'use client';

import { useEffect, useState } from 'react';
import BadgeDisplay from '@/components/BadgeDisplay';
import WeekMedalHistory from '@/components/WeekMedalHistory';
import YouPageShell from '@/components/YouPageShell';
import type { WeekPodiumYou } from '@/lib/weekPodium';

export default function MedalsPage() {
  const [badges, setBadges] = useState<any>(null);
  const [weekMedals, setWeekMedals] = useState<WeekPodiumYou[]>([]);

  useEffect(() => {
    fetch('/api/badges')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setBadges(data))
      .catch(() => setBadges(null));
    fetch('/api/week-podium')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWeekMedals(Array.isArray(data?.history) ? data.history : []))
      .catch(() => setWeekMedals([]));
  }, []);

  return (
    <YouPageShell title="Medals">
      <WeekMedalHistory medals={weekMedals} />
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
