import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { holdLineForDay } from '@/lib/holdLine';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const workoutType = String(request.nextUrl.searchParams.get('type') || '').trim();
  if (!workoutType) {
    return NextResponse.json({ line: null });
  }

  try {
    const hold = await holdLineForDay(user.id, workoutType);
    return NextResponse.json(hold);
  } catch (error) {
    console.error('Error loading hold line:', error);
    return NextResponse.json({ line: null });
  }
}
