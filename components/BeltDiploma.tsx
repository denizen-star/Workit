import BeltMark from '@/components/BeltMark';
import { sampleDuringWeeks, type Belt, type BeltState } from '@/lib/belts';

const STATE_LABEL: Record<BeltState, string> = {
  before: 'Before',
  during: 'During',
  after: 'After',
};

function inkFor(belt: Belt, state: BeltState) {
  if (state === 'after' && belt.paper === 'light') {
    return { text: '#1a1a1a', muted: 'rgba(26,26,26,0.62)', faint: 'rgba(26,26,26,0.4)' };
  }
  if (state === 'after') {
    return { text: '#f6f1e3', muted: 'rgba(246,241,227,0.72)', faint: 'rgba(246,241,227,0.45)' };
  }
  return { text: '#f6f1e3', muted: 'rgba(246,241,227,0.7)', faint: 'rgba(246,241,227,0.4)' };
}

function Sections({
  total,
  filled,
  color,
  empty,
}: {
  total: number;
  filled: number;
  color: string;
  empty: string;
}) {
  if (total > 12) {
    const pct = Math.round((filled / total) * 100);
    return (
      <div>
        <div className="h-2 overflow-hidden rounded-full" style={{ background: empty }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
        <p className="mt-2 text-[11px] font-semibold tracking-wide uppercase" style={{ color: empty }}>
          {filled} of {total} sections
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-sm"
          style={{ background: i < filled ? color : empty }}
        />
      ))}
    </div>
  );
}

export default function BeltDiploma({
  belt,
  state,
  lockedWeeks,
  showStateLabel = true,
}: {
  belt: Belt;
  state: BeltState;
  lockedWeeks?: number;
  showStateLabel?: boolean;
}) {
  const filled =
    state === 'after'
      ? belt.weeks
      : state === 'during'
        ? lockedWeeks ?? sampleDuringWeeks(belt)
        : 0;
  const ink = inkFor(belt, state);
  const accent = belt.trim || belt.fill;
  const sectionColor = state === 'after' && belt.paper === 'light' ? '#1a1a1a' : accent;
  const sectionEmpty = state === 'after' && belt.paper === 'light' ? 'rgba(26,26,26,0.18)' : 'rgba(246,241,227,0.18)';

  const paper =
    state === 'after'
      ? {
          background: belt.fill,
          borderColor: belt.trim || (belt.paper === 'light' ? 'rgba(26,26,26,0.16)' : 'rgba(246,241,227,0.28)'),
          borderWidth: belt.trim ? 2 : 1,
        }
      : state === 'during'
        ? {
            background: `linear-gradient(180deg, ${hexAlpha(belt.fill, 0.22)}, rgba(7,7,10,0.72))`,
            borderColor: hexAlpha(accent, 0.55),
            borderWidth: 1,
          }
        : {
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
            borderColor: hexAlpha(accent, 0.35),
            borderWidth: 1,
            borderStyle: 'dashed' as const,
          };

  return (
    <article className="flex h-full flex-col">
      {showStateLabel ? (
        <p className="mb-2 text-[11px] font-black tracking-[0.2em] uppercase text-[#f6f1e3]/55">
          {STATE_LABEL[state]}
        </p>
      ) : null}
      <div
        className="flex h-full flex-col rounded-3xl p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
        style={{
          background: paper.background,
          borderColor: paper.borderColor,
          borderWidth: paper.borderWidth,
          borderStyle: 'borderStyle' in paper ? paper.borderStyle : 'solid',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: ink.faint }}>
              Diploma · {belt.weeks} weeks
            </p>
            <h3 className="mt-1 text-xl font-black leading-tight" style={{ color: ink.text }}>
              {belt.name}
            </h3>
          </div>
          <BeltMark belt={belt} state={state} className="h-12 w-24 shrink-0" />
        </div>

        <div className="mt-4">
          <Sections total={belt.weeks} filled={filled} color={sectionColor} empty={sectionEmpty} />
        </div>

        <p className="mt-3 text-sm font-semibold" style={{ color: ink.muted }}>
          {state === 'before'
            ? `Not started. Lock ${belt.weeks} weeks.`
            : state === 'during'
              ? `${filled} of ${belt.weeks} locked weeks.`
              : `${belt.weeks} locked weeks. Earned.`}
        </p>

        <div
          className="mt-4 flex-1 rounded-2xl px-4 py-3"
          style={{
            background: state === 'after' ? (belt.paper === 'light' ? 'rgba(26,26,26,0.06)' : 'rgba(246,241,227,0.08)') : 'rgba(0,0,0,0.22)',
            border: state === 'before' ? `1px dashed ${sectionEmpty}` : '1px solid transparent',
          }}
        >
          {state === 'before' ? (
            <p className="text-sm italic" style={{ color: ink.faint }}>
              The line is waiting.
            </p>
          ) : (
            <>
              <p
                className="text-base font-black leading-snug"
                style={{ color: ink.text, opacity: state === 'during' ? 0.7 : 1 }}
              >
                {belt.quote}
              </p>
              <p className="mt-2 text-xs font-black tracking-[0.16em] uppercase" style={{ color: ink.muted }}>
                {belt.saidBy}
              </p>
              {state === 'after' ? (
                <p className="mt-3 text-sm font-semibold leading-relaxed" style={{ color: ink.text }}>
                  {belt.coachLine}
                </p>
              ) : (
                <p className="mt-3 text-sm italic" style={{ color: ink.faint }}>
                  Coach line unlocks when you earn it.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function hexAlpha(hex: string, alpha: number) {
  const raw = hex.replace('#', '');
  const n = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
