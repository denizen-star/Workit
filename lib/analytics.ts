// Client-only. Production only. Never sends name or email.

import { collectDeviceInfo } from './deviceCollector';
import { isProductionAnalytics, type AnalyticsEventType } from './analyticsTypes';

const ENDPOINT = '/api/analytics/event';
const SESSION_KEY = 'workit_sid';
const VISITOR_KEY = 'workit_vid';

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return '';
  }
}

export function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return '';
  }
}

export type TrackPayload = {
  event_type: AnalyticsEventType | string;
  page_category?: string;
  page_url?: string;
  referrer?: string;
  cta_type?: string;
  depth_percent?: number;
  article_slug?: string;
  article_context?: string;
};

export function trackEvent(payload: TrackPayload): void {
  if (!isProductionAnalytics()) return;
  try {
    const body = JSON.stringify({
      ...payload,
      session_id: getSessionId() || undefined,
      visitor_id: getVisitorId() || undefined,
      device_info: collectDeviceInfo(),
      page_url: payload.page_url ?? location.href,
      page_title: document.title || undefined,
      referrer: payload.referrer ?? (document.referrer || undefined),
      timestamp: new Date().toISOString(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // never surface
  }
}

export function trackPageView(category?: string): void {
  trackEvent({ event_type: 'page_view', page_category: category });
}

export function trackPageExit(category?: string): void {
  trackEvent({ event_type: 'page_exit', page_category: category });
}

export function trackScrollDepth(depthPercent: number, category?: string): void {
  trackEvent({ event_type: 'scroll_depth', depth_percent: depthPercent, page_category: category });
}

export function trackAction(
  eventType: AnalyticsEventType,
  extras?: {
    category?: string;
    cta_type?: string;
    article_context?: string;
    article_slug?: string;
  }
): void {
  trackEvent({
    event_type: eventType,
    page_category: extras?.category,
    cta_type: extras?.cta_type,
    article_context: extras?.article_context,
    article_slug: extras?.article_slug,
  });
}
