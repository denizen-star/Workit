import { athleteCallName, firstName } from '@/lib/profile';
import { formatDuration } from '@/lib/formatDuration';
import {
  appUrl,
  whoUrl,
  loginUrl,
  waiverUrl,
  verifyUrl,
  resetUrl,
  bullets,
  coachPersonaArt,
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
import { BROADCAST_TONE, coachFromAddress, MAIL_FROM } from '@/lib/mailFrom';
import { pickCoachLine, pickResumeLine } from '@/lib/coachLines';
import { voiceDisplayName, voiceFromName } from '@/lib/coachCatalog';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { CURRENT_RELEASE, type ReleaseGroup } from '@/lib/emails/currentRelease';
import type { MailTemplateId } from '@/lib/emails/ids';
import { badgeArtSrc } from '@/lib/badgeArt';
import { beltArtSrc, beltCoachLine, currentBelt, nextBelt, type Belt } from '@/lib/belts';

export type BuiltEmail = {
  from: string;
  subject: string;
  html: string;
  text: string;
};

export type WelcomeEmailInput = {
  name: string;
  tone?: CoachTone | null;
};

export type InviteEmailInput = {
  name: string;
  inviterName: string;
  inviterEmail: string | null;
  claimUrl: string;
  tone?: CoachTone | null;
};

export type InviteNotifyEmailInput = {
  inviterName: string;
  inviterEmail: string | null;
  inviteeName: string;
  inviteeEmail: string;
};

export type PinResetEmailInput = {
  name: string;
  resetUrl: string;
};

export type ScheduleDaysAskEmailInput = {
  name: string;
  scheduleDaysPerWeek: number;
  loginUrl: string;
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
  /** True once this is not the first nudge sent for this same week/day target — the coach
   * photo turns from OK (a gentle first reminder) to Mad (a repeat one). */
  isRepeat?: boolean;
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
  replenishLine?: string | null;
  weekComplete?: boolean;
  programComplete?: boolean;
  nextLabel?: string | null;
  lockedWeeks?: number;
  tone?: CoachTone | null;
  /** Badges earned by this same completed session — rolled into this one email instead of a separate send per badge. */
  badges?: Array<{ name: string; description: string }>;
  /** Belt earned by this same completed session (a week just locked into it), if any. */
  belt?: Belt | null;
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
    p('<strong style="color:#e8c547;">Bonus work.</strong> Past their week with a Your pick. They did not owe it. They paid it.') +
    list
  );
}

