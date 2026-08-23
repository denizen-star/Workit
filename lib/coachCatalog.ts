import { isCoachTone, normalizeCoachTone, type CoachTone } from '@/lib/coachTone';

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
  setUpTitle: string;
  setUpBody: string;
  setDownTitle: string;
  setDownBody: string;
};

export const FALLBACK_VOICES: CoachVoiceRecord[] = [
  {
    id: 'master',
    displayName: 'Master Tom Iron',
    fromName: 'Master Tom Iron',
    blurb: 'The original voice. Direct. I own you. I call you sissy. Good man stays good man.',
    description:
      'Dominant drill-sergeant coach. Direct, possessive, and demanding. He calls you man or sissy, owns the session, and treats every rep as tax. Praise is earned. Quitting is not a conversation.',
  },
  {
    id: 'sergeant',
    displayName: 'Luna Meadows',
    fromName: 'Luna Meadows',
    blurb: 'A warm, grounded guide. Present. Gentle. She keeps you in the work.',
    description:
      'Warm, grounded guide. Present and gentle, but she does not let you leave the work. She talks in breath, ease, and devotion. The standard stays; the voice stays kind.',
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
    setUpTitle: '',
    setUpBody: '',
    setDownTitle: '',
    setDownBody: '',
  };
}

let voices: CoachVoiceRecord[] = FALLBACK_VOICES;
let packs: Record<CoachTone, LinePack> | null = null;

export function fallbackVoice(tone?: CoachTone | null) {
  const id = normalizeCoachTone(tone);
  return FALLBACK_VOICES.find((voice) => voice.id === id) || FALLBACK_VOICES[0];
}

export function getCoachVoices() {
  return voices;
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
    const next = input.voices.filter((voice) => isCoachTone(voice.id));
    if (next.length) voices = next;
  }
  if (input.packs?.master && input.packs?.sergeant) {
    packs = {
      master: input.packs.master,
      sergeant: input.packs.sergeant,
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
    if (!isCoachTone(row.id)) continue;
    nextVoices.push({
      id: row.id,
      displayName: row.display_name,
      description: row.description,
      blurb: row.blurb,
      fromName: row.from_name,
    });
  }

  const nextPacks: Record<CoachTone, LinePack> = {
    master: emptyPack(),
    sergeant: emptyPack(),
  };

  for (const row of lineRows) {
    if (!isCoachTone(row.voice_id)) continue;
    const pack = nextPacks[row.voice_id];
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
