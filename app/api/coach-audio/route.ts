import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { coachClipKey, type VoicedCoach } from '@/lib/coachAudio';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const template = request.nextUrl.searchParams.get('t') || '';
  const voice = request.nextUrl.searchParams.get('voice') || 'master';
  if (!template || template.length > 2000 || (voice !== 'master' && voice !== 'james' && voice !== 'luna' && voice !== 'eli')) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const result = await query(
      `SELECT audio FROM coach_voice_clips WHERE voice_id = ? AND clip_key = ? LIMIT 1`,
      [voice satisfies VoicedCoach, coachClipKey(template)]
    );
    const row = (result.rows as Array<{ audio: Uint8Array | null }>)[0];
    if (!row?.audio?.byteLength) {
      return new NextResponse(null, { status: 404 });
    }
    const bytes = row.audio instanceof Uint8Array ? row.audio : new Uint8Array(row.audio);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error loading coach audio:', error);
    return new NextResponse(null, { status: 404 });
  }
}
