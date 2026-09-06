'use client';

import { useEffect, useState } from 'react';
import HouseholdScoreboard from '@/components/HouseholdScoreboard';
import WeekMedalCountTable from '@/components/WeekMedalCountTable';
import YouPageShell from '@/components/YouPageShell';
import YouVsLeader from '@/components/YouVsLeader';
import { isTestUserName } from '@/lib/householdUsers';
import type { WeekMedalCountRow } from '@/lib/weekPodium';

export default function ScoreboardPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [medalCounts, setMedalCounts] = useState<WeekMedalCountRow[]>([]);

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
      {!isTestUserName(userName) && (
        <div className="mb-6">
          <YouVsLeader userId={userId} />
        </div>
      )}
      <HouseholdScoreboard standalone highlightUserId={userId} />
    </YouPageShell>
  );
}
