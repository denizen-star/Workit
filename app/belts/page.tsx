'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import YouPageShell from '@/components/YouPageShell';
import BeltDiploma from '@/components/BeltDiploma';
import BeltChip from '@/components/BeltChip';
import { BELTS, beltState, type BeltState } from '@/lib/belts';

const STATES: BeltState[] = ['before', 'during', 'after'];

type HouseholdRow = {
  id: number;
  name: string;
  lockedWeeks: number;
  copy: { title: string; line: string };
  display: { name: string; fill: string } | null;
};

export default function BeltsPage() {
  const [lockedWeeks, setLockedWeeks] = useState(0);
  const [copy, setCopy] = useState({ title: 'Dipping your toes', line: '0 of 2 toward Dipping your toes.' });
  const [household, setHousehold] = useState<HouseholdRow[]>([]);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([fetch('/api/belts'), fetch('/api/me')])
      .then(async ([beltsRes, meRes]) => {
        const belts = beltsRes.ok ? await beltsRes.json() : null;
        const me = meRes.ok ? await meRes.json() : null;
        if (belts) {
          setLockedWeeks(Number(belts.lockedWeeks || 0));
          if (belts.copy) setCopy(belts.copy);
          setHousehold(Array.isArray(belts.household) ? belts.household : []);
        }
        if (me?.user?.id != null) setUserId(Number(me.user.id));
      })
      .catch(() => {});
  }, []);

  return (
    <YouPageShell title="Belts">
      <div className="space-y-4">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f6f1e3]/55">
          What you are aiming for
        </p>
        <h2 className="text-3xl font-black tracking-tight text-white">{copy.title}</h2>
        <p className="text-[#f6f1e3]/80">{copy.line}</p>
        <p className="text-sm text-[#f6f1e3]/60">
          {lockedWeeks} locked {lockedWeeks === 1 ? 'week' : 'weeks'} so far. Four finishes lock a week.
        </p>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-black text-white">The house</h3>
        <div className="mt-3 grid gap-2">
          {household.map((row) => (
            <div
              key={row.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                userId != null && row.id === userId ? 'border-white/25 bg-white/5' : 'border-white/10'
              }`}
            >
              <div>
                <p className="font-black text-white">{row.name}</p>
                <p className="text-xs text-[#f6f1e3]/55">{row.copy.line}</p>
              </div>
              <BeltChip lockedWeeks={row.lockedWeeks} name={row.display?.name} fill={row.display?.fill} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#f6f1e3]/55">
          How each diploma looks
        </p>
        <p className="text-[#f6f1e3]/75">
          Before you start it. During, while sections fill in. After you earn it. Yours is marked on each belt.
        </p>
        <nav className="flex flex-wrap gap-2">
          {BELTS.map((belt) => (
            <a
              key={belt.slug}
              href={`#${belt.slug}`}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-black"
              style={{ color: belt.paper === 'light' ? '#1a1a1a' : '#f6f1e3', background: belt.fill }}
            >
              {belt.name}
            </a>
          ))}
        </nav>
      </div>

      <div className="mt-10 space-y-14">
        {BELTS.map((belt) => {
          const yours = beltState(lockedWeeks, belt);
          return (
            <section key={belt.slug} id={belt.slug} className="scroll-mt-24">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f6f1e3]/50">
                    {belt.weeks} locked weeks
                  </p>
                  <h3 className="text-2xl font-black text-white">{belt.name}</h3>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f6f1e3]/55">
                  You: {yours === 'after' ? 'Earned' : yours === 'during' ? 'Aiming' : 'Not yet'}
                </p>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                {STATES.map((state) => (
                  <div
                    key={state}
                    className={state === yours ? 'rounded-[1.7rem] ring-2 ring-[#f6f1e3]/40' : undefined}
                  >
                    <BeltDiploma
                      belt={belt}
                      state={state}
                      lockedWeeks={state === 'during' && yours === 'during' ? lockedWeeks : undefined}
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-12 text-sm text-[#f6f1e3]/50">
        Medals stay on{' '}
        <Link href="/medals" className="font-bold text-[#f6f1e3]/80 underline">
          Medals
        </Link>
        .
      </p>
    </YouPageShell>
  );
}