function bonusHonorText(rows?: ScoreboardHonorRow[]) {
  if (!rows?.length) return [];
  return [
    'Bonus work. Past their week with a Your pick. They did not owe it. They paid it.',
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
  intro?: string;
  mid?: string;
  close?: string;
  wins: string[];
  groups?: ReleaseGroup[];
  also?: string[];
  tone?: CoachTone | null;
  signer?: string;
  homeScreen?: boolean;
};

function releaseGroups(input: ReleaseEmailInput): ReleaseGroup[] {
  if (input.groups && input.groups.length) return input.groups;
  if (input.wins.length) return [{ heading: 'what I just took control of', wins: input.wins }];
  return [];
}

function releaseFactHtml(item: string) {
  const parts = item.split(/\s+—\s+/);
  if (parts.length < 2) {
    return (
      '<div style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#f6f1e3;">' +
      esc(item) +
      '</div>'
    );
  }
  return (
    '<tr>' +
    '<td valign="top" style="padding:4px 12px 8px 0;font-size:13px;font-weight:800;color:#e8c547;white-space:nowrap;">' +
    esc(parts[0]) +
    '</td>' +
    '<td valign="top" style="padding:4px 0 8px;font-size:15px;line-height:1.45;color:#f6f1e3;">' +
    esc(parts.slice(1).join(' — ')) +
    '</td></tr>'
  );
}

function releaseGroupsHtml(groups: ReleaseGroup[]) {
  return groups
    .map((group) => {
      const labeled = group.wins.some((item) => /\s+—\s+/.test(item));
      const body = labeled
        ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 14px;">' +
          group.wins.map(releaseFactHtml).join('') +
          '</table>'
        : bullets(group.wins);
      return p('<strong style="color:#e8c547;">' + esc(group.heading.toUpperCase()) + '</strong>') + body;
    })
    .join('');
}

function releaseGroupsText(groups: ReleaseGroup[]) {
  return groups.flatMap((group) => [
    group.heading.toUpperCase(),
    ...group.wins.map((item) => '  ' + item),
    '',
  ]);
}

function releaseVoice(tone?: CoachTone | null) {
  const id = normalizeCoachTone(tone);
  if (id === 'james') {
    return {
      intro:
        'You will read this. I want you to. This one is for Jared, and you are in the room for it. The coach has been print on a screen. Print does not fill a gym. A voice does. Now you get the voice.',
      mid: 'Start a session and I am already talking. Come back to one you left open and I am still there. Between sets I call the rest, then I tell you to get to it. Take a record and I name it. Climb past last time, or drop off it, and I say which. Finish the exercise and I tell you how hard it sat. If more than one of those is true, they come in order. Record. Then the climb or the drop. Then the effort. Your name stays on the screen. The recording leaves it out. I still know who walked in. Coach voices is in Edit profile. Turn it off and the words stay. The chimes live on Workout sound. Both on, or you get silence where the voice should be. You can still pick your coach. I want you to hear this one.',
      close:
        'Jared, this letter has your name on it. The rest of you open the session and listen. The power is in the bar. Go and take it. Quit is still the only thing not welcome in here.',
      eyebrow: 'a note · ',
    };
  }
  if (id === 'luna') {
    return {
      intro:
        'Read this when you can. I want it to land softly and stay. This one is for Jared, and the house gets to hear it with him. The coach has been words. Words you could look past. A voice you cannot.',
      mid: 'When you start, I welcome you. When you come back to a session still open, I welcome you again. I call the rest. I tell you when rest is over. I name a new record. I tell you if you climbed past last time or fell off it. I tell you how hard the exercise felt. If more than one is true, they arrive in order, and none of them hides the others. Your name stays written down. The voice does not need to say it. Coach voices is in Edit profile if you want the room quiet. Workout sound keeps the chimes. Leave both on and I will be there. You can still choose who speaks. Stay with the work.',
      close:
        'Jared, this one is yours. Everyone else, start when you are ready and listen. Growth is the prize. It is waiting in the session. Quit is still the only thing not welcome in here.',
      eyebrow: 'a note · ',
    };
  }
  if (id === 'eli') {
    return {
      intro:
        'Hey, do not skip this one. I am fired up and I want you fired up with me. This release is for Jared, and the whole house gets to hear what that means. Your coach has been text. Text is fine. A voice in the room is better. You have the voice now.',
      mid: 'Start the workout and I welcome you like I have been waiting, because I have. Pick up a session you left open and I am still right there. I call the rest. I get you back to it when the rest is done. You take a record and I say it out loud. You beat last time or you slip off it and I tell you the truth, happy or mad, because I believe you can answer it. You finish the exercise and I tell you how hard it felt. If all three show up, they line up. Record, then the climb or the drop, then the effort. Your name stays on the screen where you can see it. The recording leaves it out so one voice fits every athlete, and I still know it is you. Coach voices is in Edit profile. Turn it off and the words stay. Workout sound is the chimes. Both on, and you get me at full volume. You can change your coach any time. I hope you keep the one who believes in you.',
      close:
        'Jared, this one has your name on it because you earned a voice in the house. The rest of you, open a session and listen. I knew you had this. Growth, lean, definition, power, stamina, mobility. Go take them. Quit is still the only thing not welcome in here.',
      eyebrow: 'good news · ',
    };
  }
  return {
    intro: 'Do not skim. These are orders. Read them. I do not repeat myself for quit.',
    mid: 'I put the year on paper. Stay on it.',
    close: 'Hard-refresh. Open Home. Then get under the bar. The power is in the work, not the note.',
    eyebrow: 'new orders · ',
  };
}

function fromFor(tone?: CoachTone | null, address?: string) {
  const id = normalizeCoachTone(tone);
  return defaultFrom(voiceFromName(id), address || coachFromAddress(id));
}

function address(name: string) {
  return p(esc(name) + '.');
}

export function buildWelcomeEmail(input: WelcomeEmailInput): BuiltEmail {
  const name = athleteCallName({ name: input.name });
  const url = loginUrl();
  const waiver = waiverUrl();
  const tone = normalizeCoachTone(input.tone);
  const grey = tone === 'james';
  const luna = tone === 'luna';
  const eli = tone === 'eli';
  const signer = voiceDisplayName(tone);
  const eyebrow = luna ? 'welcome' : eli ? "let's go" : 'roster';
  const title = luna ? 'You are welcome here' : eli ? 'Welcome to the team!' : 'You are on the floor now';
  const subtitle = '- by invitation only';
  const open = luna
    ? 'I have a place for you on the floor. Come when you are ready. The growth starts when you do.'
    : eli
      ? "I'm genuinely fired up you're here. You've got a place on the floor whenever you're ready. The growth starts the second you show up."
      : grey
        ? 'You are on the floor now. That was not a suggestion. The growth starts when you do.'
        : 'I put you on the roster. That was not a suggestion. The growth starts when you do.';
  const next = luna
    ? 'Open the app. Pick your name. Set your PIN. Then begin. First hour buys stamina.'
    : eli
      ? "Open the app, pick your name, set your PIN, then let's go. That first hour is where the stamina starts building."
      : grey
        ? 'Open the app. Pick your name. Punch your PIN. Then get under the bar. First hour buys stamina.'
        : 'Open the app. Pick your name. Punch your PIN. Then get under the bar. First hour buys stamina.';
  const pin = luna
    ? 'Want a different PIN? Edit profile. Same four digits is fine. I care that you show up.'
    : eli
      ? "Want a different PIN? Head to Edit profile and set one. Same four digits works too, I just care that you show up."
      : grey
        ? 'Want a different PIN? Report in, open Edit profile, and set one. Same four digits is allowed. I care that you show up.'
        : 'Want a different PIN? Report in, open Edit profile, and set one. Same four digits is allowed. I do not care as long as you show up.';
  const html = wrapEmailHtml({
    eyebrow,
    title,
    subtitle,
    signer,
    childrenHtml: [
      coachPersonaArt(tone, 'welcome'),
      address(name),
      p(open),
      p(next),
      p(pin),
      bullets(
        luna
          ? [
              'Six weeks. Upper. Lower. The load grows. You will finish it.',
              'Every set logged. Rest when it is time. Badges when you earn them.',
              'Your numbers stay with you so we can see the work.',
            ]
          : eli
            ? [
                'Six weeks. Upper. Lower. The load grows, and so do you. You will finish it.',
                'Every set logged. Rest when you need it. Badges the second you earn them.',
                'Your numbers stay with you, so we can watch the growth add up together.',
              ]
            : [
                'Six weeks. Upper. Lower. Progressive overload. You will finish it.',
                'Every set logged. Rest when I say. Badges when you earn them.',
                'Your numbers stay on your profile so I can inspect you.',
              ]
      ),
      cta(url, luna ? 'COME TRAIN' : eli ? "LET'S GO" : 'REPORT IN'),
      p('Waiver, Release, and Terms of Use: ' + waiver),
      iosHomeScreenStepsHtml(),
    ].join(''),
  });
  const text = [
    emailTextHeader(eyebrow, title + '\n' + subtitle),
    name + '.',
    '',
    open,
    next,
    pin,
    '',
    url,
    '',
    'Waiver: ' + waiver,
    '',
    iosHomeScreenStepsText(),
    emailTextSignOff(signer),
  ].join('\n');
  return {
    from: fromFor(input.tone, MAIL_FROM.welcome),
    subject: luna ? 'You are welcome. Work-It.' : eli ? "Welcome, let's go. Work-It." : 'Report in. Work-It.',
    html,
    text,
  };
}

export function buildVerifyEmail(input: {
  name: string;
  token: string;
  tone?: CoachTone | null;
}): BuiltEmail {
  const name = athleteCallName({ name: input.name });
  const url = verifyUrl(input.token);
  const waiver = waiverUrl();
  const html = wrapEmailHtml({
    eyebrow: 'verify',
    title: 'Open this once',
    subtitle: 'Then you are on the floor',
    signer: voiceDisplayName('luna'),
    childrenHtml: [
      address(name),
      p('Your PIN is set. Open this mail to verify the address. Home waits until you do.'),
      cta(url, 'VERIFY EMAIL'),
      p('Waiver, Release, and Terms of Use: ' + waiver),
    ].join(''),
  });
  return {
    from: fromFor('luna', MAIL_FROM.welcome),
    subject: 'Verify your email. Work-It.',
    html,
    text: [name + '.', '', 'Verify: ' + url, '', 'Waiver: ' + waiver].join('\n'),
  };
}

export function buildInviteEmail(input: InviteEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const url = input.claimUrl;
  const tone = normalizeCoachTone(input.tone);
  const grey = tone === 'james';
  const luna = tone === 'luna';
  const eli = tone === 'eli';
  const signer = voiceDisplayName(tone);
  const inviter = input.inviterEmail
    ? input.inviterName + ' (' + input.inviterEmail + ')'
    : input.inviterName;
  const eyebrow = luna ? 'welcome' : eli ? "let's go" : 'roster';
  const title = luna ? 'You are welcome here' : eli ? 'Welcome to the team!' : 'You are on the floor now';
  const subtitle = '- by invitation only';
  const put = luna
    ? esc(inviter) + ' saved you a place on the floor. Come when you are ready. The growth starts when you do.'
    : eli
      ? esc(inviter) + " saved you a spot, and I'm genuinely excited you're here. The growth starts the second you show up."
      : grey
        ? esc(inviter) + ' put you on my watch. That was not a suggestion. The growth starts when you do.'
        : esc(inviter) + ' put you on my roster. That was not a suggestion. The growth starts when you do.';
  const next = luna
    ? 'Open the link. Create your 4-digit PIN. Confirm it. Then begin. First hour buys stamina.'
    : eli
      ? "Open the link, create your 4-digit PIN, confirm it, then let's go. That first hour is where the stamina starts building."
      : grey
        ? 'Open the link. Create your 4-digit PIN. Confirm it. Then get under the bar. First hour buys stamina.'
        : 'Open the link. Create your 4-digit PIN. Confirm it. Then get under the bar. First hour buys stamina.';
  const html = wrapEmailHtml({
    eyebrow,
    title,
    subtitle,
    signer,
    childrenHtml: [
      coachPersonaArt(tone, 'welcome'),
      address(name),
      p(put),
      p(next),
      bullets(
        luna
          ? [
              'Six weeks. Upper. Lower. The load grows. You will finish it.',
              'Every set logged. Rest when it is time. Badges when you earn them.',
              'Your numbers stay with you so we can see the work.',
            ]
          : eli
            ? [
                'Six weeks. Upper. Lower. The load grows, and so do you. You will finish it.',
                'Every set logged. Rest when you need it. Badges the second you earn them.',
                'Your numbers stay with you, so we can watch the growth add up together.',
              ]
            : [
                'Six weeks. Upper. Lower. Progressive overload. You will finish it.',
                'Every set logged. Rest when I say. Badges when you earn them.',
                'Your numbers stay on your profile so I can inspect you.',
              ]
      ),
      cta(url, eli ? "LET'S GO" : 'CREATE YOUR PIN'),
      iosHomeScreenStepsHtml(),
    ].join(''),
  });
  const text = [
    emailTextHeader(eyebrow, title + '\n' + subtitle),
    name + '.',
    '',
    luna
      ? inviter + ' saved you a place on the floor. Come when you are ready. The growth starts when you do.'
      : eli
        ? inviter + " saved you a spot, and I'm genuinely excited you're here. The growth starts the second you show up."
        : inviter +
          (grey
            ? ' put you on my watch. That was not a suggestion. The growth starts when you do.'
            : ' put you on my roster. That was not a suggestion. The growth starts when you do.'),
    luna
      ? 'Open the link. Create your 4-digit PIN. Confirm it. Then begin. First hour buys stamina.'
      : eli
        ? "Open the link, create your 4-digit PIN, confirm it, then let's go. First hour is where the stamina starts building."
        : 'Open the link. Create your 4-digit PIN. Confirm it. Then get under the bar. First hour buys stamina.',
    '',
    url,
    '',
    iosHomeScreenStepsText(),
    emailTextSignOff(signer),
  ].join('\n');
  const toneSubject = luna
    ? 'You are welcome. Work-It.'
    : eli
      ? "Welcome, let's go. Work-It."
      : 'Report in. Work-It.';
  return {
    from: fromFor(input.tone, MAIL_FROM.welcome),
    // Every invite (including resends, which reuse this builder) leads with who sent it.
    subject: 'An invitation from ' + input.inviterName + ' — ' + toneSubject,
    html,
    text,
  };
}

export function buildPinResetEmail(input: PinResetEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const url = input.resetUrl;
  const html = wrapEmailHtml({
    eyebrow: 'PIN',
    title: 'New four digits',
    subtitle: '- Work-It',
    signer: voiceDisplayName('master'),
    childrenHtml: [
      coachPersonaArt('master', 'ok'),
      address(name),
      p('You asked to change your PIN, man. Open the link. Create four digits. Confirm them.'),
      p('If that was not you, ignore this. Your old PIN still works until you finish.'),
      cta(url, 'SET A NEW PIN'),
    ].join(''),
  });
  const text = [
    emailTextHeader('PIN', 'New four digits\n- Work-It'),
    name + '.',
    '',
    'You asked to change your PIN, man. Open the link. Create four digits. Confirm them.',
    'If that was not you, ignore this. Your old PIN still works until you finish.',
    '',
    url,
    '',
    emailTextSignOff(voiceDisplayName('master')),
  ].join('\n');
  return {
    from: fromFor('master', MAIL_FROM.help),
    subject: 'New PIN. Work-It.',
    html,
    text,
  };
}

/** Every 6 program weeks, in step with the Home takeover, asks whether the
 * athlete's chosen training frequency still fits. */
export function buildScheduleDaysAskEmail(input: ScheduleDaysAskEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const days = input.scheduleDaysPerWeek;
  const html = wrapEmailHtml({
    eyebrow: 'six weeks in',
    title: 'Still the right pace?',
    subtitle: '- Work-It',
    signer: voiceDisplayName(BROADCAST_TONE),
    childrenHtml: [
      coachPersonaArt(BROADCAST_TONE, 'ok'),
      address(name),
      p(
        `You're set to train ${days} day${days === 1 ? '' : 's'} a week. That is still the plan unless you change it.`
      ),
      p('Open Edit profile from the menu to change it anytime.'),
      cta(input.loginUrl, 'OPEN WORK-IT'),
    ].join(''),
  });
  const text = [
    emailTextHeader('six weeks in', 'Still the right pace?\n- Work-It'),
    name + '.',
    '',
    `You're set to train ${days} day${days === 1 ? '' : 's'} a week. That is still the plan unless you change it.`,
    'Open Edit profile from the menu to change it anytime.',
    '',
    input.loginUrl,
    '',
    emailTextSignOff(voiceDisplayName(BROADCAST_TONE)),
  ].join('\n');
  return {
    from: fromFor(BROADCAST_TONE, MAIL_FROM.news),
    subject: 'Still training ' + days + ' days a week? Work-It.',
    html,
    text,
  };
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
    from: fromFor('master', MAIL_FROM.info),
    subject: 'Invite · ' + input.inviterName + ' added ' + input.inviteeName,
    html,
    text,
  };
}

