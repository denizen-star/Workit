/**
 * One-off: send the athlete-feedback scoping analysis (alt exercises, goal
 * programs, flexible days/week) to Kevin, Christine, and Mike, in Eli's
 * voice, asking them to reply with a vote. Uses the same mail pipeline as
 * `npm run mail:release` (lib/mailClient + lib/emailLayout), not a one-off
 * template, so it looks and behaves like real household mail.
 *
 *   npx tsx --env-file=.env.local scripts/send-feedback-vote-email.ts
 */
import { isEmailEnabled, sendEmail, defaultFrom } from '../lib/mailClient';
import { MAIL_FROM } from '../lib/mailFrom';
import { voiceFromName } from '../lib/coachCatalog';
import { wrapEmailHtml, p, bullets, coachPersonaArt, esc } from '../lib/emailLayout';
import { firstName } from '../lib/profile';

type Recipient = { id: number; name: string; email: string };

const RECIPIENTS: Recipient[] = [
  { id: 1, name: 'Kevin Leacock', email: 'kervin.leacock@yahoo.com' },
  { id: 5, name: 'Christine Widga', email: 'christine.widga@gmail.com' },
  { id: 4, name: 'Mike', email: 'me76@outlook.com' },
  { id: 3, name: 'Peter', email: 'peterpapapetrou1@gmail.com' },
  { id: 16, name: 'Jared Smith', email: 'jaredlynchsmith@gmail.com' },
];

const SIGNER = 'Eli Sparks';

type Section = {
  heading: string;
  oneLiner: string;
  pros: string[];
  cons: string[];
  load: string;
};

const SECTIONS: Section[] = [
  {
    heading: '1 · Alt exercises (equipment missing, or you just don’t like it)',
    oneLiner: 'Swap any exercise for one that hits the same muscle group — same idea as the Gym/Travel toggle you already use.',
    pros: [
      'Fixes a real everyday problem — no machine, no sweat, you keep training',
      'Doesn’t touch weeks, badges, or belts — stays contained to the exercise card',
      'Reuses a toggle you already know how to use',
    ],
    cons: [
      'Every exercise in the catalog (150+) needs a muscle-group tag and a hand-picked alt',
      'A swapped exercise starts its own fresh history — you lose the PR trail on that movement when you swap',
    ],
    load: 'Low-to-medium. One more toggle, nothing new to learn.',
  },
  {
    heading: '2 · Multiple 6-week programs by goal (strength, hypertrophy)',
    oneLiner: 'Opt into a goal-specific 6-week block — same shape as Hyrox training: pauses your normal program, runs its own content, hands you back where you left off.',
    pros: [
      'Real personalization — training actually matches what you’re chasing',
      'Not unproven — Hyrox already showed this pattern works end to end',
    ],
    cons: [
      'This is basically 1-2 more programs the size of Hyrox — new content, new coach lines, new rules',
      'Standing cost — every future program change now has to be checked against every track, forever',
    ],
    load: 'Meaningfully higher, both sides. Athletes pick between 4 things to be “in.”',
  },
  {
    heading: '3 · Pick your own days per week (min 2)',
    oneLiner: 'Set your own training frequency instead of the fixed schedule everyone runs today.',
    pros: [
      'The mechanics are already close to ready — sessions don’t depend on each other within a week',
      'There’s already a working example of a flexible “days to complete a week” rule (how Hyrox’s 5-day weeks lock)',
    ],
    cons: [
      '“4 days = a complete week” is hardcoded in 10+ other places — belts, badges, weekly medals, Travel Survivor, nudge emails',
      'No full-body day exists yet — picking 2 of the current days could mean two upper days and zero legs, unless the picker is constrained',
    ],
    load: 'Low for you (one settings choice). Medium-high to build — it’s a wide refactor, not a deep one.',
  },
];

