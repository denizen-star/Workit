'use client';

const TIER_NAMES: Record<number, string> = {
  1: 'Aerobic & Tissue Base',
  2: 'Compromised Running',
  3: 'Half-Hyrox Simulation',
  4: 'Peak Volume Ready',
};

interface HyroxDiplomasProps {
  earnedTiers: number[];
}

/** Separate diploma track from the normal belt chest — one badge per passed milestone. */
export default function HyroxDiplomas({ earnedTiers }: HyroxDiplomasProps) {
  const earned = new Set(earnedTiers);

  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((tier) => {
        const won = earned.has(tier);
        return (
          <div
            key={tier}
            className={`rounded-2xl border p-4 text-center ${
              won ? 'border-[#e8c547]/50 bg-[#e8c547]/10' : 'border-white/10 bg-black/20 opacity-50'
            }`}
          >
            <p className={`text-2xl font-black ${won ? 'text-[#e8c547]' : 'text-[#f6f1e3]/40'}`}>{tier}</p>
            <p className="mt-1 text-xs font-bold text-[#f6f1e3]/80">{TIER_NAMES[tier]}</p>
          </div>
        );
      })}
    </div>
  );
}
