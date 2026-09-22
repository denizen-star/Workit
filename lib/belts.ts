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
  coachLineEli?: string;
  paper: 'light' | 'dark';
  characterImage?: string;
};

export const MALE_BELTS: Belt[] = [
  {
    weeks: 2,
    name: 'David: The Buy-In',
    slug: 'the-buy-in',
    fill: '#f6f1e3',
    quote: 'A masterpiece takes time.',
    saidBy: 'David',
    coachLine: 'Two locked weeks. You showed up. {name}. That is stamina starting.',
    coachLineJames: 'Two locked weeks. You showed up. I noticed the stamina starting.',
    coachLineLuna: 'Two locked weeks. You showed up. Soft start. Stamina first. Stay with it.',
    coachLineEli: 'Two locked weeks, {name}! You showed up and you kept showing up. That is stamina, and it is real.',
    paper: 'light',
    characterImage: 'david.png',
  },
  {
    weeks: 6,
    name: 'Hemsworth: The Foundation',
    slug: 'creed-the-foundation',
    fill: '#b7e1b5',
    quote: 'Comfort is the enemy of progress.',
    saidBy: 'Chris Hemsworth',
    coachLine: 'Six locked weeks. You are in the program. The growth is sticking.',
    coachLineJames: 'Six locked weeks. You are in the program. The growth is sticking. I noticed.',
    coachLineLuna: 'Six locked weeks. You are in the program now. Breathe. The growth is sticking.',
    coachLineEli: 'Six locked weeks! You are in the program now, {name}, and it shows. That growth is sticking.',
    paper: 'light',
    characterImage: 'hemsworth.png',
  },
  {
    weeks: 12,
    name: 'Apollo: The Momentum',
    slug: 'apollo-the-momentum',
    fill: '#6d8b6e',
    quote: 'There is no tomorrow!',
    saidBy: 'Apollo Creed',
    coachLine: 'Twelve locked weeks. The work is sticking. Definition is showing.',
    coachLineJames: 'Twelve locked weeks. The work is sticking. Definition is showing. I noticed.',
    coachLineLuna: 'Twelve locked weeks. The work is sticking. I can see the definition.',
    coachLineEli: 'Twelve locked weeks, {name}! The work is sticking and I can see the definition. Keep going.',
    paper: 'dark',
    characterImage: 'apollo.png',
  },
  {
    weeks: 18,
    name: 'John Snow: The Distance',
    slug: 'rocky-the-distance',
    fill: '#E6D385',
    quote: 'It is about the fight, not the fall.',
    saidBy: 'John Snow',
    coachLine: 'Eighteen locked weeks. This is a habit. Lean your body can tell.',
    coachLineJames: 'Eighteen locked weeks. This is a habit. Lean I intend to keep in you.',
    coachLineLuna: 'Eighteen locked weeks. This is a habit. Your body already knows the lean.',
    coachLineEli: 'Eighteen locked weeks! This is a habit now, {name}, and your body already knows it. That is lean built to stay.',
    paper: 'light',
    characterImage: 'harington.png',
  },
  {
    weeks: 24,
    name: 'Schwarzenegger: The Standard',
    slug: 'schwarzenegger-the-standard',
    fill: '#d4894a',
    quote: 'You pick it up, you put it down.',
    saidBy: 'Arnold',
    coachLine: 'Twenty-four locked weeks. The bar should be moving. Prove the power.',
    coachLineJames: 'Twenty-four locked weeks. The bar should be moving. Show me the power.',
    coachLineLuna: 'Twenty-four locked weeks. The bar should be moving. Stay honest with the power.',
    coachLineEli: 'Twenty-four locked weeks, {name}! The bar should be moving by now, and I bet it is. Show me that power.',
    paper: 'dark',
    characterImage: 'arnold.png',
  },
  {
    weeks: 30,
    name: 'Stallone: The Grit',
    slug: 'stallone-the-grit',
    fill: '#c08457',
    quote: "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.",
    saidBy: 'Stallone',
    coachLine: 'Thirty locked weeks. You take the hit and keep moving. The iron knows.',
    coachLineJames: 'Thirty locked weeks. You take the hit and keep moving. That is grit.',
    coachLineLuna: 'Thirty locked weeks. You take the hit and keep moving. Stay steady.',
    coachLineEli: 'Thirty locked weeks, {name}! You take the hit and you keep coming back. That is grit.',
    paper: 'dark',
    characterImage: 'stallone.png',
  },
  {
    weeks: 36,
    name: 'The Rock: The Engine',
    slug: 'columbu-the-engine',
    fill: '#e8c547',
    quote: 'Blood, sweat, and respect. First two you give, last one you earn.',
    saidBy: 'The Rock',
    coachLine: 'Thirty-six locked weeks. The engine is built. Your output proves it.',
    coachLineJames: 'Thirty-six locked weeks. The engine is built. Do not let it cool.',
    coachLineLuna: 'Thirty-six locked weeks. The engine is built. You know how to run it.',
    coachLineEli: 'Thirty-six locked weeks, {name}! You built the engine, now you just get to run it.',
    paper: 'light',
    characterImage: 'therock.png',
  },
  {
    weeks: 42,
    name: 'Efron: The Juggernaut',
    slug: 'ronnie-the-juggernaut',
    fill: '#a35d52',
    quote: 'You get out of it what you put into it.',
    saidBy: 'Zac Efron',
    coachLine: 'Forty-two locked weeks. It is all light weight now. Keep pushing.',
    coachLineJames: 'Forty-two locked weeks. It is all light weight now. Make it heavier.',
    coachLineLuna: 'Forty-two locked weeks. It is all light weight now. Breathe through the heavy.',
    coachLineEli: 'Forty-two locked weeks, {name}! You are a juggernaut now. Light weight, baby!',
    paper: 'dark',
    characterImage: 'efron.png',
  },
  {
    weeks: 48,
    name: 'Atlas Status: The Pinnacle',
    slug: 'atlas-the-pinnacle',
    fill: '#1a1a1a',
    trim: '#e8c547',
    quote: 'Hold up the sky.',
    saidBy: 'Atlas',
    coachLine: 'Forty-eight locked weeks. You know how to keep the mobility and the growth.',
    coachLineJames: 'Forty-eight locked weeks. You know how to keep the mobility and the growth.',
    coachLineLuna: 'Forty-eight locked weeks. You know how to keep showing up. The mobility and the growth stay.',
    coachLineEli: 'Forty-eight locked weeks, {name}. A full year. You know how to keep showing up, and that is everything.',
    paper: 'dark',
    characterImage: 'atlas-globe.png',
  },
];

