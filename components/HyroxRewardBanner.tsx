'use client';

/** Prominent Hyrox-red "reward unlocked" nudge — shared markup so the one-time and
 * persistent (already-seen) banners on Home always look the same, not just the first. */
export default function HyroxRewardBanner({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 flex w-full items-center gap-4 rounded-3xl border-2 border-[#e4032e]/60 bg-gradient-to-br from-[#e4032e]/20 via-[#16090a] to-[#16090a] px-5 py-4 text-left shadow-[0_0_28px_rgba(228,3,46,0.35)]"
    >
      <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0" aria-hidden="true">
        <path d="M22 4h20l-6 22h-8z" fill="#e4032e" opacity="0.85" />
        <path d="M22 4 12 26h12z" fill="#8c0016" />
        <path d="M42 4 52 26H40z" fill="#8c0016" />
        <circle cx="32" cy="42" r="18" fill="#16090a" stroke="#e4032e" strokeWidth="3" />
        <circle cx="32" cy="42" r="12" fill="#e4032e" opacity="0.18" />
        <path
          d="M32 33l2.7 5.6 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9z"
          fill="#e4032e"
        />
      </svg>
      <div className="min-w-0">
        <p className="text-lg font-black uppercase tracking-wide text-[#ff5c6c]">Reward unlocked</p>
        <p className="mt-1 text-sm font-bold text-[#f6f1e3]">
          Now you qualify for Hyrox Training. A 16-week program you can start any Monday.
        </p>
        <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-[#e4032e]">
          Click here to proceed — you made it!
        </p>
      </div>
    </button>
  );
}
