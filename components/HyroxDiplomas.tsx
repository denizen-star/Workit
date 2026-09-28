'use client';

const TIER_NAMES: Record<number, string> = {
  1: 'Aerobic & Tissue Base',
  2: 'Compromised Running',
  3: 'Half-Hyrox Simulation',
  4: 'Peak Volume Ready',
};

interface HyroxDiplomasProps {
  earnedTiers: number[];
  /** Tier → name. Defaults to Hyrox's four milestones; Overload Progressions passes its three. */
  tierNames?: Record<number, string>;
}

/** Separate diploma track from the normal belt chest — one badge per passed milestone
 * (or per Overload Progressions tier, via `tierNames`). */
export default function HyroxDiplomas({ earnedTiers, tierNames = TIER_NAMES }: HyroxDiplomasProps) {
  const earned = new Set(earnedTiers);
  const tiers = Object.keys(tierNames).map(Number);

  return (
    <div className={`grid gap-3 ${tiers.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {tiers.map((tier) => {
        const won = earned.has(tier);
        return (
          <div
            key={tier}
            className={`rounded-2xl border p-4 text-center ${
              won ? 'border-[#e8c547]/50 bg-[#e8c547]/10' : 'border-white/10 bg-black/20 opacity-50'
            }`}
          >
            <p className={`text-2xl font-black ${won ? 'text-[#e8c547]' : 'text-[#f6f1e3]/40'}`}>{tier}</p>
            <p className="mt-1 text-xs font-bold text-[#f6f1e3]/80">{tierNames[tier]}</p>
          </div>
        );
      })}
    </div>
  );
}
