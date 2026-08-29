'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import PinPad from '@/components/PinPad';
import BeltChip from '@/components/BeltChip';
import { trackAction } from '@/lib/analytics';

type HouseholdUser = {
  id: number;
  name: string;
  email?: string | null;
  has_pin: boolean;
  active?: boolean;
  newToTraining?: boolean;
  beltName?: string | null;
  beltFill?: string | null;
  beltEarned?: boolean;
};

function byName(a: HouseholdUser, b: HouseholdUser) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id - b.id;
}

function WhoFold({
  title,
  trailing,
  defaultOpen,
  children,
}: {
  title: string;
  trailing?: string;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">{title}</h3>
        {trailing ? (
          <span className="ml-auto truncate text-xs text-[#f6f1e3]/50">{trailing}</span>
        ) : (
          <span className="ml-auto" />
        )}
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[#f6f1e3]/65" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[#f6f1e3]/65" />
        )}
      </button>
      {open ? <div className="space-y-3 border-t border-white/10 px-3 py-3">{children}</div> : null}
    </div>
  );
}

function WhoRow({ user, onPick }: { user: HouseholdUser; onPick: (user: HouseholdUser) => void }) {
  const hint = user.newToTraining && !user.has_pin ? 'New to training' : user.has_pin ? 'Enter PIN' : 'Set up PIN';
  return (
    <button
      type="button"
      onClick={() => onPick(user)}
      className="flex w-full min-h-16 items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-6 py-4 text-left transition hover:border-[#e8c547]/50 hover:bg-[#e8c547]/10"
    >
      <span className="min-w-0">
        <span className="block text-xl font-black text-white">{user.name}</span>
        {user.email && (
          <span className="mt-0.5 block truncate text-sm text-[#f6f1e3]/50">{user.email}</span>
        )}
        {user.beltName && user.beltFill ? (
          <span className="mt-2 block">
            <BeltChip name={user.beltName} fill={user.beltFill} earned={Boolean(user.beltEarned)} />
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-sm text-[#f6f1e3]/55">{hint}</span>
    </button>
  );
}

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
  const [claimToken, setClaimToken] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('claim') || '';
    if (token) {
      loadClaim(token);
      return;
    }
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

  const loadClaim = async (token: string) => {
    setClaimToken(token);
    try {
      const response = await fetch('/api/auth/claim?token=' + encodeURIComponent(token));
      const data = await response.json();
      if (!response.ok) {
        setClaimToken('');
        setError(data.error || 'Invite link is not valid');
        await loadUsersKeepingError();
        return;
      }
      setSelected({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        has_pin: false,
      });
      setStep('create-pin');
    } catch {
      setClaimToken('');
      setError('Invite link is not valid');
      await loadUsersKeepingError();
    } finally {
      setLoading(false);
    }
  };

  const loadUsersKeepingError = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const resetPinFlow = () => {
    setPin('');
    setConfirmPin('');
    setError('');
    setSubmitting(false);
  };

  const pickUser = (user: HouseholdUser) => {
    if (user.newToTraining && !user.has_pin) {
      trackAction('who_pick', { category: 'who', article_context: user.name });
      setError('Use the invite link from your email to create a PIN.');
      return;
    }
    trackAction('who_pick', { category: 'who', article_context: user.name });
    setSelected(user);
    resetPinFlow();
    setStep(user.has_pin ? 'login' : 'create-pin');
  };

  const gymUsers = useMemo(
    () => users.filter((user) => user.active || user.newToTraining).sort(byName),
    [users]
  );
  const backUsers = useMemo(
    () => users.filter((user) => user.has_pin && !user.active).sort(byName),
    [users]
  );

  const goBack = () => {
    setSelected(null);
    resetPinFlow();
    setClaimToken('');
    setStep('pick');
    if (typeof window !== 'undefined' && window.location.search.includes('claim=')) {
      router.replace('/who');
    }
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

      trackAction('login', { category: 'who', cta_type: 'pin' });
      router.push('/home');
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
          inviteToken: claimToken || undefined,
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

      trackAction('login', { category: 'who', cta_type: 'set-pin' });
      router.push('/home');
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

            <div className="mt-10 space-y-4">
              {gymUsers.length > 0 ? (
                <WhoFold title="Working the Gym" defaultOpen>
                  {gymUsers.map((user) => (
                    <WhoRow key={user.id} user={user} onPick={pickUser} />
                  ))}
                </WhoFold>
              ) : null}

              {backUsers.length > 0 ? (
                <WhoFold title="Getting back on it!" trailing={String(backUsers.length)} defaultOpen={false}>
                  {backUsers.map((user) => (
                    <WhoRow key={user.id} user={user} onPick={pickUser} />
                  ))}
                </WhoFold>
              ) : null}

              {users.length === 0 && (
                <p className="text-center text-[#f6f1e3]/65">No profiles yet. Ask the app owner to add you.</p>
              )}
            </div>
            {error && (
              <p className="mt-6 text-center text-sm font-semibold text-rose-400">{error}</p>
            )}
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
            {selected?.beltName && selected.beltFill ? (
              <div className="mt-3 flex justify-center">
                <BeltChip name={selected.beltName} fill={selected.beltFill} earned={Boolean(selected.beltEarned)} />
              </div>
            ) : null}
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
