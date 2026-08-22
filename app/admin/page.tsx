'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Pencil, Plus, Trash2 } from 'lucide-react';
import UserFormModal, { type AdminUser } from '@/components/UserFormModal';
import Modal from '@/components/Modal';

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meId, setMeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const meRes = await fetch('/api/me');
      if (!meRes.ok) {
        router.replace('/who');
        return;
      }
      const meData = await meRes.json();
      if (!meData.user?.isAdmin) {
        router.replace('/home');
        return;
      }
      setMeId(meData.user?.id ?? null);

      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error loading admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError('');
    try {
      const response = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not delete user');
        setDeleteTarget(null);
        return;
      }
      setDeleteTarget(null);
      await load();
    } catch {
      setError('Could not delete user. Try again.');
      setDeleteTarget(null);
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
          <div className="relative flex min-h-11 items-center">
            <Link
              href="/home"
              className="relative z-10 flex min-h-11 shrink-0 items-center gap-2 text-[#f6f1e3]/75 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm sm:text-base">Dashboard</span>
            </Link>
            <h1 className="pointer-events-none absolute inset-x-0 text-center text-lg font-black whitespace-nowrap text-[#f5d76e] sm:text-2xl">
              Admin
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">Household</p>
            <h2 className="mt-1 text-3xl font-black text-white">Users</h2>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href="/admin/mail"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 px-4 font-semibold text-[#e8c547]"
            >
              <Mail className="h-4 w-4" />
              Mail
            </Link>
            <button
              type="button"
              onClick={() => {
                setFormMode('create');
                setEditing(null);
                setFormOpen(true);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#e8c547] px-4 font-black text-[#1a1404]"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm font-semibold text-rose-400">{error}</p>
        )}

        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="glass-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-white">{user.name}</p>
                  <p className="truncate text-sm text-[#f6f1e3]/55">{user.email || 'No email'}</p>
                  <p className="mt-1 text-xs text-[#f6f1e3]/40">
                    ID {user.id}
                    {user.id === meId ? ' · signed in' : ''}
                    {user.has_pin ? ' · PIN set' : ' · no PIN'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    aria-label={`Edit ${user.name}`}
                    onClick={() => {
                      setFormMode('edit');
                      setEditing(user);
                      setFormOpen(true);
                    }}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-white/10 text-[#e8c547]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${user.name}`}
                    disabled={user.id === meId}
                    onClick={() => setDeleteTarget(user)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-rose-500/30 text-rose-400 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <UserFormModal
        open={formOpen}
        mode={formMode}
        user={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSaved={load}
      />

      <Modal
        open={!!deleteTarget}
        title="Delete this person?"
        cancelLabel="Cancel"
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      >
        This removes {deleteTarget?.name} and all of their workouts, badges, and stats. This cannot be undone.
      </Modal>
    </div>
  );
}
