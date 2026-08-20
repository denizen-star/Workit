'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, ArrowLeft } from 'lucide-react';
import PinPad from '@/components/PinPad';

type HouseholdUser = {
  id: number;
  name: string;
  email?: string | null;
  has_pin: boolean;
};

type Step = 'pick' | 'login' | 'create-pin' | 'confirm-pin';

export default function WhoPage() {
  const router = useRouter();
  const [users, setUsers] = useState<HouseholdUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HouseholdUser | null>(null);
  const [step, setStep] = useState<Step>('pick');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetPinFlow = () => {
    setPin('');
    setConfirmPin('');
    setError('');
    setSubmitting(false);
  };

  const pickUser = (user: HouseholdUser) => {
    setSelected(user);
    resetPinFlow();
    setStep(user.has_pin ? 'login' : 'create-pin');
  };

  const goBack = () => {
    setSelected(null);
    resetPinFlow();
    setStep('pick');
  };

  const login = async (enteredPin: string) => {
    if (!selected) return;
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selected.id, pin: enteredPin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setPin('');
        setSubmitting(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Login failed. Try again.');
      setPin('');
      setSubmitting(false);
    }
  };

  const setUpPin = async (firstPin: string, secondPin: string) => {
    if (!selected) return;

    if (firstPin !== secondPin) {
      setError('PINs do not match. Try again.');
      setPin('');
      setConfirmPin('');
      setStep('create-pin');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selected.id,
          pin: firstPin,
          confirmPin: secondPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not set PIN');
        setPin('');
        setConfirmPin('');
        setStep('create-pin');
        setSubmitting(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Could not set PIN. Try again.');
      setPin('');
      setConfirmPin('');
      setStep('create-pin');
      setSubmitting(false);
    }
  };

  const handlePinChange = (value: string) => {
    if (step === 'login') {
      setPin(value);
      if (value.length === 4) {
        login(value);
      }
    } else if (step === 'create-pin') {
      setPin(value);
      if (value.length === 4) {
        setTimeout(() => {
          setStep('confirm-pin');
          setConfirmPin('');
        }, 150);
      }
    } else if (step === 'confirm-pin') {
      setConfirmPin(value);
      if (value.length === 4) {
        setUpPin(pin, value);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl font-black text-[#e8c547]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-8 w-8 text-[#e8c547]" />
            <h1 className="text-2xl font-black tracking-tight text-white">Work-It</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-10">
        {step === 'pick' ? (
          <>
            <h2 className="text-center text-3xl font-black text-white">Who&apos;s working out?</h2>
            <p className="mt-2 text-center text-[#f6f1e3]/65">
              Tap your profile to continue
            </p>

            <div className="mt-10 space-y-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => pickUser(user)}
                  className="flex w-full min-h-16 items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-6 py-4 text-left transition hover:border-[#e8c547]/50 hover:bg-[#e8c547]/10"
                >
                  <span className="min-w-0">
                    <span className="block text-xl font-black text-white">{user.name}</span>
                    {user.email && (
                      <span className="mt-0.5 block truncate text-sm text-[#f6f1e3]/50">{user.email}</span>
                    )}
                  </span>
                  <span className="text-sm text-[#f6f1e3]/55">
                    {user.has_pin ? 'Enter PIN' : 'Set up PIN'}
                  </span>
                </button>
              ))}

              {users.length === 0 && (
                <p className="text-center text-[#f6f1e3]/65">No profiles yet. Ask the app owner to add you.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={goBack}
              className="mb-8 inline-flex min-h-11 items-center gap-2 text-[#f6f1e3]/75 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>

            <h2 className="text-center text-3xl font-black text-white">{selected?.name}</h2>
            {selected?.email && (
              <p className="mt-1 text-center text-sm text-[#f6f1e3]/50">{selected.email}</p>
            )}
            <p className="mt-2 text-center text-[#f6f1e3]/65">
              {step === 'login'
                ? 'Enter your 4-digit PIN'
                : step === 'create-pin'
                  ? 'Create your 4-digit PIN'
                  : 'Enter your PIN again to confirm'}
            </p>

            <div className="mt-10">
              <PinPad
                value={step === 'confirm-pin' ? confirmPin : pin}
                onChange={handlePinChange}
                disabled={submitting}
              />
            </div>

            {error && (
              <p className="mt-6 text-center text-sm font-semibold text-rose-400">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
