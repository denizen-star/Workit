import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { normalizeCoachTone, TONE_COOKIE, type CoachTone } from '@/lib/coachTone';
import { normalizeSoundOn, SOUND_COOKIE } from '@/lib/soundPref';
import { normalizeRestExtraMinutes } from '@/lib/restPref';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';

export type SessionUser = {
  id: number;
  name: string;
  email: string | null;
  hasPin: boolean;
  isAdmin: boolean;
  coachTone: CoachTone;
  soundOn: boolean;
  restExtraMinutes: number;
};

let userSelectMode: 'rest' | 'full' | 'tone' | 'base' | null = null;

type UserRow = {
  id: number;
  name: string;
  email: string | null;
  pin_hash: string | null;
  coach_tone?: string | null;
  sound_on?: number | boolean | string | null;
  rest_extra_minutes?: number | string | null;
};

const USER_SELECTS = {
  rest: 'SELECT id, name, email, pin_hash, coach_tone, sound_on, rest_extra_minutes FROM users WHERE id = ? LIMIT 1',
  full: 'SELECT id, name, email, pin_hash, coach_tone, sound_on FROM users WHERE id = ? LIMIT 1',
  tone: 'SELECT id, name, email, pin_hash, coach_tone FROM users WHERE id = ? LIMIT 1',
  base: 'SELECT id, name, email, pin_hash FROM users WHERE id = ? LIMIT 1',
} as const;

async function selectUserRow(userId: number): Promise<UserRow | undefined> {
  const order: Array<'rest' | 'full' | 'tone' | 'base'> =
    userSelectMode === 'base'
      ? ['base']
      : userSelectMode === 'tone'
        ? ['tone', 'base']
        : userSelectMode === 'full'
          ? ['full', 'tone', 'base']
          : ['rest', 'full', 'tone', 'base'];

  for (const mode of order) {
    try {
      const result = await query(USER_SELECTS[mode], [userId]);
      userSelectMode = mode;
      return result.rows[0] as UserRow | undefined;
    } catch {
      userSelectMode = null;
    }
  }

  return undefined;
}

function toSessionUser(
  row: UserRow,
  prefs?: { tone?: string | null; sound?: string | null }
): SessionUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    hasPin: row.pin_hash != null,
    isAdmin: row.id === ADMIN_USER_ID,
    coachTone: normalizeCoachTone(row.coach_tone ?? prefs?.tone),
    soundOn: row.sound_on != null ? normalizeSoundOn(row.sound_on) : normalizeSoundOn(prefs?.sound),
    restExtraMinutes: normalizeRestExtraMinutes(row.rest_extra_minutes),
  };
}

export async function updateCoachTone(userId: number, tone: CoachTone): Promise<boolean> {
  try {
    await query('UPDATE users SET coach_tone = ? WHERE id = ?', [tone, userId]);
    if (userSelectMode === 'base') userSelectMode = 'tone';
    return true;
  } catch {
    return false;
  }
}

export async function updateSoundOn(userId: number, soundOn: boolean): Promise<boolean> {
  try {
    await query('UPDATE users SET sound_on = ? WHERE id = ?', [soundOn ? 1 : 0, userId]);
    if (userSelectMode === 'base' || userSelectMode === 'tone') userSelectMode = 'full';
    return true;
  } catch {
    return false;
  }
}

export async function updateRestExtraMinutes(userId: number, minutes: number): Promise<boolean> {
  try {
    await query('UPDATE users SET rest_extra_minutes = ? WHERE id = ?', [
      normalizeRestExtraMinutes(minutes),
      userId,
    ]);
    userSelectMode = 'rest';
    return true;
  } catch {
    return false;
  }
}

export async function getUserTone(userId: number): Promise<CoachTone> {
  const row = await selectUserRow(userId);
  return normalizeCoachTone(row?.coach_tone);
}

export const ADMIN_USER_ID = 1;

export function isAdminUser(user: { id: number }) {
  return user.id === ADMIN_USER_ID;
}

export {
  createSessionToken,
  sessionCookieOptions,
  clearSessionCookieOptions,
  SESSION_COOKIE,
} from '@/lib/session';

export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(pin, salt, 64);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export async function getSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const row = await selectUserRow(userId);
  if (!row) return null;
  const cookieStore = await cookies();
  return toSessionUser(row, {
    tone: cookieStore.get(TONE_COOKIE)?.value,
    sound: cookieStore.get(SOUND_COOKIE)?.value,
  });
}

export function toneCookieOptions(tone: CoachTone) {
  return {
    name: TONE_COOKIE,
    value: tone,
    httpOnly: false,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  };
}

export function soundCookieOptions(soundOn: boolean) {
  return {
    name: SOUND_COOKIE,
    value: soundOn ? '1' : '0',
    httpOnly: false,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  };
}

export async function requireCurrentUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Not authenticated', 401);
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireCurrentUser();
  if (!isAdminUser(user)) {
    throw new AuthError('Forbidden', 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

const failedAttempts = new Map<number, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

export function isUserLockedOut(userId: number): boolean {
  const entry = failedAttempts.get(userId);
  if (!entry) return false;
  if (Date.now() < entry.lockedUntil) return true;
  failedAttempts.delete(userId);
  return false;
}

export function recordFailedAttempt(userId: number): void {
  const entry = failedAttempts.get(userId) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
  }
  failedAttempts.set(userId, entry);
}

export function clearFailedAttempts(userId: number): void {
  failedAttempts.delete(userId);
}

export async function getUserById(userId: number) {
  return selectUserRow(userId);
}
