'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Pencil, Plus, Trash2, Mail } from 'lucide-react';
import UserFormModal, { type AdminUser } from '@/components/UserFormModal';
import Modal from '@/components/Modal';
import AdminBlocks from '@/components/AdminBlocks';
import type { DeviceBlockRow } from '@/lib/deviceBlock';
import { UNBLOCKABLE_USER_ID } from '@/lib/deviceBlockShared';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meId, setMeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<DeviceBlockRow[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<number>>(new Set());
  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);

  const load = async () => {
    try {
      const usersRes = await fetch('/api/users?all=1');
      if (usersRes.status === 401 || usersRes.status === 403) {
        router.replace('/home');
        return;
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      const blocksRes = await fetch('/api/admin/blocks');
      if (blocksRes.ok) {
        const data = await blocksRes.json();
        setBlocks(data.blocks || []);
        setBlockedIds(new Set<number>(data.blockedUserIds || []));
      }
      const meRes = await fetch('/api/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setMeId(meData.user?.id ?? null);
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

  const resendInvite = async (user: AdminUser) => {
    setError('');
    setNotice('');
    setResendingId(user.id);
    try {
      const response = await fetch('/api/invite/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not resend invite');
        return;
      }
      setNotice('Invite resent to ' + user.name);
    } catch {
      setError('Could not resend invite. Try again.');
    } finally {
      setResendingId(null);
    }
  };

  /** POST /api/admin/blocks, then reload users + blocks. */
  const updateBlock = async (payload: Record<string, unknown>) => {
    setError('');
    const response = await fetch('/api/admin/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null);
    if (!response?.ok) {
      const data = await response?.json().catch(() => ({}));
      setError(data?.error || 'Could not update block');
    }
    await load();
  };

  const confirmBlock = async () => {
    if (!blockTarget) return;
    const target = blockTarget;
    setBlockTarget(null);
    await updateBlock({ action: blockedIds.has(target.id) ? 'unblock' : 'block', userId: target.id });
  };

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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-2xl font-black text-[#e8c547]">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">Household</p>
            <h2 className="mt-1 text-3xl font-black text-white">Users</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormMode('create');
              setEditing(null);
              setFormOpen(true);
            }}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl bg-[#e8c547] px-4 font-black text-[#1a1404]"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {error && (
          <p className="mb-4 text-sm font-semibold text-rose-400">{error}</p>
        )}
        {notice && (
          <p className="mb-4 text-sm font-semibold text-[#e8c547]">{notice}</p>
        )}

        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="glass-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-white">
                    {user.name}
                    {blockedIds.has(user.id) ? <span className="ml-2 text-sm text-[#a35d52]">Blocked</span> : null}
                  </p>
                  <p className="truncate text-sm text-[#f6f1e3]/55">{user.email || 'No email'}</p>
                  <p className="mt-1 text-xs text-[#f6f1e3]/40">
                    ID {user.id}
                    {user.id === meId ? ' · signed in' : ''}
                    {user.has_pin ? ' · PIN set' : ' · no PIN'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!user.has_pin && (
                    <button
                      type="button"
                      aria-label={`Resend invite to ${user.name}`}
                      disabled={resendingId === user.id}
                      onClick={() => resendInvite(user)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-white/10 text-[#e8c547] disabled:opacity-30"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                  )}
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
                  {user.id !== UNBLOCKABLE_USER_ID && (
                    <button
                      type="button"
                      aria-label={`${blockedIds.has(user.id) ? 'Unblock' : 'Block'} ${user.name}`}
                      onClick={() => setBlockTarget(user)}
                      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border ${
                        blockedIds.has(user.id)
                          ? 'border-[#a35d52] bg-[#a35d52]/20 text-[#f6f1e3]'
                          : 'border-white/10 text-[#a35d52]'
                      }`}
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
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

        <AdminBlocks blocks={blocks} onClear={(block) => updateBlock({ action: 'clear', blockId: block.id })} />
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
        open={!!blockTarget}
        title={blockTarget && blockedIds.has(blockTarget.id) ? 'Unblock this person?' : 'Block this person?'}
        cancelLabel="Cancel"
        confirmLabel={blockTarget && blockedIds.has(blockTarget.id) ? 'Unblock' : 'Block'}
        variant="danger"
        onCancel={() => setBlockTarget(null)}
        onConfirm={confirmBlock}
      >
        {blockTarget && blockedIds.has(blockTarget.id)
          ? `${blockTarget.name} can sign in again and gets mail again.`
          : `${blockTarget?.name} is signed out, cannot sign in, and gets no automated mail. Their numbers stay on the boards.`}
      </Modal>

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
    </>
  );
}
