import { after } from 'next/server';
import { query } from '@/lib/db';
import { appUrl, bullets, cta, emailTextHeader, emailTextSignOff, esc, p, statsTable, whoUrl, wrapEmailHtml } from '@/lib/emailLayout';
import { defaultFrom } from '@/lib/mailClient';
import { formatAvg, reasonLabel, topicLabel } from '@/lib/feedback';
import { firstName } from '@/lib/profile';
import { claimAndSend } from '@/lib/emails/send';
import type { RatingStats } from '@/lib/ratings';
import type { BuiltEmail } from '@/lib/emails/templates';

/** Kevin's inbox for Talk to me notes and the admin digest. */
export function feedbackMailTo() {
  return (process.env.WORKIT_SCOREBOARD_TO || 'leacock.kervin@gmail.com').trim();
}

export type FeedbackNoteMailInput = {
  name: string;
  email?: string | null;
  topic?: string | null;
  message: string;
  pageUrl?: string | null;
};

export type DigestItem = {
  kind: string;
  name: string;
  topic?: string | null;
  reason?: string | null;
  exerciseName?: string | null;
  message: string;
};

export function buildFeedbackNoteEmail(input: FeedbackNoteMailInput): BuiltEmail {
  const topic = topicLabel(input.topic);
  const html = wrapEmailHtml({
    eyebrow: 'talk to me',
    title: input.name + ' sent a note',
    childrenHtml: [
      p('<strong style="color:#fff;">' + esc(topic) + '</strong>'),
      p(esc(input.message).replace(/\n/g, '<br>')),
      input.email ? p('Reply: ' + esc(input.email)) : '',
      input.pageUrl ? p('Page: ' + esc(input.pageUrl)) : '',
    ].join(''),
  });
  const text = [
    emailTextHeader('talk to me', input.name + ' sent a note'),
    topic,
    '',
    input.message,
    input.email ? 'Reply: ' + input.email : '',
    input.pageUrl ? 'Page: ' + input.pageUrl : '',
    emailTextSignOff(),
  ]
    .filter(Boolean)
    .join('\n');
  return {
    from: defaultFrom('Master Tom Iron'),
    subject: 'Talk to me · ' + input.name,
    html,
    text,
  };
}

export function buildFeedbackDigestEmail(input: {
  stats: RatingStats;
  items: DigestItem[];
}): BuiltEmail {
  const avgRows: Array<[string, string]> = [
    ['Household', formatAvg(input.stats.overall.avg) + ' · ' + input.stats.overall.count + ' rated'],
    ...input.stats.athletes.map((row) => [row.name, formatAvg(row.avg) + ' · ' + row.count] as [string, string]),
    ...input.stats.modes.map(
      (row) =>
        [row.mode === 'travel' ? 'Travel' : 'Gym', formatAvg(row.avg) + ' · ' + row.count] as [string, string]
    ),
    ...input.stats.dayTypes.map((row) => [row.type, formatAvg(row.avg) + ' · ' + row.count] as [string, string]),
    ...input.stats.outcomes.map(
      (row) =>
        [row.outcome === 'quit' ? 'Walked' : 'Finished', formatAvg(row.avg) + ' · ' + row.count] as [
          string,
          string,
        ]
    ),
  ];

  const itemLines = input.items.map((item) => {
    if (item.kind === 'thumb') {
      return (
        esc(item.name) +
        ' · ' +
        esc(item.exerciseName || 'exercise') +
        ' · ' +
        esc(reasonLabel(item.reason))
      );
    }
    return esc(item.name) + ' · ' + esc(topicLabel(item.topic)) + ' — ' + esc(item.message);
  });

  const html = wrapEmailHtml({
    eyebrow: 'digest',
    title: 'Feedback on the floor',
    childrenHtml: [
      input.stats.overall.count ? statsTable(avgRows) : p('No stars in the bank yet.'),
      itemLines.length
        ? bullets(itemLines)
        : p('No new thumbs or notes waiting.'),
      cta(appUrl() + '/admin/feedback', 'OPEN THE LIST'),
    ].join(''),
  });
  const text = [
    emailTextHeader('digest', 'Feedback on the floor'),
    ...avgRows.map((row) => row[0] + ': ' + row[1]),
    '',
    ...input.items.map((item) =>
      item.kind === 'thumb'
        ? item.name + ' · ' + (item.exerciseName || 'exercise') + ' · ' + reasonLabel(item.reason)
        : item.name + ' · ' + topicLabel(item.topic) + ' — ' + item.message
    ),
    '',
    appUrl() + '/admin/feedback',
    emailTextSignOff(),
  ].join('\n');

  return {
    from: defaultFrom('Master Tom Iron'),
    subject: 'Work-It feedback digest',
    html,
    text,
  };
}

export type FeedbackLiveMailInput = {
  name: string;
  kind: string;
  topic?: string | null;
  reason?: string | null;
  exerciseName?: string | null;
  message?: string | null;
};

