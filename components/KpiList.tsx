'use client';

import { KPI_COLOR, KPI_LABEL, formatKpiPct, kpiStroke, kpiTone, type KpiId, type KpiRowModel } from '@/lib/kpi';

function sparkPoints(values: number[], width = 88, height = 18) {
  const points = values.length ? values : [0];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  return points
    .map((value, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * (width - 2) + 1;
      const y = height - 2 - ((value - min) / span) * (height - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function KpiSpark({
  values,
  stroke,
}: {
  values: number[];
  stroke: string;
}) {
  return (
    <svg className="kpi-spark" viewBox="0 0 88 18" aria-hidden="true">
      <polyline fill="none" stroke={stroke} strokeWidth="1.8" points={sparkPoints(values)} />
    </svg>
  );
}

export function KpiSpike({ pct, id }: { pct: number | null; id: KpiId }) {
  const stroke = kpiStroke(pct, id);
  const mid = 44;
  const reach = pct == null ? 0 : Math.max(-36, Math.min(36, (pct / 100) * 36));
  const end = mid + reach;
  return (
    <svg className="kpi-spark" viewBox="0 0 88 14" aria-hidden="true">
      <line x1="44" y1="1" x2="44" y2="13" stroke="rgba(255,255,255,0.2)" />
      {pct != null && pct !== 0 ? (
        <line x1={mid} y1="7" x2={end} y2="7" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      ) : null}
      <circle cx={pct == null || pct === 0 ? mid : end} cy="7" r="3" fill={stroke} />
    </svg>
  );
}

function Delta({ pct }: { pct: number | null }) {
  const tone = kpiTone(pct);
  const color = tone === 'up' ? '#6d8b6e' : tone === 'down' ? '#a35d52' : '#f6f1e3';
  return (
    <b className="kpi-delta" style={{ color }}>
      {formatKpiPct(pct)}
    </b>
  );
}

export function KpiRow({ row }: { row: KpiRowModel }) {
  const stroke = kpiStroke(row.pct, row.id);
  const chart =
    row.spark && row.spark.length > 1 ? (
      <KpiSpark values={row.spark} stroke={stroke} />
    ) : (
      <KpiSpike pct={row.pct} id={row.id} />
    );
  return (
    <div className="kpi-row">
      <span className="kpi-name" style={{ color: KPI_COLOR[row.id] }}>
        {KPI_LABEL[row.id]}
      </span>
      <div className="kpi-val">
        <b>{row.value}</b>
        {row.hint ? <span>{row.hint}</span> : null}
      </div>
      {chart}
      <Delta pct={row.pct} />
    </div>
  );
}

export function KpiList({ rows }: { rows: KpiRowModel[] }) {
  if (!rows.length) return null;
  return (
    <div className="kpi-list">
      {rows.map((row) => (
        <KpiRow key={row.id} row={row} />
      ))}
    </div>
  );
}

export function FourKpiSpike({ rows }: { rows: KpiRowModel[] }) {
  if (!rows.length) return null;
  return (
    <div className="kpi-spike-grid">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <span
            className="w-[4.5rem] shrink-0 text-[11px] font-black uppercase tracking-[0.14em]"
            style={{ color: KPI_COLOR[row.id] }}
          >
            {KPI_LABEL[row.id]}
          </span>
          <Delta pct={row.pct} />
        </div>
      ))}
    </div>
  );
}

export function VolumeSpikeList({
  items,
  selected,
  onSelect,
}: {
  items: Array<{ key: string; name: string; pct: number | null; kpis: KpiRowModel[] }>;
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const open = selected === item.key;
        return (
          <div key={item.key}>
            <button
              type="button"
              onClick={() => onSelect(open ? null : item.key)}
              className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-left"
              aria-expanded={open}
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#f6f1e3]/90">{item.name}</span>
              <div className="w-[88px] shrink-0">
                <KpiSpike pct={item.pct} id="volume" />
              </div>
              <b
                className="w-12 shrink-0 text-right text-sm font-black"
                style={{ color: kpiTone(item.pct) === 'up' ? '#6d8b6e' : kpiTone(item.pct) === 'down' ? '#a35d52' : '#f6f1e3' }}
              >
                {formatKpiPct(item.pct)}
              </b>
            </button>
            {open ? <KpiList rows={item.kpis} /> : null}
          </div>
        );
      })}
    </div>
  );
}
