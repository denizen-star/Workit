'use client';

import { useEffect, useRef } from 'react';
import { trackAction, trackPageExit, trackPageView, trackScrollDepth } from '@/lib/analytics';

type Options = {
  category?: string;
  enabled?: boolean;
  trackScroll?: boolean;
};

export function useAnalytics({ category, enabled = true, trackScroll = true }: Options = {}) {
  const firedDepths = useRef(new Set<number>());

  useEffect(() => {
    if (!enabled) return;
    trackPageView(category);
    if (category === 'admin' || category === 'admin-mail') {
      trackAction('admin_page_view', { category });
    }

    function handleExit() {
      trackPageExit(category);
    }
    window.addEventListener('pagehide', handleExit, { once: true });
    window.addEventListener('beforeunload', handleExit, { once: true });

    return () => {
      window.removeEventListener('pagehide', handleExit);
      window.removeEventListener('beforeunload', handleExit);
    };
  }, [category, enabled]);

  useEffect(() => {
    if (!enabled || !trackScroll) return;

    const THRESHOLDS = [25, 50, 75, 100];

    function handleScroll() {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total <= 0) return;
      const pct = Math.min(100, Math.round((scrolled / total) * 100));
      for (const t of THRESHOLDS) {
        if (pct >= t && !firedDepths.current.has(t)) {
          firedDepths.current.add(t);
          trackScrollDepth(t, category);
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [category, trackScroll, enabled]);
}
