'use client';

import { useEffect, useState } from 'react';
import BadgeDisplay from '@/components/BadgeDisplay';
import YouPageShell from '@/components/YouPageShell';

export default function MedalsPage() {
  const [badges, setBadges] = useState<any>(null);

  useEffect(() => {
    fetch('/api/badges')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setBadges(data))
      .catch(() => setBadges(null));
  }, []);

  return (
    <YouPageShell title="Medals">
      {badges ? (
        <BadgeDisplay
          standalone
          allBadges={badges.allBadges}
          earnedBadges={badges.earnedBadges}
          bonusCount={Number(badges.bonusCount || 0)}
          optionalWeekCount={Number(badges.optionalWeekCount || 0)}
          optionalCount={Number(badges.optionalCount || 0)}
        />
      ) : (
        <p className="text-lg font-black text-[#e8c547]">Loading...</p>
      )}
    </YouPageShell>
  );
}
