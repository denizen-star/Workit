'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import AppMenu from '@/components/AppMenu';
import { normalizeCoachTone, type CoachTone } from '@/lib/coachTone';
import { normalizeSoundOn } from '@/lib/soundPref';
import { normalizeRestExtraMinutes } from '@/lib/restPref';

function titleFor(pathname: string) {
  if (pathname.startsWith('/admin/users')) return 'Users';
  if (pathname.startsWith('/admin/feedback')) return 'Feedback';
  if (pathname.startsWith('/admin/mail')) return 'Mail';
  if (pathname.startsWith('/admin/analytics')) return 'Analytics';
  return 'Admin';
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userTone, setUserTone] = useState<CoachTone>('master');
  const [userSoundOn, setUserSoundOn] = useState(true);
  const [userRestExtraMinutes, setUserRestExtraMinutes] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.user?.isAdmin) {
          router.replace('/home');
          return;
        }
        setUserName(data.user.name || '');
        setUserEmail(data.user.email || '');
        setUserTone(normalizeCoachTone(data.user.coachTone));
        setUserSoundOn(normalizeSoundOn(data.user.soundOn));
        setUserRestExtraMinutes(normalizeRestExtraMinutes(data.user.restExtraMinutes));
        setReady(true);
      })
      .catch(() => router.replace('/who'));
  }, [router]);

  if (!ready) {
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
          <div className="relative flex min-h-11 items-center justify-between">
            <Link
              href="/home"
              className="relative z-10 flex min-h-11 shrink-0 items-center gap-2 text-[#f6f1e3]/75 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm sm:text-base">Dashboard</span>
            </Link>
            <h1 className="pointer-events-none absolute inset-x-0 text-center text-lg font-black whitespace-nowrap text-[#f5d76e] sm:text-2xl">
              {titleFor(pathname)}
            </h1>
            <div className="relative z-10">
              <AppMenu
                userName={userName}
                userEmail={userEmail}
                userTone={userTone}
                userSoundOn={userSoundOn}
                userRestExtraMinutes={userRestExtraMinutes}
                isAdmin
                onProfileSaved={(profile) => {
                  setUserName(profile.name);
                  setUserEmail(profile.email || '');
                  setUserTone(profile.coachTone);
                  setUserSoundOn(profile.soundOn);
                  setUserRestExtraMinutes(profile.restExtraMinutes);
                }}
              />
            </div>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
