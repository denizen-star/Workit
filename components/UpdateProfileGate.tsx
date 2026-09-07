'use client';

import { useEffect, useState } from 'react';
import PhotoCropField from '@/components/PhotoCropField';
import WaiverSheet from '@/components/WaiverSheet';
import {
  composeFullName,
  emailFieldHint,
  formatUsPhone,
  isValidEmailFormat,
  splitFullName,
} from '@/lib/profile';
import { WAIVER_CHECKBOX_LABEL } from '@/lib/waiver';

export default function UpdateProfileGate({ onDone }: { onDone: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bodyWeightLb, setBodyWeightLb] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const user = data?.user;
        if (!user) return;
        const split = splitFullName(user.name);
        setFirstName(user.firstName || split.first);
        setLastName(user.lastName || split.last);
        setDisplayName(user.displayName || '');
        setEmail(user.email || '');
        setPhone(formatUsPhone(user.phone || ''));
        setBodyWeightLb(user.bodyWeightLb != null ? String(user.bodyWeightLb) : '');
        setHasPhoto(Boolean(user.hasPhoto));
        setUserId(user.id != null ? Number(user.id) : null);
      });
  }, []);

  const save = async () => {
    if (!accepted) {
      setError('Accept the waiver to continue');
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
    setBusy(true);
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: composeFullName(firstName, lastName),
        firstName,
        lastName,
        displayName,
        email,
        phone,
        bodyWeightLb,
        acceptWaiver: true,
        ...(photo ? { photo } : {}),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'Could not save');
      return;
    }
    onDone();
  };

  const fullName = composeFullName(firstName, lastName);
  const emailHint = emailFieldHint(email);

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#07070a] px-5 py-10">
      <div className="mx-auto max-w-md">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Required</p>
        <h1 className="mt-2 text-3xl font-black text-white">Update your profile</h1>
        <p className="mt-3 text-sm text-[#f6f1e3]/70">We filled in what we already have. The waiver is required.</p>
        <div className="mt-6 space-y-3">
          <input className="glass-input w-full" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input className="glass-input w-full" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <p className="text-sm text-[#f6f1e3]/55">Full name · {fullName || '—'}</p>
          <input className="glass-input w-full" placeholder="Alias" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <PhotoCropField
            optional
            initialSrc={hasPhoto && userId ? `/api/users/${userId}/photo?t=1` : null}
            onChange={setPhoto}
          />
          <div>
            <input
              className="glass-input w-full"
              placeholder="Email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailHint ? <p className="mt-1 text-sm font-semibold text-[#a35d52]">{emailHint}</p> : null}
          </div>
          <input
            className="glass-input w-full"
            placeholder="(347) 555-1234"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(formatUsPhone(e.target.value))}
          />
          <input className="glass-input w-full" placeholder="Weight lb" value={bodyWeightLb} onChange={(e) => setBodyWeightLb(e.target.value)} />
          <label className="flex items-start gap-3 text-sm text-[#f6f1e3]/80">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
            <span>
              {WAIVER_CHECKBOX_LABEL}{' '}
              <button type="button" className="font-bold text-[#e8c547]" onClick={() => setOpen(true)}>
                Read the waiver
              </button>
            </span>
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-[#a35d52]">{error}</p> : null}
        <button
          type="button"
          disabled={busy || !accepted}
          onClick={save}
          className="mt-6 min-h-12 w-full rounded-2xl bg-[#e8c547] font-black text-[#1a1404] disabled:opacity-40"
        >
          Continue
        </button>
        <WaiverSheet open={open} onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}
