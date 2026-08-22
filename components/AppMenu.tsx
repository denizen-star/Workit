'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Menu, X, Shield, UserRound, LogOut } from 'lucide-react';
import EditProfileModal from '@/components/EditProfileModal';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { trackAction } from '@/lib/analytics';

interface AppMenuProps {
  userName: string;
  userEmail?: string;
  userTone?: CoachTone | string | null;
  userSoundOn?: boolean | null;
  isAdmin?: boolean;
  onProfileSaved?: (profile: {
    name: string;
    email: string | null;
    coachTone: CoachTone;
    soundOn: boolean;
  }) => void;
}

export default function AppMenu({
  userName,
  userEmail = '',
  userTone = 'master',
  userSoundOn = true,
  isAdmin = false,
  onProfileSaved,
}: AppMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        right: Math.max(16, window.innerWidth - rect.right),
        width: 224,
      });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open]);

  const switchUser = async () => {
    setOpen(false);
    trackAction('logout', { category: 'home' });
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/who');
    router.refresh();
  };

  const menu = open && mounted
    ? createPortal(
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            style={panelStyle}
            className="z-[201] overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl"
          >
            <div className="border-b border-white/10 px-4 py-3">
              <p className="truncate text-sm font-black text-white">{userName}</p>
              {userEmail && (
                <p className="truncate text-xs text-[#f6f1e3]/50">{userEmail}</p>
              )}
            </div>
            {isAdmin && (
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
            )}
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
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-white/10 text-[#e8c547] hover:border-[#e8c547]/40"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {menu}

      <EditProfileModal
        open={showEdit}
        currentName={userName}
        currentEmail={userEmail}
        currentTone={normalizeCoachTone(userTone)}
        currentSoundOn={userSoundOn}
        onClose={() => setShowEdit(false)}
        onSaved={(profile) => {
          onProfileSaved?.(profile);
          router.refresh();
        }}
      />
    </>
  );
}