export const FEMALE_BELTS: Belt[] = [
  {
    weeks: 2,
    name: 'Ripley: The Buy-In',
    slug: 'the-buy-in',
    fill: '#f6f1e3',
    quote: 'You just have to survive.',
    saidBy: 'Ripley',
    coachLine: 'Two locked weeks. You showed up. {name}. That is stamina starting.',
    coachLineJames: 'Two locked weeks. You showed up. I noticed the stamina starting.',
    coachLineLuna: 'Two locked weeks. You showed up. Soft start. Stamina first. Stay with it.',
    coachLineEli: 'Two locked weeks, {name}! You showed up and you kept showing up. That is stamina, and it is real.',
    paper: 'light',
    characterImage: 'ripley.png',
  },
  {
    weeks: 6,
    name: 'Croft: The Foundation',
    slug: 'creed-the-foundation',
    fill: '#b7e1b5',
    quote: "I'm not a superhero. I'm just doing what I have to do.",
    saidBy: 'Lara Croft',
    coachLine: 'Six locked weeks. You are in the program. The growth is sticking.',
    coachLineJames: 'Six locked weeks. You are in the program. The growth is sticking. I noticed.',
    coachLineLuna: 'Six locked weeks. You are in the program now. Breathe. The growth is sticking.',
    coachLineEli: 'Six locked weeks! You are in the program now, {name}, and it shows. That growth is sticking.',
    paper: 'light',
    characterImage: 'croft.png',
  },
  {
    weeks: 12,
    name: 'Connor: The Momentum',
    slug: 'apollo-the-momentum',
    fill: '#6d8b6e',
    quote: 'There is no fate but what we make for ourselves.',
    saidBy: 'Sarah Connor',
    coachLine: 'Twelve locked weeks. The work is sticking. Definition is showing.',
    coachLineJames: 'Twelve locked weeks. The work is sticking. Definition is showing. I noticed.',
    coachLineLuna: 'Twelve locked weeks. The work is sticking. I can see the definition.',
    coachLineEli: 'Twelve locked weeks, {name}! The work is sticking and I can see the definition. Keep going.',
    paper: 'dark',
    characterImage: 'connor.png',
  },
  {
    weeks: 18,
    name: 'Rousey: The Distance',
    slug: 'rocky-the-distance',
    fill: '#E6D385',
    quote: 'To be a champion, you have to learn to handle stress and pressure.',
    saidBy: 'Ronda Rousey',
    coachLine: 'Eighteen locked weeks. This is a habit. Lean your body can tell.',
    coachLineJames: 'Eighteen locked weeks. This is a habit. Lean I intend to keep in you.',
    coachLineLuna: 'Eighteen locked weeks. This is a habit. Your body already knows the lean.',
    coachLineEli: 'Eighteen locked weeks! This is a habit now, {name}, and your body already knows it. That is lean built to stay.',
    paper: 'light',
    characterImage: 'rousey.png',
  },
  {
    weeks: 24,
    name: 'Furiosa: The Standard',
    slug: 'schwarzenegger-the-standard',
    fill: '#d4894a',
    quote: 'Out here, everything hurts.',
    saidBy: 'Furiosa',
    coachLine: 'Twenty-four locked weeks. The bar should be moving. Prove the power.',
    coachLineJames: 'Twenty-four locked weeks. The bar should be moving. Show me the power.',
    coachLineLuna: 'Twenty-four locked weeks. The bar should be moving. Stay honest with the power.',
    coachLineEli: 'Twenty-four locked weeks, {name}! The bar should be moving by now, and I bet it is. Show me that power.',
    paper: 'dark',
    characterImage: 'furiosa.png',
  },
  {
    weeks: 30,
    name: 'Toomey: The Grit',
    slug: 'stallone-the-grit',
    fill: '#c08457',
    quote: "It's not about how bad you want it, it's about how hard you're willing to work for it.",
    saidBy: 'Tia-Clair Toomey',
    coachLine: 'Thirty locked weeks. You take the hit and keep moving. The iron knows.',
    coachLineJames: 'Thirty locked weeks. You take the hit and keep moving. That is grit.',
    coachLineLuna: 'Thirty locked weeks. You take the hit and keep moving. Stay steady.',
    coachLineEli: 'Thirty locked weeks, {name}! You take the hit and you keep coming back. That is grit.',
    paper: 'dark',
    characterImage: 'toomey.png',
  },
  {
    weeks: 36,
    name: 'Serena: The Engine',
    slug: 'columbu-the-engine',
    fill: '#e8c547',
    quote: "I don't like to lose — at anything.",
    saidBy: 'Serena Williams',
    coachLine: 'Thirty-six locked weeks. The engine is built. Your output proves it.',
    coachLineJames: 'Thirty-six locked weeks. The engine is built. Do not let it cool.',
    coachLineLuna: 'Thirty-six locked weeks. The engine is built. You know how to run it.',
    coachLineEli: 'Thirty-six locked weeks, {name}! You built the engine, now you just get to run it.',
    paper: 'light',
    characterImage: 'serena.png',
  },
  {
    weeks: 42,
    name: 'Xena: The Juggernaut',
    slug: 'ronnie-the-juggernaut',
    fill: '#a35d52',
    quote: 'A warrior finds the love in what she does.',
    saidBy: 'Xena',
    coachLine: 'Forty-two locked weeks. It is all light weight now. Keep pushing.',
    coachLineJames: 'Forty-two locked weeks. It is all light weight now. Make it heavier.',
    coachLineLuna: 'Forty-two locked weeks. It is all light weight now. Breathe through the heavy.',
    coachLineEli: 'Forty-two locked weeks, {name}! You are a juggernaut now. Light weight, baby!',
    paper: 'dark',
    characterImage: 'xena.png',
  },
  {
    weeks: 48,
    name: 'Athena Status: The Pinnacle',
    slug: 'atlas-the-pinnacle',
    fill: '#1a1a1a',
    trim: '#e8c547',
    quote: 'Strength is nothing without the wisdom to wield it.',
    saidBy: 'Athena',
    coachLine: 'Forty-eight locked weeks. You know how to keep the mobility and the growth.',
    coachLineJames: 'Forty-eight locked weeks. You know how to keep the mobility and the growth.',
    coachLineLuna: 'Forty-eight locked weeks. You know how to keep showing up. The mobility and the growth stay.',
    coachLineEli: 'Forty-eight locked weeks, {name}. A full year. You know how to keep showing up, and that is everything.',
    paper: 'dark',
    characterImage: 'athena.png',
  },
];

