import { SignJWT, jwtVerify } from 'jose';
import { getAuthSecret } from '@/lib/session';

/**
 * Signed browser-block cookie. Edge-safe (no DB import) so middleware can read it on
 * every request without a query. The payload is the `device_blocks.id` plus whether it is an
 * admin account block; whether that row is still active is only checked by `/blocked`
 * (see lib/deviceBlock.ts).
 */
export const DEVICE_BLOCK_COOKIE = 'workit_block';
const DEVICE_BLOCK_MAX_AGE = 60 * 60 * 24 * 365 * 5; // 5 years — only an admin clear lifts it

export type DeviceBlockClaim = { blockId: number; account: boolean };

/** `account` marks an admin account block: middleware then also sends signed-out pages to /blocked. */
export async function createDeviceBlockToken(blockId: number, account = false): Promise<string> {
  return new SignJWT({ blockId, account })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DEVICE_BLOCK_MAX_AGE}s`)
    .sign(getAuthSecret());
}

export async function readDeviceBlockToken(token: string | undefined): Promise<DeviceBlockClaim | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const blockId = Number(payload.blockId);
    return Number.isFinite(blockId) && blockId > 0 ? { blockId, account: payload.account === true } : null;
  } catch {
    return null;
  }
}

export async function verifyDeviceBlockToken(token: string | undefined): Promise<number | null> {
  return (await readDeviceBlockToken(token))?.blockId ?? null;
}

export function deviceBlockCookieOptions(token: string) {
  return {
    name: DEVICE_BLOCK_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: DEVICE_BLOCK_MAX_AGE,
  };
}

export function clearDeviceBlockCookieOptions() {
  return { ...deviceBlockCookieOptions(''), maxAge: 0 };
}
