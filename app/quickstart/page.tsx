'use client';

import Link from 'next/link';
import YouPageShell from '@/components/YouPageShell';
import { QUICKSTART_LEAD, QUICKSTART_STEPS, QUICKSTART_TITLE } from '@/lib/quickstartCopy';

/** Short first-look page for brand-new athletes, linked from the Home banner. Full reference lives at /help. */
export default function QuickstartPage() {
  return (
    <YouPageShell title="Quickstart">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Work-It</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{QUICKSTART_TITLE}</h2>
      <p className="mt-3 text-[#f6f1e3]/80">{QUICKSTART_LEAD}</p>

      <ol className="mt-8 space-y-4">
        {QUICKSTART_STEPS.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8c547]/15 text-base font-black text-[#e8c547]">
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-black text-white">{step.title}</h3>
                <p className="mt-1 text-sm text-[#f6f1e3]/80">{step.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <Link
        href="/help"
        className="mt-8 block rounded-2xl border border-[#e8c547]/40 bg-[#e8c547]/10 px-4 py-3 text-center text-sm font-black text-[#e8c547]"
      >
        Want the full picture? Read the full guide
      </Link>
    </YouPageShell>
  );
}
