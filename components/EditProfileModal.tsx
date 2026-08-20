'use client';

import { useEffect, useState } from 'react';

interface EditProfileModalProps {
  open: boolean;
  currentName: string;
  currentEmail: string;
  onClose: () => void;
  onSaved: (profile: { name: string; email: string | null }) => void;
}

export default function EditProfileModal({
  open,
  currentName,
  currentEmail,
  onClose,
  onSaved,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setEmail(currentEmail);
      setError('');
      setSubmitting(false);
    }
  }, [open, currentName, currentEmail]);

  if (!open) return null;

  const save = async () => {
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
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Could not save profile');
        return;
      }

      onSaved({ name: data.user.name, email: data.user.email });
      onClose();
    } catch {
      setError('Could not save profile. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
        <h2 className="mb-2 text-2xl font-black text-white">Your profile</h2>
        <p className="mb-6 text-sm text-[#f6f1e3]/65">Update your name and email anytime.</p>

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
          className="glass-input mb-6 w-full"
        />

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
            onClick={save}
            className="min-h-12 flex-1 rounded-2xl bg-[#e8c547] font-black text-[#1a1404] disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm font-semibold text-rose-400">{error}</p>
        )}
      </div>
    </div>
  );
}
