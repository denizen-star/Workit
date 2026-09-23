'use client';

import { useState } from 'react';
import AwardsTakeover from '@/components/AwardsTakeover';
import CompleteTakeover from '@/components/CompleteTakeover';
import Modal from '@/components/Modal';
import StarRating from '@/components/StarRating';
import WorkoutRecapTakeover from '@/components/WorkoutRecapTakeover';
import type { CompareRow } from '@/lib/compareTable';

const SAMPLE_ROWS: CompareRow[] = [
  { id: 'hip', label: 'Hip Thrusts', you: { value: '2.2k', pct: 8 }, last: { value: '2.0k' } },
  { id: 'rdl', label: 'RDLs', you: { value: '1.8k', pct: 3 }, last: { value: '1.75k' } },
  { id: 'farmer', label: "Farmer's", you: { value: '1.6k', pct: 0 }, last: { value: '1.6k' } },
];

/** Local click-through of the finish stack. Not linked from the app. */
export default function PreviewFinishPage() {
  const [step, setStep] = useState(1);
  const [stars, setStars] = useState<number | null>(4);
  const next = () => setStep((value) => Math.min(4, value + 1));

  return (
    <div className="min-h-screen bg-[#07070a]">
      <p className="px-4 pt-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
        Preview · sample numbers · not a real finish
      </p>

      {step === 1 ? (
        <Modal
          open
          title="Mark this workout complete?"
          cancelLabel="Not yet"
          confirmLabel="Complete it"
          variant="success"
          confirmDisabled={stars == null}
          onCancel={() => undefined}
          onConfirm={next}
        >
          <p>Nice work. We will save the end time and add this session to your dashboard stats.</p>
          <div className="mt-5">
            <StarRating
              value={stars}
              onChange={setStars}
              label="How did that sit with you, man? One is weak. Five is you want it again."
            />
          </div>
        </Modal>
      ) : null}

      <WorkoutRecapTakeover
        open={step === 2}
        title="Lower B"
        rows={SAMPLE_ROWS}
        tone="master"
        optionalLbs={500}
        warmup
        cooldown={false}
        onClose={next}
      />

      <CompleteTakeover
        open={step === 3}
        line="That is how you finish. The growth is in. I watched it land."
        tone="master"
        replenish="Chug a big glass of water."
        onClose={next}
      />

      <AwardsTakeover
        open={step === 4}
        tone="master"
        accent={{ fill: '#f6f1e3' }}
        belt={{
          weeks: 2,
          name: 'David: The Buy-In',
          slug: 'the-buy-in',
          fill: '#f6f1e3',
          quote: 'A masterpiece takes time.',
          saidBy: 'David',
          coachLine: 'Two locked weeks. You showed up. That is stamina starting.',
          paper: 'light',
          characterImage: 'david.png',
        }}
        badges={[
          { id: 1, name: 'Perfect Week', description: 'Four days. Week locked.', icon: null },
          { id: 2, name: 'First Steps', description: 'You logged the first session.', icon: null },
          { id: 3, name: 'Week Warrior', description: 'You kept showing up.', icon: null },
        ]}
        onClose={() => setStep(1)}
      />
    </div>
  );
}
