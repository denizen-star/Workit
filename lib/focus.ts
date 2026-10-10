import { clampScheduleDays, MAX_SCHEDULE_DAYS } from '@/lib/scheduleDays';

/**
 * Training focus (docs/plans/PLAN_FOCUS_ONBOARDING.md): what kind of week the athlete
 * wants. `build` is the original program and the default for everyone who already trains,
 * so nothing changes until they choose otherwise. The other three fill the week from a
 * rotation (lib/focusRotation.ts) instead of the upper/lower split. An athlete can pick
 * more than one; their week then alternates between them.
 *
 * Client-safe: no server imports.
 */
export const FOCUSES = ['build', 'core', 'home', 'travel'] as const;
export type Focus = (typeof FOCUSES)[number];

export const DEFAULT_FOCUS: Focus = 'build';

/** The focuses an athlete trains, in `FOCUSES` order. Never empty. */
export type Focuses = readonly Focus[];
export const DEFAULT_FOCUSES: Focuses = [DEFAULT_FOCUS];

export type FocusOption = {
  id: Focus;
  label: string;
  /** Short name for chips and lists of more than one focus. */
  short: string;
  /** One-word label for the Your pick sheet's Focus chips. */
  chip: string;
  /** Neutral, plain description shown on the setup buttons. */
  description: string;
  /** What the athlete needs on hand. */
  equipment: string;
};

/** In wizard / menu order. */
export const FOCUS_OPTIONS: FocusOption[] = [
  {
    id: 'build',
    label: 'Build muscle · Gym',
    short: 'Build muscle',
    chip: 'Gym',
    description: 'Strength training in a gym with barbells, dumbbells and machines, progressing week by week.',
    equipment: 'Gym',
  },
  {
    id: 'core',
    label: 'Core Inspired',
    short: 'Core Inspired',
    chip: 'Core',
    description: 'A mat-based rotation of Pilates, yoga and core sessions for strength, mobility and posture.',
    equipment: 'A mat',
  },
  {
    id: 'home',
    label: 'Home · 2 Dumbbells',
    short: 'Home',
    chip: 'Dumbbell',
    description: 'Full-body strength sessions with two dumbbells at home, alternating two workouts.',
    equipment: 'Two dumbbells and a chair',
  },
  {
    id: 'travel',
    label: 'No equipment · Travel',
    short: 'Travel',
    chip: 'Travel',
    description: 'Bodyweight sessions you can do anywhere, in a hotel room or at home.',
    equipment: 'None',
  },
];

export function isFocus(value: unknown): value is Focus {
  return typeof value === 'string' && (FOCUSES as readonly string[]).includes(value);
}

/** A stored value (comma list) or an incoming array → the focuses it names, each once, in
 * `FOCUSES` order. Anything missing or unknown falls back to Build muscle, so the result
 * is never empty. */
export function parseFocuses(value: unknown): Focus[] {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const chosen = new Set(items.map((item) => String(item).trim()).filter(isFocus));
  const ordered = FOCUSES.filter((focus) => chosen.has(focus));
  return ordered.length > 0 ? ordered : [...DEFAULT_FOCUSES];
}

/** Stored as a comma list in `users.focus` / `week_focus.focus`. */
export function serializeFocuses(focuses: Focuses): string {
  return parseFocuses([...focuses]).join(',');
}

export function sameFocuses(a: Focuses, b: Focuses): boolean {
  return serializeFocuses(a) === serializeFocuses(b);
}

/** True for Build muscle on its own — the original program, no focus rotation. */
export function isBuildOnly(focuses: Focuses): boolean {
  return focuses.length === 1 && focuses[0] === 'build';
}

function optionFor(focus: Focus): FocusOption {
  return FOCUS_OPTIONS.find((option) => option.id === focus) ?? FOCUS_OPTIONS[0];
}

/** "Build muscle · Gym" for one focus, "Build muscle + Core Inspired" for several. */
export function focusesLabel(focuses: Focuses): string {
  return focuses.length === 1 ? optionFor(focuses[0]).label : focuses.map((focus) => optionFor(focus).short).join(' + ');
}

/** The focuses that apply to one week: that week's override if the athlete set one
 * (`week_focus`), else their default (`users.focus`). */
export function focusForWeek(
  defaults: Focuses,
  weekOverrides: ReadonlyMap<number, Focuses> | null | undefined,
  weekNumber: number
): Focuses {
  return weekOverrides?.get(weekNumber) ?? defaults;
}

/** What the client needs to shape weeks for an athlete: their default focuses, the weeks
 * they overrode, and when they saw the setup step (null = not yet). JSON-safe. */
export type FocusInfo = { focuses: Focus[]; weeks: Record<number, Focus[]>; chosenAt: string | null };

export const DEFAULT_FOCUS_INFO: FocusInfo = { focuses: [...DEFAULT_FOCUSES], weeks: {}, chosenAt: null };

/** The `(weekNumber) => Focuses` lookup the schedule helpers take, or undefined for an
 * athlete with no focus set up (every week Build muscle — the helpers' own default). */
export function focusLookupFromInfo(info: FocusInfo | null | undefined): ((weekNumber: number) => Focuses) | undefined {
  if (!info || (isBuildOnly(info.focuses) && Object.keys(info.weeks).length === 0)) return undefined;
  return (weekNumber) => info.weeks[weekNumber] ?? info.focuses;
}

/** The weekday string is `users.reminder_days` — 7 chars Mon→Sun, '1' = train that day. */
export function weekdaysSelectedCount(weekdays: string): number {
  return [...weekdays].filter((char) => char === '1').length;
}

/** The weekly workout count the chosen weekdays imply. The schedule tops out at 5
 * (`MAX_SCHEDULE_DAYS`), so a 6- or 7-day pick still reminds on every chosen day but
 * only requires 5 to lock the week. Zero selected is not a valid pick (callers refuse it). */
export function scheduleDaysFromWeekdays(weekdays: string): number {
  return Math.min(MAX_SCHEDULE_DAYS, clampScheduleDays(weekdaysSelectedCount(weekdays)));
}

/** True when two chosen weekdays sit side by side (Sunday and the next Monday count). */
export function hasBackToBackDays(weekdays: string): boolean {
  return [...weekdays].some((char, index) => char === '1' && weekdays[(index + 1) % 7] === '1');
}

/** Focuses whose days are full-body: back-to-back days work the same muscles with no break. */
export function hasFullBodyFocus(focuses: Focuses): boolean {
  return focuses.includes('home') || focuses.includes('travel');
}

/** The heads-up shown when full-body days land on back-to-back days. */
export const BACK_TO_BACK_WARNING =
  'Heads up: full-body workouts on back-to-back days train the same muscles with no break. Muscles rebuild on the rest day, not in the workout, so skipping it raises the risk of overuse, lingering soreness, sloppy form from tired muscles and injury. Leave a rest day between full-body sessions when you can, or add Core Inspired so mat days fill the gaps.';

/** Mon→Sun weekdays to pre-select for an athlete who has not picked any yet, spread so
 * rest days fall between sessions: 1 = Wed, 2 = Mon/Thu, 3 = Mon/Wed/Fri, 4 = Mon/Tue/Thu/Fri,
 * 5 = Mon-Fri. */
export function defaultWeekdaysFor(count: number): string {
  const days: Record<number, number[]> = { 1: [2], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4] };
  const chosen = new Set(days[clampScheduleDays(count)]);
  return Array.from({ length: 7 }, (_, index) => (chosen.has(index) ? '1' : '0')).join('');
}

