'use client';

import { usePathname } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { isProductionAnalytics } from '@/lib/analyticsTypes';

function categoryFromPath(pathname: string): string {
  if (pathname.startsWith('/admin/mail')) return 'admin-mail';
  if (pathname.startsWith('/admin')) return 'admin';
  const segment = pathname.split('/').filter(Boolean)[0];
  if (segment === 'who' || segment === 'home' || segment === 'workout') return segment;
  return segment || 'home';
}

export default function AnalyticsProvider() {
  const pathname = usePathname();
  const category = categoryFromPath(pathname);
  const enabled = isProductionAnalytics();

  useAnalytics({
    category,
    enabled,
    trackScroll: !pathname.startsWith('/admin'),
  });
  return null;
}
