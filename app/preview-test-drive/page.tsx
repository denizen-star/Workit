'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import QuickstartTakeover from '@/components/QuickstartTakeover';
import StarRating from '@/components/StarRating';
import TestDriveDoneHero from '@/components/TestDriveDoneHero';
import WeekMissTakeover from '@/components/WeekMissTakeover';
import { pickWeek1StartCopy } from '@/lib/coachLines';
import { COACH_TONE_OPTIONS, type CoachTone } from '@/lib/coachTone';
import { testDriveCountdown } from '@/lib/testDrive';
import { useSavingCaption } from '@/lib/useSavingCaption';

type View = 'done' | 'quickstart' | 'week1' | 'saving';

const VIEWS: { id: View; label: string }[] = [
  { id: 'done', label: 'Done hero' },
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'week1', label: 'Week 1 takeover' },
  { id: 'saving', label: 'Saving captions' },
];

/** Local look at the Test Drive screens + Finish saving captions, sample data only.
 * Not linked from the app; no API calls. Same idea as /preview-finish. */
export default function PreviewTestDrivePage() {
  const [view, setView] = useState<View>('done');
  const [days, setDays] = useState(3);
  const [tone, setTone] = useState<CoachTone>('eli');
  // Bumped to remount the done hero so the confetti replays.
  const [burst, setBurst] = useState(0);
  const save = useSavingCaption();
  const week1 = pickWeek1StartCopy(tone, 'Sam');

  const fakeSave = () => {
    if (!save.begin()) return;
    // Long enough to walk all three captions, then "jump to the recap".
    window.setTimeout(save.end, 4200);
  };

  return (
    <div className="min-h-screen bg-[#07070a] px-4 py-6">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
        Preview · sample numbers · not real data
      </p>

      <div className="relative z-[90] mx-auto mt-4 flex max-w-md flex-wrap justify-center gap-2">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setView(item.id);
              if (item.id === 'done') setBurst((n) => n + 1);
            }}
            className={`min-h-10 rounded-xl px-3 text-sm font-black ${
              view === item.id ? 'bg-[#e8c547] text-[#1a1404]' : 'border border-white/15 text-[#f6f1e3]/80'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="relative z-[90] mx-auto mt-3 flex max-w-md items-center justify-center gap-3 text-sm text-[#f6f1e3]/70">
        <label className="flex items-center gap-2">
          Days to Monday
          <input
            type="range"
            min={1}
            max={6}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          />
          {days}
        </label>
        <select
          value={tone}
          onChange={(event) => setTone(event.target.value as CoachTone)}
          className="rounded-lg bg-black/40 px-2 py-1"
        >
          {COACH_TONE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-center text-sm font-black text-[#e8c547]">
        Home hero line: {testDriveCountdown({ daysUntilMonday: days })}
      </p>

      {view === 'done' ? (
        <div className="gold-hero mx-auto mt-6 max-w-xl p-6 sm:p-8">
          <TestDriveDoneHero
            key={burst}
            daysUntilMonday={days}
            summary={{ workouts: 2, lbs: 14250, seconds: 5400 }}
          />
        </div>
      ) : null}

      {view === 'quickstart' ? (
        <QuickstartTakeover countdown={testDriveCountdown({ daysUntilMonday: days })} onDone={() => setView('done')} />
      ) : null}

      {view === 'week1' ? (
        <WeekMissTakeover
          open
          line={`${week1.title}\n${week1.body}`}
          tone={tone}
          eyebrow="Test Drive · over"
          expression="celebratory"
          accent="#e8c547"
          onClose={() => setView('done')}
        />
      ) : null}

      {view === 'saving' ? (
        <Modal
          open
          title="Mark this workout complete?"
          cancelLabel="Not yet"
          confirmLabel="Complete it"
          variant="success"
          busy={save.saving}
          busyLabel={save.caption}
          onCancel={() => setView('done')}
          onConfirm={fakeSave}
        >
          <p>Tap Complete it to watch the captions (fake 4s save).</p>
          <div className="mt-5">
            <StarRating value={4} onChange={() => undefined} label="Sample rating" />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
