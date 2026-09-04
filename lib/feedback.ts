/** Shared feedback + rating labels. Safe for client and server. */

export const FEEDBACK_TOPICS = ['bug', 'idea', 'workout', 'other'] as const;
export type FeedbackTopic = (typeof FEEDBACK_TOPICS)[number];

export const THUMB_REASONS = ['broken_video', 'image_mismatch', 'other'] as const;
export type ThumbReason = (typeof THUMB_REASONS)[number];

export const RATING_OUTCOMES = ['complete', 'quit'] as const;
export type RatingOutcome = (typeof RATING_OUTCOMES)[number];

export type FeedbackKind = 'note' | 'thumb';

export const FEEDBACK_RESOLUTIONS = ['done', 'wont_do'] as const;
export type FeedbackResolution = (typeof FEEDBACK_RESOLUTIONS)[number];

export function isFeedbackResolution(value: unknown): value is FeedbackResolution {
  return FEEDBACK_RESOLUTIONS.includes(value as FeedbackResolution);
}

export function isWontDo(item: { resolution?: string | null }) {
  return item.resolution === 'wont_do';
}

export function isDone(item: { resolved_at?: string | null; resolution?: string | null }) {
  return Boolean(item.resolved_at) && !isWontDo(item);
}

export const DAY_TYPE_ORDER = [
  'Upper Body A',
  'Lower Body A',
  'Upper Body B',
  'Lower Body B',
] as const;

export function isFeedbackTopic(value: unknown): value is FeedbackTopic {
  return FEEDBACK_TOPICS.includes(value as FeedbackTopic);
}

export function isThumbReason(value: unknown): value is ThumbReason {
  return THUMB_REASONS.includes(value as ThumbReason);
}

export function isRatingOutcome(value: unknown): value is RatingOutcome {
  return RATING_OUTCOMES.includes(value as RatingOutcome);
}

export function parseStars(value: unknown): number | null {
  const stars = Number(value);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return null;
  return stars;
}

export function topicLabel(topic: string | null | undefined) {
  if (topic === 'bug') return 'Bug';
  if (topic === 'idea') return 'Idea';
  if (topic === 'workout') return 'Workout';
  if (topic === 'other') return 'Other';
  return 'Open';
}

export function reasonLabel(reason: string | null | undefined) {
  if (reason === 'broken_video') return 'Broken video';
  if (reason === 'image_mismatch') return 'Image does not match';
  if (reason === 'other') return 'Something else';
  return 'Looks good';
}

export function dayTypeShort(workoutType: string) {
  return workoutType
    .replace(/^Upper Body /i, 'Upper ')
    .replace(/^Lower Body /i, 'Lower ');
}

export function lowestDayTypeLine(rows: Array<{ type: string; avg: number; count: number }>) {
  const scored = rows.filter((row) => row.count > 0);
  if (!scored.length) return '';
  const worst = scored.reduce((a, b) => (a.avg <= b.avg ? a : b));
  return dayTypeShort(worst.type) + ' is the leak, man.';
}

export function formatAvg(avg: number) {
  return avg.toFixed(1);
}