function sectionHtml(s: Section) {
  return (
    p('<strong style="color:#e8c547;font-size:16px;">' + esc(s.heading) + '</strong>') +
    p(esc(s.oneLiner)) +
    p('<strong style="color:#fff;">What’s good:</strong>') +
    bullets(s.pros) +
    p('<strong style="color:#fff;">What it costs:</strong>') +
    bullets(s.cons) +
    p('<strong style="color:#fff;">Load:</strong> ' + esc(s.load))
  );
}

function voteBoxHtml() {
  return (
    '<div style="margin:22px 0 6px;padding:16px;border:1px solid rgba(232,197,71,0.45);border-radius:10px;background:rgba(232,197,71,0.06);">' +
    '<p style="margin:0 0 8px;font-size:15px;font-weight:800;color:#fff;">Vote — just reply to this email</p>' +
    '<p style="margin:0;font-size:14px;line-height:1.55;color:#f6f1e3;">Tell me which one you want first. Reply with a name, or rank all three 1-2-3 if you’ve got an order in mind. That’s it — no form, no link.</p>' +
    '</div>'
  );
}

function buildEmailFor(name: string) {
  const first = firstName(name);
  const eyebrow = 'good news · your feedback';
  const title = 'I looked into all three. Here’s what I found.';
  const intro =
    'Hey, ' +
    first +
    '. You put three real ideas on the table — alt exercises, goal-based programs, and picking your own days per week. I dug into what each one actually takes before anyone touches code. Here’s the honest breakdown, and then I want your vote.';
  const close =
    'None of these are off the table — I just want to build the right one first. Reply and tell me where to start.';
  const childrenHtml =
    p(esc(first) + '.') +
    coachPersonaArt('eli', 'happy', 96) +
    p(esc(intro)) +
    SECTIONS.map(sectionHtml).join('') +
    voteBoxHtml() +
    p(esc(close));
  const html = wrapEmailHtml({ eyebrow, title, childrenHtml, signer: SIGNER });
  const text = [
    eyebrow.toUpperCase(),
    title,
    '',
    first + '.',
    '',
    intro,
    '',
    ...SECTIONS.flatMap((s) => [
      s.heading,
      s.oneLiner,
      'What’s good:',
      ...s.pros.map((x) => '  + ' + x),
      'What it costs:',
      ...s.cons.map((x) => '  - ' + x),
      'Load: ' + s.load,
      '',
    ]),
    'VOTE — just reply to this email',
    'Tell me which one you want first. Reply with a name, or rank all three 1-2-3.',
    '',
    close,
    '',
    SIGNER,
  ].join('\n');
  return { subject: title, html, text };
}

async function main() {
  if (!isEmailEnabled()) {
    console.error('[send-feedback-vote-email] EMAIL_ENABLED is off');
    process.exitCode = 1;
    return;
  }
  const dryRun = process.env.DRY_RUN === '1';
  const only = (process.env.ONLY_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const targets = only.length ? RECIPIENTS.filter((r) => only.includes(r.email.toLowerCase())) : RECIPIENTS;
  let sent = 0;
  for (const r of targets) {
    const email = buildEmailFor(r.name);
    if (dryRun) {
      console.log('=== DRY RUN for', r.email, '===');
      console.log(email.text);
      console.log('');
      sent += 1;
      continue;
    }
    const id = await sendEmail({
      to: r.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      from: defaultFrom(voiceFromName('eli'), MAIL_FROM.eli),
      archive: { userId: r.id, athleteName: r.name, template: 'feedback-vote' },
    });
    if (!id) {
      console.error('[send-feedback-vote-email] failed for', r.email);
      process.exitCode = 1;
      continue;
    }
    sent += 1;
    console.log('[send-feedback-vote-email] sent', id, 'to', r.email);
  }
  console.log('[send-feedback-vote-email] done', sent + '/' + targets.length);
  if (sent === 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[send-feedback-vote-email] failed:', err);
  process.exitCode = 1;
});
