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
    const h = String(body.h || HOUSE_GOWANUS);
    const claim = typeof body.claim === 'string' ? body.claim : '';
    const firstName = normalizeOptionalText(body.firstName, 120);
    const lastName = normalizeOptionalText(body.lastName, 120);
    const displayName = normalizeOptionalText(body.displayName, 120);
    const email = normalizeEmail(body.email);
    const phone = formatUsPhone(normalizeOptionalText(body.phone, 32) || '') || null;
    const weight =
      body.bodyWeightLb == null || body.bodyWeightLb === ''
        ? null
        : Number(body.bodyWeightLb);
    const pin = typeof body.pin === 'string' ? body.pin : '';
    const confirmPin = typeof body.confirmPin === 'string' ? body.confirmPin : '';
    const accepted = body.acceptedWaiver === true;
    const photo = parsePhotoDataUrl(body.photo);

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
    if (weight != null && (!Number.isFinite(weight) || weight <= 0 || weight > 999)) {
      return NextResponse.json({ error: 'Weight must be a number in lb' }, { status: 400 });
    }
    if (!isValidPin(pin) || pin !== confirmPin) {
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
      const name = composeFullName(firstName, lastName);
      await query(
        `UPDATE users SET
           name = ?, first_name = ?, last_name = ?, display_name = ?, email = ?, phone = ?,
           body_weight_lb = ?, pin_hash = ?, invite_token = NULL, coach_tone = COALESCE(coach_tone, 'eli'),
           waiver_text = ?, waiver_accepted_at = UTC_TIMESTAMP(), email_verified_at = UTC_TIMESTAMP()
           ${photo ? ', photo = ?' : ''}
         WHERE id = ?`,
        photo
          ? [name, firstName, lastName, displayName, email, phone, weight, hashPin(pin), WAIVER_TEXT, photo, waiting.id]
          : [name, firstName, lastName, displayName, email, phone, weight, hashPin(pin), WAIVER_TEXT, waiting.id]
      );
      await addHouseholdMember(house.id, waiting.id);
      await query('UPDATE users SET last_household_id = ? WHERE id = ?', [house.id, waiting.id]);
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

    const existing = await query('SELECT id, pin_hash FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1', [
      email,
    ]);
    if (existing.rows[0]) {
      return NextResponse.json({ error: 'That email is already on Work-It. Use login.', exists: true }, {
        status: 409,
      });
    }

    const alias = displayName || firstName;
    if (await isAliasTakenInHouse(house.id, alias)) {
      return NextResponse.json({ error: 'That alias is already on this house' }, { status: 409 });
    }

    const name = composeFullName(firstName, lastName);
    const result = await query(
      `INSERT INTO users (
         name, email, pin_hash, coach_tone, first_name, last_name, display_name, phone,
         body_weight_lb, photo, waiver_text, waiver_accepted_at, email_verified_at, last_household_id
       ) VALUES (?, ?, ?, 'eli', ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), NULL, ?)`,
      [
        name,
        email,
        hashPin(pin),
        firstName,
        lastName,
        displayName,
        phone,
        weight,
        photo || null,
        WAIVER_TEXT,
        house.id,
      ]
    );
    const id = Number(result.insertId);
    await addHouseholdMember(house.id, id);
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
      return NextResponse.json({ error: 'That email is already on Work-It. Use login.', exists: true }, {
        status: 409,
      });
    }
    console.error('Error joining:', error);
    return NextResponse.json({ error: 'Could not join' }, { status: 500 });
  }
}
