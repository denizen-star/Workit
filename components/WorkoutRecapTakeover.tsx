'use client';

import { HelpTip } from '@/components/HelpSheet';
import { formatKpiPct, KPI_COLOR, KPI_LABEL, kpiTone, type KpiRowModel } from '@/lib/kpi';
import { KPI_CALC_BULLETS } from '@/lib/helpCopy';

/** Finish recap. Same 2×2 tiles as a live set, at workout grain. */
export default function WorkoutRecapTakeover({
  open,
  title,
  kpis,
  onClose,
}: {
  open: boolean;
  title: string;
  kpis: KpiRowModel[];
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') onClose();
      }}
      className="fixed inset-0 z-[80] flex cursor-pointer items-center justify-center overflow-hidden bg-[#07070a]/95 px-6"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-[#e8c547] opacity-20 blur-3xl" />
        <div className="absolute bottom-10 right-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-center gap-1">
          <p className="text-sm font-semibold uppercase tracking-[0.45em] text-[#e8c547]">This workout</p>
          <HelpTip
            label="How these numbers are made"
            title="This workout"
            lead="Same four KPIs as Home, for this day vs last time you ran it."
            bullets={KPI_CALC_BULLETS}
          />
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight text-white">{title}</h2>
        {kpis.length > 0 ? (
          <div className="live-kpis mt-6">
            {kpis.map((row) => {
              const tone = kpiTone(row.pct);
              const pctColor = tone === 'up' ? '#6d8b6e' : tone === 'down' ? '#a35d52' : '#f6f1e3';
              return (
                <div key={row.id} className="kpi">
                  <label style={{ color: KPI_COLOR[row.id] }}>{KPI_LABEL[row.id]}</label>
                  <div className="big" style={{ color: KPI_COLOR[row.id] }}>
                    {row.value}
                  </div>
                  <div className="sub">
                    {row.hint ? `${row.hint} · ` : ''}
                    <span style={{ color: pctColor }}>{formatKpiPct(row.pct)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 text-center text-base text-[#f6f1e3]/70">No completed sets to score.</p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-8 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#e8c547] text-base font-black text-[#1a1404]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
