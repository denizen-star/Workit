'use client';

import { formatCompact } from '@/lib/athletePerformanceTypes';
import { KPI_COLOR } from '@/lib/kpi';
import type { TileDelta } from '@/lib/setHistory';
import { HelpTip } from './HelpSheet';

/** Small ▲/▼ + raw delta badge shown next to a tile's value. Renders nothing with no prior value to compare. */
function DeltaBadge({ delta }: { delta: TileDelta }) {
  if (!delta) return null;
  const arrow = delta.direction === 'up' ? '▲' : '▼';
  const signed = delta.value > 0 ? `+${delta.value}` : `${delta.value}`;
  return <span className={`delta delta-${delta.direction}`}>{arrow} {signed}</span>;
}

/**
 * Four tiles keyed to the just-completed set's position: how Set N of this exercise has
 * gone across every past session, live-folded with today's own set the instant it completes.
 */
export default function LiveSetKpis({
  setNumber,
  historyLabel,
  historySub,
  historyDelta,
  effectiveValue,
  effectiveSub,
  effectiveDelta,
  bestLabel,
  bestSub,
  bestDelta,
  volumeAvg,
  volumeDelta,
}: {
  setNumber: number;
  /** Avg weight × avg reps for this set position, folded with today's set — null with no prior history. */
  historyLabel: string | null;
  /** "← 55 lb × 2.7 PE", the average before today's set folded in, or a no-history fallback line. */
  historySub: string;
  historyDelta: TileDelta;
  /** Average Effective (weight × reps × effort factor) across this set position's history, folded with today. */
  effectiveValue: number | null;
  effectiveSub: string;
  effectiveDelta: TileDelta;
  /** Today's own weight × reps at this set position, in set units (e.g. "80 × 12") — null with no prior session to flip from. */
  bestLabel: string | null;
  /** "PR · 60 lb", the prior session's weight this just replaced, or a no-prior-session fallback line. */
  bestSub: string;
  bestDelta: TileDelta;
  /** Average (weight × reps) per completed set of this exercise, today so far. */
  volumeAvg: number;
  volumeDelta: TileDelta;
}) {
  return (
    <div className="live-kpis">
      <div className="kpi">
        <div className="kpi-label-row">
          <label>Set {setNumber} History</label>
          <HelpTip
            label="Set History"
            title="Set History"
            lead={`Average Weight × Reps · Perceived Effort (PE) logged in Set ${setNumber} of this exercise, across every past completed session. Extras beyond the planned set count don't count.`}
          />
        </div>
        <div className="kpi-value-row">
          <span className="big text" style={{ color: KPI_COLOR.volume }}>
            {historyLabel ?? '—'}
          </span>
          <DeltaBadge delta={historyDelta} />
        </div>
        <div className="sub">{historySub}</div>
      </div>

      <div className="kpi">
        <div className="kpi-label-row">
          <label>Avg Effective</label>
          <HelpTip
            label="Avg Effective"
            title="Average Set Effective"
            lead="(Weight × Reps × Effort factor) computed for each historical set at this position, then averaged — not derived from the rounded numbers in Set History."
          />
        </div>
        <div className="kpi-value-row">
          <span className="big" style={{ color: KPI_COLOR.effective }}>
            {effectiveValue != null ? formatCompact(effectiveValue) : '—'}
          </span>
          <DeltaBadge delta={effectiveDelta} />
        </div>
        <div className="sub">{effectiveSub}</div>
      </div>

      <div className="kpi">
        <div className="kpi-label-row">
          <label>Best</label>
          <HelpTip
            label="Best"
            title="Best Last Session"
            lead="The weight logged in this set position during your most recent completed session. The moment you finish this set today, it flips to show what you just lifted, and PR notes what it replaced."
          />
        </div>
        <div className="kpi-value-row">
          <span className="big text" style={{ color: KPI_COLOR.volume }}>
            {bestLabel ?? '—'}
          </span>
          <DeltaBadge delta={bestDelta} />
        </div>
        <div className="sub">{bestSub}</div>
      </div>

      <div className="kpi">
        <div className="kpi-label-row">
          <label>Volume</label>
          <HelpTip
            label="Volume"
            title="Session Volume"
            lead="Average Weight × Reps per completed set of this exercise, in today's session so far."
          />
        </div>
        <div className="kpi-value-row">
          <span className="big" style={{ color: KPI_COLOR.volume }}>
            {formatCompact(volumeAvg)}
          </span>
          <DeltaBadge delta={volumeDelta} />
        </div>
        <div className="sub">Avg</div>
      </div>
    </div>
  );
}
