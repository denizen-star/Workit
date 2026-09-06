import { formatPct, pctChange, type PerformanceLine } from '@/lib/athletePerformanceTypes';
import { kpiWord } from '@/lib/kpi';

function lineReps(line: PerformanceLine) {
  if ('currentReps' in line && typeof (line as { currentReps?: number }).currentReps === 'number') {
    const current = (line as { currentReps: number }).currentReps;
    const prior =
      'priorReps' in line && typeof (line as { priorReps?: number | null }).priorReps === 'number'
        ? (line as { priorReps: number }).priorReps
        : null;
    return { current, prior, pct: pctChange(current, prior) };
  }
  return { current: null as number | null, prior: null as number | null, pct: null as number | null };
}

/** One template sentence from the four deltas. Not generated copy. */
export function whyFromLine(line: PerformanceLine) {
  const volumePct = line.rawVolumeChangePct ?? pctChange(line.currentVolume, line.priorVolume);
  const effortPct = line.volumeChangePct;
  const weightPct = line.weightChangePct;
  const repsPct = lineReps(line).pct;

  if (volumePct == null && effortPct == null && weightPct == null && repsPct == null) {
    return 'Tracking · no last time on these lifts yet.';
  }

  if (volumePct === 0 && effortPct === 0 && (weightPct == null || weightPct === 0) && (repsPct == null || repsPct === 0)) {
    return 'No underperformer. Nothing lost Volume Load. This lift held every number vs last time.';
  }

  if ((volumePct || 0) > 40 && (weightPct || 0) > 0 && (repsPct || 0) > 0) {
    return 'Volume Load jumped. Weight and reps both rose. Effective Load rose with the work, not just the vote.';
  }

  if ((volumePct || 0) > 0 && (effortPct || 0) < 0) {
    return 'More work, easier vote. That is the good Effective story.';
  }

  if ((volumePct || 0) <= 0 && (effortPct || 0) > 15) {
    return 'Volume down or held. Effective up — same load, harder votes.';
  }

  const bits = [
    weightPct != null ? `Weight ${kpiWord(weightPct).toLowerCase()} ${formatPct(weightPct)}` : null,
    repsPct != null ? `reps ${kpiWord(repsPct).toLowerCase()} ${formatPct(repsPct)}` : null,
    volumePct != null ? `Volume ${formatPct(volumePct)}` : null,
    effortPct != null ? `Effective ${formatPct(effortPct)}` : null,
  ].filter(Boolean);
  return bits.join(' · ') + '.';
}

export function shortWorkout(name: string) {
  return String(name || '').replace(' Body ', ' ').replace(/^ITD$/, 'all workouts');
}

export function progressIntro(comparedCount: number) {
  if (comparedCount <= 0) {
    return 'No lift has a last time yet. This side is the change, not the pile.';
  }
  return `${comparedCount} lift${comparedCount === 1 ? '' : 's'} with a prior session. This side is the change, not the pile.`;
}

export function lastSessionStory(line: PerformanceLine & { workoutType?: string }) {
  const volumePct = line.rawVolumeChangePct ?? pctChange(line.currentVolume, line.priorVolume);
  const effortPct = line.volumeChangePct;
  const weightPct = line.weightChangePct;
  const repsPct = lineReps(line).pct;
  const day = shortWorkout(line.workoutType || line.name);
  const bits = [
    volumePct != null ? `Volume ${formatPct(volumePct)}` : null,
    effortPct != null ? `Effective ${formatPct(effortPct)}` : null,
    weightPct != null ? `weight ${kpiWord(weightPct).toLowerCase()}` : null,
    repsPct != null ? `reps ${kpiWord(repsPct).toLowerCase()} ${formatPct(repsPct)}` : null,
  ].filter(Boolean);
  return `Last ${day}: ${bits.join(', ')}.`;
}

export function progressCaveat(
  workouts: Array<PerformanceLine & { workoutType?: string; name: string }>
) {
  const spike = [...workouts].sort(
    (a, b) => Math.abs(b.rawVolumeChangePct || 0) - Math.abs(a.rawVolumeChangePct || 0)
  )[0];
  if (!spike || Math.abs(spike.rawVolumeChangePct || 0) < 40) return null;
  return `${shortWorkout(spike.workoutType || spike.name)} jumped because the prior day was lighter. Read the lift cards, not that one spike.`;
}

export function progressSummaryBody(
  last: (PerformanceLine & { workoutType?: string }) | null,
  workouts: Array<PerformanceLine & { workoutType?: string; name: string }>
) {
  const parts = [last ? lastSessionStory(last) : null, last ? whyFromLine(last) : null, progressCaveat(workouts)].filter(
    Boolean
  );
  return parts.join(' ');
}

export function workoutWhy(line: PerformanceLine) {
  const volumePct = line.rawVolumeChangePct ?? pctChange(line.currentVolume, line.priorVolume);
  const effortPct = line.volumeChangePct;
  if (volumePct != null && Math.abs(volumePct) < 3 && (effortPct || 0) > 8) {
    return 'Same iron. Harder votes. That is fatigue, not progress.';
  }
  if (volumePct != null && volumePct > 0 && (effortPct || 0) < 0) {
    return 'Same bar, more work, less grind. Volume Load up while Effective Load dropped.';
  }
  return whyFromLine(line);
}

export function progressVerdict(line: PerformanceLine) {
  const volumePct = line.rawVolumeChangePct ?? pctChange(line.currentVolume, line.priorVolume);
  const effortPct = line.volumeChangePct;
  if (volumePct == null && effortPct == null) {
    return 'No last time on this session yet. The pile is what you did.';
  }
  const volumeWord =
    volumePct == null ? 'unknown' : volumePct > 0 ? 'moving' : volumePct < 0 ? 'down' : 'held';
  const effortWord =
    effortPct == null ? 'held' : effortPct > 0 && (volumePct || 0) <= 0 ? 'up' : effortPct < 0 ? 'mixed' : 'moving';
  return `Volume Load is ${volumeWord}. Effective Load is ${effortWord}.`;
}

export function strongerLine(volumePct: number | null, effortPct: number | null) {
  if (volumePct == null) return 'Same four numbers on this week’s lifts vs the last time those lifts ran.';
  if (volumePct > 0 && (effortPct == null || effortPct <= 0)) {
    return 'Stronger = Volume Load up while Effective Load holds or drops.';
  }
  if (volumePct > 0) return 'Volume Load is up vs last time those lifts ran.';
  if (volumePct < 0) return 'Volume Load is down vs last time those lifts ran.';
  return 'Volume Load held vs last time those lifts ran.';
}
