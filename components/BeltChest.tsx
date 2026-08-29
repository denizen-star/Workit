import Link from 'next/link';
import BeltMark from '@/components/BeltMark';
import { beltChest, type Belt, type BeltState } from '@/lib/belts';

function ink(belt: Belt, state: BeltState) {
  if (state === 'after' && belt.paper === 'light') return '#1a1a1a';
  return '#f6f1e3';
}

function muted(belt: Belt, state: BeltState) {
  if (state === 'after' && belt.paper === 'light') return 'rgba(26,26,26,0.62)';
  return 'rgba(246,241,227,0.62)';
}

function Slot({
  label,
  belt,
  state,
  detail,
}: {
  label: string;
  belt: Belt | null;
  state: BeltState;
  detail: string;
}) {
  const paper =
    belt && state === 'after'
      ? { background: belt.fill, borderColor: belt.trim || (belt.paper === 'light' ? 'rgba(26,26,26,0.16)' : 'rgba(246,241,227,0.28)') }
      : belt && state === 'during'
        ? { background: `${belt.fill}33`, borderColor: `${belt.fill}88` }
        : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(246,241,227,0.22)' };

  return (
    <div
      className="flex min-h-[148px] flex-col rounded-2xl border px-3 py-3"
      style={paper}
    >
      <p
        className="text-[10px] font-black uppercase tracking-[0.16em]"
        style={{ color: belt ? muted(belt, state) : 'rgba(246,241,227,0.45)' }}
      >
        {label}
      </p>
      {belt ? (
        <>
          <BeltMark belt={belt} state={state} className="mx-auto mt-2 h-10 w-20" />
          <p className="mt-2 text-sm font-black leading-tight" style={{ color: ink(belt, state) }}>
            {belt.name}
          </p>
          <p className="mt-1 text-[11px] font-semibold" style={{ color: muted(belt, state) }}>
            {detail}
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm font-semibold text-[#f6f1e3]/40">Empty. Earn the first.</p>
      )}
    </div>
  );
}

/** Three trophies on Home: yours, aiming, next. Links to /belts. */
export default function BeltChest({ lockedWeeks }: { lockedWeeks: number }) {
  const { earned, aiming, after } = beltChest(lockedWeeks);

  return (
    <Link href="/belts" className="mb-4 block">
      <div className="mb-2 flex items-end justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f6f1e3]/50">
          Your trophies
        </p>
        <span className="text-sm font-semibold text-[#f6f1e3]/65">See belts</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Slot
          label="Yours"
          belt={earned}
          state="after"
          detail={earned ? `${earned.weeks} locked. Earned.` : ''}
        />
        <Slot
          label="Aiming"
          belt={aiming}
          state="during"
          detail={aiming ? `${lockedWeeks} of ${aiming.weeks}` : 'Arnold Status. Keep it up.'}
        />
        <Slot
          label="Next"
          belt={after}
          state="before"
          detail={after ? `Then ${after.weeks} weeks.` : 'End of the year.'}
        />
      </div>
    </Link>
  );
}