/** Nudge + resume mail goes out to the whole house from the daily cron, so it
 * speaks in the broadcast voice (Eli), not each athlete's own coach. */
export function buildNudgeEmail(input: NudgeEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const tone = BROADCAST_TONE;
  const resume = input.mode === 'resume';
  const shout = resume
    ? pickResumeLine(tone, input.name)
    : pickCoachLine(0, 3, tone, input.name);
  const signer = voiceDisplayName(tone);
  const eyebrow = resume ? "let's finish it" : "let's go";
  const title = resume
    ? 'Hey, that session is still waiting on you.'
    : input.dayName + '. Let us go get it.';
  const estimate = input.estimate
    ? p(
        esc(input.estimate) +
          '. That time is yours whenever you are ready. I will be right there with you.'
      )
    : '';
  const href = input.href.startsWith('http') ? input.href : appUrl() + input.href;
  const where = 'Week ' + input.weekNumber + ' · ' + input.dayName;
  const body = resume
    ? esc(where) + " is still open. I know you can finish this one, come back and let's close it out."
    : esc(where) +
      (input.focus ? ' · ' + esc(input.focus) : '') +
      '. That hour is ready whenever you are. Let us go build some stamina.';
  const html = wrapEmailHtml({
    eyebrow,
    title,
    signer,
    childrenHtml: [
      coachPersonaArt(tone, input.isRepeat ? 'mad' : 'ok'),
      address(name),
      p('<strong style="color:#fff;">' + esc(shout) + '</strong>'),
      p(body),
      estimate,
      cta(href, resume ? "LET'S FINISH IT" : "LET'S GO"),
    ].join(''),
  });
  const subject = (resume ? "Let's finish it: " : "Let's go: ") + input.dayName;
  const text = [
    emailTextHeader(eyebrow, title),
    name + '.',
    '',
    shout,
    '',
    resume
      ? where + " is still open. I know you can finish this, come back and let's close it out."
      : where + ' is ready whenever you are. Let us go build some stamina.',
    '',
    href,
    emailTextSignOff(signer),
  ].join('\n');
  return { from: fromFor(tone), subject, html, text };
}

