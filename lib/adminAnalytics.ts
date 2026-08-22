import { query } from '@/lib/db';
import { APP_NAME } from '@/lib/analyticsTypes';
import {
  easternHourLabel,
  easternYmd,
  geoActive,
  resolveAllTimeWindow,
  resolveAnalyticsWindow,
  sqlUtc,
  toNum,
  type AnalyticsRangeId,
  type DeviceFilter,
  type GeoFilter,
} from '@/lib/analyticsTime';

export type AdminAnalyticsPayload = {
  range: AnalyticsRangeId;
  bucket: 'hour' | 'day';
  labels: string[];
  device: DeviceFilter;
  personUserId: number | null;
  funnel: {
    sessions: number;
    pageViews: number;
    logins: number;
    starts: number;
    completes: number;
  };
  sessions: number[];
  pageViews: number[];
  sessionsCumulative: number[];
  pageViewsCumulative: number[];
  avgByWeekday: { label: string; sessions: number; pageViews: number }[];
  avgByHour: { hour: string; sessions: number; pageViews: number }[];
  devices: { name: string; count: number }[];
  geo: { country: string; region: string; city: string; events: number }[];
  events: { type: string; count: number }[];
  ctas: { type: string; count: number }[];
  sessionDepth: { bucket: string; count: number }[];
  exitRate: { url: string; views: number; exits: number; rate: number }[];
  people: {
    userId: number | null;
    name: string;
    email: string;
    events: number;
  }[];
  recent: {
    at: string;
    eventType: string;
    name: string;
    email: string;
    pageCategory: string;
    ctaType: string;
    context: string;
  }[];
};

function scopeSql(
  device: DeviceFilter,
  geo: GeoFilter,
  personUserId: number | null,
  alias = ''
): { sql: string; args: Array<string | number> } {
  const col = (name: string) => (alias ? `${alias}.${name}` : name);
  const parts: string[] = [];
  const args: Array<string | number> = [];

  if (device === 'unknown') {
    parts.push(`(${col('device_type')} IS NULL OR ${col('device_type')} = '')`);
  } else if (device !== 'all') {
    parts.push(`${col('device_type')} = ?`);
    args.push(device);
  }

  if (personUserId != null) {
    parts.push(`${col('user_id')} = ?`);
    args.push(personUserId);
  }

  if (geoActive(geo)) {
    const geoCol = col('ip_geolocation');
    const countryExpr = `JSON_UNQUOTE(JSON_EXTRACT(${geoCol}, '$.country'))`;
    const regionExpr = `JSON_UNQUOTE(JSON_EXTRACT(${geoCol}, '$.region'))`;
    const cityExpr = `JSON_UNQUOTE(JSON_EXTRACT(${geoCol}, '$.city'))`;
    const unknownSql = `(${geoCol} IS NULL OR ${countryExpr} IS NULL OR ${countryExpr} = '' OR ${countryExpr} = 'null')`;
    const orParts: string[] = [];
    if (geo.countries.length || geo.regions.length || geo.cities.length) {
      const known: string[] = [`${geoCol} IS NOT NULL`, `NOT (${unknownSql})`];
      if (geo.countries.length) {
        known.push(`${countryExpr} IN (${geo.countries.map(() => '?').join(',')})`);
        args.push(...geo.countries);
      }
      if (geo.regions.length) {
        known.push(`${regionExpr} IN (${geo.regions.map(() => '?').join(',')})`);
        args.push(...geo.regions);
      }
      if (geo.cities.length) {
        known.push(`${cityExpr} IN (${geo.cities.map(() => '?').join(',')})`);
        args.push(...geo.cities);
      }
      orParts.push(`(${known.join(' AND ')})`);
    }
    if (geo.includeUnknown) orParts.push(`(${unknownSql})`);
    if (orParts.length) parts.push(`(${orParts.join(' OR ')})`);
  }

  return { sql: parts.length ? ` AND ${parts.join(' AND ')}` : '', args };
}

