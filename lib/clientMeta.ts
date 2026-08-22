import type { NextRequest } from 'next/server';

export function extractClientIp(req: NextRequest): string {
  const h = req.headers;
  const raw =
    h.get('client-ip') ||
    h.get('x-forwarded-for') ||
    h.get('x-nf-client-connection-ip') ||
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    '';
  return raw.split(',')[0].trim();
}

export function parseOsFromUserAgent(uaRaw: string | null): string | null {
  const ua = (uaRaw ?? '').toLowerCase();
  if (!ua) return null;
  if (ua.includes('windows nt')) return 'windows';
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'ios';
  if (ua.includes('mac os x') || ua.includes('macintosh')) return 'macos';
  if (ua.includes('cros')) return 'chromeos';
  if (ua.includes('linux')) return 'linux';
  return 'other';
}

export function parseBrowserFromUserAgent(uaRaw: string | null): string | null {
  const ua = (uaRaw ?? '').toLowerCase();
  if (!ua) return null;
  if (ua.includes('edg/') || ua.includes('edge/')) return 'edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'opera';
  if (ua.includes('firefox/')) return 'firefox';
  if (ua.includes('chrome/') || ua.includes('crios/')) return 'chrome';
  if (ua.includes('safari/')) return 'safari';
  return 'other';
}
