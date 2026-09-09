'use client';

import { useEffect, useState } from 'react';
import HouseholdScoreboard from '@/components/HouseholdScoreboard';
import ScoreboardPeriodPills from '@/components/ScoreboardPeriodPills';
import WeekMedalCountTable from '@/components/WeekMedalCountTable';
import YouPageShell from '@/components/YouPageShell';
import YouVsLeader from '@/components/YouVsLeader';
import { isTestUserName } from '@/lib/householdUsers';
import type { ScoreboardPeriod } from '@/lib/scoreboardTypes';
import type { WeekMedalCountRow } from '@/lib/weekPodium';

export default function ScoreboardPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [medalCounts, setMedalCounts] = useState<WeekMedalCountRow[]>([]);
  const [period, setPeriod] = useState<ScoreboardPeriod>('7');

  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUserId(data?.user?.id != null ? Number(data.user.id) : null);
        setUserName(data?.user?.name || '');
        setIsAdmin(!!data?.user?.isAdmin);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setMedalCounts([]);
      return;
    }
    let cancelled = false;
    fetch('/api/week-podium')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setMedalCounts(Array.isArray(data?.counts) ? data.counts : []);
      })
      .catch(() => {
        if (!cancelled) setMedalCounts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  return (
    <YouPageShell title="The house">
      {isAdmin && <WeekMedalCountTable rows={medalCounts} />}
      <ScoreboardPeriodPills period={period} onChange={setPeriod} />
      {!isTestUserName(userName) && (
        <div className="mb-6">
          <YouVsLeader
            userId={userId}
            period={period}
            onPeriodChange={setPeriod}
            showPeriodPills={false}
          />
        </div>
      )}
      <HouseholdScoreboard
        standalone
        highlightUserId={userId}
        period={period}
        onPeriodChange={setPeriod}
        showPeriodPills={false}
      />
    </YouPageShell>
  );
}
