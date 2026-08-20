'use client';

import { useEffect, useState } from 'react';
import PinPad from '@/components/PinPad';

export type AdminUser = {
  id: number;
  name: string;
  email: string | null;
  has_pin: boolean;
};

interface UserFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  user?: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function UserFormModal({ open, mode, user, onClose, onSaved }: UserFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'details' | 'pin' | 'confirm'>('details');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [changePin, setChangePin] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPin('');
    setConfirmPin('');
    setStep('details');
    setError('');
    setSubmitting(false);
    setChangePin(mode === 'create');
  }, [open, user, mode]);

  if (!open) return null;

  const handleClose = () => {
    onClose();
  };

  const goToPin = () => {
    if (!name.trim()) {
      setError('Enter a full name');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email');
      return;
    }
    setError('');
    if (mode === 'create' || changePin) {
      setStep('pin');
      return;
    }
    save(null);
  };

  const save = async (finalPin: string | null) => {
    setSubmitting(true);
    setError('');

    try {
      const payload: { name: string; email: string; pin?: string } = {
        name: name.trim(),
        email: email.trim(),
      };
      if (finalPin) payload.pin = finalPin;

      const response = await fetch(mode === 'create' ? '/api/users' : `/api/users/${user?.id}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not save user');
        setSubmitting(false);
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('Could not save user. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
        <h2 className="mb-2 text-2xl font-black text-white">
          {mode === 'create' ? 'Add person' : 'Edit person'}
        </h2>
        <p className="mb-6 text-sm text-[#f6f1e3]/65">
          {step === 'details'
            ? 'Full name and email'
            : step === 'pin'
              ? 'Choose a 4-digit PIN'
              : 'Enter the PIN again to confirm'}
        </p>

        {step === 'details' && (
          <>
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
            {mode === 'edit' && (
              <label className="mb-6 flex items-center gap-2 text-sm text-[#f6f1e3]/75">
                <input
                  type="checkbox"
                  checked={changePin}
                  onChange={(e) => setChangePin(e.target.checked)}
                  className="h-4 w-4 accent-[#e8c547]"
                />
                Reset PIN
              </label>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
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
                {mode === 'create' || changePin ? 'Next' : submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}

        {(step === 'pin' || step === 'confirm') && (
          <>
            <p className="mb-4 text-center text-sm font-semibold text-[#e8c547]">{name}</p>
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
                      setError('PINs do not match. Try again.');
                      setPin('');
                      setConfirmPin('');
                      setStep('pin');
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
                if (step === 'confirm') {
                  setConfirmPin('');
                  setStep('pin');
                } else {
                  setPin('');
                  setStep('details');
                }
                setError('');
              }}
              className="mt-4 w-full text-sm text-[#f6f1e3]/55 hover:text-white"
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
