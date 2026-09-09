import {
  comparePctClass,
  comparePctLabel,
  type CompareRow,
} from '@/lib/compareTable';

/** You | Last | optional them. Cream wash on You. No vertical rules. */
export default function CompareTable({
  rows,
  themLabel,
  showThem = false,
  youLabel = 'You',
  lastLabel = 'Last',
}: {
  rows: CompareRow[];
  themLabel?: string;
  showThem?: boolean;
  youLabel?: string;
  lastLabel?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="compare-scroll">
      <table className={`compare-table${showThem ? ' compare-table-three' : ''}`}>
        <thead>
          <tr>
            <th />
            <th className="col you">
              <span className="head-you">{youLabel}</span>
            </th>
            <th className="col last">
              <span className="head-last">{lastLabel}</span>
            </th>
            {showThem ? (
              <th className="col">
                <span className="head-them">{themLabel || 'Them'}</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="feat">{row.label}</td>
              <td className="col you">
                <Cell cell={row.you} />
              </td>
              <td className="col last">
                <Cell cell={row.last ?? { value: '—' }} />
              </td>
              {showThem ? (
                <td className="col">
                  <Cell cell={row.them ?? { value: '—' }} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ cell }: { cell: { value: string; pct?: number | null } }) {
  const showPct = cell.pct != null && Number.isFinite(cell.pct);
  return (
    <>
      <span className="val">{cell.value}</span>
      {showPct ? (
        <span className={comparePctClass(cell.pct)}>{comparePctLabel(cell.pct)}</span>
      ) : null}
    </>
  );
}
