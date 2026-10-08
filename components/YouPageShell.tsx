'use client';

import type { ReactNode } from 'react';
import PageHeader from '@/components/PageHeader';
import { useMe } from '@/lib/meProfile';

/** Shared chrome for hamburger destinations: back to Home, gold title, menu. */
export default function YouPageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { profile, status, applySaved } = useMe();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl font-black text-[#e8c547]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title={title} profile={profile} onProfileSaved={applySaved} />
      <div className="container mx-auto px-4 py-6">
        <div className="mx-auto max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
