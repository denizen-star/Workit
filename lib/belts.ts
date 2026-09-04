import { normalizeCoachTone } from '@/lib/coachTone';
import { firstName } from '@/lib/profile';

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
  coachLineJames?: string;
  coachLineLuna?: string;
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
    coachLine: 'Two locked weeks. You showed up. {name}. That is stamina starting.',
    coachLineJames: 'Two locked weeks. You showed up. I noticed the stamina starting.',
    coachLineLuna: 'Two locked weeks. You showed up. Soft start. Stamina first. Stay with it.',
    paper: 'light',
  },
  {
    weeks: 6,
    name: 'Got back in the saddle',
    slug: 'got-back-in-the-saddle',
    fill: '#b7e1b5',
    quote: 'Yeah buddy! Light weight, baby!',
    saidBy: 'Ronnie',
    coachLine: 'Six locked weeks. You are in the program. The growth is sticking.',
    coachLineJames: 'Six locked weeks. You are in the program. The growth is sticking. I noticed.',
    coachLineLuna: 'Six locked weeks. You are in the program now. Breathe. The growth is sticking.',
    paper: 'light',
  },
  {
    weeks: 10,
    name: 'I see you getting stronger',
    slug: 'i-see-you-getting-stronger',
    fill: '#6d8b6e',
    quote: 'If I can change, and you can change, everybody can change!',
    saidBy: 'Rocky',
    coachLine: 'Ten locked weeks. The work is sticking. Definition is showing.',
    coachLineJames: 'Ten locked weeks. The work is sticking. Definition is showing. I noticed.',
    coachLineLuna: 'Ten locked weeks. The work is sticking. I can see the definition.',
    paper: 'dark',
  },
  {
    weeks: 20,
    name: 'Steady',
    slug: 'steady',
    fill: '#E6D385',
    quote: 'All I wanna do is go the distance.',
    saidBy: 'Rocky',
    coachLine: 'Twenty locked weeks. This is a habit. Lean your body can tell.',
    coachLineJames: 'Twenty locked weeks. This is a habit. Lean I intend to keep in you.',
    coachLineLuna: 'Twenty locked weeks. This is a habit. Your body already knows the lean.',
    paper: 'light',
  },
  {
    weeks: 24,
    name: 'Weigh-up sprint',
    slug: 'weigh-up-sprint',
    fill: '#d4894a',
    quote: "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.",
    saidBy: 'Rocky',
    coachLine: 'Twenty-four locked weeks. The bar should be moving. Prove the power.',
    coachLineJames: 'Twenty-four locked weeks. The bar should be moving. Show me the power.',
    coachLineLuna: 'Twenty-four locked weeks. The bar should be moving. Stay honest with the power.',
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
    coachLine: 'Forty-eight locked weeks. You know how to keep the mobility and the growth.',
    coachLineJames: 'Forty-eight locked weeks. You know how to keep the mobility and the growth.',
    coachLineLuna: 'Forty-eight locked weeks. You know how to keep showing up. The mobility and the growth stay.',
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

export function beltCoachLine(belt: Belt, tone?: string | null, name?: string | null) {
  const id = normalizeCoachTone(tone);
  const line =
    id === 'james' && belt.coachLineJames
      ? belt.coachLineJames
      : id === 'luna' && belt.coachLineLuna
        ? belt.coachLineLuna
        : belt.coachLine;
  return line.replace(/\{name\}/g, firstName(name));
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

/** Live-session wash. Same belt fills; page, header, and cards pick up the tint. */
export function beltWashStyle(belt: Belt): { background: string; borderColor: string; rgb: string } {
  const light = belt.paper === 'light';
  const glow = light ? 0.55 : 0.42;
  const veil = light ? 0.22 : 0.24;
  const raw = belt.fill.replace('#', '');
  const n = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return {
    rgb: `${r} ${g} ${b}`,
    background: [
      `radial-gradient(140% 90% at 50% 12%, rgba(${r},${g},${b},${glow}), transparent 68%)`,
      `rgba(${r},${g},${b},${veil})`,
      '#07070a',
    ].join(', '),
    borderColor: `rgba(${r},${g},${b},${light ? 0.55 : 0.6})`,
  };
}

export function serializeBelt(belt: Belt | null, tone?: string | null, name?: string | null) {
  if (!belt) return null;
  return {
    weeks: belt.weeks,
    name: belt.name,
    slug: belt.slug,
    fill: belt.fill,
    trim: belt.trim || null,
    quote: belt.quote,
    saidBy: belt.saidBy,
    coachLine: beltCoachLine(belt, tone, name),
    paper: belt.paper,
  };
}

export function progressFor(lockedWeeks: number, tone?: string | null, name?: string | null) {
  return {
    lockedWeeks,
    earned: serializeBelt(currentBelt(lockedWeeks), tone, name),
    aiming: serializeBelt(nextBelt(lockedWeeks), tone, name),
    display: serializeBelt(displayBelt(lockedWeeks), tone, name),
    copy: aimingCopy(lockedWeeks),
  };
}
