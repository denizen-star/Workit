'use client';

import { formatCompact } from '@/lib/athletePerformanceTypes';
import { KPI_COLOR } from '@/lib/kpi';

/** Four tiles after a completed set on a live card. */
export default function LiveSetKpis({
  setVolume,
  setEffective,
  lastTimeVolume,
  sessionVolume,
  sessionEffective,
  setHint,
}: {
  setVolume: number;
  setEffective: number;
  /** Volume from the last time this exercise was completed, not this session's own sum — more useful mid-lift. */
  lastTimeVolume: number | null;
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
        <label>Last Time</label>
        <div className="big" style={{ color: KPI_COLOR.volume }}>
          {lastTimeVolume != null ? formatCompact(lastTimeVolume) : '—'}
        </div>
        <div className="sub">this exercise, last session</div>
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
