import { SignJWT, jwtVerify } from 'jose';

const PURPOSE = 'email_verify';
const MAX_AGE = 60 * 60 * 24 * 7;

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be set and at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export async function createEmailVerifyToken(userId: number): Promise<string> {
  return new SignJWT({ userId, purpose: PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getAuthSecret());
}

export async function verifyEmailToken(token: string): Promise<number | null> {
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