import { currentBelt, displayBelt } from '@/lib/belts';

export default function BeltChip({
  lockedWeeks,
  name,
  fill,
  earned,
  href,
}: {
  lockedWeeks?: number;
  name?: string;
  fill?: string;
  /** Solid fill = locked that belt. Outline = still working toward it. */
  earned?: boolean;
  href?: string;
}) {
  const weeks = Number(lockedWeeks || 0);
  const belt = name && fill ? { name, fill } : displayBelt(weeks);
  const isEarned = earned ?? (name && fill ? true : currentBelt(weeks) != null);
  const light = fillIsLight(belt.fill);
  const inner = (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black"
      style={
        isEarned
          ? {
              background: belt.fill,
              color: light ? '#1a1a1a' : '#f6f1e3',
              border: '1px solid transparent',
            }
          : {
              background: 'transparent',
              color: '#f6f1e3',
              border: `1px solid ${belt.fill}`,
            }
      }
    >
      {isEarned ? belt.name : `Aiming · ${belt.name}`}
    </span>
  );
  if (href) {
    return (
      <a href={href} className="inline-flex">
        {inner}
      </a>
    );
  }
  return inner;
}

function fillIsLight(hex: string) {
  const raw = hex.replace('#', '');
  const n = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
