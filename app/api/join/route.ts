import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { createSessionToken, hashPin, isValidPin, sessionCookieOptions } from '@/lib/auth';
import { addHouseholdMember, getHouseholdBySlug, HOUSE_GOWANUS, HOUSE_OG } from '@/lib/household';
import { findWaitingUserByToken } from '@/lib/invite';
import {
  composeFullName,
  formatUsPhone,
  isAliasTakenInHouse,
  isDuplicateEmailError,
  normalizeEmail,
  normalizeOptionalText,
} from '@/lib/profile';
import { parsePhotoDataUrl } from '@/lib/photo';
import { WAIVER_TEXT } from '@/lib/waiver';
import { queueJoinWelcome } from '@/lib/emails/lifecycle';
import { clampScheduleDays } from '@/lib/scheduleDays';
import { joinSourceFrom, type JoinSource } from '@/lib/joinSource';
import { logBodyWeightChange, parseBodyWeightInput } from '@/lib/bodyWeight';

/** Best effort: the onboarding report reads it, a sign-up never fails on it (column may be unapplied). */
async function recordJoinSource(userId: number, source: JoinSource) {
  await query('UPDATE users SET join_source = ? WHERE id = ?', [source, userId]).catch((error) => {
    console.warn('[join] join_source not saved', error);
  });
}

type ExistingUser = {
  id: number;
  pin_hash: string | null;
  invited_by: number | null;
  invite_token: string | null;
  email_verified_at: string | null;
};

async function findUserByEmail(email: string): Promise<ExistingUser | null> {
  const result = await query(
    `SELECT id, pin_hash, invited_by, invite_token, email_verified_at
     FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1`,
    [email]
  );
  return (result.rows[0] as ExistingUser | undefined) ?? null;
}

/**
 * A public sign-up that saved its details but never set a PIN. No house membership and
 * no PIN, so it can't log in and stays off every board; Finish (or a fresh Next with the
 * same email) takes it over.
 */
function isJoinDraft(row: ExistingUser): boolean {
  return !row.pin_hash && row.invited_by == null && !row.invite_token && !row.email_verified_at;
}

type DraftFields = {
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  phone: string | null;
  weight: number | null;
  scheduleDaysPerWeek: number;
  photo: Buffer | null;
  householdId: number;
};

/** Inserts or refreshes the unverified public-join row; `pinHash` is null until Finish. */
async function writeJoinUser(existingId: number | null, fields: DraftFields, pinHash: string | null) {
  if (existingId != null) {
    const params = [
      fields.name,
      fields.firstName,
      fields.lastName,
      fields.displayName,
      fields.phone,
      fields.weight,
      fields.scheduleDaysPerWeek,
      WAIVER_TEXT,
      fields.householdId,
      pinHash,
      ...(fields.photo ? [fields.photo] : []),
      existingId,
    ];
    await query(
      `UPDATE users SET
         name = ?, first_name = ?, last_name = ?, display_name = ?, phone = ?, body_weight_lb = ?,
         schedule_days_per_week = ?, waiver_text = ?, waiver_accepted_at = UTC_TIMESTAMP(),
         adult_risk_confirmed_at = UTC_TIMESTAMP(), last_household_id = ?, pin_hash = ?
         ${fields.photo ? ', photo = ?' : ''}
       WHERE id = ? AND pin_hash IS NULL`,
      params
    );
    return existingId;
  }
  const result = await query(
    `INSERT INTO users (
       name, email, pin_hash, coach_tone, schedule_days_per_week, first_name, last_name, display_name, phone,
       body_weight_lb, photo, waiver_text, waiver_accepted_at, email_verified_at, adult_risk_confirmed_at,
       last_household_id
     ) VALUES (?, ?, ?, 'eli', ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), NULL, UTC_TIMESTAMP(), ?)`,
    [
      fields.name,
      fields.email,
      pinHash,
      fields.scheduleDaysPerWeek,
      fields.firstName,
      fields.lastName,
      fields.displayName,
      fields.phone,
      fields.weight,
      fields.photo,
      WAIVER_TEXT,
      fields.householdId,
    ]
  );
  return Number(result.insertId);
}

