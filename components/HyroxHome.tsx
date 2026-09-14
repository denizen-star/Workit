'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell } from 'lucide-react';
import AppMenu from '@/components/AppMenu';
import Modal from '@/components/Modal';
import HyroxDiplomas from '@/components/HyroxDiplomas';
import WeekLock from '@/components/WeekLock';
import WeekPerformance from '@/components/WeekPerformance';
import HomeKpiLead, { HomeTodayKpis } from '@/components/HomeKpiLead';
import type { CoachTone } from '@/lib/coachTone';
import type { WorkoutSessionRow } from '@/lib/nextWorkout';
import { hyroxProgram } from '@/lib/hyroxProgram';

interface HyroxHomeProps {
  userName: string;
  userEmail: string;
  userTone: CoachTone;
  isAdmin: boolean;
}

interface HyroxToday {
  week: number;
  day: number;
  name: string;
  milestone: number | null;
}

/** Hyrox Training fully replaces Home while active — its own focused view, not the
 * normal program's KPI/fold stack (week-lock, You vs, etc. don't apply here). */
export default function HyroxHome({ userName, userEmail, userTone, isAdmin }: HyroxHomeProps) {
  const router = useRouter();
  const [today, setToday] = useState<HyroxToday | null>(null);
  const [phaseComplete, setPhaseComplete] = useState(false);
  const [diplomaTiers, setDiplomaTiers] = useState<number[]>([]);
  const [hyroxSessions, setHyroxSessions] = useState<WorkoutSessionRow[]>([]);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  useEffect(() => {
    fetch('/api/hyrox')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setToday(data.today || null);
        setPhaseComplete(Boolean(data.phaseComplete));
        setDiplomaTiers((data.diplomas || []).map((row: { tier: number }) => Number(row.tier)));
      })
      .catch(() => {});

    // Week numbers are namespaced at 101+ (see lib/hyroxProgram.ts), so filtering
    // to program_track='hyrox' here is belt-and-suspenders — week_number alone
    // already can't collide with the normal program's 1-48.
    fetch('/api/sessions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = (data?.sessions || []) as (WorkoutSessionRow & { program_track?: string })[];
        setHyroxSessions(rows.filter((row) => row.program_track === 'hyrox'));
      })
      .catch(() => {});
  }, []);

  // The raw namespaced week (101+) WeekLock/WeekPerformance need — `today.week` off
  // /api/hyrox is already converted to the 1-based display week.
  const currentWeekPlan = today ? hyroxProgram.find((w) => w.weekNumber === today.week + 100) ?? null : null;

  const leaveHyrox = async () => {
    setLeaveError('');
    try {
      const res = await fetch('/api/hyrox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'drop' }),
      });
      if (!res.ok) {
        setLeaveError("Couldn't leave Hyrox Training — try again in a moment.");
        return;
      }
      router.refresh();
      window.location.assign('/home');
    } catch {
      setLeaveError("Couldn't leave Hyrox Training — try again in a moment.");
    }
  };

  return (
    <div className="min-h-screen">
      <header className="glass-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-8 w-8 text-[#e8c547]" />
              <h1 className="text-2xl font-black tracking-tight text-white">Hyrox Training</h1>
            </div>
            <AppMenu
              userName={userName}
              userEmail={userEmail}
              userTone={userTone}
              isAdmin={isAdmin}
              hyroxActive
              onLeaveHyrox={() => setConfirmLeave(true)}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="gold-hero p-6 sm:p-8">
          {phaseComplete ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">Phase 1 complete</p>
              <h2 className="mt-1 text-3xl font-black text-white">More on the way</h2>
              <p className="mt-2 text-[#f6f1e3]/75">
                Weeks 5-16 aren&apos;t built yet. You can keep holding here, or head back to your normal
                program until the next phase ships.
              </p>
            </>
          ) : today ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">
                Week {today.week}
              </p>
              <h2 className="mt-1 text-3xl font-black text-white">{today.name}</h2>
              {today.milestone ? (
                <p className="mt-2 text-sm font-bold text-[#e8c547]">Milestone {today.milestone} benchmark day</p>
              ) : null}
              <button
                type="button"
                onClick={() => router.push('/workout')}
                className="mt-6 min-h-12 rounded-2xl bg-[#e8c547] px-6 text-lg font-black text-[#1a1404]"
              >
                Go to workout
              </button>
              <HomeTodayKpis track="hyrox" />
            </>
          ) : (
            <p className="text-[#f6f1e3]/75">Loading your Hyrox week…</p>
          )}
        </div>

        {currentWeekPlan && (
          <div className="mt-6">
            <WeekLock week={currentWeekPlan} sessions={hyroxSessions} />
          </div>
        )}

        {currentWeekPlan && (
          <div className="mt-6">
            <WeekPerformance week={currentWeekPlan} />
          </div>
        )}

        <div className="mt-6">
          <HomeKpiLead weekNumber={currentWeekPlan?.weekNumber} track="hyrox" />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#f6f1e3]/70">Your diplomas</h3>
          <div className="mt-4">
            <HyroxDiplomas earnedTiers={diplomaTiers} />
          </div>
        </div>
      </div>

      <Modal
        open={confirmLeave}
        title="Leave Hyrox Training?"
        variant="danger"
        confirmLabel="Leave Hyrox Training"
        cancelLabel="Stay in Hyrox"
        onConfirm={leaveHyrox}
        onCancel={() => {
          setConfirmLeave(false);
          setLeaveError('');
        }}
      >
        If you come back later, Hyrox starts over from Week 1 — this run won&apos;t be saved. Your normal
        program picks back up right where it left off.
        {leaveError && (
          <p className="mt-4 rounded-xl border border-[#e4032e]/40 bg-[#e4032e]/10 px-4 py-3 text-sm font-bold text-[#ff5c6c]">
            {leaveError}
          </p>
        )}
      </Modal>
    </div>
  );
}