function runningSum(values: number[]): number[] {
  let total = 0;
  return values.map((v) => {
    total += v;
    return total;
  });
}

export async function fetchAdminAnalytics(opts: {
  range: AnalyticsRangeId;
  device: DeviceFilter;
  geo: GeoFilter;
  personUserId: number | null;
}): Promise<AdminAnalyticsPayload> {
  let win =
    opts.range === 'all'
      ? await resolveAllTimeWindow(null)
      : resolveAnalyticsWindow(opts.range);

  if (opts.range === 'all') {
    const earliest = await query(
      `SELECT MIN(timestamp) AS d FROM app_events WHERE app_name = ?`,
      [APP_NAME]
    );
    const raw = (earliest.rows[0] as { d?: string | Date } | undefined)?.d;
    const ymd = raw ? easternYmd(new Date(raw)) : null;
    win = await resolveAllTimeWindow(ymd);
  }

  const { sql: scope, args: scopeArgs } = scopeSql(opts.device, opts.geo, opts.personUserId);
  const start = sqlUtc(win.rangeStartUtc);
  const end = sqlUtc(win.rangeEndExclusiveUtc);
  const baseArgs = [APP_NAME, start, end, ...scopeArgs];
  const where = `app_name = ? AND timestamp >= ? AND timestamp < ?${scope}`;

  const funnelRows = await query(
    `SELECT
       COUNT(DISTINCT session_id) AS sessions,
       COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END) AS pageViews,
       COUNT(DISTINCT CASE WHEN event_type = 'login' THEN session_id END) AS logins,
       COUNT(DISTINCT CASE WHEN event_type = 'workout_start' THEN session_id END) AS starts,
       COUNT(DISTINCT CASE WHEN event_type = 'workout_complete' THEN session_id END) AS completes
     FROM app_events WHERE ${where}`,
    baseArgs
  );
  const f = funnelRows.rows[0] as Record<string, unknown>;

  const timeRows = await query(
    `SELECT UNIX_TIMESTAMP(timestamp) AS t, session_id, event_type
     FROM app_events WHERE ${where}`,
    baseArgs
  );

  const labelSet = new Set(win.labels);
  const sessionsMap = new Map<string, Set<string>>();
  const pageViewsMap = new Map<string, number>();
  const weekdaySessions = new Map<string, Set<string>>();
  const weekdayViews = new Map<string, number>();
  const weekdayDays = new Map<string, Set<string>>();
  const hourSessions = new Map<number, Set<string>>();
  const hourViews = new Map<number, number>();
  const hourDays = new Map<number, Set<string>>();

  for (let i = 0; i < 7; i++) {
    weekdaySessions.set(String(i), new Set());
    weekdayViews.set(String(i), 0);
    weekdayDays.set(String(i), new Set());
  }
  for (let h = 0; h < 24; h++) {
    hourSessions.set(h, new Set());
    hourViews.set(h, 0);
    hourDays.set(h, new Set());
  }

  for (const row of timeRows.rows as { t: number; session_id: string | null; event_type: string }[]) {
    const date = new Date(toNum(row.t) * 1000);
    const key = win.bucket === 'hour' ? easternHourLabel(date) : easternYmd(date);
    const ymd = easternYmd(date);
    const hour = Number(easternHourLabel(date).slice(11, 13));
    const dow = String(new Date(`${ymd}T12:00:00-05:00`).getDay());

    weekdayDays.get(dow)?.add(ymd);
    hourDays.get(hour)?.add(ymd);

    if (row.session_id) {
      if (labelSet.has(key)) {
        if (!sessionsMap.has(key)) sessionsMap.set(key, new Set());
        sessionsMap.get(key)!.add(row.session_id);
      }
      weekdaySessions.get(dow)?.add(row.session_id);
      hourSessions.get(hour)?.add(row.session_id);
    }
    if (row.event_type === 'page_view') {
      if (labelSet.has(key)) pageViewsMap.set(key, (pageViewsMap.get(key) ?? 0) + 1);
      weekdayViews.set(dow, (weekdayViews.get(dow) ?? 0) + 1);
      hourViews.set(hour, (hourViews.get(hour) ?? 0) + 1);
    }
  }

  const sessions = win.labels.map((l) => sessionsMap.get(l)?.size ?? 0);
  const pageViews = win.labels.map((l) => pageViewsMap.get(l) ?? 0);

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const avgByWeekday = weekdayLabels.map((label, i) => {
    const days = weekdayDays.get(String(i))?.size || 1;
    return {
      label,
      sessions: Number(((weekdaySessions.get(String(i))?.size ?? 0) / days).toFixed(2)),
      pageViews: Number(((weekdayViews.get(String(i)) ?? 0) / days).toFixed(2)),
    };
  });

  const avgByHour = Array.from({ length: 24 }, (_, h) => {
    const days = hourDays.get(h)?.size || 1;
    return {
      hour: String(h).padStart(2, '0'),
      sessions: Number(((hourSessions.get(h)?.size ?? 0) / days).toFixed(2)),
      pageViews: Number(((hourViews.get(h) ?? 0) / days).toFixed(2)),
    };
  });

  const deviceRows = await query(
    `SELECT COALESCE(NULLIF(device_type, ''), 'unknown') AS name, COUNT(*) AS count
     FROM app_events WHERE ${where}
     GROUP BY name ORDER BY count DESC`,
    baseArgs
  );

  const geoRows = await query(
    `SELECT
       COALESCE(JSON_UNQUOTE(JSON_EXTRACT(ip_geolocation, '$.country')), 'Unknown') AS country,
       COALESCE(JSON_UNQUOTE(JSON_EXTRACT(ip_geolocation, '$.region')), 'Unknown') AS region,
       COALESCE(JSON_UNQUOTE(JSON_EXTRACT(ip_geolocation, '$.city')), 'Unknown') AS city,
       COUNT(*) AS events
     FROM app_events WHERE ${where}
     GROUP BY country, region, city
     ORDER BY events DESC
     LIMIT 40`,
    baseArgs
  );

  const eventRows = await query(
    `SELECT event_type AS type, COUNT(*) AS count
     FROM app_events WHERE ${where}
     GROUP BY event_type ORDER BY count DESC`,
    baseArgs
  );

  const ctaRows = await query(
    `SELECT cta_type AS type, COUNT(*) AS count
     FROM app_events
     WHERE ${where} AND cta_type IS NOT NULL AND cta_type != ''
     GROUP BY cta_type ORDER BY count DESC`,
    baseArgs
  );

  const depthRows = await query(
    `SELECT session_id, COUNT(*) AS n
     FROM app_events
     WHERE ${where} AND session_id IS NOT NULL AND session_id != ''
     GROUP BY session_id`,
    baseArgs
  );

  const depthBuckets = new Map<string, number>([
    ['1', 0],
    ['2-3', 0],
    ['4-7', 0],
    ['8-15', 0],
    ['16+', 0],
  ]);
  for (const row of depthRows.rows as { n: number }[]) {
    const n = toNum(row.n);
    const key = n <= 1 ? '1' : n <= 3 ? '2-3' : n <= 7 ? '4-7' : n <= 15 ? '8-15' : '16+';
    depthBuckets.set(key, (depthBuckets.get(key) ?? 0) + 1);
  }

  const pageRows = await query(
    `SELECT page_url AS url, session_id, event_type, UNIX_TIMESTAMP(timestamp) AS t
     FROM app_events
     WHERE ${where} AND page_url IS NOT NULL AND page_url != '' AND event_type IN ('page_view', 'page_exit')`,
    baseArgs
  );

  const lastBySession = new Map<string, { url: string; t: number }>();
  const viewsByUrl = new Map<string, number>();
  for (const row of pageRows.rows as { url: string; session_id: string; event_type: string; t: number }[]) {
    if (!row.session_id || !row.url) continue;
    if (row.event_type === 'page_view') {
      viewsByUrl.set(row.url, (viewsByUrl.get(row.url) ?? 0) + 1);
    }
    const t = toNum(row.t);
    const prev = lastBySession.get(row.session_id);
    if (!prev || t >= prev.t) lastBySession.set(row.session_id, { url: row.url, t });
  }
  const exitsByUrl = new Map<string, number>();
  for (const last of lastBySession.values()) {
    exitsByUrl.set(last.url, (exitsByUrl.get(last.url) ?? 0) + 1);
  }
  const exitRate = [...viewsByUrl.entries()]
    .map(([url, views]) => {
      const exits = exitsByUrl.get(url) ?? 0;
      return { url, views, exits, rate: views ? Number((exits / views).toFixed(2)) : 0 };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  const peopleRows = await query(
    `SELECT user_id AS userId, MAX(user_name) AS name, MAX(user_email) AS email, COUNT(*) AS events
     FROM app_events
     WHERE ${where} AND user_id IS NOT NULL
     GROUP BY user_id
     ORDER BY events DESC`,
    baseArgs
  );
  const unsigned = await query(
    `SELECT COUNT(*) AS events FROM app_events WHERE ${where} AND user_id IS NULL`,
    baseArgs
  );
  const people: AdminAnalyticsPayload['people'] = (
    peopleRows.rows as { userId: number; name: string | null; email: string | null; events: number }[]
  ).map((r) => ({
    userId: toNum(r.userId),
    name: r.name || 'Unknown',
    email: r.email || '',
    events: toNum(r.events),
  }));
  const unsignedN = toNum((unsigned.rows[0] as { events?: number } | undefined)?.events);
  if (unsignedN > 0 && opts.personUserId == null) {
    people.push({ userId: null, name: 'Unsigned', email: '', events: unsignedN });
  }

  const recentRows = await query(
    `SELECT timestamp AS at, event_type AS eventType, user_name AS name, user_email AS email,
            page_category AS pageCategory, cta_type AS ctaType, article_context AS context
     FROM app_events
     WHERE ${where}
     ORDER BY timestamp DESC
     LIMIT 40`,
    baseArgs
  );

  return {
    range: opts.range,
    bucket: win.bucket,
    labels: win.labels,
    device: opts.device,
    personUserId: opts.personUserId,
    funnel: {
      sessions: toNum(f?.sessions as number | undefined),
      pageViews: toNum(f?.pageViews as number | undefined),
      logins: toNum(f?.logins as number | undefined),
      starts: toNum(f?.starts as number | undefined),
      completes: toNum(f?.completes as number | undefined),
    },
    sessions,
    pageViews,
    sessionsCumulative: runningSum(sessions),
    pageViewsCumulative: runningSum(pageViews),
    avgByWeekday,
    avgByHour,
    devices: (deviceRows.rows as { name: string; count: number }[]).map((r) => ({
      name: r.name,
      count: toNum(r.count),
    })),
    geo: (geoRows.rows as { country: string; region: string; city: string; events: number }[]).map((r) => ({
      country: r.country,
      region: r.region,
      city: r.city,
      events: toNum(r.events),
    })),
    events: (eventRows.rows as { type: string; count: number }[]).map((r) => ({
      type: r.type,
      count: toNum(r.count),
    })),
    ctas: (ctaRows.rows as { type: string; count: number }[]).map((r) => ({
      type: r.type,
      count: toNum(r.count),
    })),
    sessionDepth: [...depthBuckets.entries()].map(([bucket, count]) => ({ bucket, count })),
    exitRate,
    people,
    recent: (recentRows.rows as {
      at: string;
      eventType: string;
      name: string | null;
      email: string | null;
      pageCategory: string | null;
      ctaType: string | null;
      context: string | null;
    }[]).map((r) => ({
      at: String(r.at),
      eventType: r.eventType,
      name: r.name || 'Unsigned',
      email: r.email || '',
      pageCategory: r.pageCategory || '',
      ctaType: r.ctaType || '',
      context: r.context || '',
    })),
  };
}