function formatLbs(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Math.round(Number(value)).toLocaleString() + ' lbs';
}

export function buildWorkoutCompleteEmail(input: WorkoutCompleteEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const tone = normalizeCoachTone(input.tone);
  const luna = tone === 'luna';
  const eli = tone === 'eli';
  const signer = voiceDisplayName(tone);
  const eyebrow = input.programComplete
    ? 'program complete'
    : input.weekComplete
      ? 'week locked'
      : luna
        ? 'complete'
        : eli
          ? 'nailed it'
          : 'paid';
  const title = input.programComplete
    ? luna
      ? 'Six weeks. The growth held.'
      : eli
        ? 'Six weeks down! The power held, and so did you.'
        : 'Six weeks. The power held.'
    : input.weekComplete
      ? luna
        ? 'Week ' + input.weekNumber + ' is locked. The stamina is paid.'
        : eli
          ? 'Week ' + input.weekNumber + ' is locked in! That stamina is yours.'
          : 'Week ' + input.weekNumber + ' is locked. The stamina is paid.'
      : luna
        ? input.dayName + ' is done. The growth settled.'
        : eli
          ? input.dayName + ' is done, ' + name + '! That is real growth.'
          : input.dayName + ' is done. ' + name + '. That is growth.';

  const rows: Array<[string, string]> = [
    ['Workout', 'Week ' + input.weekNumber + ' · ' + input.dayName],
    ['Time under the iron', formatDuration(input.durationSeconds)],
    ['Volume', formatLbs(input.volumeLbs)],
    ['Sets', String(input.setCount ?? '—')],
    ['Exercises', String(input.exerciseCount ?? '—')],
  ];

  const next = input.programComplete
    ? p(
        luna
          ? 'The work is complete. Rest. Let the lean land. Then the next year.'
          : eli
            ? "That's a whole year of work, and you finished it. Rest up, let it land. Then let's do the next one."
            : 'The tax is paid in full. Recover. Let the lean land. Then the next week.'
      )
    : input.nextLabel
      ? p(
          luna
            ? 'Next is waiting: <strong style="color:#fff;">' +
              esc(input.nextLabel) +
              '</strong>. Soft start. Soft now is less definition.'
            : eli
              ? 'Next up: <strong style="color:#fff;">' +
                esc(input.nextLabel) +
                '</strong>. Whenever you are ready, I will be there.'
              : 'Next is <strong style="color:#fff;">' +
                esc(input.nextLabel) +
                '</strong>. Soft now is less definition.'
        )
      : '';

  const badges = input.badges ?? [];
  const belt = input.belt ?? null;
  const earned = belt != null || badges.length > 0;

  // Belt and badge blocks reuse the same art + copy as the standalone diploma/badge
  // emails (buildBeltEmail / buildBadgeEmail below), which still serve the admin
  // template preview — here they roll into this one send instead of separate mails.
  const beltBlockHtml = belt
    ? p('<strong style="color:#fff;">Diploma earned</strong>') +
      emailArt(hostedAsset(beltArtSrc(belt.slug)), belt.name, 160) +
      p('<strong style="color:#fff;">' + esc(belt.quote) + '</strong>') +
      p(esc(belt.saidBy)) +
      p(esc(beltCoachLine(belt, input.tone, input.name)))
    : '';
  const badgesBlockHtml = badges.length
    ? p('<strong style="color:#fff;">' + (badges.length === 1 ? 'New badge' : 'New badges') + '</strong>') +
      badges
        .map((badge) => emailArt(hostedAsset(badgeArtSrc(badge.name)), badge.name, 80) + p(esc(badge.name) + ' — ' + esc(badge.description)))
        .join('')
    : '';

  const html = wrapEmailHtml({
    eyebrow,
    title,
    signer,
    childrenHtml: [
      coachPersonaArt(tone, earned ? 'celebratory' : 'happy'),
      address(name),
      p('<strong style="color:#fff;">' + esc(input.completeLine) + '</strong>'),
      input.replenishLine ? p(esc(input.replenishLine)) : '',
      statsTable(rows),
      beltProgressBlock(input.lockedWeeks).html,
      beltBlockHtml,
      badgesBlockHtml,
      next,
      cta(whoUrl(), input.programComplete ? 'OPEN HOME' : luna ? 'SEE THE WORK' : eli ? 'SEE WHAT YOU BUILT' : 'OPEN HOME'),
    ].join(''),
  });

  let subject = input.programComplete
    ? luna
      ? 'The year bought growth.'
      : eli
        ? 'A full year. Look what you built.'
        : 'Program complete. The year bought growth.'
    : input.weekComplete
      ? luna
        ? 'Week ' + input.weekNumber + ' locked. Keep the power.'
        : eli
          ? 'Week ' + input.weekNumber + ' locked in! Keep that momentum.'
          : 'Week ' + input.weekNumber + ' locked. Keep the power.'
      : luna
        ? 'Complete. ' + input.dayName + ' is done.'
        : eli
          ? 'Nailed it. ' + input.dayName + ' is done.'
          : 'Paid. ' + input.dayName + ' is done.';
  if (belt) subject += ' · ' + belt.name + ' diploma';
  else if (badges.length === 1) subject += ' · ' + badges[0].name;
  else if (badges.length > 1) subject += ' · ' + badges.length + ' badges';

  const text = [
    emailTextHeader(eyebrow, title),
    name + '.',
    '',
    input.completeLine,
    '',
    ...(input.replenishLine ? [input.replenishLine, ''] : []),
    'Week ' + input.weekNumber + ' · ' + input.dayName,
    'Time: ' + formatDuration(input.durationSeconds),
    'Volume: ' + formatLbs(input.volumeLbs),
    ...beltProgressBlock(input.lockedWeeks).text,
    ...(belt ? ['', 'Diploma earned: ' + belt.name, belt.quote, belt.saidBy] : []),
    ...(badges.length
      ? ['', badges.length === 1 ? 'New badge:' : 'New badges:', ...badges.map((badge) => badge.name + ' — ' + badge.description)]
      : []),
    input.programComplete
      ? luna
        ? 'The work is complete. Let the lean land.'
        : eli
          ? "That's a whole year of work, and you finished it. Let it land."
          : 'The tax is paid in full. Let the lean land.'
      : input.nextLabel
        ? luna
          ? 'Next is waiting: ' + input.nextLabel + '. Soft now is less definition.'
          : eli
            ? 'Next up: ' + input.nextLabel + '. Whenever you are ready, I will be there.'
            : 'Next is ' + input.nextLabel + '. Soft now is less definition.'
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
  const tone = normalizeCoachTone(input.tone);
  const luna = tone === 'luna';
  const eli = tone === 'eli';
  const signer = voiceDisplayName(tone);
  const eyebrow = 'earned';
  const title = luna
    ? 'You stayed. The stamina showed. ' + input.badgeName + '.'
    : eli
      ? name + '! ' + input.badgeName + '. Look what you built!'
      : name + '. ' + input.badgeName + '. That is growth.';
  const html = wrapEmailHtml({
    eyebrow,
    title,
    signer,
    childrenHtml: [
      address(name),
      emailArt(hostedAsset(badgeArtSrc(input.badgeName)), input.badgeName, 96),
      p(esc(input.badgeDescription) + '.'),
      p(
        luna
          ? 'You earned this because you stayed with the work. The next one is more definition.'
          : eli
            ? "You earned this because you stayed with it, and I noticed every bit of it. The next one's out there waiting."
            : 'You earned this because the work stuck. The next one is more definition.'
      ),
      cta(whoUrl(), luna ? 'SEE THE WORK' : eli ? 'SEE WHAT YOU BUILT' : 'OPEN HOME'),
    ].join(''),
  });
  const text = [
    emailTextHeader(eyebrow, title),
    name + '.',
    '',
    input.badgeName,
    input.badgeDescription + '.',
    luna
      ? 'You earned this because you stayed with the work. The next one is more definition.'
      : eli
        ? "You earned this because you stayed with it, and I noticed every bit of it. The next one's out there waiting."
        : 'You earned this because the work stuck. The next one is more definition.',
    '',
    whoUrl(),
    emailTextSignOff(signer),
  ].join('\n');
  return {
    from: fromFor(input.tone),
    subject: luna
      ? 'You stayed. You earned ' + input.badgeName + '.'
      : eli
        ? name + '! You earned ' + input.badgeName + '. Nice work.'
        : name + '. You earned ' + input.badgeName + '. That is growth.',
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
      p(esc(beltCoachLine(belt, input.tone, input.name))),
      cta(appUrl() + '/belts', 'SEE THE BELTS'),
    ].join(''),
  });
  const text = [
    emailTextHeader(eyebrow, title),
    name + '.',
    '',
    belt.quote,
    belt.saidBy,
    beltCoachLine(belt, input.tone, input.name),
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

const SCOREBOARD_INTRO =
  'Here is the house this week. Every workout on this list is somebody choosing to show up, and I love to see it. Stamina, power, growth, all of it came from those hours.';
const SCOREBOARD_OPEN =
  'Left a session open? No stress, it is still waiting for you. Come back and close it out, I know you have it.';

export function buildScoreboardEmail(input: ScoreboardEmailInput): BuiltEmail {
  const eyebrow = 'the house';
  const title = 'Who showed up · ' + input.rangeLabel;
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
    signer: voiceDisplayName(BROADCAST_TONE),
    childrenHtml: [
      coachPersonaArt(BROADCAST_TONE, 'celebratory'),
      p(esc(SCOREBOARD_INTRO)),
      p(esc(SCOREBOARD_OPEN)),
      rankingHtml,
      yoursHtml,
      bonusHonorHtml(input.bonusHonor),
      optionalHonorHtml(input.optionalHonor),
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
        rowsHtml +
        '</table>',
      cta(whoUrl(), "LET'S GO"),
    ].join(''),
  });

  const text = [
    emailTextHeader(eyebrow, title),
    '',
    SCOREBOARD_INTRO,
    SCOREBOARD_OPEN,
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
    emailTextSignOff(voiceDisplayName(BROADCAST_TONE)),
  ].join('\n');

  return {
    from: fromFor(BROADCAST_TONE, MAIL_FROM.info),
    subject: 'The house this week — who showed up',
    html,
    text,
  };
}

