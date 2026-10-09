import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { normalizeCoachTone, TONE_COOKIE, type CoachTone } from '@/lib/coachTone';
import { normalizeSoundOn, SOUND_COOKIE } from '@/lib/soundPref';
import { normalizeRestExtraMinutes } from '@/lib/restPref';
import { normalizeNoiseLevel, normalizeShowPrs, type NoiseLevel } from '@/lib/noisePref';
import { clampScheduleDays, scheduleDaysForUser } from '@/lib/scheduleDays';
import { clearSessionCookieOptions, verifySessionToken, SESSION_COOKIE } from '@/lib/session';
import { accountBlockId } from '@/lib/deviceBlock';
import { createDeviceBlockToken, deviceBlockCookieOptions } from '@/lib/deviceBlockToken';
import { athleteCallName } from '@/lib/profile';
import {
  listHouseholdsForUser,
  parseHouseholdsJson,
  pickHousehold,
  SQL_USER_HOUSES_JSON,
  type Household,
} from '@/lib/household';

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
  scheduleDaysPerWeek: number;
  scheduleDaysAskedWeek: number | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  callName: string;
  phone: string | null;
  bodyWeightLb: number | null;
  hasPhoto: boolean;
  waiverAccepted: boolean;
  emailVerified: boolean;
  quickstartSeen: boolean;
  householdId: number | null;
  householdSlug: string | null;
  householdName: string | null;
  createdAt: string | Date | null;
  gender: string;
  coachVoiceOn: boolean;
  /** Every house the athlete is in (id order), read with the user at sign-in. */
  households?: Household[];
};

type SelectMode = 'houses' | 'guard' | 'house' | 'rest' | 'full' | 'tone' | 'base';

/** Richest user select this database supports, learned on first use (null = not known yet,
 * try from the top). Only `houses` and `guard` read `blocked_at`. */
let userSelectMode: SelectMode | null = null;

/** Lowest → richest. */
const SELECT_MODE_RANK: SelectMode[] = ['base', 'tone', 'full', 'rest', 'house', 'guard', 'houses'];

/** A write just proved `mode`'s columns exist: step the known mode up to it, never down
 * (stepping down from `guard` would stop reading `blocked_at`). Unknown stays unknown, so
 * the next read still tries the richest select first. */
function raiseSelectMode(mode: SelectMode) {
  if (userSelectMode == null) return;
  if (SELECT_MODE_RANK.indexOf(userSelectMode) < SELECT_MODE_RANK.indexOf(mode)) userSelectMode = mode;
}

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
  schedule_days_per_week?: number | string | null;
  schedule_days_asked_week?: number | string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  phone?: string | null;
  body_weight_lb?: number | string | null;
  has_photo?: number | boolean | null;
  waiver_accepted_at?: string | Date | null;
  email_verified_at?: string | Date | null;
  quickstart_seen_at?: string | Date | null;
  last_household_id?: number | null;
  created_at?: string | Date | null;
  gender?: string | null;
  coach_voice_on?: number | boolean | string | null;
  blocked_at?: string | Date | null;
  /** 'houses' select only: the athlete's houses as JSON (`SQL_USER_HOUSES_JSON`). */
  houses_json?: unknown;
};

const HOUSE_SELECT =
  'SELECT id, name, email, pin_hash, coach_tone, sound_on, rest_extra_minutes, noise_takeover, noise_effort, show_prs, schedule_days_per_week, schedule_days_asked_week, first_name, last_name, display_name, phone, body_weight_lb, photo IS NOT NULL as has_photo, waiver_accepted_at, email_verified_at, quickstart_seen_at, last_household_id, created_at, gender, coach_voice_on FROM users WHERE id = ? LIMIT 1';

const GUARD_SELECT = HOUSE_SELECT.replace(' FROM users', ', blocked_at FROM users');

