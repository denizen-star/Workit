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
import { OVERLOAD_DIPLOMA_NAMES, overloadWeekPlan } from '@/lib/overloadProgram';

interface OverloadHomeProps {
  userName: string;
  userEmail: string;
  userTone: CoachTone;
  isAdmin: boolean;
  scheduleDays: number;
}

interface OverloadToday {
  weekNumber: number;
  week: number;
  day: number;
  name: string;
}

/** Overload Progressions replaces Home while its run is live — same shape as
 * HyroxHome: today's day, the week lock, week performance, stories, diplomas. */
export default function OverloadHome({ userName, userEmail, userTone, isAdmin, scheduleDays }: OverloadHomeProps) {
  const router = useRouter();
  const [today, setToday] = useState<OverloadToday | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [seriesComplete, setSeriesComplete] = useState(false);
  const [run, setRun] = useState(0);
  const [diplomaTiers, setDiplomaTiers] = useState<number[]>([]);
  const [overloadSessions, setOverloadSessions] = useState<WorkoutSessionRow[]>([]);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  useEffect(() => {
    fetch('/api/overload')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setToday(data.today || null);
        setSeriesComplete(Boolean(data.seriesComplete));
        const currentRun = Number(data.run) || 0;
        setRun(currentRun);
        setDiplomaTiers(
          (data.diplomas || [])
            .filter((row: { run: number }) => Number(row.run) === currentRun)
            .map((row: { tier: number }) => Number(row.tier))
        );
      })
      .catch(() => {})
      .finally(() => setLoaded(true));

    fetch('/api/sessions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = (data?.sessions || []) as (WorkoutSessionRow & { program_track?: string })[];
        setOverloadSessions(rows.filter((row) => row.program_track === 'overload'));
      })
      .catch(() => {});
  }, []);

  const currentWeekPlan = today ? overloadWeekPlan(today.weekNumber, scheduleDays) : null;

  const leaveOverload = async () => {
    setLeaveError('');
    try {
      const res = await fetch('/api/overload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'drop' }),
      });
      if (!res.ok) {
        setLeaveError("Couldn't leave Overload Progressions. Try again in a moment.");
        return;
      }
      router.refresh();
      window.location.assign('/home');
    } catch {
      setLeaveError("Couldn't leave Overload Progressions. Try again in a moment.");
    }
  };

  return (
    <div className="min-h-screen">
      <header className="glass-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-8 w-8 text-[#e8c547]" />
              <h1 className="text-2xl font-black tracking-tight text-white">Overload Progressions</h1>
            </div>
            <AppMenu
              userName={userName}
              userEmail={userEmail}
              userTone={userTone}
              isAdmin={isAdmin}
              overloadActive
              onLeaveOverload={() => setConfirmLeave(true)}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="gold-hero p-6 sm:p-8">
          {seriesComplete ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">All six weeks locked</p>
              <h2 className="mt-1 text-3xl font-black text-white">Series complete</h2>
              <p className="mt-2 text-[#f6f1e3]/75">
                Your last diploma lands when week 6 ends. Head back to your normal program now, or wait it out.
              </p>
              <button
                type="button"
                onClick={leaveOverload}
                className="mt-6 min-h-12 rounded-2xl bg-[#e8c547] px-6 text-lg font-black text-[#1a1404]"
              >
                Back to the program
              </button>
            </>
          ) : today ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">Week {today.week} of 6</p>
              <h2 className="mt-1 text-3xl font-black text-white">{today.name}</h2>
              <button
                type="button"
                onClick={() => router.push('/workout')}
                className="mt-6 min-h-12 rounded-2xl bg-[#e8c547] px-6 text-lg font-black text-[#1a1404]"
              >
                Go to workout
              </button>
              <HomeTodayKpis track="overload" />
            </>
          ) : (
            <p className="text-[#f6f1e3]/75">{loaded ? 'Nothing due right now.' : 'Loading your week…'}</p>
          )}
        </div>

        {currentWeekPlan && (
          <div className="mt-6">
            <WeekLock week={currentWeekPlan} sessions={overloadSessions} scheduleDays={scheduleDays} />
          </div>
        )}

        {currentWeekPlan && (
          <div className="mt-6">
            <WeekPerformance week={currentWeekPlan} />
          </div>
        )}

        <div className="mt-6">
          <HomeKpiLead weekNumber={currentWeekPlan?.weekNumber} track="overload" />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#f6f1e3]/70">
            Your diplomas{run > 1 ? ` · run ${run}` : ''}
          </h3>
          <div className="mt-4">
            <HyroxDiplomas earnedTiers={diplomaTiers} tierNames={OVERLOAD_DIPLOMA_NAMES} />
          </div>
        </div>
      </div>

      <Modal
        open={confirmLeave}
        title="Leave Overload Progressions?"
        variant="danger"
        confirmLabel="Leave Overload Progressions"
        cancelLabel="Stay"
        onConfirm={leaveOverload}
        onCancel={() => {
          setConfirmLeave(false);
          setLeaveError('');
        }}
      >
        If you come back later, Overload Progressions starts over from Week 1. Weeks you already locked still count
        toward your belts. Your normal program picks back up, moved ahead by the weeks you locked here.
        {leaveError && (
          <p className="mt-4 rounded-xl border border-[#e4032e]/40 bg-[#e4032e]/10 px-4 py-3 text-sm font-bold text-[#ff5c6c]">
            {leaveError}
          </p>
        )}
      </Modal>
    </div>
  );
}
