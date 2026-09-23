import { createHash } from 'crypto';

/** ElevenLabs voice for Master Tom Iron. */
export const TOM_ELEVEN_VOICE_ID = 'c1zz1gP1b2Gxm00yeXa5';

/** ElevenLabs voice for Eli Sparks. */
export const ELI_ELEVEN_VOICE_ID = '4qlF1DCcdREwQSYtHyMk';

/** ElevenLabs voice for Luna Meadows. */
export const LUNA_ELEVEN_VOICE_ID = 'pS1aPYBx1bOepxwSjJHk';

/** ElevenLabs voice for James Grey. */
export const JAMES_ELEVEN_VOICE_ID = 'p4OjgHPVXH9tmMn6BZgA';

export const COACH_ELEVEN_VOICE_IDS = {
  master: TOM_ELEVEN_VOICE_ID,
  james: JAMES_ELEVEN_VOICE_ID,
  luna: LUNA_ELEVEN_VOICE_ID,
  eli: ELI_ELEVEN_VOICE_ID,
} as const;

export type VoicedCoach = keyof typeof COACH_ELEVEN_VOICE_IDS;

export function coachClipKey(template: string): string {
  return createHash('sha256').update(template, 'utf8').digest('hex');
}

/**
 * What Tom actually speaks. `{name}` is omitted so one clip fits every athlete.
 * Newlines between a title and a body become a sentence break.
 */
export function speakableCoachText(template: string): string {
  let text = template.replace(/\r\n/g, '\n');
  // The name is a vocative. Drop it, and the comma that only introduced it.
  text = text.replace(/,\s*\{name\}/g, '');
  text = text.replace(/\{name\}\s*,/g, '');
  text = text.replace(/\{name\}/g, '');
  text = text.replace(/\n+/g, '. ');
  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(/\s+([,.?!])/g, '$1');
  text = text.replace(/\s+with\s*\./g, '.');
  text = text.replace(/,\s*\./g, '.');
  text = text.replace(/([.?!])(?:\s*[.,])+/g, '$1');
  text = text.replace(/\.\s*,/g, ',');
  text = text.replace(/^[,.\s]+/, '');
  text = text.replace(/\s{2,}/g, ' ').trim();
  text = text.replace(/([.?!]\s+)([a-z])/g, (_match, lead: string, letter: string) => lead + letter.toUpperCase());
  return text;
}
