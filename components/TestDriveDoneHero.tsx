'use client';

import { formatCompact } from '@/lib/athletePerformanceTypes';
import { formatDuration } from '@/lib/formatDuration';
import { TEST_DRIVE_NAME, testDriveCountdown } from '@/lib/testDrive';

/** Confetti colors: gold (take action), earth green (done), copper (house), cream (you). */
const CONFETTI_COLORS = ['#e8c547', '#6d8b6e', '#c08457', '#f6f1e3'];

/** 18 pieces fanned around a circle — fixed, so the burst is the same on every render. */
const PIECES = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2;
  const reach = 90 + (index % 3) * 35;
  return {
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    dx: `${Math.round(Math.cos(angle) * reach)}px`,
    dy: `${Math.round(Math.sin(angle) * reach)}px`,
    spin: `${(index % 2 ? 1 : -1) * (180 + index * 20)}deg`,
    delay: `${(index % 4) * 40}ms`,
  };
});

export type TestDriveDoneSummary = { workouts: number; lbs: number; seconds: number };

/**
 * Home hero once every Test Drive workout is done and Week 1 hasn't started yet
 * (lib/testDrive.ts): a confetti burst, the countdown to Monday and what they did.
 * No Start button — the program waits for Monday.
 */
export default function TestDriveDoneHero({
  daysUntilMonday,
  summary,
}: {
  daysUntilMonday: number;
  summary: TestDriveDoneSummary | null;
}) {
  const tiles = summary
    ? [
        { label: 'Workouts', value: String(summary.workouts) },
        { label: 'Lbs', value: formatCompact(summary.lbs) },
        { label: 'Time', value: formatDuration(summary.seconds) },
      ]
    : [];
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-10 h-0 w-0">
        {PIECES.map((piece, index) => (
          <span
            key={index}
            className="test-drive-confetti absolute block h-2.5 w-1.5 rounded-sm"
            style={
              {
                backgroundColor: piece.color,
                animationDelay: piece.delay,
                '--dx': piece.dx,
                '--dy': piece.dy,
                '--spin': piece.spin,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">{TEST_DRIVE_NAME} · done</p>
      <h2 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
        {testDriveCountdown({ daysUntilMonday })}
      </h2>
      <p className="mt-3 text-lg text-[#f6f1e3]/75">You&apos;ve had the feel of it. The program starts Monday.</p>
      {tiles.length ? (
        <div className="mt-6 grid grid-cols-3 gap-2">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-2xl border border-[#6d8b6e]/40 bg-[#6d8b6e]/10 px-3 py-3 text-center">
              <p className="text-2xl font-black text-[#f6f1e3]">{tile.value}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f6f1e3]/60">{tile.label}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
