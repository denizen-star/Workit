'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PinPad from '@/components/PinPad';
import { getCoachToneOptions } from '@/lib/coachCatalog';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, currentName, currentEmail, currentTone, currentSoundOn]);

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

  if (!open || !mounted) return null;

  const sheet = (
    <div className="fixed inset-0 z-[300] flex items-stretch justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative flex h-full min-h-0 w-full max-w-md flex-col bg-[#12121a] sm:h-auto sm:max-h-[min(88dvh,760px)] sm:rounded-3xl sm:border sm:border-white/10 sm:shadow-2xl">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
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
                {getCoachToneOptions().map((option) => {
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
                    <span className="mt-2 block text-xs leading-relaxed text-[#f6f1e3]/45">{option.description}</span>
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
              <label className="mb-2 flex items-center gap-2 text-sm text-[#f6f1e3]/75">
                <input
                  type="checkbox"
                  checked={changePin}
                  onChange={(e) => setChangePin(e.target.checked)}
                  className="h-4 w-4 accent-[#e8c547]"
                />
                Change PIN
              </label>
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
            </>
          )}

          {error && (
            <p className="mt-4 text-center text-sm font-semibold text-rose-400">{error}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-3 border-t border-white/10 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {step === 'details' ? (
            <>
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
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStep('details');
                setPin('');
                setConfirmPin('');
                setError('');
              }}
              className="min-h-12 w-full rounded-2xl border border-white/10 font-semibold text-[#f6f1e3]/75"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
