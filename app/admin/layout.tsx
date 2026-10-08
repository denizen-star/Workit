'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { useMe } from '@/lib/meProfile';

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
  const { profile, status, applySaved } = useMe();
  const ready = status === 'ready' && Boolean(profile?.isAdmin);

  useEffect(() => {
    if (status === 'failed') router.replace('/login');
    else if (status === 'ready' && !profile?.isAdmin) router.replace('/home');
  }, [status, profile, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl font-black text-[#e8c547]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Admin greets with the full name, as before. */}
      <PageHeader title={titleFor(pathname)} profile={profile} displayName={profile?.name} onProfileSaved={applySaved} />
      {children}
    </div>
  );
}
