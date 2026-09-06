'use client';

import YouPageShell from '@/components/YouPageShell';
import { HOW_TO_BULLETS, HOW_TO_LEAD, HOW_TO_TITLE } from '@/lib/joinCopy';

export default function HowPage() {
  return (
    <YouPageShell title="How to use">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Work-It</p>
      <h2 className="mt-2 text-3xl font-black text-white">{HOW_TO_TITLE}</h2>
      <p className="mt-3 text-[#f6f1e3]/80">{HOW_TO_LEAD}</p>
      <ul className="mt-6 space-y-3 text-sm text-[#f6f1e3]/80">
        {HOW_TO_BULLETS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </YouPageShell>
  );
}
