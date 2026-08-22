import { query } from '@/lib/db';
import { isUnknownColumnError } from '@/lib/db-errors';
import { APP_NAME, toMySQLDateTime } from '@/lib/analyticsTypes';

export type AppEventRow = {
  eventType: string;
  sessionId?: string | null;
  visitorId?: string | null;
  pageCategory?: string | null;
  pageUrl?: string | null;
  pageTitle?: string | null;
  articleSlug?: string | null;
  articleContext?: string | null;
  ctaType?: string | null;
  depthPercent?: number | null;
  referrer?: string | null;
  deviceInfo?: Record<string, unknown> | null;
  deviceType?: string | null;
  os?: string | null;
  browser?: string | null;
  ipAddress?: string | null;
  ipGeolocation?: Record<string, unknown> | null;
  userAgent?: string | null;
  timestamp?: string;
  userId?: number | null;
  userName?: string | null;
  userEmail?: string | null;
};

function clip(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/** Insert one app_events row. Failures are thrown so callers can swallow. */
export async function writeAppEvent(row: AppEventRow): Promise<void> {
  const timestamp = toMySQLDateTime(row.timestamp || new Date().toISOString());
  const args = [
    APP_NAME,
    timestamp,
    clip(row.sessionId, 255),
    row.eventType,
    clip(row.pageCategory, 255),
    row.pageUrl ?? null,
    null,
    clip(row.articleSlug, 255),
    clip(row.articleContext, 255),
    clip(row.ctaType, 100),
    row.depthPercent ?? null,
    row.referrer ?? null,
    row.deviceInfo ? JSON.stringify(row.deviceInfo) : null,
    clip(row.ipAddress, 45),
    row.ipGeolocation ? JSON.stringify(row.ipGeolocation) : null,
    row.userAgent ?? null,
    timestamp,
    clip(row.pageTitle, 255),
    clip(row.deviceType, 32),
    clip(row.os, 32),
    clip(row.browser, 32),
    clip(row.visitorId, 64),
    row.userId ?? null,
    clip(row.userName, 255),
    clip(row.userEmail, 255),
  ];

  try {
    await query(
      `INSERT INTO app_events
        (app_name, timestamp, session_id, event_type, page_category, page_url,
         article_id, article_slug, article_context, cta_type, depth_percent,
         referrer, device_info, ip_address, ip_geolocation, user_agent, created_at,
         page_title, device_type, os, browser, visitor_id,
         user_id, user_name, user_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args
    );
  } catch (e) {
    if (!isUnknownColumnError(e, 'user_id') && !isUnknownColumnError(e, 'user_email')) {
      throw e;
    }
    await query(
      `INSERT INTO app_events
        (app_name, timestamp, session_id, event_type, page_category, page_url,
         article_id, article_slug, article_context, cta_type, depth_percent,
         referrer, device_info, ip_address, ip_geolocation, user_agent, created_at,
         page_title, device_type, os, browser, visitor_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args.slice(0, 22)
    );
  }
}
