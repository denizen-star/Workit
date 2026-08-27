'use client';

import { useEffect, useState } from 'react';

type InviteGuest = {
  id: number;
  name: string;
  email: string | null;
  has_pin: boolean;
  invited_at: string | null;
};

interface InviteFriendModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteFriendModal({ open, onClose }: InviteFriendModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [guests, setGuests] = useState<InviteGuest[]>([]);

  const loadGuests = async () => {
    try {
      const response = await fetch('/api/invite');
      if (response.ok) {
        const data = await response.json();
        setGuests(data.guests || []);
      }
    } catch {
      // Guest list is secondary to the form.
    }
  };

  useEffect(() => {
    if (!open) return;
    setName('');
    setEmail('');
    setError('');
    setNotice('');
    setSubmitting(false);
    setResendingId(null);
    void loadGuests();
  }, [open]);

  if (!open) return null;

  const sendInvite = async () => {
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not send invite');
        return;
      }
      setName('');
      setEmail('');
      setNotice('Invite sent. They create their PIN from the email.');
      await loadGuests();
    } catch {
      setError('Could not send invite. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async (guest: InviteGuest) => {
    setResendingId(guest.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/invite/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: guest.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not resend');
        return;
      }
      setNotice('Invite resent to ' + guest.name + '. The old link no longer works.');
    } catch {
      setError('Could not resend. Try again.');
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
        <h2 className="mb-2 text-2xl font-black text-white">Invite a friend</h2>
        <p className="mb-6 text-sm text-[#f6f1e3]/65">
          Full name and email. They create their PIN from the mail.
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-2xl border border-white/10 font-semibold text-[#f6f1e3]/75"
          >
            Close
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={sendInvite}
            className="min-h-12 flex-1 rounded-2xl bg-[#e8c547] font-black text-[#1a1404] disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send invite'}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm font-semibold text-rose-400">{error}</p>
        )}
        {notice && (
          <p className="mt-4 text-center text-sm font-semibold text-[#e8c547]">{notice}</p>
        )}

        {guests.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-[#e8c547]">
              Your guests
            </p>
            <div className="space-y-2">
              {guests.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-white">{guest.name}</p>
                    <p className="truncate text-xs text-[#f6f1e3]/50">{guest.email}</p>
                    <p className="mt-0.5 text-xs text-[#f6f1e3]/40">
                      {guest.has_pin ? 'On the roster' : 'Waiting'}
                    </p>
                  </div>
                  {!guest.has_pin && (
                    <button
                      type="button"
                      disabled={resendingId === guest.id}
                      onClick={() => resend(guest)}
                      className="shrink-0 text-sm font-semibold text-[#e8c547] disabled:opacity-50"
                    >
                      {resendingId === guest.id ? 'Sending...' : 'Resend'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
