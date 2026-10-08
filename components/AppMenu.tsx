'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, BarChart3, Mail, MessageSquare, Users, UserRound, UserPlus, LogOut, TrendingUp, Trophy, Award, GraduationCap, CircleHelp, ClipboardList, Sparkles, Flame, DoorOpen, Dumbbell, ChevronsUp, Lock } from 'lucide-react';
import EditProfileModal from '@/components/EditProfileModal';
import InitialsAvatar from '@/components/InitialsAvatar';
import InviteFriendModal from '@/components/InviteFriendModal';
import RemindersMenuSection from '@/components/RemindersMenuSection';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { type NoiseLevel } from '@/lib/noisePref';
import { isTestUserName } from '@/lib/householdUsers';
import { trackAction } from '@/lib/analytics';
import {
  MORE_PROGRAMS,
  PROGRAM_LOCKED_HINT,
  programIntroHref,
  programLabel,
  programUnlockProgress,
} from '@/lib/programUnlock';
import type { OptInTrack } from '@/lib/programTrack';
import { fetchMe, forgetMe } from '@/lib/meClient';

export type MoreProgramState = 'open' | 'locked' | null;

const PROGRAM_ICONS: Record<OptInTrack, typeof Flame> = { hyrox: Flame, overload: ChevronsUp };

interface AppMenuProps {
  userName: string;
  userEmail?: string;
  userTone?: CoachTone | string | null;
  userSoundOn?: boolean | null;
  userRestExtraMinutes?: number | null;
  userScheduleDays?: number | null;
  userNoiseTakeover?: NoiseLevel | string | null;
  userNoiseEffort?: NoiseLevel | string | null;
  userShowPrs?: boolean | null;
  userGender?: string | null;
  isAdmin?: boolean;
  /** **More programs** section (docs/plans/PLAN_MORE_PROGRAMS.md) — Home's menu only.
   * Each program is `open` (normal item), `locked` (lock + hint; a tap shows
   * "N of 6 weeks locked"), or `null` (hidden, e.g. while the other one is active).
   * Omitted = no section. */
  morePrograms?: {
    lockedWeeks: number;
    states: Record<OptInTrack, MoreProgramState>;
  };
  /** Called instead of navigating when a More program item is tapped and the current
   * page can handle it directly (Home opens the intro takeover in place) — pages that
   * don't pass this fall back to `/home?program=<track>`, which Home reads on mount. */
  onProgramClick?: (track: OptInTrack) => void;
  /** The More program the athlete is in right now — shows "Leave <program>" in the footer. */
  activeProgram?: OptInTrack | null;
  onLeaveProgram?: () => void;
  onProfileSaved?: (profile: {
    name: string;
    email: string | null;
    coachTone: CoachTone;
    soundOn: boolean;
    restExtraMinutes: number;
    scheduleDaysPerWeek: number;
    noiseTakeover: NoiseLevel;
    noiseEffort: NoiseLevel;
    showPrs: boolean;
    hasPhoto?: boolean;
    gender: string;
    coachVoiceOn: boolean;
    bodyWeightLb?: number | null;
  }) => void;
  /** Bump to open Edit profile on the Weight field (Home's missing-weight banner). */
  editWeightSignal?: number;
}