const USER_SELECTS = {
  // 'guard' + the athlete's houses in one JSON column: sign-in is one query, not two.
  // Falls back to 'guard' (+ a separate house read) if the database can't run it.
  houses: GUARD_SELECT.replace(' FROM users', `, ${SQL_USER_HOUSES_JSON} FROM users`),
  // 'house' + blocked_at (migrate-user-blocked.sql). Falls back to 'house' until that column exists.
  guard: GUARD_SELECT,
  house: HOUSE_SELECT,
  rest: 'SELECT id, name, email, pin_hash, coach_tone, sound_on, rest_extra_minutes FROM users WHERE id = ? LIMIT 1',
  full: 'SELECT id, name, email, pin_hash, coach_tone, sound_on FROM users WHERE id = ? LIMIT 1',
  tone: 'SELECT id, name, email, pin_hash, coach_tone FROM users WHERE id = ? LIMIT 1',
  base: 'SELECT id, name, email, pin_hash FROM users WHERE id = ? LIMIT 1',
} as const;

async function selectUserRow(userId: number): Promise<UserRow | undefined> {
  // From the known mode down; unknown starts at the top.
  const start = userSelectMode == null ? SELECT_MODE_RANK.length - 1 : SELECT_MODE_RANK.indexOf(userSelectMode);
  const order = SELECT_MODE_RANK.slice(0, start + 1).reverse();

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
    scheduleDaysPerWeek: scheduleDaysForUser({ schedule_days_per_week: row.schedule_days_per_week }),
    scheduleDaysAskedWeek: row.schedule_days_asked_week == null ? null : Number(row.schedule_days_asked_week),
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
    quickstartSeen: row.quickstart_seen_at !== undefined ? Boolean(row.quickstart_seen_at) : true,
    householdId: house?.id ?? null,
    householdSlug: house?.slug ?? null,
    householdName: house?.name ?? null,
    createdAt: row.created_at ?? null,
    gender: row.gender ?? 'male',
    coachVoiceOn: row.coach_voice_on != null ? normalizeSoundOn(row.coach_voice_on) : true,
  };
}

export async function updateCoachTone(userId: number, tone: CoachTone): Promise<boolean> {
  try {
    await query('UPDATE users SET coach_tone = ? WHERE id = ?', [tone, userId]);
    raiseSelectMode('tone');
    return true;
  } catch {
    return false;
  }
}

export async function updateCoachVoiceOn(userId: number, coachVoiceOn: boolean): Promise<boolean> {
  try {
    await query('UPDATE users SET coach_voice_on = ? WHERE id = ?', [coachVoiceOn ? 1 : 0, userId]);
    return true;
  } catch {
    return false;
  }
}

export async function updateSoundOn(userId: number, soundOn: boolean): Promise<boolean> {
  try {
    await query('UPDATE users SET sound_on = ? WHERE id = ?', [soundOn ? 1 : 0, userId]);
    raiseSelectMode('full');
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
    raiseSelectMode('rest');
    return true;
  } catch {
    return false;
  }
}

export async function updateScheduleDaysPerWeek(userId: number, days: number): Promise<boolean> {
  try {
    await query('UPDATE users SET schedule_days_per_week = ? WHERE id = ?', [
      clampScheduleDays(days),
      userId,
    ]);
    raiseSelectMode('house');
    return true;
  } catch {
    return false;
  }
}

export async function updateGender(userId: number, gender: string): Promise<boolean> {
  try {
    await query('UPDATE users SET gender = ? WHERE id = ?', [
      gender,
      userId,
    ]);
    raiseSelectMode('house');
    return true;
  } catch {
    return false;
  }
}

/** Marks the 6-week re-ask as shown for `week` (the program week it appeared on),
 * whether the athlete changed their count or just dismissed it. */
export async function markScheduleDaysAsked(userId: number, week: number): Promise<boolean> {
  try {
    await query('UPDATE users SET schedule_days_asked_week = ? WHERE id = ?', [week, userId]);
    raiseSelectMode('house');
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
    raiseSelectMode('house');
    return true;
  } catch {
    return false;
  }
}

