'use client';

import { formatCompact } from '@/lib/athletePerformanceTypes';
import { KPI_COLOR } from '@/lib/kpi';

/** Four tiles after a completed set on a live card. */
export default function LiveSetKpis({
  setVolume,
  setEffective,
  allTimeBestLabel,
  sessionVolume,
  sessionEffective,
  setHint,
}: {
  setVolume: number;
  setEffective: number;
  /** Heaviest single set ever logged for this exercise, in set units (e.g. "40 lb × 10") — not a volume number. */
  allTimeBestLabel: string | null;
  sessionVolume: number;
  sessionEffective: number;
  setHint?: string;
}) {
  return (
    <div className="live-kpis">
      <div className="kpi">
        <label>Set Volume</label>
        <div className="big" style={{ color: KPI_COLOR.volume }}>
          {formatCompact(setVolume)}
        </div>
        {setHint ? <div className="sub">{setHint}</div> : null}
      </div>
      <div className="kpi">
        <label>Set Effective</label>
        <div className="big" style={{ color: KPI_COLOR.effective }}>
          {formatCompact(setEffective)}
        </div>
        <div className="sub">volume × Effort</div>
      </div>
      <div className="kpi">
        <label>All-Time Best</label>
        <div className="big text" style={{ color: KPI_COLOR.volume }}>
          {allTimeBestLabel ?? '—'}
        </div>
        <div className="sub">heaviest set ever</div>
      </div>
      <div className="kpi">
        <label>Session Volume</label>
        <div className="big" style={{ color: KPI_COLOR.volume }}>
          {formatCompact(sessionVolume)}
        </div>
        <div className="sub">Effective {formatCompact(sessionEffective)}</div>
      </div>
    </div>
  );
}
