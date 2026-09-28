import { HYROX_WEEK_OFFSET } from '@/lib/hyroxProgram';
import { isOverloadWeek } from '@/lib/overloadProgram';

/** `workout_sessions.program_track` values. */
export type ProgramTrack = 'main' | 'hyrox' | 'overload';

/** The opt-in tracks that replace Home while active. */
export type OptInTrack = Exclude<ProgramTrack, 'main'>;

/** The track a week_number belongs to — derived server-side, never trusted from the
 * client. Bands: main 0-48, Hyrox 101-200 (lib/hyroxProgram.ts), Overload
 * Progressions 201+ (lib/overloadProgram.ts). */
export function programTrackForWeek(weekNumber: number): ProgramTrack {
  if (isOverloadWeek(weekNumber)) return 'overload';
  if (Number(weekNumber) > HYROX_WEEK_OFFSET) return 'hyrox';
  return 'main';
}
