import { appUrl, bullets, cta, emailTextHeader, emailTextSignOff, esc, p, statsTable, wrapEmailHtml } from '@/lib/emailLayout';
import { defaultFrom } from '@/lib/mailClient';
import { formatAvg, reasonLabel, topicLabel } from '@/lib/feedback';
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
