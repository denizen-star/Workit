'use client';

import Link from 'next/link';
import { QUICKSTART_LEAD, QUICKSTART_STEPS, QUICKSTART_TITLE } from '@/lib/quickstartCopy';

/** First-login takeover for brand-new athletes. Shown once (gated on users.quickstart_seen_at), after the waiver gate if one was needed. Same copy as the standalone /quickstart page. */
export default function QuickstartTakeover({ onDone }: { onDone: () => void }) {
  return (
    <div className="fixed inset-0 z-[85] overflow-y-auto bg-[#07070a] px-5 py-10">
      <div className="mx-auto max-w-md">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Work-It</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white">{QUICKSTART_TITLE}</h2>
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

        <button
          type="button"
          onClick={onDone}
          className="mt-8 min-h-12 w-full rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
        >
          Let&apos;s go
        </button>
        <Link
          href="/help"
          onClick={onDone}
          className="mt-3 block text-center text-sm font-bold text-[#e8c547]"
        >
          Want the full picture? Read the full guide
        </Link>
      </div>
    </div>
  );
}