export const BELTS = MALE_BELTS; // Default export for backwards compat where gender is missing

export function getBelts(gender?: string | null): Belt[] {
  if (gender === 'female') return FEMALE_BELTS;
  return MALE_BELTS; // male or non-binary
}

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

export function sampleDuringWeeks(belt: Belt) {
  if (belt.weeks <= 2) return 1;
  return Math.max(1, Math.round(belt.weeks * 0.6));
}

export function beltArtSrc(slug: string) {
  return `/belts/${slug}.svg`;
}

export function currentBelt(lockedWeeks: number, gender?: string | null): Belt | null {
  const belts = getBelts(gender);
  let earned: Belt | null = null;
  for (const belt of belts) {
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
        : id === 'eli' && belt.coachLineEli
          ? belt.coachLineEli
          : belt.coachLine;
  return line.replace(/\{name\}/g, firstName(name));
}

export function nextBelt(lockedWeeks: number, gender?: string | null): Belt | null {
  const belts = getBelts(gender);
  return belts.find((belt) => lockedWeeks < belt.weeks) ?? null;
}

export function beltChest(lockedWeeks: number, gender?: string | null) {
  const belts = getBelts(gender);
  const earned = currentBelt(lockedWeeks, gender);
  const aiming = nextBelt(lockedWeeks, gender);
  const after = aiming ? belts.find((belt) => belt.weeks > aiming.weeks) ?? null : null;
  return { earned, aiming, after };
}

export function beltState(lockedWeeks: number, belt: Belt, gender?: string | null): BeltState {
  if (lockedWeeks >= belt.weeks) return 'after';
  const aiming = nextBelt(lockedWeeks, gender);
  if (aiming && aiming.weeks === belt.weeks) return 'during';
  return 'before';
}

export function displayBelt(lockedWeeks: number, gender?: string | null): Belt {
  return currentBelt(lockedWeeks, gender) || nextBelt(lockedWeeks, gender) || getBelts(gender)[0];
}

export function whoBelt(lockedWeeks: number, gender?: string | null) {
  const belts = getBelts(gender);
  const earned = currentBelt(lockedWeeks, gender);
  const aiming = nextBelt(lockedWeeks, gender);
  const belt = earned || aiming || belts[0];
  return {
    name: belt.name,
    fill: belt.fill,
    earned: Boolean(earned),
  };
}

export function aimingCopy(lockedWeeks: number, gender?: string | null) {
  const aiming = nextBelt(lockedWeeks, gender);
  const belts = getBelts(gender);
  const highest = belts[belts.length - 1];
  
  if (!aiming) {
    return {
      title: highest.name,
      line: `${lockedWeeks} locked weeks. You know how to keep it up.`,
    };
  }
  return {
    title: aiming.name,
    line: `${lockedWeeks} of ${aiming.weeks} toward ${aiming.name}.`,
  };
}

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
    characterImage: belt.characterImage,
  };
}

export function progressFor(lockedWeeks: number, tone?: string | null, name?: string | null, gender?: string | null) {
  return {
    lockedWeeks,
    earned: serializeBelt(currentBelt(lockedWeeks, gender), tone, name),
    aiming: serializeBelt(nextBelt(lockedWeeks, gender), tone, name),
    display: serializeBelt(displayBelt(lockedWeeks, gender), tone, name),
    copy: aimingCopy(lockedWeeks, gender),
  };
}
