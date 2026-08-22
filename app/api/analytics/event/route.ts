import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getGeolocationFromIP } from '@/lib/ipGeolocation';
import { ALLOWED_EVENT_TYPE_SET, isProductionAnalytics } from '@/lib/analyticsTypes';
import { writeAppEvent } from '@/lib/writeAppEvent';
import {
  extractClientIp,
  parseBrowserFromUserAgent,
  parseOsFromUserAgent,
} from '@/lib/clientMeta';

export async function POST(req: NextRequest) {
  if (!isProductionAnalytics()) {
    return new NextResponse(null, { status: 204 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const eventType = typeof body.event_type === 'string' ? body.event_type : null;
  if (!eventType || !ALLOWED_EVENT_TYPE_SET.has(eventType)) {
    return NextResponse.json({ error: 'invalid event_type' }, { status: 400 });
  }

  const ip = extractClientIp(req);
  const userAgent = req.headers.get('user-agent');
  let ipGeolocation: Record<string, unknown> | null = null;
  try {
    const geo = await getGeolocationFromIP(ip);
    if (geo) ipGeolocation = geo as Record<string, unknown>;
  } catch {
    // best-effort
  }

  const deviceInfo =
    body.device_info && typeof body.device_info === 'object'
      ? (body.device_info as Record<string, unknown>)
      : null;

  const user = await getCurrentUser();

  try {
    await writeAppEvent({
      eventType,
      sessionId: typeof body.session_id === 'string' ? body.session_id : null,
      visitorId: typeof body.visitor_id === 'string' ? body.visitor_id : null,
      pageCategory: typeof body.page_category === 'string' ? body.page_category : null,
      pageUrl: typeof body.page_url === 'string' ? body.page_url : null,
      pageTitle: typeof body.page_title === 'string' ? body.page_title : null,
      articleSlug: typeof body.article_slug === 'string' ? body.article_slug : null,
      articleContext: typeof body.article_context === 'string' ? body.article_context : null,
      ctaType: typeof body.cta_type === 'string' ? body.cta_type : null,
      depthPercent: typeof body.depth_percent === 'number' ? body.depth_percent : null,
      referrer: typeof body.referrer === 'string' ? body.referrer : null,
      deviceInfo,
      deviceType:
        typeof body.device_type === 'string'
          ? body.device_type
          : deviceInfo && typeof deviceInfo.device_type === 'string'
            ? String(deviceInfo.device_type)
            : null,
      os: parseOsFromUserAgent(userAgent),
      browser: parseBrowserFromUserAgent(userAgent),
      ipAddress: ip || null,
      ipGeolocation,
      userAgent,
      timestamp: typeof body.timestamp === 'string' ? body.timestamp : undefined,
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      userEmail: user?.email ?? null,
    });
  } catch (err) {
    console.error('[analytics/event] DB write failed:', err);
  }

  return new NextResponse(null, { status: 204 });
}
