import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const id = Number((await context.params).id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const result = await query('SELECT photo FROM users WHERE id = ? LIMIT 1', [id]);
  const row = result.rows[0] as { photo?: Buffer | Uint8Array | string | null } | undefined;
  if (!row?.photo) {
    return new NextResponse(null, { status: 204 });
  }
  const buf = Buffer.isBuffer(row.photo) ? row.photo : Buffer.from(row.photo as Uint8Array);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, no-store',
    },
  });
}
