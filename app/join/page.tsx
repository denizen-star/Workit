'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PhotoCropField from '@/components/PhotoCropField';
import PinPad from '@/components/PinPad';
import WaiverSheet from '@/components/WaiverSheet';
import {
  JOIN_AGREE_CONFIRM,
  JOIN_AGREE_PASS,
  JOIN_AGREE_SECTIONS,
  JOIN_AGREE_TITLE,
  JOIN_INTRO_BULLETS,
  JOIN_INTRO_LEAD,
  JOIN_INTRO_TITLE,
} from '@/lib/joinCopy';
import { DEVICE_BLOCK_STORAGE_KEY } from '@/lib/deviceBlockShared';
import { trackAction } from '@/lib/analytics';
import { joinSourceFrom, joinStepContext } from '@/lib/joinSource';
import { emailFieldHint, formatUsPhone, isValidEmailFormat } from '@/lib/profile';
import { WAIVER_CHECKBOX_LABEL } from '@/lib/waiver';
import { DEFAULT_SCHEDULE_DAYS, MAX_SCHEDULE_DAYS, MIN_SCHEDULE_DAYS, scheduleDaysHint } from '@/lib/scheduleDays';

const DRAFT_KEY = 'workit_join_draft';

type Step = 'intro' | 'agree' | 'form' | 'pin' | 'confirm' | 'wait';

