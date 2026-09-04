import { formatK, ordinalRank, overallRankSentence, type WeightRank } from '@/lib/exerciseCompare';
import { firstName } from '@/lib/scoreboardTypes';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <p className="text-sm uppercase tracking-[0.14em] text-[#f6f1e3]/50">{label}</p>
      <p className="mt-0.5 text-lg font-black text-[#e8c547]">{formatK(value)}</p>
    </div>
  );
}

export default function WeightRanking({
  ranking,
  highlightUserId,
  names = 'first',
}: {
  ranking: WeightRank[];
  highlightUserId?: number;
  names?: 'first' | 'full';
}) {
  if (ranking.length === 0) return null;

  const highlight = highlightUserId != null ? ranking.find((row) => row.userId === highlightUserId) : undefined;
  const sentence = highlight
    ? overallRankSentence({ userId: highlight.userId, name: highlight.name }, ranking, true)
    : null;

  return (
    <div className="mb-5">
      <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#e8c547]">
        Best day / Total weight
      </h3>
      {sentence && <p className="mb-3 font-semibold leading-snug text-white">{sentence}</p>}
      <div className="space-y-2">
        {ranking.map((row) => {
          const you = highlightUserId != null && row.userId === highlightUserId;
          const label = names === 'full' ? row.name : firstName(row.name);
          return (
            <div
              key={row.userId}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                you
                  ? 'border-[#f6f1e3]/45 bg-white/[0.06]'
                  : 'border-white/10 bg-black/20'
              }`}
            >
              <p className="text-lg font-black text-white">
                <span className="text-[#e8c547]">{ordinalRank(row.rank)}</span> {label}
              </p>
              <div className="flex items-start gap-4">
                <Stat label="Best day" value={row.effortBestDay} />
                <Stat label="Total weight" value={row.effortTotalWeight} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
