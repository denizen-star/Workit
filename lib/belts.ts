export type BeltState = 'before' | 'during' | 'after';

export type Belt = {
  weeks: number;
  name: string;
  slug: string;
  fill: string;
  trim?: string;
  quote: string;
  saidBy: string;
  coachLine: string;
  /** Dark ink on a light paper diploma. */
  paper: 'light' | 'dark';
};

export const BELTS: Belt[] = [
  {
    weeks: 2,
    name: 'Dipping your toes',
    slug: 'dipping-your-toes',
    fill: '#f6f1e3',
    quote: 'Failure is an attitude, not an outcome.',
    saidBy: 'Tom Platz',
    coachLine: 'You showed up. Two locked weeks. The water is not that cold, man.',
    paper: 'light',
  },
  {
    weeks: 6,
    name: 'Got back in the saddle',
    slug: 'got-back-in-the-saddle',
    fill: '#b7e1b5',
    quote: 'Yeah buddy! Light weight, baby!',
    saidBy: 'Ronnie',
    coachLine: 'Six locked weeks. You are in the program, not visiting it.',
    paper: 'light',
  },
  {
    weeks: 10,
    name: 'I see you getting stronger',
    slug: 'i-see-you-getting-stronger',
    fill: '#6d8b6e',
    quote: 'If I can change, and you can change, everybody can change!',
    saidBy: 'Rocky',
    coachLine: 'Ten locked weeks. The work is sticking.',
    paper: 'dark',
  },
  {
    weeks: 20,
    name: 'Steady',
    slug: 'steady',
    fill: '#E6D385',
    quote: 'All I wanna do is go the distance.',
    saidBy: 'Rocky',
    coachLine: 'Twenty locked weeks. This is a habit. Your body can tell.',
    paper: 'light',
  },
  {
    weeks: 24,
    name: 'Weigh-up sprint',
    slug: 'weigh-up-sprint',
    fill: '#d4894a',
    quote: "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.",
    saidBy: 'Rocky',
    coachLine: 'Twenty-four locked weeks. The bar should be moving. Prove it.',
    paper: 'dark',
  },
  {
    weeks: 48,
    name: 'Arnold Status',
    slug: 'arnold-status',
    fill: '#1a1a1a',
    trim: '#e8c547',
    quote: 'You pick it up, you put it down.',
    saidBy: 'Arnold',
    coachLine: 'Forty-eight locked weeks. You know how to keep it up.',
    paper: 'dark',
  },
];

export const BELT_ACTIVITY_OPTIONS = [
  'run',
  'yoga',
  'walk',
  'class',
  'pilates',
  'ride',
  'HIIT',
  'Hyrox',
  'other',
] as const;

/** Mid-pack sample so During is never empty and never complete. */
export function sampleDuringWeeks(belt: Belt) {
  if (belt.weeks <= 2) return 1;
  return Math.max(1, Math.round(belt.weeks * 0.6));
}

export function beltArtSrc(slug: string) {
  return `/belts/${slug}.svg`;
}

export function currentBelt(lockedWeeks: number): Belt | null {
  let earned: Belt | null = null;
  for (const belt of BELTS) {
    if (lockedWeeks >= belt.weeks) earned = belt;
  }
  return earned;
}

export function nextBelt(lockedWeeks: number): Belt | null {
  return BELTS.find((belt) => lockedWeeks < belt.weeks) ?? null;
}

/** Home chest: trophy you hold, the one you are filling, the one after that. */
export function beltChest(lockedWeeks: number) {
  const earned = currentBelt(lockedWeeks);
  const aiming = nextBelt(lockedWeeks);
  const after = aiming ? BELTS.find((belt) => belt.weeks > aiming.weeks) ?? null : null;
  return { earned, aiming, after };
}

export function lockedWeekCount(
  sessions: Array<{ week_number?: number; is_completed?: unknown }>
) {
  const byWeek = new Map<number, number>();
  for (const session of sessions) {
    if (!Boolean(Number(session.is_completed))) continue;
    const week = Number(session.week_number);
    if (!week) continue;
    byWeek.set(week, (byWeek.get(week) || 0) + 1);
  }
  let count = 0;
  for (const days of byWeek.values()) {
    if (days >= 4) count += 1;
  }
  return count;
}

/** Earned if locked, aiming if this is the next belt, else not started. */
export function beltState(lockedWeeks: number, belt: Belt): BeltState {
  if (lockedWeeks >= belt.weeks) return 'after';
  const aiming = nextBelt(lockedWeeks);
  if (aiming && aiming.weeks === belt.weeks) return 'during';
  return 'before';
}

/** Wash / chip belt: last earned, or the one they are aiming for. */
export function displayBelt(lockedWeeks: number): Belt {
  return currentBelt(lockedWeeks) || nextBelt(lockedWeeks) || BELTS[0];
}

/** Who picker: same belt name, but earned vs still aiming. */
export function whoBelt(lockedWeeks: number) {
  const earned = currentBelt(lockedWeeks);
  const aiming = nextBelt(lockedWeeks);
  const belt = earned || aiming || BELTS[0];
  return {
    name: belt.name,
    fill: belt.fill,
    earned: Boolean(earned),
  };
}

export function aimingCopy(lockedWeeks: number) {
  const aiming = nextBelt(lockedWeeks);
  if (!aiming) {
    return {
      title: 'Arnold Status',
      line: `${lockedWeeks} locked weeks. You know how to keep it up.`,
    };
  }
  return {
    title: aiming.name,
    line: `${lockedWeeks} of ${aiming.weeks} toward ${aiming.name}.`,
  };
}

/** Light tint so glass cards stay readable. Cream and pale yellow stay a wash, not a flood. */
export function beltWashStyle(belt: Belt): { background: string; borderColor: string } {
  const light = belt.paper === 'light';
  const alpha = light ? 0.1 : 0.16;
  const raw = belt.fill.replace('#', '');
  const n = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return {
    background: `radial-gradient(900px 420px at 50% -8%, rgba(${r},${g},${b},${alpha}), transparent 58%), #07070a`,
    borderColor: `rgba(${r},${g},${b},${light ? 0.28 : 0.4})`,
  };
}

export function serializeBelt(belt: Belt | null) {
  if (!belt) return null;
  return {
    weeks: belt.weeks,
    name: belt.name,
    slug: belt.slug,
    fill: belt.fill,
    trim: belt.trim || null,
    quote: belt.quote,
    saidBy: belt.saidBy,
    coachLine: belt.coachLine,
    paper: belt.paper,
  };
}

export function progressFor(lockedWeeks: number) {
  return {
    lockedWeeks,
    earned: serializeBelt(currentBelt(lockedWeeks)),
    aiming: serializeBelt(nextBelt(lockedWeeks)),
    display: serializeBelt(displayBelt(lockedWeeks)),
    copy: aimingCopy(lockedWeeks),
  };
}