// Collapses the six internal steps into 4 visual stages for the progress bar.
const STAGE_LABELS = ['Confirm', 'Details', 'PIN', 'Done'];
const STAGE_FOR_STEP: Record<Step, number> = {
  intro: 0,
  agree: 0,
  form: 1,
  pin: 2,
  confirm: 2,
  wait: 3,
};

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('intro');
  const [h, setH] = useState('gowanus');
  const [claim, setClaim] = useState('');
  // 'qr' when the printed code's ?src=qr came in; kept in the draft so a resumed sign-up keeps it.
  const [src, setSrc] = useState('');
  const [ready, setReady] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bodyWeightLb, setBodyWeightLb] = useState('');
  const [scheduleDays, setScheduleDays] = useState(DEFAULT_SCHEDULE_DAYS);
  const [photo, setPhoto] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  // In memory only (never in the draft): a resumed sign-up always passes the agree screen again.
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [waiverOpen, setWaiverOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const house = params.get('h') || '';
    const token = params.get('claim') || '';
    // Backup for the httpOnly block cookie middleware already checks.
    try {
      if (localStorage.getItem(DEVICE_BLOCK_STORAGE_KEY)) {
        router.replace('/blocked');
        return;
      }
    } catch {
      /* storage unavailable: the cookie still guards */
    }
    setH(house || 'gowanus');
    setClaim(token);
    let source = params.get('src') || '';
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved) as { step?: Step; firstName?: string; src?: string };
        if (!source && draft.src) source = draft.src;
        // Any saved step past the intro resumes on the agree screen: the 18+ / own-risk
        // confirmation is never persisted, so it has to be given again every visit.
        if (draft.step && draft.step !== 'wait' && draft.step !== 'intro') {
          setStep('agree');
        }
        if (draft.firstName) setFirstName(draft.firstName);
      } catch {
        /* ignore */
      }
    }
    setSrc(source);
    setReady(true);
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
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, firstName, lastName, displayName, email, src }));
  }, [step, firstName, lastName, displayName, email, src]);

  // One join_step per screen reached, for the nightly onboarding report's funnel.
  // Anonymous (visitor id only) until the account exists.
  useEffect(() => {
    if (!ready) return;
    trackAction('join_step', {
      category: 'join',
      cta_type: step,
      article_context: joinStepContext(h, joinSourceFrom(src, claim)),
    });
  }, [ready, step, h, src, claim]);

  // Takes confirmPinValue explicitly rather than reading the `confirmPin` state
  // directly: the auto-submit call fires from the same PinPad onChange handler
  // that just called setConfirmPin(value), and since that update hasn't
  // re-rendered yet, `confirmPin` in this closure would still be the prior,
  // one-digit-short value — sending a false mismatch to the server.
  const submit = async (confirmPinValue: string) => {
    setBusy(true);
    setError('');
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        h,
        claim,
        src,
        firstName,
        lastName,
        displayName,
        email,
        phone,
        bodyWeightLb,
        photo,
        scheduleDaysPerWeek: scheduleDays,
        acceptedWaiver: accepted,
        adultRiskConfirmed: adultConfirmed,
        pin,
        confirmPin: confirmPinValue,
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
    trackAction('join_step', {
      category: 'join',
      cta_type: 'done',
      article_context: joinStepContext(h, joinSourceFrom(src, claim)),
    });
    if (data.session) {
      router.replace('/home');
      return;
    }
    setStep('wait');
  };

  // "Under 18 / Pass": block this browser (server row + cookie + localStorage) and leave.
  const pass = async () => {
    setBusy(true);
    await fetch('/api/device-block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pass' }),
    }).catch(() => null);
    try {
      localStorage.setItem(DEVICE_BLOCK_STORAGE_KEY, '1');
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* cookie still guards */
    }
    router.replace('/blocked');
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 py-8">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Work-It</p>
      <StepProgress stage={STAGE_FOR_STEP[step]} />
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
            onClick={() => setStep('agree')}
            className="mt-8 min-h-12 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
          >
            Next
          </button>
          <a href="/login" className="mt-4 text-center text-sm font-bold text-[#f6f1e3]/60">
            I already train
          </a>
          <a href="/faq" className="mt-3 text-center text-sm font-bold text-[#f6f1e3]/60">
            Why Work-It
          </a>
        </>
      ) : null}

      {step === 'agree' ? (
        <>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#e8c547]">{JOIN_AGREE_TITLE}</h1>
          <div className="mt-8 space-y-7">
            {JOIN_AGREE_SECTIONS.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-black text-[#e8c547]">{section.heading}</h2>
                <p className="mt-2 text-xl leading-relaxed text-[#f6f1e3]/90">{section.body}</p>
              </section>
            ))}
          </div>
          {/* Both gold on purpose: the one screen where "gold = take this action" doesn't apply. */}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setAdultConfirmed(true);
              setStep('form');
            }}
            className="mt-10 min-h-14 rounded-2xl bg-[#e8c547] text-xl font-black text-[#1a1404] disabled:opacity-40"
          >
            {JOIN_AGREE_CONFIRM}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={pass}
            className="mt-3 min-h-14 rounded-2xl bg-[#e8c547] text-xl font-black text-[#1a1404] disabled:opacity-40"
          >
            {JOIN_AGREE_PASS}
          </button>
          <BackLink onClick={() => setStep('intro')} />
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
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/50">
                Days per week · {scheduleDays}
                {scheduleDays === DEFAULT_SCHEDULE_DAYS ? ' (recommended)' : ''}
              </span>
              <input
                type="range"
                min={MIN_SCHEDULE_DAYS}
                max={MAX_SCHEDULE_DAYS}
                step={1}
                value={scheduleDays}
                onChange={(event) => setScheduleDays(Number(event.target.value))}
                className="mt-2 w-full accent-[#e8c547]"
              />
              <p className="mt-1 text-sm text-[#f6f1e3]/60">
                {scheduleDaysHint(scheduleDays)} Change this anytime in Edit profile.
              </p>
            </div>
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
              if (!adultConfirmed) {
                setStep('agree');
                return;
              }
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
          <BackLink onClick={() => setStep('agree')} />
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
                  setError('');
                  setPin(value);
                  // A stale confirmPin from an earlier attempt must never carry
                  // forward into a fresh PIN — always require a fresh confirmation.
                  setConfirmPin('');
                  if (value.length === 4) setStep('confirm');
                } else {
                  setConfirmPin(value);
                  if (value.length === 4) {
                    if (value === pin) {
                      submit(value);
                    } else {
                      // Mismatch: surface it and send them back to re-enter the
                      // PIN from scratch, instead of leaving them stuck on 4
                      // filled, disabled dots with no way forward or back.
                      setError('PINs do not match. Enter your PIN again.');
                      setPin('');
                      setConfirmPin('');
                      setStep('pin');
                    }
                  }
                }
              }}
            />
          </div>
          {error ? <p className="mt-3 text-sm text-[#a35d52]">{error}</p> : null}
          <button
            type="button"
            disabled={busy || (step === 'pin' ? pin.length !== 4 : confirmPin.length !== 4)}
            onClick={() => (step === 'pin' ? setStep('confirm') : submit(confirmPin))}
            className="mt-8 min-h-12 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404] disabled:opacity-40"
          >
            {step === 'pin' ? 'Next' : 'Finish'}
          </button>
          <BackLink
            onClick={() => {
              setError('');
              if (step === 'pin') {
                setStep('form');
              } else {
                // Keep the original pin so they can review/edit it; only the
                // stale confirmation needs to be cleared.
                setConfirmPin('');
                setStep('pin');
              }
            }}
          />
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

function StepProgress({ stage }: { stage: number }) {
  return (
    <div className="mt-4 flex items-center gap-2">
      {STAGE_LABELS.map((label, index) => (
        <div key={label} className="flex flex-1 items-center gap-2">
          <div
            className={`h-1.5 flex-1 rounded-full ${
              index <= stage ? 'bg-[#e8c547]' : 'bg-white/10'
            }`}
          />
          <span
            className={`text-[10px] font-black uppercase tracking-[0.14em] ${
              index <= stage ? 'text-[#e8c547]' : 'text-[#f6f1e3]/40'
            }`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 text-center text-sm font-bold text-[#f6f1e3]/60"
    >
      Back
    </button>
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