export default function AppMenu({
  userName,
  userEmail = '',
  userTone = 'master',
  userSoundOn = true,
  userRestExtraMinutes = 0,
  userScheduleDays = 4,
  userNoiseTakeover = 'set',
  userNoiseEffort = 'set',
  userShowPrs = true,
  userGender = 'male',
  isAdmin = false,
  morePrograms,
  onProgramClick,
  activeProgram = null,
  onLeaveProgram,
  onProfileSaved,
  editWeightSignal = 0,
}: AppMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  // `?profile=weight` deep link (docs/plans/PLAN_BODY_WEIGHT.md): open Edit profile on the Weight field.
  const [focusWeight, setFocusWeight] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  // Which locked More program was tapped — shows its "N of 6 weeks locked" line.
  const [lockedTapped, setLockedTapped] = useState<'hyrox' | 'overload' | null>(null);
  const [houses, setHouses] = useState<{ id: number; slug: string; name: string }[]>([]);
  const [houseId, setHouseId] = useState<number | null>(null);
  const [callName, setCallName] = useState(userName);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoUserId, setPhotoUserId] = useState<number | null>(null);
  const [photoBust, setPhotoBust] = useState(0);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    if (!editWeightSignal) return;
    setFocusWeight(true);
    setShowEdit(true);
  }, [editWeightSignal]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('profile') !== 'weight') return;
    setFocusWeight(true);
    setShowEdit(true);
    url.searchParams.delete('profile');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchMe()
      .then((res) => {
        // Admin blocked this account: the API already evicted the session.
        if (!res.ok) {
          if (res.status === 403 && res.data?.blocked) {
            window.location.replace('/blocked');
          }
          return null;
        }
        return res.data;
      })
      .then((data) => {
        setHouses(data?.houses || []);
        setHouseId(data?.user?.householdId ?? null);
        setCallName(data?.user?.callName || userName);
        setHasPhoto(Boolean(data?.user?.hasPhoto));
        setPhotoUserId(data?.user?.id != null ? Number(data.user.id) : null);
        if (data?.user?.hasPhoto) setPhotoBust(Date.now());
      });
  }, [userName]);

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
      // A `?` box (HelpTip, e.g. the Reminders section's) portals outside the panel; tapping it keeps the menu open.
      if ((target as Element).closest?.('[role="tooltip"]')) return;
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
    router.push('/login');
    router.refresh();
  };

  // More programs, in MORE_PROGRAMS order. A `null` state drops the item; no items = no section.
  const moreProgramItems = MORE_PROGRAMS.map(({ track, label }) => ({
    key: track,
    label,
    Icon: PROGRAM_ICONS[track],
    state: morePrograms?.states[track] ?? null,
    onTrack: onProgramClick ? () => onProgramClick(track) : undefined,
    href: programIntroHref(track),
  })).filter((item) => item.state !== null);

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
              <div className="flex items-center gap-3">
                {hasPhoto && photoUserId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/users/${photoUserId}/photo?t=${photoBust}`}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <InitialsAvatar name={callName} />
                )}
                <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">{callName}</p>
              {userEmail && (
                <p className="truncate text-xs text-[#f6f1e3]/50">{userEmail}</p>
              )}
                </div>
              </div>
              {houses.length > 1 ? (
                <select
                  value={houseId ?? ''}
                  onChange={async (e) => {
                    const householdId = Number(e.target.value);
                    await fetch('/api/me', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ householdId }),
                    });
                    setHouseId(householdId);
                    setOpen(false);
                    window.location.assign('/home');
                  }}
                  className="mt-3 w-full rounded-lg border border-white/15 bg-[#1a1404] px-3 py-2 text-xs font-black text-[#f6f1e3] focus:border-[#e8c547] focus:outline-none"
                >
                  {houses.map((house) => (
                    <option key={house.id} value={house.id}>
                      {house.name}
                    </option>
                  ))}
                </select>
              ) : houses[0] ? (
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c08457]">
                  {houses[0].name}
                </p>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-scroll overscroll-contain">
              <RemindersMenuSection />
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
              {moreProgramItems.length > 0 && (
                <div className="border-b border-white/10 py-1">
                  <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#e8c547]">
                    More programs
                  </p>
                  {moreProgramItems.map(({ key, label, Icon, state, onTrack, href }) => {
                    const locked = state === 'locked';
                    return (
                      <button
                        key={key}
                        type="button"
                        // Locked: stays in the menu and shows what's left instead of opening.
                        aria-disabled={locked}
                        onClick={() => {
                          if (locked) {
                            setLockedTapped((current) => (current === key ? null : key));
                            return;
                          }
                          setOpen(false);
                          if (onTrack) {
                            onTrack();
                            return;
                          }
                          router.push(href);
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm font-semibold ${
                          locked ? 'text-[#f6f1e3]/40' : 'text-[#f6f1e3]/85 hover:bg-white/5'
                        }`}
                      >
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${locked ? 'text-[#f6f1e3]/40' : 'text-[#e8c547]'}`} />
                        <span className="min-w-0 flex-1">
                          {label}
                          {locked ? (
                            <span className="block text-xs font-medium text-[#f6f1e3]/40">
                              {lockedTapped === key
                                ? programUnlockProgress(morePrograms?.lockedWeeks ?? 0)
                                : PROGRAM_LOCKED_HINT}
                            </span>
                          ) : null}
                        </span>
                        {locked ? <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#f6f1e3]/40" /> : null}
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
                  { href: '/belts', label: 'Belts', Icon: GraduationCap },
                  { href: '/medals', label: 'Medals', Icon: Award },
                  { href: '/library', label: 'The Library', Icon: Dumbbell },
                  { href: '/help', label: 'Help', Icon: CircleHelp },
                  { href: '/faq', label: 'Why Work-It', Icon: Sparkles },
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
              {activeProgram && onLeaveProgram && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onLeaveProgram();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#ff5c6c] hover:bg-[#e4032e]/10"
                >
                  <DoorOpen className="h-4 w-4 shrink-0 text-[#e4032e]" />
                  Leave {programLabel(activeProgram)}
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
      <div className="flex items-center gap-2">
        {hasPhoto && photoUserId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/users/${photoUserId}/photo?t=${photoBust}`}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <InitialsAvatar name={callName} />
        )}
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
      </div>

      {menu}

      <EditProfileModal
        open={showEdit}
        currentName={userName}
        currentEmail={userEmail}
        currentTone={normalizeCoachTone(userTone)}
        currentSoundOn={userSoundOn}
        currentRestExtraMinutes={userRestExtraMinutes}
        currentScheduleDays={userScheduleDays}
        currentNoiseTakeover={userNoiseTakeover}
        currentNoiseEffort={userNoiseEffort}
        currentShowPrs={userShowPrs}
        currentGender={userGender}
        focusWeight={focusWeight}
        onClose={() => {
          setShowEdit(false);
          setFocusWeight(false);
        }}
        onSaved={(profile) => {
          forgetMe();
          if (profile.hasPhoto) {
            setHasPhoto(true);
            setPhotoBust(Date.now());
          }
          onProfileSaved?.(profile);
          router.refresh();
        }}
      />
      <InviteFriendModal open={showInvite} onClose={() => setShowInvite(false)} />
    </>
  );
}
