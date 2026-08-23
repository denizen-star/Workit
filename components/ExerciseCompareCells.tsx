import {
  compareSentence,
  formatCompareValue,
  type ExerciseCompareCell,
  type ExerciseCompareTrio,
} from '@/lib/exerciseCompare';

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function CellBody({
  cell,
  kind,
  athleteName,
}: {
  cell: ExerciseCompareCell | null;
  kind: 'lead' | 'deficit' | 'similar';
  athleteName: string;
}) {
  const sentence = compareSentence(kind, athleteName, cell);
  if (!cell || !sentence) {
    return <p className="text-sm text-[#f6f1e3]/45">—</p>;
  }

  const date = formatDate(cell.sessionDate);
  const peerDate = formatDate(cell.peerSessionDate);
  const yours = [formatCompareValue(cell.value, cell.unit), date].filter(Boolean).join(' · ');
  const theirs = [formatCompareValue(cell.peerValue, cell.unit), peerDate].filter(Boolean).join(' · ');

  return (
    <div className="space-y-1">
      <p className="font-semibold leading-snug text-white">{sentence}</p>
      <p className="text-sm text-[#e8c547]">{yours}</p>
      {theirs && (
        <p className="text-xs text-[#f6f1e3]/55">
          {cell.peerName ? `${cell.peerName} · ${theirs}` : theirs}
          {cell.percent != null ? ` · ${cell.percent}%` : ''}
        </p>
      )}
    </div>
  );
}

export default function ExerciseCompareCells({
  trio,
  athleteName,
  layout = 'stack',
}: {
  trio: ExerciseCompareTrio;
  athleteName: string;
  layout?: 'stack' | 'row';
}) {
  const items = [
    { kind: 'lead' as const, cell: trio.lead },
    { kind: 'deficit' as const, cell: trio.deficit },
    { kind: 'similar' as const, cell: trio.similar },
  ];

  return (
    <div
      className={
        layout === 'row'
          ? 'grid grid-cols-1 gap-3 md:grid-cols-3'
          : 'grid grid-cols-1 gap-3'
      }
    >
      {items.map((item) => (
        <div key={item.kind} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
          <CellBody cell={item.cell} kind={item.kind} athleteName={athleteName} />
        </div>
      ))}
    </div>
  );
}
