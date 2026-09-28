import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireAdmin, requireCurrentUser } from '@/lib/auth';
import { bodyWeightHistory } from '@/lib/bodyWeight';

/**
 * GET /api/body-weight — the signed-in athlete's weight history (oldest → newest).
 * `?userId=` reads another athlete's history and is Kevin-only (requireAdmin).
 * Body weight is private: only the athlete and Kevin ever see it, never a house board.
 */
export async function GET(request: NextRequest) {
  try {
    const requested = request.nextUrl.searchParams.get('userId');
    const user = requested ? await requireAdmin() : await requireCurrentUser();
    const userId = requested ? Number(requested) : user.id;
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Bad userId' }, { status: 400 });
    }
    return NextResponse.json({ history: await bodyWeightHistory(userId) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error loading body weight history:', error);
    return NextResponse.json({ error: 'Failed to load body weight' }, { status: 500 });
  }
}