/** Finds the draft for this email (or none) and writes it; a double-tapped insert falls back to the update. */
async function saveJoinUser(fields: DraftFields, pinHash: string | null): Promise<number | 'exists'> {
  const existing = await findUserByEmail(fields.email);
  if (existing && !isJoinDraft(existing)) return 'exists';
  try {
    return await writeJoinUser(existing?.id ?? null, fields, pinHash);
  } catch (error) {
    if (existing || !isDuplicateEmailError(error)) throw error;
    const raced = await findUserByEmail(fields.email);
    if (!raced || !isJoinDraft(raced)) return 'exists';
    return writeJoinUser(raced.id, fields, pinHash);
  }
}

const EXISTS_RESPONSE = { error: 'That email is already on Work-It. Use login.', exists: true };

export async function GET(request: NextRequest) {
  try {
    const h = request.nextUrl.searchParams.get('h') || '';
    const claim = request.nextUrl.searchParams.get('claim') || '';
    if (claim) {
      const waiting = await findWaitingUserByToken(claim);
      if (!waiting) {
        return NextResponse.json({ error: 'Invite link is not valid' }, { status: 404 });
      }
      return NextResponse.json({
        mode: 'claim',
        house: { slug: h || HOUSE_OG, public: false },
        user: { id: waiting.id, name: waiting.name, email: waiting.email },
      });
    }

    const house = await getHouseholdBySlug(h);
    if (!house || !house.public_join) {
      return NextResponse.json({ redirect: '/login' }, { status: 400 });
    }
    return NextResponse.json({ mode: 'join', house: { slug: house.slug, name: house.name, public: true } });
  } catch (error) {
    console.error('Error loading join:', error);
    return NextResponse.json({ error: 'Could not open join' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 'details' = the form screen's Next: save who they are now, PIN comes later.
    const detailsOnly = body.action === 'details';
    const h = String(body.h || HOUSE_GOWANUS);
    const claim = typeof body.claim === 'string' ? body.claim : '';
    const joinSource = joinSourceFrom(body.src, claim);
    const firstName = normalizeOptionalText(body.firstName, 120);
    const lastName = normalizeOptionalText(body.lastName, 120);
    const displayName = normalizeOptionalText(body.displayName, 120);
    const email = normalizeEmail(body.email);
    const phone = formatUsPhone(normalizeOptionalText(body.phone, 32) || '') || null;
    const weight = parseBodyWeightInput(body.bodyWeightLb);
    const scheduleDaysPerWeek = clampScheduleDays(body.scheduleDaysPerWeek);
    const pin = typeof body.pin === 'string' ? body.pin : '';
    const confirmPin = typeof body.confirmPin === 'string' ? body.confirmPin : '';
    const accepted = body.acceptedWaiver === true;
    // /join's agree screen (18+ and own risk); stamped as users.adult_risk_confirmed_at below.
    const adultRiskConfirmed = body.adultRiskConfirmed === true;
    const photo = parsePhotoDataUrl(body.photo);

    if (!adultRiskConfirmed) {
      return NextResponse.json({ error: 'Confirm you are 18+ to continue' }, { status: 400 });
    }
    if (!accepted) {
      return NextResponse.json({ error: 'Accept the waiver to continue' }, { status: 400 });
    }
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First and last name are required' }, { status: 400 });
    }
    if (email === undefined) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (photo === undefined) {
      return NextResponse.json({ error: 'Use a smaller JPEG or PNG for the photo' }, { status: 400 });
    }
    if (weight === undefined) {
      return NextResponse.json({ error: 'Weight must be a number in lb' }, { status: 400 });
    }
    if (!detailsOnly && (!isValidPin(pin) || pin !== confirmPin)) {
      return NextResponse.json({ error: 'PIN must be four matching digits' }, { status: 400 });
    }

    if (claim) {
      const waiting = await findWaitingUserByToken(claim);
      if (!waiting) {
        return NextResponse.json({ error: 'Invite link is not valid' }, { status: 404 });
      }
      const house = (await getHouseholdBySlug(h)) || (await getHouseholdBySlug(HOUSE_OG));
      if (!house) {
        return NextResponse.json({ error: 'House not found' }, { status: 400 });
      }
      const alias = displayName || firstName;
      if (await isAliasTakenInHouse(house.id, alias, waiting.id)) {
        return NextResponse.json({ error: 'That alias is already on this house' }, { status: 409 });
      }
      // Invitees already have a row (created at invite time); nothing to save until the PIN.
      if (detailsOnly) {
        return NextResponse.json({ success: true, draft: false });
      }
      const name = composeFullName(firstName, lastName);
      await query(
        `UPDATE users SET
           name = ?, first_name = ?, last_name = ?, display_name = ?, email = ?, phone = ?,
           body_weight_lb = ?, pin_hash = ?, invite_token = NULL, coach_tone = COALESCE(coach_tone, 'eli'),
           schedule_days_per_week = ?,
           waiver_text = ?, waiver_accepted_at = UTC_TIMESTAMP(), email_verified_at = UTC_TIMESTAMP(),
           adult_risk_confirmed_at = UTC_TIMESTAMP()
           ${photo ? ', photo = ?' : ''}
         WHERE id = ?`,
        photo
          ? [name, firstName, lastName, displayName, email, phone, weight, hashPin(pin), scheduleDaysPerWeek, WAIVER_TEXT, photo, waiting.id]
          : [name, firstName, lastName, displayName, email, phone, weight, hashPin(pin), scheduleDaysPerWeek, WAIVER_TEXT, waiting.id]
      );
      await addHouseholdMember(house.id, waiting.id);
      await query('UPDATE users SET last_household_id = ? WHERE id = ?', [house.id, waiting.id]);
      await recordJoinSource(waiting.id, joinSource);
      await logBodyWeightChange(waiting.id, null, weight, 'join');
      queueJoinWelcome({
        id: waiting.id,
        name,
        email,
        verify: false,
        callName: alias,
      });
      const cookieStore = await cookies();
      cookieStore.set(sessionCookieOptions(await createSessionToken(waiting.id)));
      return NextResponse.json({ success: true, session: true, userId: waiting.id });
    }

    const house = await getHouseholdBySlug(h);
    if (!house?.public_join) {
      return NextResponse.json({ error: 'This house is invite only' }, { status: 400 });
    }

    const alias = displayName || firstName;
    if (await isAliasTakenInHouse(house.id, alias)) {
      return NextResponse.json({ error: 'That alias is already on this house' }, { status: 409 });
    }

    const name = composeFullName(firstName, lastName);
    const fields: DraftFields = {
      name,
      email,
      firstName,
      lastName,
      displayName,
      phone,
      weight,
      scheduleDaysPerWeek,
      photo: photo || null,
      householdId: house.id,
    };
    const saved = await saveJoinUser(fields, detailsOnly ? null : hashPin(pin));
    if (saved === 'exists') {
      return NextResponse.json(EXISTS_RESPONSE, { status: 409 });
    }
    const id = saved;
    await recordJoinSource(id, joinSource);
    if (detailsOnly) {
      return NextResponse.json({ success: true, draft: true });
    }

    await addHouseholdMember(house.id, id);
    await logBodyWeightChange(id, null, weight, 'join');
    queueJoinWelcome({
      id,
      name,
      email,
      verify: true,
      callName: alias,
    });
    return NextResponse.json({ success: true, session: false, userId: id });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return NextResponse.json(EXISTS_RESPONSE, { status: 409 });
    }
    console.error('Error joining:', error);
    return NextResponse.json({ error: 'Could not join' }, { status: 500 });
  }
}
