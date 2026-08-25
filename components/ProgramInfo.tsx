import { Flag } from 'lucide-react';

const WEEK = [
  { day: 'Mon', name: 'Upper A', rest: false },
  { day: 'Tue', name: 'Lower A', rest: false },
  { day: 'Wed', name: 'Rest', rest: true },
  { day: 'Thu', name: 'Upper B', rest: false },
  { day: 'Fri', name: 'Lower B', rest: false },
] as const;

/** About program — week tiles, bonus, overload. Gold/glass, same copy as the live plan. */
export default function ProgramInfo() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">
          About program
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          4-day Upper / Lower split
        </h2>
        <p className="mt-3 text-[#f6f1e3]/80">
          6 weeks. Upper / Lower / Rest / Upper / Lower. Built for muscle retention and full recovery.
          Four finished days lock the week.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {WEEK.map((slot) => (
          <div
            key={slot.day}
            className={`rounded-2xl px-1 py-3 text-center ${
              slot.rest
                ? 'border border-transparent bg-black/55'
                : 'border border-white/10 bg-white/5'
            }`}
          >
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${slot.rest ? 'text-[#f6f1e3]/40' : 'text-[#f6f1e3]/55'}`}>
              {slot.day}
            </p>
            <p className={`mt-1 text-xs font-black sm:text-sm ${slot.rest ? 'text-[#f6f1e3]/45' : 'text-white'}`}>
              {slot.name}
            </p>
          </div>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-[#f6f1e3]/70">
        Mon Upper A · Push. Tue Lower A · Quad and glute. Wed rest. Thu Upper B · Pull and shoulder.
        Fri Lower B · Posterior chain and unilateral.
      </p>

      <div className="glass-card p-5">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8c547]/20">
          <Flag className="h-4 w-4 text-[#e8c547]" />
        </div>
        <h3 className="text-lg font-black text-white">Weeks 3–6 · Bonus upper</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#f6f1e3]/75">
          Optional extra upper for traps, arms, and abs. Leave a day between upper sessions. Does not
          block a locked week. Weekend is active recovery, or this bonus if you want it.
        </p>
      </div>

      <div className="glass-card p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">
          Progressive overload
        </p>
        <div className="mt-3 space-y-2 text-sm text-[#f6f1e3]/80">
          <p>
            <span className="font-black text-white">Weeks 1–2 ·</span> Adaptation. Conservative weights.
          </p>
          <p>
            <span className="font-black text-white">Weeks 3–5 ·</span> Building. Add 2.5–5 lb or 1–2 reps
            per set.
          </p>
          <p>
            <span className="font-black text-white">Week 6 ·</span> Peak. Match or beat week 4.
          </p>
        </div>
        <p className="mt-4 text-sm text-[#f6f1e3]/60">
          Any day can be Gym or Travel (no equipment). Home Start uses Gym. Pick Travel on Select
          Workout.
        </p>
      </div>
    </div>
  );
}