export function buildFeedbackLiveEmail(input: FeedbackLiveMailInput): BuiltEmail {
  const name = firstName(input.name);
  const thumb = input.kind === 'thumb';
  const what = thumb
    ? reasonLabel(input.reason) + (input.exerciseName ? ' · ' + input.exerciseName : '')
    : topicLabel(input.topic);
  const body = thumb
    ? name +
      '. You named the lift. The tape and the picture are on the floor now. That is growth.'
    : name + '. You named it. It is on the floor now. That is growth.';
  const note = String(input.message || '').trim();
  const html = wrapEmailHtml({
    eyebrow: 'live',
    title: 'Your feature is live',
    childrenHtml: [
      p(esc(body)),
      p('<strong style="color:#fff;">' + esc(what) + '</strong>'),
      note ? p(esc(note).replace(/\n/g, '<br>')) : '',
      p('Hard-refresh. Open Home. Then get under the bar.'),
      cta(whoUrl(), 'OPEN HOME'),
    ].join(''),
  });
  const text = [
    emailTextHeader('live', 'Your feature is live'),
    body,
    '',
    what,
    note,
    '',
    'Hard-refresh. Open Home. Then get under the bar.',
    whoUrl(),
    emailTextSignOff(),
  ]
    .filter((line) => line !== undefined)
    .join('\n');
  return {
    from: defaultFrom('Master Tom Iron'),
    subject: 'Your feature is live',
    html,
    text,
  };
}

export function buildFeedbackWontDoEmail(input: FeedbackLiveMailInput): BuiltEmail {
  const name = firstName(input.name);
  const thumb = input.kind === 'thumb';
  const what = thumb
    ? reasonLabel(input.reason) + (input.exerciseName ? ' · ' + input.exerciseName : '')
    : topicLabel(input.topic);
  const body = thumb
    ? name + '. You named the lift. I will not change it. The growth stays on the work that holds.'
    : name + '. You named it. I will not build it. That is not a maybe.';
  const note = String(input.message || '').trim();
  const html = wrapEmailHtml({
    eyebrow: "won't do",
    title: 'I will not do this',
    childrenHtml: [
      p(esc(body)),
      p('<strong style="color:#fff;">' + esc(what) + '</strong>'),
      note ? p(esc(note).replace(/\n/g, '<br>')) : '',
      p('Hard-refresh. Open Home. Then get under the bar.'),
      cta(whoUrl(), 'OPEN HOME'),
    ].join(''),
  });
  const text = [
    emailTextHeader("won't do", 'I will not do this'),
    body,
    '',
    what,
    note,
    '',
    'Hard-refresh. Open Home. Then get under the bar.',
    whoUrl(),
    emailTextSignOff(),
  ]
    .filter((line) => line !== undefined)
    .join('\n');
  return {
    from: defaultFrom('Master Tom Iron'),
    subject: 'I will not do this',
    html,
    text,
  };
}

type FeedbackCloseKind = 'live' | 'wont_do';

export function queueFeedbackLiveEmail(feedbackId: number) {
  after(async () => {
    await sendFeedbackCloseEmail(feedbackId, 'live');
  });
}

export function queueFeedbackWontDoEmail(feedbackId: number) {
  after(async () => {
    await sendFeedbackCloseEmail(feedbackId, 'wont_do');
  });
}

export async function sendFeedbackLiveEmail(feedbackId: number) {
  return sendFeedbackCloseEmail(feedbackId, 'live');
}

async function sendFeedbackCloseEmail(feedbackId: number, kind: FeedbackCloseKind) {
  const result = await query(
    `SELECT
       f.id, f.kind, f.topic, f.reason, f.message, f.exercise_name,
       u.id as user_id, u.name as user_name, u.email
     FROM feedback f
     INNER JOIN users u ON u.id = f.user_id
     WHERE f.id = ?
     LIMIT 1`,
    [feedbackId]
  );
  const row = result.rows[0] as
    | {
        id: number;
        kind: string;
        topic: string | null;
        reason: string | null;
        message: string | null;
        exercise_name: string | null;
        user_id: number;
        user_name: string;
        email: string | null;
      }
    | undefined;
  const to = String(row?.email || '').trim();
  if (!row || !to) return { sent: false, skipped: 'no-address' as const };

  const input = {
    name: row.user_name,
    kind: row.kind,
    topic: row.topic,
    reason: row.reason,
    exerciseName: row.exercise_name,
    message: row.message,
  };
  const live = kind === 'live';
  return claimAndSend({
    userId: row.user_id,
    athleteName: row.user_name,
    template: live ? 'feedback_live' : 'feedback_wont_do',
    dedupeKey: 'feedback:' + row.id + ':' + (live ? 'live' : 'wont_do'),
    to,
    email: live ? buildFeedbackLiveEmail(input) : buildFeedbackWontDoEmail(input),
  });
}
