'use client';

import { useState } from 'react';
import PinPad from '@/components/PinPad';

interface AddPersonModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddPersonModal({ open, onClose, onAdded }: AddPersonModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'details' | 'pin' | 'confirm'>('details');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setEmail('');
    setPin('');
    setConfirmPin('');
    setStep('details');
    setError('');
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
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
    setStep('pin');
  };

  const submit = async (finalPin: string, finalConfirm: string) => {
    if (finalPin !== finalConfirm) {
      setError('PINs do not match. Try again.');
      setPin('');
      setConfirmPin('');
      setStep('pin');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), pin: finalPin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not add person');
        setPin('');
        setConfirmPin('');
        setStep('details');
        return;
      }

      reset();
      onAdded();
      onClose();
    } catch {
      setError('Could not add person. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePinComplete = (nextPin: string) => {
    if (step === 'confirm') {
      setConfirmPin(nextPin);
      submit(pin, nextPin);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
        <h2 className="mb-2 text-2xl font-black text-white">Add person</h2>
        <p className="mb-6 text-sm text-[#f6f1e3]/65">
          {step === 'details'
            ? 'Full name, email, then a 4-digit PIN'
            : step === 'pin'
              ? 'Choose a 4-digit PIN for them'
              : 'Enter the PIN again to confirm'}
        </p>

        {step === 'details' && (
          <>
            <label className="mb-1 block text-sm font-semibold text-[#f6f1e3]/65">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Smith"
              autoFocus
              className="glass-input mb-4 w-full"
            />
            <label className="mb-1 block text-sm font-semibold text-[#f6f1e3]/65">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@example.com"
              className="glass-input mb-4 w-full"
            />
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
                onClick={goToPin}
                className="min-h-12 flex-1 rounded-2xl bg-[#e8c547] font-black text-[#1a1404]"
              >
                Next
              </button>
            </div>
          </>
        )}

        {(step === 'pin' || step === 'confirm') && (
          <>
            <p className="mb-1 text-center text-sm font-semibold text-[#e8c547]">{name}</p>
            <p className="mb-4 text-center text-xs text-[#f6f1e3]/55">{email}</p>
            <PinPad
              value={step === 'pin' ? pin : confirmPin}
              onChange={(v) => {
                if (step === 'pin') {
                  setPin(v);
                  if (v.length === 4) {
                    setTimeout(() => setStep('confirm'), 150);
                  }
                } else {
                  setConfirmPin(v);
                  if (v.length === 4) {
                    handlePinComplete(v);
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
