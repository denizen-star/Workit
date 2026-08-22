'use client';

import { useEffect, useState } from 'react';
import PinPad from '@/components/PinPad';
import { COACH_TONE_OPTIONS, normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { setSoundEnabled } from '@/lib/playChime';
import { normalizeSoundOn } from '@/lib/soundPref';

interface EditProfileModalProps {
  open: boolean;
  currentName: string;
  currentEmail: string;
  currentTone?: CoachTone | string | null;
  currentSoundOn?: boolean | null;
  onClose: () => void;
  onSaved: (profile: { name: string; email: string | null; coachTone: CoachTone; soundOn: boolean }) => void;
}

export default function EditProfileModal({
  open,
  currentName,
  currentEmail,
  currentTone = 'master',
  currentSoundOn = true,
  onClose,
  onSaved,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [tone, setTone] = useState<CoachTone>(normalizeCoachTone(currentTone));
  const [soundOn, setSoundOn] = useState(normalizeSoundOn(currentSoundOn));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [changePin, setChangePin] = useState(false);
  const [step, setStep] = useState<'details' | 'pin' | 'confirm'>('details');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    if (open) {
      setName(currentName);
      setEmail(currentEmail);
      setTone(normalizeCoachTone(currentTone));
      setSoundOn(normalizeSoundOn(currentSoundOn));
      setError('');
      setSubmitting(false);
      setChangePin(false);
      setStep('details');
      setPin('');
      setConfirmPin('');
    }
  }, [open, currentName, currentEmail, currentTone, currentSoundOn]);

  if (!open) return null;

  const save = async (finalPin: string | null) => {
    if (!name.trim()) {
      setError('Enter a full name');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload: { name: string; email: string; pin?: string; coachTone: CoachTone; soundOn: boolean } = {
        name: name.trim(),
        email: email.trim(),
        coachTone: tone,
        soundOn,
      };
      if (finalPin) payload.pin = finalPin;

      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not save profile');
        return;
      }

      const nextSoundOn = normalizeSoundOn(data.user.soundOn);
      setSoundEnabled(nextSoundOn);
      onSaved({
        name: data.user.name,
        email: data.user.email,
        coachTone: normalizeCoachTone(data.user.coachTone),
        soundOn: nextSoundOn,
      });
      onClose();
    } catch {
      setError('Could not save profile. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goToPin = () => {
    if (!name.trim()) {
      setError('Enter a full name');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email');
      return;
    }
    setError('');
    if (changePin) {
      setStep('pin');
      return;
    }
    save(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
        {step === 'details' && (
          <>
            <h2 className="mb-2 text-2xl font-black text-white">Your profile</h2>
            <p className="mb-6 text-sm text-[#f6f1e3]/65">
              Update your name, email, or PIN. Same four digits is allowed.
            </p>

            <label className="mb-1 block text-sm font-semibold text-[#f6f1e3]/65">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input mb-4 w-full"
            />
            <label className="mb-1 block text-sm font-semibold text-[#f6f1e3]/65">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input mb-4 w-full"
            />
            <p className="mb-2 text-sm font-semibold text-[#f6f1e3]/65">Coach voice</p>
            <div className="mb-4 grid gap-2">
              {COACH_TONE_OPTIONS.map((option) => {
                const selected = tone === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTone(option.id)}
                    className={`rounded-2xl border px-4 py-3 text-left ${
                      selected
                        ? 'border-[#e8c547] bg-[#e8c547]/15'
                        : 'border-white/10 bg-black/25'
                    }`}
                  >
                    <span className="block text-sm font-black text-white">{option.label}</span>
                    <span className="mt-1 block text-xs text-[#f6f1e3]/60">{option.blurb}</span>
                  </button>
                );
              })}
            </div>
            <p className="mb-2 text-sm font-semibold text-[#f6f1e3]/65">Workout sound</p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSoundOn(true)}
                className={`rounded-2xl border px-4 py-3 text-left ${
                  soundOn ? 'border-[#e8c547] bg-[#e8c547]/15' : 'border-white/10 bg-black/25'
                }`}
              >
                <span className="block text-sm font-black text-white">On</span>
                <span className="mt-1 block text-xs text-[#f6f1e3]/60">Chimes and horn</span>
              </button>
              <button
                type="button"
                onClick={() => setSoundOn(false)}
                className={`rounded-2xl border px-4 py-3 text-left ${
                  !soundOn ? 'border-[#e8c547] bg-[#e8c547]/15' : 'border-white/10 bg-black/25'
                }`}
              >
                <span className="block text-sm font-black text-white">Off</span>
                <span className="mt-1 block text-xs text-[#f6f1e3]/60">Silent sets</span>
              </button>
            </div>
            <label className="mb-6 flex items-center gap-2 text-sm text-[#f6f1e3]/75">
              <input
                type="checkbox"
                checked={changePin}
                onChange={(e) => setChangePin(e.target.checked)}
                className="h-4 w-4 accent-[#e8c547]"
              />
              Change PIN
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 flex-1 rounded-2xl border border-white/10 font-semibold text-[#f6f1e3]/75"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={goToPin}
                className="min-h-12 flex-1 rounded-2xl bg-[#e8c547] font-black text-[#1a1404] disabled:opacity-50"
              >
                {changePin ? 'Next' : submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}

        {(step === 'pin' || step === 'confirm') && (
          <>
            <h2 className="mb-2 text-2xl font-black text-white">
              {step === 'pin' ? 'New PIN' : 'Confirm PIN'}
            </h2>
            <p className="mb-6 text-center text-sm font-semibold text-[#e8c547]">
              {step === 'pin' ? 'Four digits. Same PIN is allowed.' : 'Enter it again.'}
            </p>
            <PinPad
              value={step === 'pin' ? pin : confirmPin}
              onChange={(v) => {
                if (step === 'pin') {
                  setPin(v);
                  if (v.length === 4) setTimeout(() => setStep('confirm'), 150);
                } else {
                  setConfirmPin(v);
                  if (v.length === 4) {
                    if (v !== pin) {
                      setError('PINs do not match');
                      setConfirmPin('');
                      setStep('pin');
                      setPin('');
                      return;
                    }
                    save(v);
                  }
                }
              }}
              disabled={submitting}
            />
            <button
              type="button"
              onClick={() => {
                setStep('details');
                setPin('');
                setConfirmPin('');
                setError('');
              }}
              className="mt-6 min-h-12 w-full rounded-2xl border border-white/10 font-semibold text-[#f6f1e3]/75"
            >
              Back
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 text-center text-sm font-semibold text-rose-400">{error}</p>
        )}
      </div>
    </div>
  );
}
