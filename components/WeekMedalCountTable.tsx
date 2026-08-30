import type { WeekMedalCountRow } from '@/lib/weekPodium';

export default function WeekMedalCountTable({ rows }: { rows: WeekMedalCountRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="glass-card mb-8 p-6">
      <h2 className="text-2xl font-black text-white">Week medals</h2>
      <p className="mt-1 text-sm font-semibold text-[#f6f1e3]/55">Closed Eastern weeks. Test out.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-left">
          <thead>
            <tr className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f6f1e3]/50">
              <th className="pb-3 pr-3 font-black">Athlete</th>
              <th className="pb-3 px-2 text-center font-black text-[#e8c547]">Gold</th>
              <th className="pb-3 px-2 text-center font-black text-[#c5c5c5]">Silver</th>
              <th className="pb-3 pl-2 text-center font-black text-[#c08457]">Bronze</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.userId} className="border-t border-white/10">
                <td className="py-3 pr-3 text-lg font-black text-white">{row.name}</td>
                <td className="px-2 py-3 text-center text-lg font-black text-[#e8c547]">{row.gold}</td>
                <td className="px-2 py-3 text-center text-lg font-black text-[#c5c5c5]">{row.silver}</td>
                <td className="py-3 pl-2 text-center text-lg font-black text-[#c08457]">{row.bronze}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
