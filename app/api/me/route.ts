import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import {
  getCurrentUser,
  hashPin,
  isValidPin,
  soundCookieOptions,
  toneCookieOptions,
  updateCoachTone,
  updateSoundOn,
  updateRestExtraMinutes,
} from '@/lib/auth';
import { asCoachTone } from '@/lib/coachTone';
import { normalizeSoundOn } from '@/lib/soundPref';
import { normalizeRestExtraMinutes } from '@/lib/restPref';
import {
  composeFullName,
  formatUsPhone,
  isAliasTakenInHouse,
  isDuplicateEmailError,
  isNameTaken,
  NAME_TAKEN_MESSAGE,
  normalizeEmail,
  normalizeName,
  normalizeOptionalText,
} from '@/lib/profile';
import { listHouseholdsForUser, setLastHousehold, userInHousehold } from '@/lib/household';
import { parsePhotoDataUrl } from '@/lib/photo';
import { WAIVER_TEXT } from '@/lib/waiver';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const [houses, done] = await Promise.all([
    listHouseholdsForUser(user.id).catch(() => []),
    query(
      'SELECT COUNT(*) as total FROM workout_sessions WHERE user_id = ? AND is_completed = 1',
      [user.id]
    ).catch(() => ({ rows: [{ total: 0 }] })),
  ]);

  return NextResponse.json({
    user,
    houses,
    completedWorkouts: Number((done.rows[0] as { total: number } | undefined)?.total || 0),
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    if (body.householdId != null) {
      const householdId = Number(body.householdId);
      if (!(await userInHousehold(user.id, householdId))) {
        return NextResponse.json({ error: 'Not in that house' }, { status: 403 });
      }
      await setLastHousehold(user.id, householdId);
      return NextResponse.json({ success: true });
    }

    if (body.acceptWaiver === true) {
      await query(
        'UPDATE users SET waiver_text = ?, waiver_accepted_at = UTC_TIMESTAMP() WHERE id = ?',
        [WAIVER_TEXT, user.id]
      );
    }

    const soundOnly = typeof body.soundOn === 'boolean' && body.name == null && body.firstName == null;
    if (soundOnly) {
      const soundOn = normalizeSoundOn(body.soundOn);
      await updateSoundOn(user.id, soundOn);
      const cookieStore = await cookies();
      const soundCookie = soundCookieOptions(soundOn);
      cookieStore.set(soundCookie.name, soundCookie.value, soundCookie);
      return NextResponse.json({
        success: true,
        user: { ...user, soundOn },
      });
    }

    const firstName = normalizeOptionalText(body.firstName, 120);
    const lastName = normalizeOptionalText(body.lastName, 120);
    const displayName = normalizeOptionalText(body.displayName, 120);
    const phone = formatUsPhone(normalizeOptionalText(body.phone, 32) || '') || null;
    const weight =
      body.bodyWeightLb == null || body.bodyWeightLb === ''
        ? null
        : Number(body.bodyWeightLb);
    const photo = parsePhotoDataUrl(body.photo);
    const name =
      composeFullName(firstName, lastName, body.name) || normalizeName(body.name) || user.name;
    const email = normalizeEmail(body.email);
    const pin = typeof body.pin === 'string' && body.pin.length > 0 ? body.pin : null;
    const coachTone = asCoachTone(body.coachTone) ?? user.coachTone;
    const soundOn = body.soundOn === undefined ? user.soundOn : normalizeSoundOn(body.soundOn);
    const restExtraMinutes =
      body.restExtraMinutes === undefined
        ? user.restExtraMinutes
        : normalizeRestExtraMinutes(body.restExtraMinutes);

    if (!name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (user.householdId && displayName && (await isAliasTakenInHouse(user.householdId, displayName, user.id))) {
      return NextResponse.json({ error: 'That alias is already on this house' }, { status: 409 });
    }

    if (name && (await isNameTaken(name, user.id))) {
      return NextResponse.json({ error: NAME_TAKEN_MESSAGE }, { status: 409 });
    }

    if (photo === undefined) {
      return NextResponse.json({ error: 'Use a smaller JPEG or PNG for the photo' }, { status: 400 });
    }

    if (weight != null && (!Number.isFinite(weight) || weight <= 0 || weight > 999)) {
      return NextResponse.json({ error: 'Weight must be a number in lb' }, { status: 400 });
    }

    if (email === undefined) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (pin != null) {
      if (!isValidPin(pin)) {
        return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
      }
      await query(
        `UPDATE users SET name = ?, email = ?, pin_hash = ?, first_name = ?, last_name = ?, display_name = ?,
          phone = ?, body_weight_lb = ? ${photo ? ', photo = ?' : ''} WHERE id = ?`,
        photo
          ? [name, email, hashPin(pin), firstName, lastName, displayName, phone, weight, photo, user.id]
          : [name, email, hashPin(pin), firstName, lastName, displayName, phone, weight, user.id]
      );
    } else {
      await query(
        `UPDATE users SET name = ?, email = ?, first_name = ?, last_name = ?, display_name = ?,
          phone = ?, body_weight_lb = ? ${photo ? ', photo = ?' : ''} WHERE id = ?`,
        photo
          ? [name, email, firstName, lastName, displayName, phone, weight, photo, user.id]
          : [name, email, firstName, lastName, displayName, phone, weight, user.id]
      );
    }

    await updateCoachTone(user.id, coachTone);
    await updateSoundOn(user.id, soundOn);
    await updateRestExtraMinutes(user.id, restExtraMinutes);
    const cookieStore = await cookies();
    const toneCookie = toneCookieOptions(coachTone);
    cookieStore.set(toneCookie.name, toneCookie.value, toneCookie);
    const soundCookie = soundCookieOptions(soundOn);
    cookieStore.set(soundCookie.name, soundCookie.value, soundCookie);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name,
        email,
        hasPin: pin != null || user.hasPin,
        coachTone,
        soundOn,
        restExtraMinutes,
      },
    });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return NextResponse.json({ error: 'That email is already in use' }, { status: 409 });
    }
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
