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
import { OVERLOAD_DIPLOMA_NAMES, OVERLOAD_WEEKS } from '@/lib/overloadProgram';
import { TRACKS, type OptInTrack } from '@/lib/programTrack';
import { programLabel } from '@/lib/programUnlock';

/** What differs between the More program Homes (docs/plans/PLAN_MORE_PROGRAMS.md). */
type HomeCopy = {
  /** Weeks in a run, for "Week 2 of 6" (omitted: just "Week 2"). */
  runWeeks?: number;
  /** Diploma names per tier (omitted: the strip's own defaults). */
  diplomaNames?: Record<number, string>;
  /** The run is over or out of content: eyebrow, title, body. */
  done: { eyebrow: string; title: string; body: string; leaveButton: boolean };
  leave: { cancel: string; body: string };
};

const HOME_COPY: Record<OptInTrack, HomeCopy> = {
  hyrox: {
    done: {
      eyebrow: 'Phase 1 complete',
      title: 'More on the way',
      body: "Weeks 5-16 aren't built yet. You can keep holding here, or head back to your normal program until the next phase ships.",
      leaveButton: false,
    },
    leave: {
      cancel: 'Stay in Hyrox',
      body: "If you come back later, Hyrox starts over from Week 1 — this run won't be saved. Your normal program picks back up right where it left off.",
    },
  },
  overload: {
    runWeeks: OVERLOAD_WEEKS,
    diplomaNames: OVERLOAD_DIPLOMA_NAMES,
    done: {
      eyebrow: 'All six weeks locked',
      title: 'Series complete',
      body: 'Your last diploma lands when week 6 ends. Head back to your normal program now, or wait it out.',
      leaveButton: true,
    },
    leave: {
      cancel: 'Stay',
      body: 'If you come back later, Overload Progressions starts over from Week 1. Weeks you already locked still count toward your belts. Your normal program picks back up, moved ahead by the weeks you locked here.',
    },
  },
};

interface ProgramTrackHomeProps {
  track: OptInTrack;
  userName: string;
  userEmail: string;
  userTone: CoachTone;
  isAdmin: boolean;
  scheduleDays: number;
}

interface ProgramToday {
  /** Stored week_number (Hyrox 101+, Overload 201+). */
  weekNumber: number;
  /** The week the athlete sees (1+). */
  week: number;
  day: number;
  name: string;
  /** Hyrox benchmark day. */
  milestone?: number | null;
}

/** A running More program replaces Home: today's day, the week lock, week performance,
 * stories, and this run's diplomas. Reads `GET /api/<track>` + this track's sessions. */
export default function ProgramTrackHome({
  track,
  userName,
  userEmail,
  userTone,
  isAdmin,
  scheduleDays,
}: ProgramTrackHomeProps) {
  const copy = HOME_COPY[track];
  const label = programLabel(track);
  const router = useRouter();
  const [today, setToday] = useState<ProgramToday | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [complete, setComplete] = useState(false);
  const [run, setRun] = useState(0);
  const [diplomaTiers, setDiplomaTiers] = useState<number[]>([]);
  const [sessions, setSessions] = useState<WorkoutSessionRow[]>([]);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  useEffect(() => {
    fetch(`/api/${track}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setToday(data.today || null);
        // Hyrox: out of built content. Overload: every week of the run locked.
        setComplete(Boolean(data.phaseComplete || data.seriesComplete));
        const currentRun = Number(data.run) || 0;
        setRun(currentRun);
        // Overload diplomas carry their run; only this run's show. Hyrox's have none.
        setDiplomaTiers(
          (data.diplomas || [])
            .filter((row: { run?: number }) => row.run == null || Number(row.run) === currentRun)
            .map((row: { tier: number }) => Number(row.tier))
        );
      })
      .catch(() => {})
      .finally(() => setLoaded(true));

    fetch('/api/sessions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = (data?.sessions || []) as (WorkoutSessionRow & { program_track?: string })[];
        setSessions(rows.filter((row) => row.program_track === track));
      })
      .catch(() => {});
  }, [track]);

  // The stored week (101+ / 201+) WeekLock and WeekPerformance need.
  const currentWeekPlan = today ? TRACKS[track].weekPlan(today.weekNumber, scheduleDays) ?? null : null;

  const leaveProgram = async () => {
    setLeaveError('');
    try {
      const res = await fetch(`/api/${track}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'drop' }),
      });
      if (!res.ok) {
        setLeaveError(`Couldn't leave ${label}. Try again in a moment.`);
        return;
      }
      router.refresh();
      window.location.assign('/home');
    } catch {
      setLeaveError(`Couldn't leave ${label}. Try again in a moment.`);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="glass-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-8 w-8 text-[#e8c547]" />
              <h1 className="text-2xl font-black tracking-tight text-white">{label}</h1>
            </div>
            <AppMenu
              userName={userName}
              userEmail={userEmail}
              userTone={userTone}
              isAdmin={isAdmin}
              activeProgram={track}
              onLeaveProgram={() => setConfirmLeave(true)}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="gold-hero p-6 sm:p-8">
          {complete ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">{copy.done.eyebrow}</p>
              <h2 className="mt-1 text-3xl font-black text-white">{copy.done.title}</h2>
              <p className="mt-2 text-[#f6f1e3]/75">{copy.done.body}</p>
              {copy.done.leaveButton ? (
                <button
                  type="button"
                  onClick={leaveProgram}
                  className="mt-6 min-h-12 rounded-2xl bg-[#e8c547] px-6 text-lg font-black text-[#1a1404]"
                >
                  Back to the program
                </button>
              ) : null}
            </>
          ) : today ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">
                Week {today.week}
                {copy.runWeeks ? ` of ${copy.runWeeks}` : ''}
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
              <HomeTodayKpis track={track} />
            </>
          ) : (
            <p className="text-[#f6f1e3]/75">{loaded ? 'Nothing due right now.' : 'Loading your week…'}</p>
          )}
        </div>

        {currentWeekPlan && (
          <div className="mt-6">
            <WeekLock week={currentWeekPlan} sessions={sessions} scheduleDays={scheduleDays} />
          </div>
        )}

        {currentWeekPlan && (
          <div className="mt-6">
            <WeekPerformance week={currentWeekPlan} />
          </div>
        )}

        <div className="mt-6">
          <HomeKpiLead weekNumber={currentWeekPlan?.weekNumber} track={track} />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#f6f1e3]/70">
            Your diplomas{run > 1 ? ` · run ${run}` : ''}
          </h3>
          <div className="mt-4">
            <HyroxDiplomas earnedTiers={diplomaTiers} tierNames={copy.diplomaNames} />
          </div>
        </div>
      </div>

      <Modal
        open={confirmLeave}
        title={`Leave ${label}?`}
        variant="danger"
        confirmLabel={`Leave ${label}`}
        cancelLabel={copy.leave.cancel}
        onConfirm={leaveProgram}
        onCancel={() => {
          setConfirmLeave(false);
          setLeaveError('');
        }}
      >
        {copy.leave.body}
        {leaveError && (
          <p className="mt-4 rounded-xl border border-[#e4032e]/40 bg-[#e4032e]/10 px-4 py-3 text-sm font-bold text-[#ff5c6c]">
            {leaveError}
          </p>
        )}
      </Modal>
    </div>
  );
}
