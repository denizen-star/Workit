'use client';

import { useEffect, useState } from 'react';
import AthletePerformance from '@/components/AthletePerformance';
import YouPageShell from '@/components/YouPageShell';
import { isTestUserName } from '@/lib/householdUsers';

export default function PerformancePage() {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUserName(data?.user?.name || ''))
      .catch(() => setUserName(''));
  }, []);

  return (
    <YouPageShell title="Your performance">
      {userName == null ? (
        <p className="text-lg font-black text-[#e8c547]">Loading...</p>
      ) : isTestUserName(userName) ? (
        <p className="text-[#f6f1e3]/75">This board stays off for Test.</p>
      ) : (
        <AthletePerformance variant="page" />
      )}
    </YouPageShell>
  );
}
