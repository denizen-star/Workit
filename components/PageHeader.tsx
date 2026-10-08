'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AppMenu from '@/components/AppMenu';
import type { Profile, SavedProfile } from '@/lib/meProfile';

/** Shared header for menu destinations and admin pages: Dashboard back link, centered
 * gold title, and the menu (fed from the page's `useMe()` profile). */
export default function PageHeader({
  title,
  profile,
  displayName,
  onProfileSaved,
}: {
  title: string;
  profile: Profile | null;
  /** Name the menu greets with (defaults to the alias / first name). */
  displayName?: string;
  onProfileSaved: (saved: SavedProfile) => void;
}) {
  return (
    <header className="glass-header">
      <div className="container mx-auto px-4 py-4">
        <div className="relative flex min-h-11 items-center justify-between">
          <Link
            href="/home"
            className="relative z-10 flex min-h-11 shrink-0 items-center gap-2 text-[#f6f1e3]/75 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm sm:text-base">Dashboard</span>
          </Link>
          <h1 className="pointer-events-none absolute inset-x-0 text-center text-lg font-black whitespace-nowrap text-[#f5d76e] sm:text-2xl">
            {title}
          </h1>
          <div className="relative z-10">
            <AppMenu
              userName={displayName ?? profile?.callName ?? ''}
              userEmail={profile?.email ?? ''}
              userTone={profile?.coachTone ?? 'master'}
              userSoundOn={profile?.soundOn ?? true}
              userRestExtraMinutes={profile?.restExtraMinutes ?? 0}
              userGender={profile?.gender ?? 'male'}
              isAdmin={profile?.isAdmin ?? false}
              onProfileSaved={onProfileSaved}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
