import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { normalizeCoachTone, TONE_COOKIE, type CoachTone } from '@/lib/coachTone';
import { normalizeSoundOn, SOUND_COOKIE } from '@/lib/soundPref';
import { normalizeRestExtraMinutes } from '@/lib/restPref';
import { normalizeNoiseLevel, normalizeShowPrs, type NoiseLevel } from '@/lib/noisePref';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';
import { athleteCallName } from '@/lib/profile';
import { getHouseholdById, householdIdForUser } from '@/lib/household';

export type SessionUser = {
  id: number;
  name: string;
  email: string | null;
  hasPin: boolean;
  isAdmin: boolean;
  coachTone: CoachTone;
  soundOn: boolean;
  restExtraMinutes: number;
  noiseTakeover: NoiseLevel;
  noiseEffort: NoiseLevel;
  showPrs: boolean;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  callName: string;
  phone: string | null;
  bodyWeightLb: number | null;
  hasPhoto: boolean;
  waiverAccepted: boolean;
  emailVerified: boolean;
  householdId: number | null;
  householdSlug: string | null;
  householdName: string | null;
};

let userSelectMode: 'house' | 'rest' | 'full' | 'tone' | 'base' | null = null;

type UserRow = {
  id: number;
  name: string;
  email: string | null;
  pin_hash: string | null;
  coach_tone?: string | null;
  sound_on?: number | boolean | string | null;
  rest_extra_minutes?: number | string | null;
  noise_takeover?: string | null;
  noise_effort?: string | null;
  show_prs?: number | boolean | string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  phone?: string | null;
  body_weight_lb?: number | string | null;
  has_photo?: number | boolean | null;
  waiver_accepted_at?: string | Date | null;
  email_verified_at?: string | Date | null;
  last_household_id?: number | null;
};

const USER_SELECTS = {
  house:
    'SELECT id, name, email, pin_hash, coach_tone, sound_on, rest_extra_minutes, noise_takeover, noise_effort, show_prs, first_name, last_name, display_name, phone, body_weight_lb, photo IS NOT NULL as has_photo, waiver_accepted_at, email_verified_at, last_household_id FROM users WHERE id = ? LIMIT 1',
  rest: 'SELECT id, name, email, pin_hash, coach_tone, sound_on, rest_extra_minutes FROM users WHERE id = ? LIMIT 1',
  full: 'SELECT id, name, email, pin_hash, coach_tone, sound_on FROM users WHERE id = ? LIMIT 1',
  tone: 'SELECT id, name, email, pin_hash, coach_tone FROM users WHERE id = ? LIMIT 1',
  base: 'SELECT id, name, email, pin_hash FROM users WHERE id = ? LIMIT 1',
} as const;

async function selectUserRow(userId: number): Promise<UserRow | undefined> {
  const order: Array<'house' | 'rest' | 'full' | 'tone' | 'base'> =
    userSelectMode === 'base'
      ? ['base']
      : userSelectMode === 'tone'
        ? ['tone', 'base']
        : userSelectMode === 'full'
          ? ['full', 'tone', 'base']
          : userSelectMode === 'rest'
            ? ['rest', 'full', 'tone', 'base']
            : ['house', 'rest', 'full', 'tone', 'base'];

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
  prefs?: { tone?: string | null; sound?: string | null },
  house?: { id: number | null; slug: string | null; name: string | null }
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
    noiseTakeover: normalizeNoiseLevel(row.noise_takeover),
    noiseEffort: normalizeNoiseLevel(row.noise_effort),
    showPrs: row.show_prs != null ? normalizeShowPrs(row.show_prs) : true,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    displayName: row.display_name ?? null,
    callName: athleteCallName({
      display_name: row.display_name,
      first_name: row.first_name,
      name: row.name,
    }),
    phone: row.phone ?? null,
    bodyWeightLb: row.body_weight_lb == null ? null : Number(row.body_weight_lb),
    hasPhoto: Boolean(row.has_photo),
    waiverAccepted: Boolean(row.waiver_accepted_at),
    emailVerified: row.email_verified_at !== undefined ? Boolean(row.email_verified_at) : true,
    householdId: house?.id ?? null,
    householdSlug: house?.slug ?? null,
    householdName: house?.name ?? null,
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

export async function updateNoisePrefs(
  userId: number,
  prefs: { noiseTakeover: NoiseLevel; noiseEffort: NoiseLevel; showPrs: boolean }
): Promise<boolean> {
  try {
    await query('UPDATE users SET noise_takeover = ?, noise_effort = ?, show_prs = ? WHERE id = ?', [
      prefs.noiseTakeover,
      prefs.noiseEffort,
      prefs.showPrs ? 1 : 0,
      userId,
    ]);
    userSelectMode = 'house';
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
  let house: { id: number | null; slug: string | null; name: string | null } = {
    id: null,
    slug: null,
    name: null,
  };
  try {
    const householdId = await householdIdForUser(userId, row.last_household_id ?? null);
    const resolved = householdId ? await getHouseholdById(householdId) : null;
    if (resolved) house = { id: resolved.id, slug: resolved.slug, name: resolved.name };
  } catch {
    house = { id: null, slug: null, name: null };
  }
  return toSessionUser(
    row,
    {
      tone: cookieStore.get(TONE_COOKIE)?.value,
      sound: cookieStore.get(SOUND_COOKIE)?.value,
    },
    house
  );
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
