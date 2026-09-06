'use client';

import { KPI_COLOR } from '@/lib/kpi';

/** Four tiles after a completed set on a live card. */
export default function LiveSetKpis({
  setVolume,
  setEffective,
  exerciseVolume,
  sessionVolume,
  sessionEffective,
  setHint,
}: {
  setVolume: number;
  setEffective: number;
  exerciseVolume: number;
  sessionVolume: number;
  sessionEffective: number;
  setHint?: string;
}) {
  return (
    <div className="live-kpis">
      <div className="kpi">
        <label>Set Volume</label>
        <div className="big" style={{ color: KPI_COLOR.volume }}>
          {Math.round(setVolume).toLocaleString()}
        </div>
        {setHint ? <div className="sub">{setHint}</div> : null}
      </div>
      <div className="kpi">
        <label>Set Effective</label>
        <div className="big" style={{ color: KPI_COLOR.effective }}>
          {Math.round(setEffective).toLocaleString()}
        </div>
        <div className="sub">volume × Effort</div>
      </div>
      <div className="kpi">
        <label>Exercise Volume</label>
        <div className="big" style={{ color: KPI_COLOR.volume }}>
          {Math.round(exerciseVolume).toLocaleString()}
        </div>
      </div>
      <div className="kpi">
        <label>Session Volume</label>
        <div className="big" style={{ color: KPI_COLOR.volume }}>
          {Math.round(sessionVolume).toLocaleString()}
        </div>
        <div className="sub">Effective {Math.round(sessionEffective).toLocaleString()}</div>
      </div>
    </div>
  );
}
