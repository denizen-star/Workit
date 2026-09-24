import { createHash } from 'crypto';

/** ElevenLabs voice for Master Tom Iron. */
export const TOM_ELEVEN_VOICE_ID = 'mKRyR5dyNdWWG5c8dHd6';

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
 * A line break is a breath. A title and the line under it stay one phrase,
 * so the voice does not stop and start again. The on-screen text is unchanged.
 */
export function speakableCoachText(template: string): string {
  let text = template.replace(/\r\n/g, '\n');
  // The name is a vocative. Drop it, and the comma that only introduced it.
  text = text.replace(/,\s*\{name\}/g, '');
  text = text.replace(/\{name\}\s*,/g, '');
  text = text.replace(/\{name\}/g, '');
  // A period that only existed to end "{name}." is not a real stop.
  text = text.replace(/\n+\s*\./g, '\n');
  text = text.replace(/^\s*\.\s*/, '');
  text = text.replace(/([.?!])\s*\n+/g, '$1 ');
  text = text.replace(/\n+/g, ', ');
  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(/\s+([,.?!])/g, '$1');
  text = text.replace(/\s+with\s*\./g, '.');
  text = text.replace(/,\s*\./g, '.');
  text = text.replace(/([.?!])(?:\s*[.,])+/g, '$1');
  text = text.replace(/\.\s*,/g, ',');
  text = text.replace(/^[,.\s]+/, '');
  text = text.replace(/\s{2,}/g, ' ').trim();
  text = text.replace(/([.?!]\s+)([a-z])/g, (_match, lead: string, letter: string) => lead + letter.toUpperCase());
  text = text.replace(/,\s+([A-Z])(?![A-Z])/g, (_match, letter: string) =>
    letter === 'I' ? ', I' : ', ' + letter.toLowerCase()
  );
  return text;
}
