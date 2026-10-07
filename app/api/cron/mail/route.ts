import { NextRequest, NextResponse } from 'next/server';
import { sendDailyNudges } from '@/lib/emails/nudge';
import { sendScoreboardEmail } from '@/lib/emails/scoreboard';
import { sendOnboardingReport } from '@/lib/emails/onboarding';
import { sendDueReminders } from '@/lib/pushReminders';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isCronAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === 'Bearer ' + secret;
}

function hourInNewYork() {
  return Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/New_York' }).format(
      new Date()
    )
  );
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

  // Onboarding report: its own evening cron fires at 00:00 and 01:00 UTC so one of the two
  // lands on 8pm Eastern in both EDT and EST; the other is a no-op. Never part of 'all'.
  if (task === 'onboarding') {
    const hour = hourInNewYork();
    if (hour !== 20 && request.nextUrl.searchParams.get('force') !== '1') {
      result.onboarding = { sent: false, skipped: 'not-8pm-eastern', hour };
    } else {
      result.onboarding = await sendOnboardingReport();
    }
    return NextResponse.json(result);
  }

  // Workout reminder pushes: their own 15-minute cron (workit-push-cron). Never part of 'all'.
  if (task === 'push') {
    result.push = await sendDueReminders();
    return NextResponse.json(result);
  }

  if (task === 'nudge' || task === 'all') {
    result.nudges = await sendDailyNudges();
  }

  if (task === 'scoreboard' || (task === 'all' && weekday === 'Mon')) {
    result.scoreboard = await sendScoreboardEmail();
  }

  return NextResponse.json(result);
}
