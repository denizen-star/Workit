'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell } from 'lucide-react';
import { DEVICE_BLOCK_STORAGE_KEY } from '@/lib/deviceBlockShared';
import { isValidEmailFormat } from '@/lib/profile';

/**
 * Landing page for a blocked browser (middleware sends /join, /faq, /waiver here).
 * - Device block (/join "Under 18 / Pass"): 18+ notice + a one-time Request access form.
 * - Account block (admin): a dumbbell and nothing else.
 * A block Kevin cleared is noticed here: the API drops the cookie, we drop the
 * localStorage mirror, and the browser goes back to /join.
 */

type Status =
  | { state: 'loading' }
  | { state: 'account' }
  | { state: 'device'; requested: boolean };

export default function BlockedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ state: 'loading' });
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/device-block')
      .then((res) => res.json())
      .then((data: { blocked: boolean; kind?: 'device' | 'account'; requested?: boolean }) => {
        if (!data.blocked) {
          try {
            localStorage.removeItem(DEVICE_BLOCK_STORAGE_KEY);
          } catch {
            /* nothing to clear */
          }
          router.replace('/join?h=gowanus');
          return;
        }
        setStatus(data.kind === 'account' ? { state: 'account' } : { state: 'device', requested: Boolean(data.requested) });
      })
      // Offline or API down: stay blocked, show the device notice without a form.
      .catch(() => setStatus({ state: 'device', requested: true }));
  }, [router]);

  const sendRequest = async () => {
    if (!isValidEmailFormat(email)) {
      setError('Enter a valid email');
      return;
    }
    if (!note.trim()) {
      setError('Add a short note');
      return;
    }
    setBusy(true);
    setError('');
    const res = await fetch('/api/device-block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', email, note }),
    });
    setBusy(false);
    // 409 = already requested from this browser: show the same "sent" state.
    if (res.ok || res.status === 409) {
      setStatus({ state: 'device', requested: true });
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error || 'Could not send');
  };

  if (status.state === 'loading') {
    return <main className="min-h-[100dvh]" />;
  }

  if (status.state === 'account') {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center">
        <Dumbbell aria-label="Blocked" className="h-24 w-24 text-[#e8c547]" strokeWidth={1.5} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 py-10">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Work-It</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight text-[#e8c547]">Work-It is for adults 18+.</h1>

      {status.requested ? (
        <p className="mt-6 text-xl leading-relaxed text-[#f6f1e3]/90">Request sent. We&apos;ll review it.</p>
      ) : (
        <>
          <h2 className="mt-10 text-2xl font-black text-[#e8c547]">Request access</h2>
          <p className="mt-2 text-[#f6f1e3]/80">Tapped by mistake? Tell us. One request per device.</p>
          <label className="mt-6 block">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/50">Email</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/50">Note</span>
            <textarea
              rows={3}
              maxLength={1000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            />
          </label>
          {error ? <p className="mt-3 text-sm text-[#a35d52]">{error}</p> : null}
          <button
            type="button"
            disabled={busy}
            onClick={sendRequest}
            className="mt-6 min-h-12 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404] disabled:opacity-40"
          >
            Send request
          </button>
        </>
      )}
    </main>
  );
}
