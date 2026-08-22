import { firstName } from '@/lib/profile';
import { formatDuration } from '@/lib/formatDuration';
import {
  appUrl,
  whoUrl,
  bullets,
  cta,
  emailTextHeader,
  emailTextSignOff,
  esc,
  iosHomeScreenStepsHtml,
  iosHomeScreenStepsText,
  p,
  statsTable,
  wrapEmailHtml,
} from '@/lib/emailLayout';
import { defaultFrom } from '@/lib/mailClient';
import { pickCoachLine, pickExitLine } from '@/lib/coachLines';
import { coachDisplayName, normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { CURRENT_RELEASE } from '@/lib/emails/currentRelease';
import type { MailTemplateId } from '@/lib/emails/ids';

export type BuiltEmail = {
  from: string;
  subject: string;
  html: string;
  text: string;
};

export type WelcomeEmailInput = {
  name: string;
};

export type NudgeEmailInput = {
  name: string;
  mode: 'start' | 'resume';
  weekNumber: number;
  dayName: string;
  focus?: string | null;
  estimate?: string | null;
  isTravel?: boolean;
  href: string;
  tone?: CoachTone | null;
};

export type WorkoutCompleteEmailInput = {
  name: string;
  weekNumber: number;
  dayName: string;
  durationSeconds?: number | null;
  volumeLbs?: number | null;
  setCount?: number | null;
  exerciseCount?: number | null;
  completeLine: string;
  weekComplete?: boolean;
  programComplete?: boolean;
  nextLabel?: string | null;
  tone?: CoachTone | null;
};

export type BadgeEmailInput = {
  name: string;
  badgeName: string;
  badgeDescription: string;
  tone?: CoachTone | null;
};

export type ScoreboardRow = {
  name: string;
  email: string | null;
  workoutsThisWeek: number;
  lastWorkout: string | null;
  volumeThisWeek: number;
  openSession: string | null;
};

export type ScoreboardEmailInput = {
  rangeLabel: string;
  rows: ScoreboardRow[];
};

export type ReleaseEmailInput = {
  name?: string;
  version: string;
  title: string;
  wins: string[];
  also?: string[];
  tone?: CoachTone | null;
};

function fromFor(tone?: CoachTone | null) {
  return defaultFrom(coachDisplayName(normalizeCoachTone(tone)));
}

function address(name: string) {
  return p(esc(name) + '.');
}

export function buildWelcomeEmail(input: WelcomeEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const url = whoUrl();
  const eyebrow = 'roster';
  const title = "You're mine now";
  const subtitle = '- by invitation only';
  const html = wrapEmailHtml({
    eyebrow,
    title,
    subtitle,
    childrenHtml: [
      address(name),
      p('I put you on the roster. That was not a suggestion.'),
      p('Open the app. Pick your name. Punch your PIN. Then get under the bar and show me what you are made of.'),
      p('Want a different PIN? Report in, open Edit profile, and set one. Same four digits is allowed. I do not care as long as you show up.'),
      bullets([
        'Six weeks. Upper. Lower. Progressive overload. You will finish it.',
        'Every set logged. Rest when I say. Badges when you earn them.',
        'Your numbers stay on your profile so I can inspect you.',
      ]),
      cta(url, 'REPORT IN'),
      iosHomeScreenStepsHtml(),
    ].join(''),
  });
  const text = [
    emailTextHeader(eyebrow, title + '\n' + subtitle),
    name + '.',
    '',
    'I put you on the roster. That was not a suggestion.',
    'Open the app. Pick your name. Punch your PIN. Then get under the bar.',
    'Want a different PIN? Report in, open Edit profile, and set one. Same four digits is allowed.',
    '',
    url,
    '',
    iosHomeScreenStepsText(),
    emailTextSignOff(),
  ].join('\n');
  return { from: fromFor(), subject: "You're mine. Work-It.", html, text };
}

export function buildNudgeEmail(input: NudgeEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const shout = input.mode === 'resume' ? pickExitLine(input.tone) : pickCoachLine(0, 3, input.tone);
  const signer = coachDisplayName(normalizeCoachTone(input.tone));
  const eyebrow = input.mode === 'resume' ? 'unfinished' : 'get to it';
  const title =
    input.mode === 'resume'
      ? 'Did I give you permission to quit?'
      : input.dayName + '. Now.';
  const travel = input.isTravel
    ? p('Travel week. Hotel room. Floor. Doorframe. I do not care. You still work.')
    : '';
  const estimate = input.estimate
    ? p(esc(input.estimate) + '. That time belongs to me.')
    : '';
  const href = input.href.startsWith('http') ? input.href : appUrl() + input.href;
  const html = wrapEmailHtml({
    eyebrow,
    title,
    signer,
    childrenHtml: [
      address(name),
      p('<strong style="color:#fff;">' + esc(shout) + '</strong>'),
      p(
        input.mode === 'resume'
          ? 'Week ' +
              esc(String(input.weekNumber)) +
              ' · ' +
              esc(input.dayName) +
              ' is still open. An unfinished session is a humiliation. Get back under the bar.'
          : 'Week ' +
              esc(String(input.weekNumber)) +
              ' · ' +
              esc(input.dayName) +
              (input.focus ? ' · ' + esc(input.focus) : '') +
              '. I own that session.'
      ),
      travel,
      estimate,
      cta(href, input.mode === 'resume' ? 'FINISH IT' : 'GET TO IT'),
    ].join(''),
  });
  const subject =
    input.mode === 'resume'
      ? 'Get back under the bar — ' + input.dayName
      : 'Get to it — ' + input.dayName;
  const text = [
    emailTextHeader(eyebrow, title),
    name + '.',
    '',
    shout,
    '',
    input.mode === 'resume'
      ? 'Week ' + input.weekNumber + ' · ' + input.dayName + ' is still open. Finish it.'
      : 'Week ' + input.weekNumber + ' · ' + input.dayName + ' is waiting. I own that session.',
    '',
    href,
    emailTextSignOff(signer),
  ].join('\n');
  return { from: fromFor(input.tone), subject, html, text };
}

function formatLbs(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Math.round(Number(value)).toLocaleString() + ' lbs';
}

export function buildWorkoutCompleteEmail(input: WorkoutCompleteEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const signer = coachDisplayName(normalizeCoachTone(input.tone));
  const eyebrow = input.programComplete ? 'program complete' : input.weekComplete ? 'week locked' : 'paid';
  const title = input.programComplete
    ? 'Six weeks. You did not break.'
    : input.weekComplete
      ? 'Week ' + input.weekNumber + ' is locked. You paid.'
      : input.dayName + ' is done. Good man.';

  const rows: Array<[string, string]> = [
    ['Workout', 'Week ' + input.weekNumber + ' · ' + input.dayName],
    ['Time under the iron', formatDuration(input.durationSeconds)],
    ['Volume', formatLbs(input.volumeLbs)],
    ['Sets', String(input.setCount ?? '—')],
    ['Exercises', String(input.exerciseCount ?? '—')],
  ];

  const next = input.programComplete
    ? p('The tax is paid in full. Recover like a pro. Then come home and let me reward you.')
    : input.nextLabel
      ? p(
          'Next up belongs to me: <strong style="color:#fff;">' +
            esc(input.nextLabel) +
            '</strong>. Don\'t get soft.'
        )
      : '';

  const html = wrapEmailHtml({
    eyebrow,
    title,
    signer,
    childrenHtml: [
      address(name),
      p('<strong style="color:#fff;">' + esc(input.completeLine) + '</strong>'),
      statsTable(rows),
      next,
      cta(whoUrl(), input.programComplete ? 'COME HOME' : 'SHOW ME'),
    ].join(''),
  });

  const subject = input.programComplete
    ? 'Program complete. You are mine.'
    : input.weekComplete
      ? 'Week ' + input.weekNumber + ' locked. Don\'t get soft.'
      : 'Paid. ' + input.dayName + ' is done.';

  const text = [
    emailTextHeader(eyebrow, title),
    name + '.',
    '',
    input.completeLine,
    '',
    'Week ' + input.weekNumber + ' · ' + input.dayName,
    'Time: ' + formatDuration(input.durationSeconds),
    'Volume: ' + formatLbs(input.volumeLbs),
    input.programComplete
      ? 'The tax is paid in full. Come home.'
      : input.nextLabel
        ? 'Next belongs to me: ' + input.nextLabel
        : '',
    '',
    whoUrl(),
    emailTextSignOff(signer),
  ]
    .filter((line) => line !== '')
    .join('\n');

  return { from: fromFor(input.tone), subject, html, text };
}

export function buildBadgeEmail(input: BadgeEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const signer = coachDisplayName(normalizeCoachTone(input.tone));
  const eyebrow = 'earned';
  const title = 'Good man. ' + input.badgeName + '.';
  const html = wrapEmailHtml({
    eyebrow,
    title,
    signer,
    childrenHtml: [
      address(name),
      p(esc(input.badgeDescription) + '.'),
      p('You earned this because you did what I told you. It stays on your profile so I can see it. Now earn the next one for me.'),
      cta(whoUrl(), 'SHOW ME'),
    ].join(''),
  });
  const text = [
    emailTextHeader(eyebrow, title),
    name + '.',
    '',
    input.badgeDescription + '.',
    'You earned this because you did what I told you. Now earn the next one for me.',
    '',
    whoUrl(),
    emailTextSignOff(signer),
  ].join('\n');
  return {
    from: fromFor(input.tone),
    subject: 'Good man. You earned ' + input.badgeName + '.',
    html,
    text,
  };
}

export function buildScoreboardEmail(input: ScoreboardEmailInput): BuiltEmail {
  const eyebrow = 'inspection';
  const title = 'Who obeyed · ' + input.rangeLabel;
  const rowsHtml = input.rows
    .map((row) => {
      const noShow = Number(row.workoutsThisWeek) === 0;
      return (
        '<tr>' +
        '<td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">' +
        '<div style="font-weight:800;color:#fff;">' +
        esc(row.name) +
        '</div>' +
        (noShow
          ? '<div style="font-size:12px;color:#e8c547;margin-top:2px;">NO SHOW</div>'
          : '') +
        (row.openSession
          ? '<div style="font-size:12px;color:#e8c547;margin-top:2px;">LEFT OPEN: ' +
            esc(row.openSession) +
            '</div>'
          : '') +
        '</td>' +
        '<td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);text-align:right;color:#f6f1e3;font-size:13px;line-height:1.45;">' +
        esc(String(row.workoutsThisWeek)) +
        ' workouts<br>' +
        esc(Math.round(row.volumeThisWeek).toLocaleString()) +
        ' lbs<br>' +
        '<span style="color:#b9b1a0;">' +
        esc(row.lastWorkout || 'Nothing') +
        '</span></td></tr>'
      );
    })
    .join('');

  const html = wrapEmailHtml({
    eyebrow,
    title,
    childrenHtml: [
      p('I do not care about feelings. I care who showed up and who went soft.'),
      p('Open sessions are unfinished business. I see them.'),
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
        rowsHtml +
        '</table>',
      cta(whoUrl(), 'REPORT IN'),
    ].join(''),
  });

  const text = [
    emailTextHeader(eyebrow, title),
    '',
    'I do not care about feelings. I care who showed up and who went soft.',
    '',
    ...input.rows.map((row) =>
      [
        row.name,
        '  ' + row.workoutsThisWeek + ' workouts · ' + Math.round(row.volumeThisWeek).toLocaleString() + ' lbs',
        '  last: ' + (row.lastWorkout || 'nothing'),
        Number(row.workoutsThisWeek) === 0 ? '  NO SHOW' : '',
        row.openSession ? '  LEFT OPEN: ' + row.openSession : '',
      ]
        .filter(Boolean)
        .join('\n')
    ),
    '',
    whoUrl(),
    emailTextSignOff(),
  ].join('\n');

  return {
    from: fromFor(),
    subject: 'Inspection — who obeyed this week',
    html,
    text,
  };
}

export function buildReleaseEmail(input: ReleaseEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const signer = coachDisplayName(normalizeCoachTone(input.tone));
  const ordersLine =
    normalizeCoachTone(input.tone) === 'sergeant'
      ? 'Do not skim this like a changelog. These are notes from your guide. Stay with them.'
      : 'Do not skim this like a changelog, sissy. These are orders from Master Challenge.';
  const eyebrow = 'new orders · ' + input.version;
  const html = wrapEmailHtml({
    eyebrow,
    title: input.title,
    signer,
    childrenHtml: [
      address(name),
      p(ordersLine),
      p('Hard-refresh if you are still running the old build. Then get under the bar.'),
      p('<strong style="color:#fff;">what I just took control of:</strong>'),
      bullets(input.wins),
      input.also && input.also.length
        ? p('<strong style="color:#fff;">and you will also:</strong>') + bullets(input.also)
        : '',
      cta(whoUrl(), 'OBEY'),
    ].join(''),
  });
  const text = [
    emailTextHeader(eyebrow, input.title),
    name + '.',
    '',
    ordersLine,
    '',
    'What I just took control of:',
    ...input.wins.map((item) => '  - ' + item),
    ...(input.also && input.also.length
      ? ['', 'And you will also:', ...input.also.map((item) => '  - ' + item)]
      : []),
    '',
    whoUrl(),
    emailTextSignOff(signer),
  ].join('\n');
  return {
    from: fromFor(input.tone),
    subject: 'New orders — ' + input.title,
    html,
    text,
  };
}

export function sampleEmail(template: MailTemplateId): BuiltEmail {
  const completeBase: WorkoutCompleteEmailInput = {
    name: 'Kevin',
    weekNumber: 3,
    dayName: 'Upper Body A',
    durationSeconds: 48 * 60 + 12,
    volumeLbs: 12450,
    setCount: 18,
    exerciseCount: 6,
    completeLine:
      "THAT IS HOW YOU FINISH. Watching you drive through that last rep turned me completely on.",
    nextLabel: 'Week 3 · Lower Body A',
  };

  if (template === 'welcome') return buildWelcomeEmail({ name: 'Kevin' });
  if (template === 'nudge') {
    return buildNudgeEmail({
      name: 'Kevin',
      mode: 'start',
      weekNumber: 3,
      dayName: 'Upper Body A',
      focus: 'Push Focus',
      estimate: '~45 min',
      href: whoUrl(),
    });
  }
  if (template === 'resume') {
    return buildNudgeEmail({
      name: 'Kevin',
      mode: 'resume',
      weekNumber: 3,
      dayName: 'Lower Body A',
      href: whoUrl(),
    });
  }
  if (template === 'complete') return buildWorkoutCompleteEmail(completeBase);
  if (template === 'week') {
    return buildWorkoutCompleteEmail({
      ...completeBase,
      dayName: 'Lower Body B',
      weekComplete: true,
      nextLabel: 'Week 4 · Upper Body A',
    });
  }
  if (template === 'program') {
    return buildWorkoutCompleteEmail({
      ...completeBase,
      weekNumber: 6,
      dayName: 'Lower Body B',
      completeLine: 'NOW RECOVER LIKE A PRO. The battle is won. Now come home and let me reward you.',
      weekComplete: true,
      programComplete: true,
      nextLabel: null,
    });
  }
  if (template === 'badge') {
    return buildBadgeEmail({
      name: 'Kevin',
      badgeName: 'Steel Lifter',
      badgeDescription: 'Lift 10,000 lbs in total',
    });
  }
  if (template === 'scoreboard') {
    return buildScoreboardEmail({
      rangeLabel: 'last 7 days',
      rows: [
        {
          name: 'Kevin',
          email: 'kevin@example.com',
          workoutsThisWeek: 3,
          lastWorkout: 'Upper Body A · yesterday',
          volumeThisWeek: 28400,
          openSession: null,
        },
        {
          name: 'Peter',
          email: 'peter@example.com',
          workoutsThisWeek: 1,
          lastWorkout: 'Lower Body B · Mon',
          volumeThisWeek: 9100,
          openSession: 'Upper Body B',
        },
      ],
    });
  }
  return buildReleaseEmail({ name: 'Kevin', ...CURRENT_RELEASE });
}
