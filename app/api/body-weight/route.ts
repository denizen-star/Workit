import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireAdmin, requireCurrentUser } from '@/lib/auth';
import { addWeighIn, bodyWeightHistory, deleteWeighIn } from '@/lib/bodyWeight';
import { BODY_WEIGHT_INVALID, parseBodyWeightInput } from '@/lib/bodyWeightShared';

function authError(error: unknown, fallback: string) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

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
    return authError(error, 'Failed to load body weight');
  }
}

/** POST { weightLb } — add a weigh-in for yourself (becomes your current weight). */
export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json().catch(() => ({}));
    const lb = parseBodyWeightInput(body?.weightLb);
    if (lb == null) {
      return NextResponse.json({ error: BODY_WEIGHT_INVALID }, { status: 400 });
    }
    await addWeighIn(user.id, lb);
    return NextResponse.json({ history: await bodyWeightHistory(user.id), weightLb: lb });
  } catch (error) {
    return authError(error, 'Failed to save body weight');
  }
}

/** DELETE ?id= — remove one of your own entries; current weight falls back to the newest left. */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const id = Number(request.nextUrl.searchParams.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Bad id' }, { status: 400 });
    }
    if (!(await deleteWeighIn(user.id, id))) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    return NextResponse.json({ history: await bodyWeightHistory(user.id) });
  } catch (error) {
    return authError(error, 'Failed to delete body weight entry');
  }
}
