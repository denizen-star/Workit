import type { Belt, BeltState } from '@/lib/belts';

export default function BeltMark({
  belt,
  state,
  className = 'h-16 w-32',
}: {
  belt: Belt;
  state: BeltState;
  className?: string;
}) {
  const id = `${belt.slug}-${state}`;
  const fill = state === 'before' ? 'transparent' : belt.fill;
  const stroke = belt.trim || (belt.paper === 'light' && state === 'after' ? '#2a2a28' : belt.fill);
  const seal = belt.trim || (state === 'before' ? '#f6f1e3' : belt.paper === 'light' ? '#2a2a28' : '#f6f1e3');
  const opacity = state === 'before' ? 0.45 : state === 'during' ? 0.85 : 1;

  return (
    <svg
      viewBox="0 0 160 80"
      className={className}
      aria-hidden
      style={{ opacity }}
    >
      <defs>
        <linearGradient id={`${id}-sash`} x1="0" y1="0" x2="160" y2="80">
          <stop offset="0" stopColor={state === 'before' ? '#f6f1e3' : fill} stopOpacity={state === 'before' ? 0.2 : 1} />
          <stop offset="1" stopColor={stroke} stopOpacity={state === 'before' ? 0.35 : 1} />
        </linearGradient>
      </defs>
      <path
        d="M8 28h44l8 12-8 12H8l10-12z"
        fill={`url(#${id}-sash)`}
        stroke={stroke}
        strokeWidth="2"
      />
      <path
        d="M152 28H108l-8 12 8 12h44l-10-12z"
        fill={`url(#${id}-sash)`}
        stroke={stroke}
        strokeWidth="2"
      />
      <rect
        x="48"
        y="22"
        width="64"
        height="36"
        rx="4"
        fill={state === 'before' ? '#07070a' : fill}
        stroke={stroke}
        strokeWidth="2"
        strokeDasharray={state === 'before' ? '4 4' : undefined}
      />
      <circle cx="80" cy="40" r="11" fill={state === 'before' ? '#07070a' : fill} stroke={seal} strokeWidth="2.5" />
      <circle cx="80" cy="40" r="5" fill={seal} />
    </svg>
  );
}
