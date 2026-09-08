'use client';

import YouPageShell from '@/components/YouPageShell';
import { HOW_TO_LEAD, HOW_TO_STEPS, HOW_TO_TITLE } from '@/lib/joinCopy';

export default function HowPage() {
  return (
    <YouPageShell title="How to use">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Work-It</p>
      <h2 className="mt-2 text-3xl font-black text-white">{HOW_TO_TITLE}</h2>
      <p className="mt-3 text-[#f6f1e3]/80">{HOW_TO_LEAD}</p>

      <ol className="mt-8 space-y-6">
        {HOW_TO_STEPS.map((step, index) => (
          <li
            key={step.title}
            className="rounded-2xl border border-white/10 bg-black/25 p-5"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8c547]/15 text-base font-black text-[#e8c547]">
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-black text-white">{step.title}</h3>
                <p className="mt-1 text-sm text-[#f6f1e3]/80">{step.description}</p>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step.image}
              alt={step.title}
              className="mt-4 w-full rounded-xl border border-white/10 object-cover"
              onError={(event) => {
                (event.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </li>
        ))}
      </ol>
    </YouPageShell>
  );
}
