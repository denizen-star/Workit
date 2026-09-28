'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';

/** Wraps a tappable Home banner with a small ✕ in its top-right corner. The ✕ is a
 * sibling of the banner's own button (never nested inside it), so dismissing
 * doesn't also fire the banner's tap. Used by the More programs unlock banners
 * (docs/plans/PLAN_MORE_PROGRAMS.md). */
export default function DismissibleBanner({
  onDismiss,
  children,
}: {
  onDismiss: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative mb-6">
      {children}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded-full p-1.5 text-[#f6f1e3]/60 hover:bg-white/10 hover:text-[#f6f1e3]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
