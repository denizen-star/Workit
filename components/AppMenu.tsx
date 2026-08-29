'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, BarChart3, Mail, MessageSquare, Users, UserRound, UserPlus, LogOut, TrendingUp, Trophy, Award, Info, ClipboardList } from 'lucide-react';
import EditProfileModal from '@/components/EditProfileModal';
import InviteFriendModal from '@/components/InviteFriendModal';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { isTestUserName } from '@/lib/householdUsers';
import { trackAction } from '@/lib/analytics';

interface AppMenuProps {
  userName: string;
  userEmail?: string;
  userTone?: CoachTone | string | null;
  userSoundOn?: boolean | null;
  userRestExtraMinutes?: number | null;
  isAdmin?: boolean;
  onProfileSaved?: (profile: {
    name: string;
    email: string | null;
    coachTone: CoachTone;
    soundOn: boolean;
    restExtraMinutes: number;
  }) => void;
}

export default function AppMenu({
  userName,
  userEmail = '',
  userTone = 'master',
  userSoundOn = true,
  userRestExtraMinutes = 0,
  isAdmin = false,
  onProfileSaved,
}: AppMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mobile = window.innerWidth < 640;
      const gutter = 16;
      const top = rect.bottom + 8;
      const maxHeight = Math.max(240, window.innerHeight - top - gutter);
      if (mobile) {
        setPanelStyle({
          position: 'fixed',
          top,
          left: gutter,
          right: gutter,
          width: 'auto',
          height: maxHeight,
          display: 'flex',
          flexDirection: 'column',
        });
        return;
      }
      const width = Math.min(280, window.innerWidth - gutter * 2);
      const left = Math.min(
        Math.max(gutter, rect.right - width),
        window.innerWidth - width - gutter
      );
      setPanelStyle({
        position: 'fixed',
        top,
        left,
        width,
        maxHeight,
        display: 'flex',
        flexDirection: 'column',
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
          {panelStyle && (
          <div
            ref={panelRef}
            style={panelStyle}
            className="z-[201] overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl"
          >
            <div className="shrink-0 border-b border-white/10 px-4 py-3">
              <p className="truncate text-sm font-black text-white">{userName}</p>
              {userEmail && (
                <p className="truncate text-xs text-[#f6f1e3]/50">{userEmail}</p>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-scroll overscroll-contain">
              {isAdmin && (
                <div className="border-b border-white/10 py-1">
                  <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#e8c547]">
                    Admin
                  </p>
                  {(
                    [
                      { href: '/admin/analytics', label: 'Analytics', Icon: BarChart3 },
                      { href: '/admin/users', label: 'Users', Icon: Users },
                      { href: '/admin/feedback', label: 'Feedback', Icon: MessageSquare },
                      { href: '/admin/mail', label: 'Mail', Icon: Mail },
                    ] as const
                  ).map(({ href, label, Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/');
                    return (
                      <button
                        key={href}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          router.push(href);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold ${
                          active
                            ? 'bg-white/5 text-[#e8c547]'
                            : 'text-[#f6f1e3]/85 hover:bg-white/5'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-[#e8c547]" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="py-1">
                {[
                  { href: '/performance', label: 'Your performance', Icon: TrendingUp },
                  { href: '/scoreboard', label: 'The house', Icon: Trophy },
                  { href: '/history', label: 'Completed log', Icon: ClipboardList },
                  { href: '/medals', label: 'Medals', Icon: Award },
                  { href: '/about', label: 'About program', Icon: Info },
                ].map(({ href, label, Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/');
                    return (
                      <button
                        key={href}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          router.push(href);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold ${
                          active
                            ? 'bg-white/5 text-[#e8c547]'
                            : 'text-[#f6f1e3]/85 hover:bg-white/5'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-[#e8c547]" />
                        {label}
                      </button>
                    );
                  })}
              </div>
            </div>
            <div className="shrink-0 border-t border-white/10 pb-[max(0px,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setShowEdit(true);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#f6f1e3]/85 hover:bg-white/5"
              >
                <UserRound className="h-4 w-4 shrink-0 text-[#e8c547]" />
                Edit profile
              </button>
              {!isTestUserName(userName) && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setShowInvite(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#f6f1e3]/85 hover:bg-white/5"
                >
                  <UserPlus className="h-4 w-4 shrink-0 text-[#e8c547]" />
                  Invite a friend
                </button>
              )}
              <button
                type="button"
                onClick={switchUser}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#f6f1e3]/85 hover:bg-white/5"
              >
                <LogOut className="h-4 w-4 shrink-0 text-[#e8c547]" />
                Switch profile
              </button>
            </div>
          </div>
          )}
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
        currentRestExtraMinutes={userRestExtraMinutes}
        onClose={() => setShowEdit(false)}
        onSaved={(profile) => {
          onProfileSaved?.(profile);
          router.refresh();
        }}
      />
      <InviteFriendModal open={showInvite} onClose={() => setShowInvite(false)} />
    </>
  );
}
