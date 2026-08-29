import { Flag } from 'lucide-react';

const WEEK_EARLY = [
  { day: 'Mon', name: 'Upper A', rest: false },
  { day: 'Tue', name: 'Lower A', rest: false },
  { day: 'Wed', name: 'Rest', rest: true },
  { day: 'Thu', name: 'Upper B', rest: false },
  { day: 'Fri', name: 'Lower B', rest: false },
] as const;

const WEEK_LATER = [
  { day: 'Mon', name: 'Upper A', rest: false },
  { day: 'Tue', name: 'Lower', rest: false },
  { day: 'Wed', name: 'Rest', rest: true },
  { day: 'Thu', name: 'Upper B', rest: false },
  { day: 'Fri', name: 'Extra upper', rest: false },
] as const;

function WeekRow({ slots }: { slots: readonly { day: string; name: string; rest: boolean }[] }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {slots.map((slot) => (
        <div
          key={slot.day}
          className={`rounded-2xl px-1 py-3 text-center ${
            slot.rest ? 'border border-transparent bg-black/55' : 'border border-white/10 bg-white/5'
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
  );
}

/** About program. Weeks 1 to 6 stay two lowers. Week 7+ one lower, extra upper, bonus core or class. */
export default function ProgramInfo() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">
          About program
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
          48-week year. Four days lock a week.
        </h2>
        <p className="mt-3 text-[#f6f1e3]/80">
          Weeks 1 to 6 are the saddle: two uppers, two lowers. From week 7, one lower alternates A and B.
          Friday is extra upper. Bonus is core in the app, or a class you mark.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/50">
          Weeks 1 to 6
        </p>
        <WeekRow slots={WEEK_EARLY} />
        <p className="mt-3 text-sm leading-relaxed text-[#f6f1e3]/70">
          Mon Upper A. Tue Lower A. Wed rest. Thu Upper B. Fri Lower B. Weeks 3 to 6 add optional Bonus Upper.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/50">
          Week 7 onward
        </p>
        <WeekRow slots={WEEK_LATER} />
        <p className="mt-3 text-sm leading-relaxed text-[#f6f1e3]/70">
          Mon Upper A. Tue Lower A or B (odd / even week). Wed rest. Thu Upper B. Fri Extra upper.
          Sat bonus: logged core, or run / yoga / class.
        </p>
      </div>

      <div className="glass-card p-5">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8c547]/20">
          <Flag className="h-4 w-4 text-[#e8c547]" />
        </div>
        <h3 className="text-lg font-black text-white">Belts</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#f6f1e3]/75">
          Lock weeks (any 4 finishes). Gaps count. You always see the belt you are aiming for on Belts.
        </p>
      </div>

      <div className="glass-card p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">
          Progressive overload
        </p>
        <div className="mt-3 space-y-2 text-sm text-[#f6f1e3]/80">
          <p>
            <span className="font-black text-white">Weeks 1 to 2 ·</span> Adaptation. Conservative weights.
          </p>
          <p>
            <span className="font-black text-white">Weeks 3 to 5 ·</span> Building. Add 2.5–5 lb or 1–2 reps
            per set.
          </p>
          <p>
            <span className="font-black text-white">Week 6 ·</span> Peak. Match or beat week 4.
          </p>
          <p>
            <span className="font-black text-white">Weeks 7 to 48 ·</span> Same compounds. Notes change by
            block. How hard is a suggestion. Extra upper pack changes every 6 weeks.
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
