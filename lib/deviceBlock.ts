import type { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createDeviceBlockToken, deviceBlockCookieOptions } from '@/lib/deviceBlockToken';
import { UNBLOCKABLE_USER_ID } from '@/lib/deviceBlockShared';

/**
 * Browser + account blocks (database/migrate-device-blocks.sql, migrate-user-blocked.sql).
 *
 * - A `/join` "Under 18 / Pass" tap creates a row with `user_id` NULL (device block).
 * - An admin account block sets `users.blocked_at` and creates a row with `user_id` set.
 * Either way the browser carries a signed cookie holding the row id; `cleared_at` is how
 * Kevin releases it, and `/blocked` notices and deletes the cookie itself.
 */

export type DeviceBlock = {
  id: number;
  userId: number | null;
  requested: boolean;
  cleared: boolean;
};

export type DeviceBlockRow = {
  id: number;
  userId: number | null;
  userName: string | null;
  createdAt: string;
  requestEmail: string | null;
  requestNote: string | null;
  requestedAt: string | null;
  clearedAt: string | null;
};

export async function createDeviceBlock(userId: number | null = null): Promise<number> {
  const result = await query('INSERT INTO device_blocks (user_id) VALUES (?)', [userId]);
  return Number(result.insertId);
}

export async function getDeviceBlock(id: number): Promise<DeviceBlock | null> {
  const result = await query(
    'SELECT id, user_id, requested_at, cleared_at FROM device_blocks WHERE id = ? LIMIT 1',
    [id],
  );
  const row = result.rows[0] as
    | { id: number; user_id: number | null; requested_at: unknown; cleared_at: unknown }
    | undefined;
  if (!row) return null;
  return {
    id: Number(row.id),
    userId: row.user_id == null ? null : Number(row.user_id),
    requested: row.requested_at != null,
    cleared: row.cleared_at != null,
  };
}

/** One request per device block; account blocks can't request. Returns false if refused. */
export async function recordAccessRequest(id: number, email: string, note: string): Promise<boolean> {
  const result = await query(
    `UPDATE device_blocks
        SET request_email = ?, request_note = ?, requested_at = UTC_TIMESTAMP()
      WHERE id = ? AND user_id IS NULL AND requested_at IS NULL AND cleared_at IS NULL`,
    [email, note, id],
  );
  return result.rowsAffected > 0;
}

export async function clearDeviceBlock(id: number): Promise<void> {
  await query('UPDATE device_blocks SET cleared_at = UTC_TIMESTAMP() WHERE id = ? AND cleared_at IS NULL', [id]);
}

/** Open block row for a blocked account, created if missing, so its browser can be marked. */
export async function accountBlockId(userId: number): Promise<number> {
  const result = await query(
    'SELECT id FROM device_blocks WHERE user_id = ? AND cleared_at IS NULL ORDER BY id DESC LIMIT 1',
    [userId],
  );
  const row = result.rows[0] as { id: number } | undefined;
  return row ? Number(row.id) : createDeviceBlock(userId);
}

/** True when an admin blocked this account. False (not blocked) until migrate-user-blocked.sql is applied. */
export async function isUserBlocked(userId: number): Promise<boolean> {
  try {
    const result = await query('SELECT blocked_at FROM users WHERE id = ? LIMIT 1', [userId]);
    return (result.rows[0] as { blocked_at: unknown } | undefined)?.blocked_at != null;
  } catch {
    return false;
  }
}

/** Admin account block: stamps `users.blocked_at` and opens a block row for the browser. */
export async function blockUser(userId: number): Promise<void> {
  if (userId === UNBLOCKABLE_USER_ID) throw new Error('Cannot block this account');
  await query('UPDATE users SET blocked_at = UTC_TIMESTAMP() WHERE id = ? AND blocked_at IS NULL', [userId]);
  await accountBlockId(userId);
}

/** Admin unblock: clears the account flag and every open block row for that account. */
export async function unblockUser(userId: number): Promise<void> {
  await query('UPDATE users SET blocked_at = NULL WHERE id = ?', [userId]);
  await query('UPDATE device_blocks SET cleared_at = UTC_TIMESTAMP() WHERE user_id = ? AND cleared_at IS NULL', [userId]);
}

/** Ids of admin-blocked accounts ([] until migrate-user-blocked.sql is applied). */
export async function listBlockedUserIds(): Promise<number[]> {
  try {
    const result = await query('SELECT id FROM users WHERE blocked_at IS NOT NULL');
    return (result.rows as { id: number }[]).map((row) => Number(row.id));
  } catch {
    return [];
  }
}

/** Every block, newest pending requests first (Admin → Users → Blocks). */
export async function listDeviceBlocks(): Promise<DeviceBlockRow[]> {
  const result = await query(
    `SELECT db.id, db.user_id, u.name AS user_name, db.created_at, db.request_email,
            db.request_note, db.requested_at, db.cleared_at
       FROM device_blocks db
       LEFT JOIN users u ON u.id = db.user_id
      ORDER BY (db.requested_at IS NOT NULL AND db.cleared_at IS NULL) DESC, db.id DESC
      LIMIT 500`,
  );
  return (result.rows as Record<string, unknown>[]).map((row) => ({
    id: Number(row.id),
    userId: row.user_id == null ? null : Number(row.user_id),
    userName: (row.user_name as string | null) ?? null,
    createdAt: String(row.created_at),
    requestEmail: (row.request_email as string | null) ?? null,
    requestNote: (row.request_note as string | null) ?? null,
    requestedAt: row.requested_at == null ? null : String(row.requested_at),
    clearedAt: row.cleared_at == null ? null : String(row.cleared_at),
  }));
}

/** Marks the browser behind `response` with the block cookie for `blockId` (`account` = admin account block). */
export async function setDeviceBlockCookie(
  response: NextResponse,
  blockId: number,
  account = false
): Promise<NextResponse> {
  response.cookies.set(deviceBlockCookieOptions(await createDeviceBlockToken(blockId, account)));
  return response;
}
