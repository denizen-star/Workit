import YouHouseCols from '@/components/YouHouseCols';
import {
  formatCompareValue,
  type ExerciseCompareCell,
  type ExerciseCompareTrio,
} from '@/lib/exerciseCompare';
import { firstName } from '@/lib/scoreboardTypes';

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function kindCopy(kind: 'lead' | 'deficit' | 'similar', athleteName: string) {
  const who = firstName(athleteName) || 'You';
  if (kind === 'lead') return { kicker: `${who} leads`, tone: 'good' as const };
  if (kind === 'deficit') return { kicker: `${who} trails`, tone: 'bad' as const };
  return { kicker: 'Closest', tone: 'plain' as const };
}

function CellCard({
  cell,
  kind,
  athleteName,
}: {
  cell: ExerciseCompareCell | null;
  kind: 'lead' | 'deficit' | 'similar';
  athleteName: string;
}) {
  const copy = kindCopy(kind, athleteName);
  const kickerColor =
    copy.tone === 'good' ? 'text-[#6d8b6e]' : copy.tone === 'bad' ? 'text-[#a35d52]' : 'text-[#f6f1e3]/55';

  if (!cell) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">
        <p className={`text-sm font-black uppercase tracking-[0.16em] ${kickerColor}`}>{copy.kicker}</p>
        <p className="mt-2 text-sm text-[#f6f1e3]/45">No lift in this band yet.</p>
      </div>
    );
  }

  const peer = cell.peerName ? firstName(cell.peerName) : 'Pack';
  const youValue = formatCompareValue(cell.value, cell.unit) || '—';
  const houseValue = formatCompareValue(cell.peerValue, cell.unit) || '—';
  const youWhen = formatDate(cell.sessionDate);
  const houseWhen = formatDate(cell.peerSessionDate);
  const gap =
    cell.percent != null
      ? kind === 'deficit'
        ? `${cell.percent}% behind`
        : kind === 'lead'
          ? `${cell.percent}% ahead`
          : `${cell.percent}% apart`
      : null;

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">
      <p className={`text-sm font-black uppercase tracking-[0.16em] ${kickerColor}`}>{copy.kicker}</p>
      <p className="mt-1 text-lg font-black text-white">{cell.exerciseName}</p>
      {gap ? <p className="mt-1 text-sm text-[#f6f1e3]/60">{gap}</p> : null}
      <YouHouseCols
        youLabel={firstName(athleteName) || 'You'}
        houseLabel={peer}
        rows={[
          { label: cell.unit === 'reps' ? 'Best reps' : 'Best lb', you: youValue, house: houseValue },
          { label: 'When', you: youWhen || '—', house: houseWhen || '—' },
        ]}
      />
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
  return (
    <div
      className={
        layout === 'row' ? 'grid grid-cols-1 gap-3 md:grid-cols-3' : 'grid grid-cols-1 gap-3'
      }
    >
      <CellCard kind="lead" cell={trio.lead} athleteName={athleteName} />
      <CellCard kind="deficit" cell={trio.deficit} athleteName={athleteName} />
      <CellCard kind="similar" cell={trio.similar} athleteName={athleteName} />
    </div>
  );
}
