'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PinPad from '@/components/PinPad';
import { FORGOT_PIN_NOTICE } from '@/lib/helpCopy';
import { EMAIL_NOT_VERIFIED, JOIN_INTRO_LEAD } from '@/lib/joinCopy';

const LOGIN_EMAIL_KEY = 'workit_login_email';

function readSavedEmail() {
  try {
    return (window.localStorage.getItem(LOGIN_EMAIL_KEY) || '').trim();
  } catch {
    return '';
  }
}

function saveLoginEmail(value: string) {
  try {
    const trimmed = value.trim();
    if (trimmed) window.localStorage.setItem(LOGIN_EMAIL_KEY, trimmed);
    else window.localStorage.removeItem(LOGIN_EMAIL_KEY);
  } catch {
    /* private mode */
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    const saved = readSavedEmail();
    if (saved) setEmail(saved);
    const params = new URLSearchParams(window.location.search);
    const verify = params.get('verify') || '';
    const reset = params.get('reset') || '';
    if (verify) {
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verify }),
      }).then(async (res) => {
        if (res.ok) router.replace('/home');
        else setError('That verify link is not valid');
      });
    }
    if (reset) setResetToken(reset);
  }, [router]);

  const submit = async (nextPin?: string) => {
    const value = nextPin ?? pin;
    if (value.length !== 4) return;
    setBusy(true);
    setError('');
    if (resetToken) {
      if (confirmPin.length !== 4) {
        setConfirmPin(value);
        setPin('');
        setBusy(false);
        setNotice('Enter the same PIN again');
        return;
      }
      const res = await fetch('/api/auth/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, pin: confirmPin, confirmPin: value }),
      });
      const data = await res.json();
      setBusy(false);
      if (!res.ok) {
        setError(data.error || 'Could not reset PIN');
        setPin('');
        setConfirmPin('');
        return;
      }
      saveLoginEmail(email);
      router.replace('/home');
      return;
    }
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin: value }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.unverified ? EMAIL_NOT_VERIFIED : data.error || 'Could not log in');
      setPin('');
      return;
    }
    saveLoginEmail(email);
    router.replace('/home');
  };

  const forgot = async () => {
    setNotice(FORGOT_PIN_NOTICE);
    await fetch('/api/auth/forgot-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 py-8">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Work-It</p>
      <h1 className="mt-2 text-3xl font-black text-white">Log in</h1>
      <p className="mt-3 text-sm text-[#f6f1e3]/70">{JOIN_INTRO_LEAD}</p>
      <form
        className="mt-8 flex flex-col"
        autoComplete="on"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
      <label
        htmlFor="login-email"
        className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/50"
      >
        Email
      </label>
      <input
        id="login-email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => {
          const next = event.target.value;
          setEmail(next);
          saveLoginEmail(next);
        }}
        className="mt-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        inputMode="email"
        enterKeyHint="next"
      />
      <label
        htmlFor="login-pin"
        className="mt-6 text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/50"
      >
        PIN
      </label>
      <input
        id="login-pin"
        name="password"
        type="password"
        value={pin}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, '').slice(0, 4);
          setPin(next);
          if (next.length === 4) submit(next);
        }}
        className="mt-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-center text-lg tracking-[0.4em] text-white"
        autoComplete="current-password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        enterKeyHint="go"
      />
      <div className="mt-4">
        <PinPad
          value={pin}
          onChange={(value) => {
            setPin(value);
            if (value.length === 4) submit(value);
          }}
        />
      </div>
      {error ? <p className="mt-4 text-sm text-[#a35d52]">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm text-[#6d8b6e]">{notice}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-6 min-h-12 rounded-2xl bg-[#e8c547] text-lg font-black text-[#1a1404]"
      >
        Enter
      </button>
      </form>
      <button type="button" onClick={forgot} className="mt-3 text-sm font-bold text-[#e8c547]">
        Forgot PIN
      </button>
      <a href="/join?h=gowanus" className="mt-8 text-center text-sm font-bold text-[#f6f1e3]/60">
        Join the movement
      </a>
    </main>
  );
}
