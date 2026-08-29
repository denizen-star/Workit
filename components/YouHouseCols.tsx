/** Two labeled columns: cream = you, copper = the other person or house avg. */

export type YouHouseRow = {
  label: string;
  you: string;
  house: string;
};

export default function YouHouseCols({
  youLabel = 'You',
  houseLabel,
  rows,
}: {
  youLabel?: string;
  houseLabel: string;
  rows: YouHouseRow[];
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
      <div className="grid grid-cols-[1fr_minmax(0,1fr)_minmax(0,1fr)] gap-px bg-white/10">
        <p className="bg-[#0c0c10] px-3 py-2 text-sm font-semibold uppercase tracking-wider text-[#f6f1e3]/45">
          {' '}
        </p>
        <p className="bg-[#0c0c10] px-3 py-2 text-right text-sm font-semibold uppercase tracking-wider text-[#f6f1e3]">
          {youLabel}
        </p>
        <p className="bg-[#0c0c10] px-3 py-2 text-right text-sm font-semibold uppercase tracking-wider text-[#c08457]">
          {houseLabel}
        </p>
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <p className="bg-black/40 px-3 py-3 text-sm font-semibold uppercase tracking-wider text-[#f6f1e3]/50">
              {row.label}
            </p>
            <p className="bg-black/40 px-3 py-3 text-right text-lg font-black text-[#f6f1e3]">
              {row.you}
            </p>
            <p className="bg-black/40 px-3 py-3 text-right text-lg font-black text-[#c08457]">
              {row.house}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
