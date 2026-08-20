import { NextRequest, NextResponse } from 'next/server';
import { sendDailyNudges } from '@/lib/emails/nudge';
import { sendScoreboardEmail } from '@/lib/emails/scoreboard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isCronAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === 'Bearer ' + secret;
}

function todayWeekdayInNewYork() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'America/New_York',
  }).format(new Date());
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const task = request.nextUrl.searchParams.get('task') || 'all';
  const weekday = todayWeekdayInNewYork();

  const result: Record<string, unknown> = { ok: true, task, weekday };

  if (task === 'nudge' || task === 'all') {
    result.nudges = await sendDailyNudges();
  }

  if (task === 'scoreboard' || (task === 'all' && weekday === 'Mon')) {
    result.scoreboard = await sendScoreboardEmail();
  }

  return NextResponse.json(result);
}
