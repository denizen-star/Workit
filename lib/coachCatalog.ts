import { asCoachTone, normalizeCoachTone, type CoachTone } from '@/lib/coachTone';

export type CoachVoiceRecord = {
  id: CoachTone;
  displayName: string;
  description: string;
  blurb: string;
  fromName: string;
};

export type LinePack = {
  initial: string[];
  mid: string[];
  final: string[];
  exit: string[];
  complete: string[];
  bonusComplete: string[];
  optionalComplete: string[];
  weekPlace1: string[];
  weekPlace2: string[];
  weekPlace3: string[];
  resume: string[];
  missedWeek: string[];
  setUpTitle: string;
  setUpBody: string;
  setDownTitle: string;
  setDownBody: string;
  hardness: Partial<Record<1 | 2 | 3 | 4 | 5, { title: string; body: string }>>;
};

const VOICE_ORDER: CoachTone[] = ['master', 'james', 'luna'];

export const FALLBACK_VOICES: CoachVoiceRecord[] = [
  {
    id: 'master',
    displayName: 'Master Tom Iron',
    fromName: 'Master Tom Iron',
    blurb:
      'Direct. I own the hour. Quit is not a name I use. The prize is growth, lean, definition, power, stamina, mobility.',
    description:
      'Enigmatic master. Direct, possessive, and demanding. He takes you under his wing. He uses your name. Quit is not a name he uses. Praise is earned. The reward is growth, lean, definition, power, stamina, and mobility.',
  },
  {
    id: 'james',
    displayName: 'James Grey',
    fromName: 'James Grey',
    blurb: 'Grey. Private. He wants you present. The hour has to show on the body.',
    description:
      'Precise, British. He takes you under his watch. He wants you present. Praise is rare. The hour has to show as growth, lean, definition, power, stamina, or mobility.',
  },
  {
    id: 'luna',
    displayName: 'Luna Meadows',
    fromName: 'Luna Meadows',
    blurb: 'Calm. Soft. She holds you in the hard part until the strength stays.',
    description:
      'Melodic and still. She talks like a moving meditation: breath, alignment, stay. The work can burn. The voice does not. Praise is quiet. The prize is growth, lean, definition, power, stamina, and mobility.',
  },
];

function emptyPack(): LinePack {
  return {
    initial: [],
    mid: [],
    final: [],
    exit: [],
    complete: [],
    bonusComplete: [],
    optionalComplete: [],
    weekPlace1: [],
    weekPlace2: [],
    weekPlace3: [],
    resume: [],
    missedWeek: [],
    setUpTitle: '',
    setUpBody: '',
    setDownTitle: '',
    setDownBody: '',
    hardness: {},
  };
}

let voices: CoachVoiceRecord[] = FALLBACK_VOICES;
let packs: Record<CoachTone, LinePack> | null = null;

export function fallbackVoice(tone?: CoachTone | null) {
  const id = normalizeCoachTone(tone);
  return FALLBACK_VOICES.find((voice) => voice.id === id) || FALLBACK_VOICES[0];
}

export function getCoachVoices() {
  return [...voices].sort((a, b) => VOICE_ORDER.indexOf(a.id) - VOICE_ORDER.indexOf(b.id));
}

export function getCoachToneOptions() {
  return getCoachVoices().map((voice) => ({
    id: voice.id,
    label: voice.displayName,
    blurb: voice.blurb,
    description: voice.description,
  }));
}

export function voiceDisplayName(tone?: CoachTone | null) {
  const id = normalizeCoachTone(tone);
  return getCoachVoices().find((voice) => voice.id === id)?.displayName || fallbackVoice(id).displayName;
}

export function voiceFromName(tone?: CoachTone | null) {
  const id = normalizeCoachTone(tone);
  return getCoachVoices().find((voice) => voice.id === id)?.fromName || fallbackVoice(id).fromName;
}

export function getLinePack(tone?: CoachTone | null): LinePack | null {
  if (!packs) return null;
  return packs[normalizeCoachTone(tone)] || null;
}

