/**
 * Kevin-only voice compare: 5.0.0 New orders + welcome + recap in each coach.
 *
 *   npx tsx --env-file=.env.local scripts/send-kevin-voice-samples.ts
 */
import { query } from '../lib/db';
import { isEmailEnabled, sendEmail } from '../lib/mailClient';
import { CURRENT_RELEASE } from '../lib/emails/currentRelease';
import {
  buildReleaseEmail,
  buildWelcomeEmail,
  buildWorkoutCompleteEmail,
} from '../lib/emails/templates';
import { pickCompleteLine, pickReplenishLine } from '../lib/coachLines';
import { coachDisplayName, type CoachTone } from '../lib/coachTone';
import { SQL_EXCLUDE_TEST_USER } from '../lib/householdUsers';

const TONES: CoachTone[] = ['master', 'james', 'luna'];

const TAG: Record<CoachTone, string> = {
  master: 'Tom',
  james: 'Grey',
  luna: 'Luna',
};

const YEAR_RELEASE = {
  version: '5.0.0',
  title: 'A year. Belts. You earn the paper.',
  subject: 'New orders. 48 weeks. Diplomas.',
  signer: 'Master Tom Iron',
  intro: 'Do not skim. These are orders. Read them. I do not repeat myself for quit.',
  mid: 'I put the year on paper. Stay on it.',
  close: 'Hard-refresh. Open Home. Then get under the bar.',
  groups: [
    {
      heading: 'The year',
      wins: [
        'Weeks 1 to 6 — two lower days. That is the start.',
        'Week 7 on — one lower, A then B.',
        'Friday — Extra Upper.',
        'Saturday bonus — core in the app, or a run or class you mark.',
        'Lock a week — four finishes. Missed days still count.',
      ],
    },
    {
      heading: 'The belts',
      wins: [
        '2 weeks — Dipping your toes',
        '6 weeks — Got back in the saddle',
        '10 weeks — I see you getting stronger',
        '20 weeks — Steady',
        '24 weeks — Weigh-up sprint',
        '48 weeks — Arnold Status',
      ],
    },
    {
      heading: 'Home',
      wins: [
        'Three belts — the one you hold, the one you are filling, the next one.',
      ],
    },
    {
      heading: 'Who',
      wins: [
        'Solid — you earned that belt',
        'Aiming — you have not locked it yet',
      ],
    },
    {
      heading: 'The session',
      wins: [
        'Last lift — scrolls you to Easy cooldown',
        'Finish it — under that card, phone and desktop',
        'Header — does not close the day',
      ],
    },
  ],
  wins: [] as string[],
  also: [] as string[],
};

function tagged(tone: CoachTone, email: { subject: string; html: string; text: string; from: string }) {
  const tag = '[' + TAG[tone] + '] ';
  return {
    ...email,
    subject: tag + email.subject,
  };
}

async function main() {
  if (!isEmailEnabled()) {
    console.error('[voice-samples] EMAIL_ENABLED is off');
    process.exitCode = 1;
    return;
  }

  const result = await query(
    `SELECT u.id, u.name, u.email FROM users u
     WHERE u.email IS NOT NULL AND u.email != ''
       AND ${SQL_EXCLUDE_TEST_USER}
       AND LOWER(u.name) LIKE 'kevin%'
     ORDER BY u.id ASC
     LIMIT 1`
  );
  const user = result.rows[0] as { id: number; name: string; email: string } | undefined;
  if (!user?.email) {
    console.error('[voice-samples] no Kevin with email');
    process.exitCode = 1;
    return;
  }

  let sent = 0;
  let failed = 0;

  async function send(
    label: string,
    tone: CoachTone,
    email: { subject: string; html: string; text: string; from: string },
    template: string
  ) {
    const next = tagged(tone, email);
    const id = await sendEmail({
      to: user!.email,
      subject: next.subject,
      html: next.html,
      text: next.text,
      from: next.from,
      archive: {
        userId: user!.id,
        athleteName: user!.name,
        template,
      },
    });
    if (!id) {
      failed += 1;
      console.error('[voice-samples] failed', label, coachDisplayName(tone));
      return;
    }
    sent += 1;
    console.log('[voice-samples] sent', label, TAG[tone], next.subject);
  }

  for (const tone of TONES) {
    if (tone !== 'master') {
      await send(
        '5.2.0',
        tone,
        buildReleaseEmail({
          name: user.name,
          ...CURRENT_RELEASE,
          tone,
          signer: undefined,
        }),
        'release'
      );
    }
    await send(
      '5.0.0',
      tone,
      buildReleaseEmail({
        name: user.name,
        ...YEAR_RELEASE,
        tone,
        signer: tone === 'master' ? YEAR_RELEASE.signer : undefined,
      }),
      'release'
    );
    await send('welcome', tone, buildWelcomeEmail({ name: user.name, tone }), 'welcome');
    await send(
      'complete',
      tone,
      buildWorkoutCompleteEmail({
        name: user.name,
        weekNumber: 3,
        dayName: 'Upper Body A',
        durationSeconds: 48 * 60 + 12,
        volumeLbs: 12450,
        setCount: 18,
        exerciseCount: 6,
        completeLine: pickCompleteLine(tone),
        replenishLine: pickReplenishLine(),
        nextLabel: 'Week 3 · Lower Body A',
        lockedWeeks: 4,
        tone,
      }),
      'complete'
    );
  }

  console.log('[voice-samples] done', sent, 'sent', failed, 'failed');
  if (failed || sent === 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[voice-samples] failed:', err);
  process.exitCode = 1;
});
