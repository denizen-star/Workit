const MAX_PHOTO_CHARS = 200_000;

export function parsePhotoDataUrl(raw: unknown): Buffer | null | undefined {
  if (raw === null || raw === '') return null;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return undefined;
  if (trimmed.length > MAX_PHOTO_CHARS) return undefined;
  try {
    const buf = Buffer.from(match[2], 'base64');
    if (buf.length < 32 || buf.length > 180_000) return undefined;
    return buf;
  } catch {
    return undefined;
  }
}

export function photoSrc(userId: number, bust?: string | number | null) {
  const extra = bust ? `?t=${encodeURIComponent(String(bust))}` : '';
  return `/api/users/${userId}/photo${extra}`;
}