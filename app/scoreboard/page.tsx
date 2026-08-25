'use client';

import { useEffect, useState } from 'react';
import ExerciseCompare from '@/components/ExerciseCompare';
import HouseholdScoreboard from '@/components/HouseholdScoreboard';
import YouPageShell from '@/components/YouPageShell';
import { isTestUserName } from '@/lib/householdUsers';

export default function ScoreboardPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUserId(data?.user?.id != null ? Number(data.user.id) : null);
        setUserName(data?.user?.name || '');
      })
      .catch(() => undefined);
  }, []);

  return (
    <YouPageShell title="The house">
      <HouseholdScoreboard standalone highlightUserId={userId} />
      {!isTestUserName(userName) && <ExerciseCompare standalone />}
    </YouPageShell>
  );
}