export type ProfilePrefs = {
  coachTone: CoachTone;
  soundOn: boolean;
  coachVoiceOn: boolean;
  restExtraMinutes: number;
  scheduleDaysPerWeek: number;
  noiseTakeover: NoiseLevel;
  noiseEffort: NoiseLevel;
  showPrs: boolean;
};

/**
 * Every Edit-profile preference in one UPDATE. If that fails (a column missing before
 * its migration), falls back to the one-column helpers above, which each fail alone.
 */
export async function updateProfilePrefs(userId: number, prefs: ProfilePrefs): Promise<void> {
  try {
    await query(
      `UPDATE users SET coach_tone = ?, sound_on = ?, coach_voice_on = ?, rest_extra_minutes = ?,
         schedule_days_per_week = ?, noise_takeover = ?, noise_effort = ?, show_prs = ?
       WHERE id = ?`,
      [
        prefs.coachTone,
        prefs.soundOn ? 1 : 0,
        prefs.coachVoiceOn ? 1 : 0,
        normalizeRestExtraMinutes(prefs.restExtraMinutes),
        clampScheduleDays(prefs.scheduleDaysPerWeek),
        prefs.noiseTakeover,
        prefs.noiseEffort,
        prefs.showPrs ? 1 : 0,
        userId,
      ]
    );
    // Every profile column exists (raiseSelectMode never steps down from 'guard').
    raiseSelectMode('house');
  } catch {
    await updateCoachTone(userId, prefs.coachTone);
    await updateSoundOn(userId, prefs.soundOn);
    await updateCoachVoiceOn(userId, prefs.coachVoiceOn);
    await updateRestExtraMinutes(userId, prefs.restExtraMinutes);
    await updateScheduleDaysPerWeek(userId, prefs.scheduleDaysPerWeek);
    await updateNoisePrefs(userId, {
      noiseTakeover: prefs.noiseTakeover,
      noiseEffort: prefs.noiseEffort,
      showPrs: prefs.showPrs,
    });
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

/**
 * Signs a blocked account out of this browser (Admin → Users block): drops the session
 * cookie and marks the browser with the account's device-block cookie. Cookie writes only
 * work in route handlers / actions, so a server-component caller just gets the null.
 */
async function evictBlockedSession(userId: number): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(clearSessionCookieOptions());
    cookieStore.set(deviceBlockCookieOptions(await createDeviceBlockToken(await accountBlockId(userId), true)));
  } catch {
    /* read-only cookie context */
  }
}

/** Like getCurrentUser, but says 'blocked' for a blocked account (after evicting its session). */
export async function getCurrentUserOrBlocked(): Promise<SessionUser | 'blocked' | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const row = await selectUserRow(userId);
  if (!row) return null;
  if (row.blocked_at) {
    await evictBlockedSession(userId);
    return 'blocked';
  }
  const cookieStore = await cookies();
  // The houses came with the user row ('houses' select), else one more read.
  let households: Household[] = [];
  try {
    households =
      row.houses_json !== undefined ? parseHouseholdsJson(row.houses_json) : await listHouseholdsForUser(userId);
  } catch {
    households = [];
  }
  const resolved = pickHousehold(households, row.last_household_id ?? null);
  const house = { id: resolved?.id ?? null, slug: resolved?.slug ?? null, name: resolved?.name ?? null };
  return {
    ...toSessionUser(
      row,
      {
        tone: cookieStore.get(TONE_COOKIE)?.value,
        sound: cookieStore.get(SOUND_COOKIE)?.value,
      },
      house
    ),
    households,
  };
}

/** Session user, or null when signed out or blocked (a blocked session is evicted on the spot). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const user = await getCurrentUserOrBlocked();
  return user === 'blocked' ? null : user;
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
