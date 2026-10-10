import Link from 'next/link';
import { KpiSpark, KpiSpike } from '@/components/KpiList';
import { performanceRangeLabel, type PerformancePeriod } from '@/lib/athletePerformanceTypes';
import { formatKpiPct, kpiStroke, type KpiRowModel } from '@/lib/kpi';

/**
 * The one big number: Effective (volume × perceived effort) vs last time, with its
 * sparkline. Shared by Home's hero (links to Your performance) and the top of the
 * Analytics tab (follows its filters, no link).
 */
export default function EffectiveKpi({
  row,
  period,
  cut,
  href,
  className = '',
}: {
  row: KpiRowModel;
  period: PerformancePeriod;
  /** The Analytics workout cut ("Upper A + Lower"), when one is picked. */
  cut?: string;
  /** Makes the whole block a link. */
  href?: string;
  className?: string;
}) {
  const stroke = kpiStroke(row.pct, 'effective');
  const range = performanceRangeLabel(period).replace(/^last /, '');
  const classes = `flex items-end justify-between gap-4 ${className}`;
  const content = (
    <>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f6f1e3]/60">
          Effective · {range}
          {cut ? ` · ${cut}` : ''}
        </p>
        <p className="mt-1 text-4xl font-black leading-none" style={{ color: stroke }}>
          {formatKpiPct(row.pct)}
        </p>
      </div>
      {row.spark && row.spark.length > 1 ? (
        <KpiSpark values={row.spark} stroke={stroke} />
      ) : (
        <KpiSpike pct={row.pct} id="effective" />
      )}
    </>
  );
  return href ? (
    <Link href={href} aria-label={`Effective, ${range}. Open Your performance`} className={classes}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}
