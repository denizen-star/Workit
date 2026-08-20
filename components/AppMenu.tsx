'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Shield, UserRound, LogOut } from 'lucide-react';
import EditProfileModal from '@/components/EditProfileModal';

interface AppMenuProps {
  userName: string;
  userEmail?: string;
  onProfileSaved?: (profile: { name: string; email: string | null }) => void;
}

export default function AppMenu({ userName, userEmail = '', onProfileSaved }: AppMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const switchUser = async () => {
    setOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/who');
    router.refresh();
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-white/10 text-[#e8c547] hover:border-[#e8c547]/40"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {open && (
          <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="truncate text-sm font-black text-white">{userName}</p>
              {userEmail && (
                <p className="truncate text-xs text-[#f6f1e3]/50">{userEmail}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/admin');
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#f6f1e3]/85 hover:bg-white/5"
            >
              <Shield className="h-4 w-4 text-[#e8c547]" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setShowEdit(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#f6f1e3]/85 hover:bg-white/5"
            >
              <UserRound className="h-4 w-4 text-[#e8c547]" />
              Edit profile
            </button>
            <button
              type="button"
              onClick={switchUser}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#f6f1e3]/85 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4 text-[#e8c547]" />
              Switch profile
            </button>
          </div>
        )}
      </div>

      <EditProfileModal
        open={showEdit}
        currentName={userName}
        currentEmail={userEmail}
        onClose={() => setShowEdit(false)}
        onSaved={(profile) => {
          onProfileSaved?.(profile);
          router.refresh();
        }}
      />
    </>
  );
}
