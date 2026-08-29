import { firstName } from '@/lib/profile';
import { formatDuration } from '@/lib/formatDuration';
import {
  appUrl,
  whoUrl,
  bullets,
  cta,
  emailArt,
  emailTextHeader,
  hostedAsset,
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
import { voiceDisplayName, voiceFromName } from '@/lib/coachCatalog';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { CURRENT_RELEASE, type ReleaseGroup } from '@/lib/emails/currentRelease';
import type { MailTemplateId } from '@/lib/emails/ids';
import { badgeArtSrc } from '@/lib/badgeArt';
import { beltArtSrc, currentBelt, nextBelt, type Belt } from '@/lib/belts';

export type BuiltEmail = {
  from: string;
  subject: string;
  html: string;
  text: string;
};

export type WelcomeEmailInput = {
  name: string;
};

export type InviteEmailInput = {
  name: string;
  inviterName: string;
  inviterEmail: string | null;
  claimUrl: string;
};

export type InviteNotifyEmailInput = {
  inviterName: string;
  inviterEmail: string | null;
  inviteeName: string;
  inviteeEmail: string;
};

export type NudgeEmailInput = {
  name: string;
  mode: 'start' | 'resume';
  weekNumber: number;
  dayName: string;
  focus?: string | null;
  estimate?: string | null;
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
  lockedWeeks?: number;
  tone?: CoachTone | null;
};

export type BadgeEmailInput = {
  name: string;
  badgeName: string;
  badgeDescription: string;
  tone?: CoachTone | null;
};

export type BeltEmailInput = {
  name: string;
  belt: Belt;
  tone?: CoachTone | null;
};

function beltProgressBlock(lockedWeeks: number | undefined) {
  const count = Number(lockedWeeks || 0);
  const earned = currentBelt(count);
  const next = nextBelt(count);
  const toward = next
    ? count + ' of ' + next.weeks + ' toward ' + next.name
    : 'Arnold Status. You know how to keep it up.';
  const mark = next || earned;
  const img = mark
    ? emailArt(hostedAsset(beltArtSrc(mark.slug)), mark.name, 160)
    : '';
  const html =
    p('<strong style="color:#fff;">Belt.</strong> ' + esc(count + ' locked weeks. ' + toward)) +
    img;
  const text = ['Belt. ' + count + ' locked weeks. ' + toward, ''];
  return { html, text };
}

export type ScoreboardRow = {
  name: string;
  email: string | null;
  workoutsThisWeek: number;
  lastWorkout: string | null;
  volumeThisWeek: number;
  openSession: string | null;
  standing?: string[];
  beltName?: string | null;
};

export type ScoreboardHonorRow = {
  name: string;
  bonusWeeks: number;
};

export type ScoreboardOptionalHonorRow = {
  name: string;
  optionalWeeks: number;
};

export type ScoreboardEmailInput = {
  rangeLabel: string;
  rows: ScoreboardRow[];
  ranking?: string[];
  yoursName?: string | null;
  yours?: string[];
  bonusHonor?: ScoreboardHonorRow[];
  optionalHonor?: ScoreboardOptionalHonorRow[];
};

function bonusHonorHtml(rows?: ScoreboardHonorRow[]) {
  if (!rows?.length) return '';
  const list = rows
    .map(
      (row) =>
        '<div style="font-weight:800;color:#fff;margin-top:6px;">' +
        esc(row.name) +
        ' · ' +
        esc(String(row.bonusWeeks)) +
        ' bonus ' +
        (row.bonusWeeks === 1 ? 'week' : 'weeks') +
        '</div>'
    )
    .join('');
  return (
    p('<strong style="color:#e8c547;">Bonus work.</strong> Extra upper. They did not owe it. They paid it.') +
    list
  );
}

function bonusHonorText(rows?: ScoreboardHonorRow[]) {
  if (!rows?.length) return [];
  return [
    'Bonus work. Extra upper. They did not owe it. They paid it.',
    ...rows.map((row) => '  ' + row.name + ' · ' + row.bonusWeeks + ' bonus ' + (row.bonusWeeks === 1 ? 'week' : 'weeks')),
    '',
  ];
}

function optionalHonorHtml(rows?: ScoreboardOptionalHonorRow[]) {
  if (!rows?.length) return '';
  const list = rows
    .map(
      (row) =>
        '<div style="font-weight:800;color:#fff;margin-top:6px;">' +
        esc(row.name) +
        ' · ' +
        esc(String(row.optionalWeeks)) +
        ' optional ' +
        (row.optionalWeeks === 1 ? 'week' : 'weeks') +
        '</div>'
    )
    .join('');
  return (
    p('<strong style="color:#e8c547;">Optionals.</strong> Four warmups. Four cooldowns. Easy minutes that still count.') +
    list
  );
}

function optionalHonorText(rows?: ScoreboardOptionalHonorRow[]) {
  if (!rows?.length) return [];
  return [
    'Optionals. Four warmups. Four cooldowns. Easy minutes that still count.',
    ...rows.map(
      (row) =>
        '  ' +
        row.name +
        ' · ' +
        row.optionalWeeks +
        ' optional ' +
        (row.optionalWeeks === 1 ? 'week' : 'weeks')
    ),
    '',
  ];
}

export type ReleaseEmailInput = {
  name?: string;
  version: string;
  title: string;
  subject?: string;
  lead?: string;
  wins: string[];
  groups?: ReleaseGroup[];
  also?: string[];
  tone?: CoachTone | null;
  signer?: string;
};

function releaseGroups(input: ReleaseEmailInput): ReleaseGroup[] {
  if (input.groups && input.groups.length) return input.groups;
  if (input.wins.length) return [{ heading: 'what I just took control of', wins: input.wins }];
  return [];
}

function releaseGroupsHtml(groups: ReleaseGroup[]) {
  return groups
    .map(
      (group) =>
        p('<strong style="color:#e8c547;">' + esc(group.heading) + '</strong>') +
        bullets(group.wins)
    )
    .join('');
}

function releaseGroupsText(groups: ReleaseGroup[]) {
  return groups.flatMap((group) => [
    group.heading.toUpperCase(),
    ...group.wins.map((item) => '  - ' + item),
    '',
  ]);
}

function fromFor(tone?: CoachTone | null) {
  return defaultFrom(voiceFromName(normalizeCoachTone(tone)));
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

export function buildInviteEmail(input: InviteEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const url = input.claimUrl;
  const inviter = input.inviterEmail
    ? input.inviterName + ' (' + input.inviterEmail + ')'
    : input.inviterName;
  const eyebrow = 'roster';
  const title = "You're mine now";
  const subtitle = '- by invitation only';
  const html = wrapEmailHtml({
    eyebrow,
    title,
    subtitle,
    childrenHtml: [
      address(name),
      p(esc(inviter) + ' put you on my roster. That was not a suggestion.'),
      p('Open the link. Create your 4-digit PIN. Confirm it. Then get under the bar and show me what you are made of.'),
      bullets([
        'Six weeks. Upper. Lower. Progressive overload. You will finish it.',
        'Every set logged. Rest when I say. Badges when you earn them.',
        'Your numbers stay on your profile so I can inspect you.',
      ]),
      cta(url, 'CREATE YOUR PIN'),
      iosHomeScreenStepsHtml(),
    ].join(''),
  });
  const text = [
    emailTextHeader(eyebrow, title + '\n' + subtitle),
    name + '.',
    '',
    inviter + ' put you on my roster. That was not a suggestion.',
    'Open the link. Create your 4-digit PIN. Confirm it. Then get under the bar.',
    '',
    url,
    '',
    iosHomeScreenStepsText(),
    emailTextSignOff(),
  ].join('\n');
  return { from: fromFor(), subject: "You're mine. Work-It.", html, text };
}

export function buildInviteNotifyEmail(input: InviteNotifyEmailInput): BuiltEmail {
  const html = wrapEmailHtml({
    eyebrow: 'invite',
    title: input.inviterName + ' invited ' + input.inviteeName,
    childrenHtml: [
      p(
        '<strong style="color:#fff;">' +
          esc(input.inviterName) +
          '</strong>' +
          (input.inviterEmail ? ' · ' + esc(input.inviterEmail) : '')
      ),
      p('just put ' + esc(input.inviteeName) + ' on the roster.'),
      p('Reply: ' + esc(input.inviteeEmail)),
    ].join(''),
  });
  const text = [
    emailTextHeader('invite', input.inviterName + ' invited ' + input.inviteeName),
    input.inviterName + (input.inviterEmail ? ' · ' + input.inviterEmail : ''),
    'just put ' + input.inviteeName + ' on the roster.',
    'Reply: ' + input.inviteeEmail,
    emailTextSignOff(),
  ].join('\n');
  return {
    from: fromFor(),
    subject: 'Invite · ' + input.inviterName + ' added ' + input.inviteeName,
    html,
    text,
  };
}

export function buildNudgeEmail(input: NudgeEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const shout = input.mode === 'resume' ? pickExitLine(input.tone) : pickCoachLine(0, 3, input.tone);
  const signer = voiceDisplayName(normalizeCoachTone(input.tone));
  const eyebrow = input.mode === 'resume' ? 'unfinished' : 'get to it';
  const title =
    input.mode === 'resume'
      ? 'Did I give you permission to quit?'
      : input.dayName + '. Now.';
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
  const signer = voiceDisplayName(normalizeCoachTone(input.tone));
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
      beltProgressBlock(input.lockedWeeks).html,
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
    ...beltProgressBlock(input.lockedWeeks).text,
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
  const signer = voiceDisplayName(normalizeCoachTone(input.tone));
  const eyebrow = 'earned';
  const title = 'Good man. ' + input.badgeName + '.';
  const html = wrapEmailHtml({
    eyebrow,
    title,
    signer,
    childrenHtml: [
      address(name),
      emailArt(hostedAsset(badgeArtSrc(input.badgeName)), input.badgeName, 96),
      p(esc(input.badgeDescription) + '.'),
      p('You earned this because you did what I told you. It stays on your profile so I can see it. Now earn the next one for me.'),
      cta(whoUrl(), 'SHOW ME'),
    ].join(''),
  });
  const text = [
    emailTextHeader(eyebrow, title),
    name + '.',
    '',
    input.badgeName,
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

export function buildBeltEmail(input: BeltEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const signer = voiceDisplayName(normalizeCoachTone(input.tone));
  const belt = input.belt;
  const eyebrow = 'diploma';
  const title = belt.name + '.';
  const html = wrapEmailHtml({
    eyebrow,
    title,
    signer,
    childrenHtml: [
      address(name),
      emailArt(hostedAsset(beltArtSrc(belt.slug)), belt.name, 180),
      p('<strong style="color:#fff;">' + esc(belt.quote) + '</strong>'),
      p(esc(belt.saidBy)),
      p(esc(belt.coachLine)),
      cta(appUrl() + '/belts', 'SEE THE BELTS'),
    ].join(''),
  });
  const text = [
    emailTextHeader(eyebrow, title),
    name + '.',
    '',
    belt.quote,
    belt.saidBy,
    belt.coachLine,
    '',
    appUrl() + '/belts',
    emailTextSignOff(signer),
  ].join('\n');
  return {
    from: fromFor(input.tone),
    subject: 'Diploma. ' + belt.name + '.',
    html,
    text,
  };
}

export function buildScoreboardEmail(input: ScoreboardEmailInput): BuiltEmail {
  const eyebrow = 'inspection';
  const title = 'Who obeyed · ' + input.rangeLabel;
  const yoursName = input.yoursName ? firstName(input.yoursName) : null;
  const rankingHtml =
    input.ranking && input.ranking.length
      ? p('<strong style="color:#e8c547;">Best day / Total weight.</strong>') +
        bullets(input.ranking)
      : '';
  const yoursHtml =
    input.yours && input.yours.length
      ? p(
          '<strong style="color:#e8c547;">Your standing' +
            (yoursName ? ', ' + esc(yoursName) : '') +
            '.</strong>'
        ) + bullets(input.yours)
      : '';
  const rowsHtml = input.rows
    .map((row) => {
      const noShow = Number(row.workoutsThisWeek) === 0;
      const standingHtml = (row.standing || [])
        .map(
          (line) =>
            '<div style="font-size:12px;color:#b9b1a0;margin-top:4px;line-height:1.4;">' +
            esc(line) +
            '</div>'
        )
        .join('');
      return (
        '<tr>' +
        '<td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);">' +
        '<div style="font-weight:800;color:#fff;">' +
        esc(row.name) +
        (row.beltName ? ' · ' + esc(row.beltName) : '') +
        '</div>' +
        (noShow
          ? '<div style="font-size:12px;color:#e8c547;margin-top:2px;">NO SHOW</div>'
          : '') +
        (row.openSession
          ? '<div style="font-size:12px;color:#e8c547;margin-top:2px;">LEFT OPEN: ' +
            esc(row.openSession) +
            '</div>'
          : '') +
        standingHtml +
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
      rankingHtml,
      yoursHtml,
      bonusHonorHtml(input.bonusHonor),
      optionalHonorHtml(input.optionalHonor),
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
    ...(input.ranking && input.ranking.length
      ? ['Best day / Total weight.', ...input.ranking.map((line) => '  ' + line), '']
      : []),
    ...(input.yours && input.yours.length
      ? ['Your standing' + (yoursName ? ', ' + yoursName : '') + '.', ...input.yours.map((line) => '  ' + line), '']
      : []),
    ...bonusHonorText(input.bonusHonor),
    ...optionalHonorText(input.optionalHonor),
    ...input.rows.map((row) =>
      [
        row.name,
        '  ' + row.workoutsThisWeek + ' workouts · ' + Math.round(row.volumeThisWeek).toLocaleString() + ' lbs',
        '  last: ' + (row.lastWorkout || 'nothing'),
        Number(row.workoutsThisWeek) === 0 ? '  NO SHOW' : '',
        row.openSession ? '  LEFT OPEN: ' + row.openSession : '',
        ...(row.standing || []).map((line) => '  ' + line),
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
  const signer = input.signer || voiceDisplayName(normalizeCoachTone(input.tone));
  const sergeant = normalizeCoachTone(input.tone) === 'sergeant';
  const ordersLine = sergeant
    ? 'Do not skim this like a changelog. These are notes from your guide. Stay with them.'
    : 'Do not skim this like a changelog, sissy. These are orders from Master Tom Iron.';
  const refreshLine = sergeant
    ? 'Hard-refresh if you are still on the old build. Then come train with me.'
    : 'Hard-refresh if you are still running the old build. Then get under the bar.';
  const eyebrow = sergeant ? 'a note · ' + input.version : 'new orders · ' + input.version;
  const groups = releaseGroups(input);
  const html = wrapEmailHtml({
    eyebrow,
    title: input.title,
    signer,
    childrenHtml: [
      address(name),
      input.lead ? p(esc(input.lead)) : '',
      p(ordersLine),
      p(refreshLine),
      releaseGroupsHtml(groups),
      input.also && input.also.length
        ? p('<strong style="color:#fff;">and you will also:</strong>') + bullets(input.also)
        : '',
      cta(whoUrl(), 'REPORT IN'),
      iosHomeScreenStepsHtml(),
    ].join(''),
  });
  const text = [
    emailTextHeader(eyebrow, input.title),
    name + '.',
    '',
    ...(input.lead ? [input.lead, ''] : []),
    ordersLine,
    '',
    refreshLine,
    '',
    ...releaseGroupsText(groups),
    ...(input.also && input.also.length
      ? ['And you will also:', ...input.also.map((item) => '  - ' + item), '']
      : []),
    whoUrl(),
    '',
    iosHomeScreenStepsText(),
    emailTextSignOff(signer),
  ].join('\n');
  return {
    from: fromFor(input.tone),
    subject: input.subject || 'New orders — ' + input.title,
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
    lockedWeeks: 4,
  };

  if (template === 'welcome') return buildWelcomeEmail({ name: 'Kevin' });
  if (template === 'invite') {
    return buildInviteEmail({
      name: 'Maya Chen',
      inviterName: 'Kevin Leacock',
      inviterEmail: 'leacock.kervin@gmail.com',
      claimUrl: whoUrl() + '?claim=preview',
    });
  }
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
  if (template === 'belt') {
    return buildBeltEmail({
      name: 'Kevin',
      belt: currentBelt(6)!,
    });
  }
  if (template === 'scoreboard') {
    return buildScoreboardEmail({
      rangeLabel: 'last 7 days',
      yoursName: 'Kevin',
      ranking: [
        '1. Kevin · Best day 1.2k · Total weight 28.4k',
        '2. Mike · Best day 980 · Total weight 19.1k',
        '3. Peter · Best day 640 · Total weight 9.1k',
      ],
      bonusHonor: [{ name: 'Kevin', bonusWeeks: 2 }],
      optionalHonor: [{ name: 'Kevin', optionalWeeks: 1 }],
      yours: [
        'Kevin is 1st of 3. Best day 1.2k · Total weight 28.4k.',
        'Weight',
        '  Lead: Standing Calf Raises · 80 lb · +12% vs Peter',
        '  Behind: Barbell Hip Thrusts or Glute Bridges · 135 lb · 18% vs Mike',
        '  In the pack: Trap Bar Deadlifts or Barbell Conventional Deadlifts · 185 lb · 4% from pack avg',
        'Reps',
        '  Lead: Dumbbell Biceps Curls · 45 reps · +8% vs Peter',
        '  Behind: Walking Lunges · 24 reps · 15% vs Mike',
        '  In the pack: Face Pulls · 36 reps · 3% from pack avg',
      ],
      rows: [
        {
          name: 'Kevin',
          email: 'kevin@example.com',
          workoutsThisWeek: 3,
          lastWorkout: 'Upper Body A · yesterday',
          volumeThisWeek: 28400,
          openSession: null,
          standing: [
            'Weight',
            '  Lead: Standing Calf Raises · 80 lb · +12% vs Peter',
            '  Behind: Barbell Hip Thrusts or Glute Bridges · 135 lb · 18% vs Mike',
            '  In the pack: Trap Bar Deadlifts or Barbell Conventional Deadlifts · 185 lb · 4% from pack avg',
            'Reps',
            '  Lead: Dumbbell Biceps Curls · 45 reps · +8% vs Peter',
            '  Behind: Walking Lunges · 24 reps · 15% vs Mike',
            '  In the pack: Face Pulls · 36 reps · 3% from pack avg',
          ],
        },
        {
          name: 'Peter',
          email: 'peter@example.com',
          workoutsThisWeek: 1,
          lastWorkout: 'Lower Body B · Mon',
          volumeThisWeek: 9100,
          openSession: 'Upper Body B',
          standing: [
            'Weight',
            '  Lead: —',
            '  Behind: Standing Calf Raises · 70 lb · 14% vs Kevin',
            '  In the pack: Face Pulls · 25 lb · 2% from pack avg',
            'Reps',
            '  Lead: Triceps Cable Pushdowns or Overhead Extensions · 45 reps · +8% vs Kevin',
            '  Behind: —',
            '  In the pack: Lat Pulldowns or Cable Rows · 36 reps · 2% from pack avg',
          ],
        },
      ],
    });
  }
  return buildReleaseEmail({ name: 'Kevin', ...CURRENT_RELEASE });
}
