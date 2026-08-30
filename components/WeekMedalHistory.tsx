import WeekMedal from '@/components/WeekMedal';
import { formatWeekMonday, medalLabel, type WeekPodiumYou } from '@/lib/weekPodium';

export default function WeekMedalHistory({ medals }: { medals: WeekPodiumYou[] }) {
  if (medals.length === 0) return null;

  return (
    <div className="glass-card mb-4 p-6">
      <h2 className="text-2xl font-black text-white">Last weeks</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {medals.map((medal) => (
          <div
            key={`${medal.weekMonday}-${medal.place}`}
            className="rounded-2xl border border-[#e8c547]/35 bg-[#e8c547]/10 px-3 py-4 text-center"
          >
            <WeekMedal place={medal.place} size="sm" />
            <p className="mt-2 text-sm font-black text-white">{medalLabel(medal.place)}</p>
            <p className="mt-1 text-xs font-semibold text-[#f6f1e3]/65">
              {formatWeekMonday(medal.weekMonday)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
