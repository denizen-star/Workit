// How someone reached /join. Printed QR codes carry ?src=qr (launch-house skill);
// a plain /join?h=… is a link; a claim token is an invite. Shared by the wizard and POST /api/join.

export type JoinSource = 'qr' | 'link' | 'invite';

export const JOIN_SOURCE_LABEL: Record<JoinSource, string> = {
  qr: 'QR code',
  link: 'Link',
  invite: 'Invite',
};

export function joinSourceFrom(src: unknown, claim?: unknown): JoinSource {
  if (typeof claim === 'string' && claim.trim()) return 'invite';
  return String(src || '').trim().toLowerCase() === 'qr' ? 'qr' : 'link';
}

/** `article_context` on a `join_step` event: `h=<slug>;src=<source>`. */
export function joinStepContext(house: string, source: JoinSource): string {
  return 'h=' + (house || 'gowanus') + ';src=' + source;
}

export function parseJoinStepContext(value: string | null | undefined): { house: string | null; source: JoinSource | null } {
  const out: { house: string | null; source: JoinSource | null } = { house: null, source: null };
  for (const part of String(value || '').split(';')) {
    const [key, raw] = part.split('=');
    if (key === 'h' && raw) out.house = raw.trim().toLowerCase();
    if (key === 'src' && (raw === 'qr' || raw === 'link' || raw === 'invite')) out.source = raw;
  }
  return out;
}