export function buildReleaseEmail(input: ReleaseEmailInput): BuiltEmail {
  const name = firstName(input.name);
  const tone = normalizeCoachTone(input.tone);
  const voice = releaseVoice(tone);
  const signer =
    tone === 'master' ? input.signer || voiceDisplayName(tone) : voiceDisplayName(tone);
  const intro = input.intro || voice.intro;
  const mid = input.mid || voice.mid;
  const close = input.close || voice.close;
  const eyebrow = voice.eyebrow + input.version;
  const groups = releaseGroups(input);
  const first = groups[0] ? [groups[0]] : [];
  const rest = groups.slice(1);
  const html = wrapEmailHtml({
    eyebrow,
    title: input.title,
    signer,
    childrenHtml: [
      address(name),
      p(esc(intro)),
      releaseGroupsHtml(first),
      mid ? p(esc(mid)) : '',
      releaseGroupsHtml(rest),
      input.also && input.also.length
        ? p('<strong style="color:#fff;">and you will also:</strong>') + bullets(input.also)
        : '',
      p(esc(close)),
      cta(whoUrl(), tone === 'luna' ? 'COME TRAIN' : tone === 'eli' ? "LET'S GO" : 'REPORT IN'),
      input.homeScreen ? iosHomeScreenStepsHtml() : '',
    ].join(''),
  });
  const text = [
    emailTextHeader(eyebrow, input.title),
    name + '.',
    '',
    intro,
    '',
    ...releaseGroupsText(first),
    ...(mid ? [mid, ''] : []),
    ...releaseGroupsText(rest),
    ...(input.also && input.also.length
      ? ['And you will also:', ...input.also.map((item) => '  - ' + item), '']
      : []),
    close,
    '',
    whoUrl(),
    ...(input.homeScreen ? ['', iosHomeScreenStepsText()] : []),
    emailTextSignOff(signer),
  ].join('\n');
  return {
    from: fromFor(tone, MAIL_FROM.news),
    subject:
      input.subject ||
      (tone === 'master' ? 'New orders — ' + input.title : 'A note — ' + input.title),
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
    completeLine: 'That is how you finish. I watched. You do not get to look away.',
    replenishLine: 'Rehydrate with at least 16 ounces of water.',
    nextLabel: 'Week 3 · Lower Body A',
    lockedWeeks: 4,
  };

  if (template === 'welcome') return buildWelcomeEmail({ name: 'Kevin' });
  if (template === 'verify') return buildVerifyEmail({ name: 'Kevin', token: 'preview' });
  if (template === 'invite') {
    return buildInviteEmail({
      name: 'Maya Chen',
      inviterName: 'Kevin Leacock',
      inviterEmail: 'leacock.kervin@gmail.com',
      claimUrl: whoUrl() + '?claim=preview',
    });
  }
  if (template === 'pin_reset') {
    return buildPinResetEmail({
      name: 'Kevin',
      resetUrl: resetUrl('preview'),
    });
  }
  if (template === 'schedule_days_ask') {
    return buildScheduleDaysAskEmail({
      name: 'Kevin',
      scheduleDaysPerWeek: 4,
      loginUrl: loginUrl(),
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
  return buildReleaseEmail({ name: 'Kevin', ...CURRENT_RELEASE, tone: BROADCAST_TONE });
}
