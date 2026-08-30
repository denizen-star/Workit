import { SignJWT, jwtVerify } from 'jose';

const PURPOSE = 'pin_reset';
const RESET_MAX_AGE = 60 * 60; // 1 hour

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be set and at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export async function createPinResetToken(userId: number): Promise<string> {
  return new SignJWT({ userId, purpose: PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${RESET_MAX_AGE}s`)
    .sign(getAuthSecret());
}

export async function verifyPinResetToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (payload.purpose !== PURPOSE) return null;
    const userId = Number(payload.userId);
    if (!Number.isFinite(userId) || userId <= 0) return null;
    return userId;
  } catch {
    return null;
  }
}
