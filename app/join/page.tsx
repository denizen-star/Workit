'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PhotoCropField from '@/components/PhotoCropField';
import PinPad from '@/components/PinPad';
import WaiverSheet from '@/components/WaiverSheet';
import { JOIN_INTRO_BULLETS, JOIN_INTRO_LEAD, JOIN_INTRO_TITLE } from '@/lib/joinCopy';
import { emailFieldHint, formatUsPhone, isValidEmailFormat } from '@/lib/profile';
import { WAIVER_CHECKBOX_LABEL } from '@/lib/waiver';

const DRAFT_KEY = 'workit_join_draft';

type Step = 'intro' | 'form' | 'pin' | 'confirm' | 'wait';

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('intro');
  const [h, setH] = useState('gowanus');
  const [claim, setClaim] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bodyWeightLb, setBodyWeightLb] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [waiverOpen, setWaiverOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const house = params.get('h') || '';
    const token = params.get('claim') || '';
    setH(house || 'gowanus');
    setClaim(token);
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved) as { step?: Step; firstName?: string };
        if (draft.step && draft.step !== 'wait') setStep(draft.step);
        if (draft.firstName) setFirstName(draft.firstName);
      } catch {
        /* ignore */
      }
    }
    fetch('/api/join?' + new URLSearchParams({ h: house, claim: token }).toString()).then(async (res) => {
      const data = await res.json();
      if (!res.ok && data.redirect) {
        router.replace('/login');
        return;
      }
      if (data.user?.email) setEmail(data.user.email);
      if (data.user?.name && !firstName) {
        const parts = String(data.user.name).split(/\s+/);
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' '));
      }
    });
  }, [router]);

  useEffect(() => {
    if (step === 'wait') {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, firstName, lastName, displayName, email }));
  }, [step, firstName, lastName, displayName, email]);

  const submit = async () => {
    setBusy(true);
    setError('');
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        h,
        claim,
        firstName,
        lastName,
        displayName,
        email,
        phone,
        bodyWeightLb,
        photo,
        acceptedWaiver: accepted,
        pin,
        confirmPin,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.exists) {
      router.replace('/login');
      return;
    }
    if (!res.ok) {
      setError(data.error || 'Could not join');
      return;
    }
    localStorage.removeItem(DRAFT_KEY);
    if (data.session) {
      router.replace('/home');
      return;
    }
    setStep('wait');
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 py-8">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Work-It</p>
      {step === 'intro' ? (
        <>
          <h1 className="mt-2 text-3xl font-black text-white">{JOIN_INTRO_TITLE}</h1>
          <p className="mt-3 text-[#f6f1e3]/80">{JOIN_INTRO_LEAD}</p>
          <ul className="mt-6 space-y-2 text-sm text-[#f6f1e3]/75">
            {JOIN_INTRO_BULLETS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setStep('form')}
            className="mt-8 min-h-12 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
          >
            Next
          </button>
          <a href="/login" className="mt-4 text-center text-sm font-bold text-[#f6f1e3]/60">
            I already train
          </a>
        </>
      ) : null}

      {step === 'form' ? (
        <>
          <h1 className="mt-2 text-3xl font-black text-white">You</h1>
          <div className="mt-6 space-y-4">
            <Field label="First name" value={firstName} onChange={setFirstName} />
            <Field label="Last name" value={lastName} onChange={setLastName} />
            <Field label="Alias" value={displayName} onChange={setDisplayName} hint="optional" />
            <PhotoCropField optional onChange={setPhoto} />
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              hint={emailFieldHint(email) || undefined}
              hintTone={emailFieldHint(email) ? 'error' : undefined}
            />
            <Field
              label="Phone"
              value={phone}
              onChange={(value) => setPhone(formatUsPhone(value))}
              type="tel"
              hint="optional"
            />
            <Field label="Weight (lb)" value={bodyWeightLb} onChange={setBodyWeightLb} hint="optional" />
            <label className="flex items-start gap-3 text-sm text-[#f6f1e3]/80">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1"
              />
              <span>
                {WAIVER_CHECKBOX_LABEL}{' '}
                <button type="button" className="font-bold text-[#e8c547]" onClick={() => setWaiverOpen(true)}>
                  Read the waiver
                </button>
              </span>
            </label>
          </div>
          {error ? <p className="mt-3 text-sm text-[#a35d52]">{error}</p> : null}
          <button
            type="button"
            disabled={!accepted}
            onClick={() => {
              if (!email.trim()) {
                setError('Email is required');
                return;
              }
              if (!isValidEmailFormat(email)) {
                setError('Enter a valid email');
                return;
              }
              setError('');
              setStep('pin');
            }}
            className="mt-8 min-h-12 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404] disabled:opacity-40"
          >
            Next
          </button>
        </>
      ) : null}

      {step === 'pin' || step === 'confirm' ? (
        <>
          <h1 className="mt-2 text-3xl font-black text-white">
            {step === 'pin' ? 'Create PIN' : 'Confirm PIN'}
          </h1>
          <div className="mt-6">
            <PinPad
              value={step === 'pin' ? pin : confirmPin}
              onChange={(value) => {
                if (step === 'pin') {
                  setPin(value);
                  if (value.length === 4) setStep('confirm');
                } else {
                  setConfirmPin(value);
                  if (value.length === 4 && value === pin) submit();
                }
              }}
            />
          </div>
          {error ? <p className="mt-3 text-sm text-[#a35d52]">{error}</p> : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => (step === 'pin' ? setStep('confirm') : submit())}
            className="mt-8 min-h-12 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
          >
            {step === 'pin' ? 'Next' : 'Finish'}
          </button>
        </>
      ) : null}

      {step === 'wait' ? (
        <>
          <h1 className="mt-2 text-3xl font-black text-white">Check your mail</h1>
          <p className="mt-3 text-[#f6f1e3]/80">
            Open the verify link. Home waits until that email is verified.
          </p>
          <a href="/login" className="mt-8 text-center text-sm font-bold text-[#e8c547]">
            Log in after you verify
          </a>
        </>
      ) : null}

      <WaiverSheet open={waiverOpen} onClose={() => setWaiverOpen(false)} />
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  hintTone,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  hintTone?: 'error';
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/50">
        {label}
        {hint && hintTone !== 'error' ? ` · ${hint}` : ''}
      </span>
      <input
        type={type}
        required={type === 'email'}
        autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined}
        inputMode={type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
      />
      {hint && hintTone === 'error' ? (
        <span className="mt-1 block text-sm font-semibold text-[#a35d52]">{hint}</span>
      ) : null}
    </label>
  );
}
