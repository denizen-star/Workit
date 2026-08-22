import { getCurrentUser } from '@/lib/auth';
import { ALLOWED_EVENT_TYPE_SET, isProductionAnalytics } from '@/lib/analyticsTypes';
import { writeAppEvent, type AppEventRow } from '@/lib/writeAppEvent';

export type ServerEventInput = {
  eventType: string;
  pageCategory?: string | null;
  pageUrl?: string | null;
  ctaType?: string | null;
  articleContext?: string | null;
  articleSlug?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/** Fire-and-forget server insert. Production only. Stamps session user when present. */
export async function trackServerEvent(payload: ServerEventInput): Promise<void> {
  if (!isProductionAnalytics()) return;
  if (!ALLOWED_EVENT_TYPE_SET.has(payload.eventType)) return;

  try {
    const user = await getCurrentUser();
    const row: AppEventRow = {
      eventType: payload.eventType,
      pageCategory: payload.pageCategory,
      pageUrl: payload.pageUrl,
      ctaType: payload.ctaType,
      articleContext: payload.articleContext,
      articleSlug: payload.articleSlug,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      userEmail: user?.email ?? null,
    };
    await writeAppEvent(row);
  } catch (err) {
    console.error('[trackServerEvent] failed:', err);
  }
}
