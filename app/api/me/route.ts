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
import { isDuplicateEmailError, isNameTaken, NAME_TAKEN_MESSAGE, normalizeEmail, normalizeName } from '@/lib/profile';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const soundOnly = typeof body.soundOn === 'boolean' && body.name == null;
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

    const name = normalizeName(body.name);
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

    if (await isNameTaken(name, user.id)) {
      return NextResponse.json({ error: NAME_TAKEN_MESSAGE }, { status: 409 });
    }

    if (email === undefined) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    if (pin != null) {
      if (!isValidPin(pin)) {
        return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
      }
      await query('UPDATE users SET name = ?, email = ?, pin_hash = ? WHERE id = ?', [
        name,
        email,
        hashPin(pin),
        user.id,
      ]);
    } else {
      await query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, user.id]);
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
