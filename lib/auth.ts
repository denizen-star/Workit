import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';

export type SessionUser = {
  id: number;
  name: string;
  email: string | null;
  hasPin: boolean;
  isAdmin: boolean;
};

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

  const result = await query(
    'SELECT id, name, email, pin_hash FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  const row = result.rows[0] as {
    id: number;
    name: string;
    email: string | null;
    pin_hash: string | null;
  } | undefined;
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    hasPin: row.pin_hash != null,
    isAdmin: row.id === ADMIN_USER_ID,
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
  const result = await query(
    'SELECT id, name, email, pin_hash FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  return result.rows[0] as {
    id: number;
    name: string;
    email: string | null;
    pin_hash: string | null;
  } | undefined;
}
