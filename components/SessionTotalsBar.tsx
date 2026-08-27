'use client';

function formatLbs(value: number) {
  return Math.round(Number(value || 0)).toLocaleString();
}

/** Sticky live totals under the workout header. Today vs all-time. */
export default function SessionTotalsBar({
  sessionLbs,
  sessionReps,
  allTimeLbs,
}: {
  sessionLbs: number;
  sessionReps: number;
  allTimeLbs: number;
}) {
  return (
    <div className="border-t border-white/10 bg-black/35">
      <div className="container mx-auto flex flex-wrap items-baseline justify-center gap-x-4 px-4 py-1 text-sm">
        <p>
          <span className="mr-1.5 font-semibold text-[#f6f1e3]/55">Today</span>
          <span className="font-black text-white">{formatLbs(sessionLbs)} lb</span>
          {sessionReps > 0 ? (
            <span className="text-[#f6f1e3]/70"> · {sessionReps.toLocaleString()} reps</span>
          ) : null}
        </p>
        <p>
          <span className="mr-1.5 font-semibold text-[#f6f1e3]/55">All-time</span>
          <span className="font-black text-[#e8c547]">{formatLbs(allTimeLbs)} lb</span>
        </p>
      </div>
    </div>
  );
}