export function setLinePacks(next: Record<CoachTone, LinePack>) {
  packs = next;
}

export function hydrateCoachCatalog(input: {
  voices?: CoachVoiceRecord[];
  packs?: Partial<Record<CoachTone, LinePack>>;
}) {
  if (input.voices?.length) {
    const next: CoachVoiceRecord[] = [];
    for (const voice of input.voices) {
      const id = asCoachTone(voice.id);
      if (!id || next.some((item) => item.id === id)) continue;
      next.push({ ...voice, id });
    }
    const seen = new Set(next.map((voice) => voice.id));
    for (const fallback of FALLBACK_VOICES) {
      if (!seen.has(fallback.id)) next.push(fallback);
    }
    if (next.length) voices = next;
  }
  const lunaPack = input.packs?.luna || (input.packs as { sergeant?: LinePack } | undefined)?.sergeant;
  if (input.packs?.master && lunaPack) {
    packs = {
      master: input.packs.master,
      luna: lunaPack,
      james: input.packs.james || emptyPack(),
    };
  }
}

export function catalogFromRows(
  voiceRows: Array<{
    id: string;
    display_name: string;
    description: string;
    blurb: string;
    from_name: string;
  }>,
  lineRows: Array<{
    voice_id: string;
    bucket: string;
    title: string | null;
    body: string;
    sort_order: number;
  }>
) {
  const nextVoices: CoachVoiceRecord[] = [];
  for (const row of voiceRows) {
    const id = asCoachTone(row.id);
    if (!id || nextVoices.some((voice) => voice.id === id)) continue;
    nextVoices.push({
      id,
      displayName: row.display_name,
      description: row.description,
      blurb: row.blurb,
      fromName: row.from_name,
    });
  }

  const nextPacks: Record<CoachTone, LinePack> = {
    master: emptyPack(),
    james: emptyPack(),
    luna: emptyPack(),
  };
  const seenLine = new Set<string>();

  for (const row of lineRows) {
    const voiceId = asCoachTone(row.voice_id);
    if (!voiceId) continue;
    const lineKey = `${voiceId}:${row.bucket}:${row.sort_order}`;
    if (seenLine.has(lineKey)) continue;
    seenLine.add(lineKey);
    const pack = nextPacks[voiceId];
    if (row.bucket === 'set_up') {
      pack.setUpTitle = row.title || '';
      pack.setUpBody = row.body;
      continue;
    }
    if (row.bucket === 'set_down') {
      pack.setDownTitle = row.title || '';
      pack.setDownBody = row.body;
      continue;
    }
    if (row.bucket.startsWith('hardness_')) {
      const score = Number(row.bucket.slice('hardness_'.length));
      if (score >= 1 && score <= 5) {
        pack.hardness[score as 1 | 2 | 3 | 4 | 5] = {
          title: row.title || '',
          body: row.body,
        };
      }
      continue;
    }
    if (
      row.bucket === 'initial' ||
      row.bucket === 'mid' ||
      row.bucket === 'final' ||
      row.bucket === 'exit' ||
      row.bucket === 'complete'
    ) {
      pack[row.bucket].push(row.body);
    }
    if (row.bucket === 'bonus_complete') {
      pack.bonusComplete.push(row.body);
    }
    if (row.bucket === 'optional_complete') {
      pack.optionalComplete.push(row.body);
    }
    if (row.bucket === 'week_place_1') pack.weekPlace1.push(row.body);
    if (row.bucket === 'week_place_2') pack.weekPlace2.push(row.body);
    if (row.bucket === 'week_place_3') pack.weekPlace3.push(row.body);
    if (row.bucket === 'resume') pack.resume.push(row.body);
    if (row.bucket === 'missed_week') pack.missedWeek.push(row.body);
  }

  return { voices: nextVoices, packs: nextPacks };
}

export function packIsUsable(pack: LinePack | null | undefined) {
  return Boolean(
    pack &&
      pack.initial.length &&
      pack.mid.length &&
      pack.final.length &&
      pack.exit.length &&
      pack.complete.length
  );
}
