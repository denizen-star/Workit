'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { FAQ_ENTRIES, FAQ_LEAD, FAQ_TITLE } from '@/lib/faqCopy';

/**
 * Public "why we're better" page. Unlike /help, this has no session-gated
 * shell — it's linked from /join and /login for people who haven't signed
 * up yet, as well as from /help and the athlete menu for people who have.
 */
export default function FaqPage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => setLoggedIn(res.ok))
      .catch(() => setLoggedIn(false));
  }, []);

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 py-8">
      <a
        href={loggedIn ? '/home' : '/login'}
        className="flex min-h-11 w-fit items-center gap-2 text-[#f6f1e3]/75 hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm">{loggedIn ? 'Dashboard' : 'Back'}</span>
      </a>
      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Work-It</p>
      <h1 className="mt-2 text-3xl font-black text-white">{FAQ_TITLE}</h1>
      <p className="mt-3 text-sm text-[#f6f1e3]/70">{FAQ_LEAD}</p>

      <div className="mt-8 glass-card divide-y divide-white/10">
        {FAQ_ENTRIES.map((entry) => (
          <div key={entry.question} className="px-5 py-4">
            <p className="font-black text-white">{entry.question}</p>
            <p className="mt-1 text-sm text-[#f6f1e3]/70">{entry.answer}</p>
          </div>
        ))}
      </div>

      {loggedIn ? null : (
        <>
          <a href="/join?h=gowanus" className="mt-8 text-center text-sm font-bold text-[#e8c547]">
            Join the movement
          </a>
          <a href="/login" className="mt-4 text-center text-sm font-bold text-[#f6f1e3]/60">
            I already train
          </a>
        </>
      )}
    </main>
  );
}
