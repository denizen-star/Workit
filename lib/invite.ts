import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { query } from '@/lib/db';

export const INVITE_CAP = 100;

export type InviteGuest = {
  id: number;
  name: string;
  email: string | null;
  has_pin: boolean;
  invited_at: string | null;
};

function inviteSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be set and at least 32 characters');
  }
  return secret;
}

export function hashInviteToken(raw: string): string {
  return createHmac('sha256', inviteSecret()).update(raw).digest('hex');
}

export function createInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  return { raw, hash: hashInviteToken(raw) };
}

export function inviteTokenMatches(raw: string, storedHash: string | null | undefined): boolean {
  if (!raw || !storedHash) return false;
  try {
    const actual = Buffer.from(hashInviteToken(raw), 'hex');
    const expected = Buffer.from(storedHash, 'hex');
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function countInvitesBy(userId: number): Promise<number> {
  const result = await query(
    'SELECT COUNT(*) as total FROM users WHERE invited_by = ?',
    [userId]
  );
  return Number((result.rows[0] as { total: number } | undefined)?.total || 0);
}

export async function listGuestsFor(userId: number): Promise<InviteGuest[]> {
  const result = await query(
    `SELECT id, name, email, pin_hash, invited_at
     FROM users
     WHERE invited_by = ?
     ORDER BY invited_at ASC, id ASC`,
    [userId]
  );
  return (result.rows as {
    id: number;
    name: string;
    email: string | null;
    pin_hash: string | null;
    invited_at: string | Date | null;
  }[]).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    has_pin: row.pin_hash != null,
    invited_at: row.invited_at ? String(row.invited_at) : null,
  }));
}

export async function findWaitingUserByToken(raw: string) {
  if (!raw) return null;
  const result = await query(
    `SELECT id, name, email, invite_token
     FROM users
     WHERE invite_token = ? AND pin_hash IS NULL
     LIMIT 1`,
    [hashInviteToken(raw)]
  );
  const row = result.rows[0] as
    | { id: number; name: string; email: string | null; invite_token: string | null }
    | undefined;
  if (!row || !inviteTokenMatches(raw, row.invite_token)) return null;
  return { id: row.id, name: row.name, email: row.email };
}

export async function getWaitingGuest(userId: number) {
  const result = await query(
    `SELECT id, name, email, invited_by, invite_token, pin_hash
     FROM users
     WHERE id = ? AND pin_hash IS NULL
     LIMIT 1`,
    [userId]
  );
  return (result.rows[0] as
    | {
        id: number;
        name: string;
        email: string | null;
        invited_by: number | null;
        invite_token: string | null;
        pin_hash: string | null;
      }
    | undefined) ?? null;
}

export async function rotateInviteToken(userId: number): Promise<string | null> {
  const { raw, hash } = createInviteToken();
  const result = await query(
    'UPDATE users SET invite_token = ? WHERE id = ? AND pin_hash IS NULL',
    [hash, userId]
  );
  if (!result.rowsAffected) return null;
  return raw;
}
