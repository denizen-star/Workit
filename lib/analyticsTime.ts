import { addDays, addHours, addMonths } from 'date-fns';

export const ANALYTICS_TIME_ZONE = 'America/New_York';
export type AnalyticsRangeId = 'today' | 'yesterday' | '7d' | '30d' | 'mom' | 'all';
export type AnalyticsBucket = 'hour' | 'day';
export type DeviceFilter = 'all' | 'mobile' | 'tablet' | 'desktop' | 'unknown';

export type GeoFilter = {
  countries: string[];
  regions: string[];
  cities: string[];
  includeUnknown: boolean;
};

export const EMPTY_GEO: GeoFilter = {
  countries: [],
  regions: [],
  cities: [],
  includeUnknown: false,
};

export function sqlUtc(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function easternYmd(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ANALYTICS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function easternHourLabel(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ANALYTICS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:00:00`;
}

function easternHour(d: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: ANALYTICS_TIME_ZONE,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(d)
  );
}

export function easternMidnightUtc(ymd: string): Date {
  for (const offset of ['-05:00', '-04:00'] as const) {
    const guess = new Date(`${ymd}T00:00:00${offset}`);
    if (easternYmd(guess) === ymd && easternHour(guess) === 0) return guess;
  }
  return new Date(`${ymd}T00:00:00-05:00`);
}

/** 0 = Sunday … 6 = Saturday in America/New_York. */
export function easternWeekday(d: Date = new Date()): number {
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: ANALYTICS_TIME_ZONE,
    weekday: 'short',
  }).format(d);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(label);
}

export function isEasternWeekend(d: Date = new Date()): boolean {
  const day = easternWeekday(d);
  return day === 0 || day === 6;
}

/** Monday YMD of the Eastern calendar week containing `d`. */
export function easternMondayKey(d: Date = new Date()): string {
  const ymd = easternYmd(d);
  const weekday = easternWeekday(d);
  const back = weekday === 0 ? 6 : weekday - 1;
  return addEasternCalendarDays(ymd, -back);
}

export function addEasternCalendarDays(ymd: string, delta: number): string {
  const noon = new Date(`${ymd}T12:00:00-05:00`);
  return easternYmd(addDays(noon, delta));
}

function buildDayLabels(startYmd: string, endYmdInclusive: string): string[] {
  const labels: string[] = [];
  let cur = startYmd;
  while (cur <= endYmdInclusive) {
    labels.push(cur);
    cur = addEasternCalendarDays(cur, 1);
  }
  return labels;
}

function buildHourLabels(dayStartUtc: Date, lastInstantUtc: Date): string[] {
  const labels: string[] = [];
  let cursor = dayStartUtc;
  while (cursor <= lastInstantUtc) {
    labels.push(easternHourLabel(cursor));
    cursor = addHours(cursor, 1);
  }
  return labels;
}

export type AnalyticsWindow = {
  bucket: AnalyticsBucket;
  labels: string[];
  rangeStartUtc: Date;
  rangeEndExclusiveUtc: Date;
};

export function resolveAnalyticsWindow(range: AnalyticsRangeId, now = new Date()): AnalyticsWindow {
  const ymdToday = easternYmd(now);
  const todayStartUtc = easternMidnightUtc(ymdToday);
  const tomorrowStartUtc = addDays(todayStartUtc, 1);

  if (range === 'today') {
    return {
      bucket: 'hour',
      labels: buildHourLabels(todayStartUtc, now),
      rangeStartUtc: todayStartUtc,
      rangeEndExclusiveUtc: tomorrowStartUtc,
    };
  }

  if (range === 'yesterday') {
    const ymdY = addEasternCalendarDays(ymdToday, -1);
    const yStart = easternMidnightUtc(ymdY);
    const yEndEx = addDays(yStart, 1);
    return {
      bucket: 'hour',
      labels: buildHourLabels(yStart, addHours(yEndEx, -1)),
      rangeStartUtc: yStart,
      rangeEndExclusiveUtc: yEndEx,
    };
  }

  if (range === 'all') {
    return {
      bucket: 'day',
      labels: buildDayLabels(addEasternCalendarDays(ymdToday, -89), ymdToday),
      rangeStartUtc: easternMidnightUtc(addEasternCalendarDays(ymdToday, -89)),
      rangeEndExclusiveUtc: tomorrowStartUtc,
    };
  }

  let startYmd: string;
  if (range === '7d') startYmd = addEasternCalendarDays(ymdToday, -6);
  else if (range === '30d') startYmd = addEasternCalendarDays(ymdToday, -29);
  else {
    const y = Number(ymdToday.slice(0, 4));
    const m = Number(ymdToday.slice(5, 7));
    startYmd = easternYmd(addMonths(new Date(`${y}-${pad2(m)}-01T12:00:00-05:00`), -1));
  }

  return {
    bucket: 'day',
    labels: buildDayLabels(startYmd, ymdToday),
    rangeStartUtc: easternMidnightUtc(startYmd),
    rangeEndExclusiveUtc: tomorrowStartUtc,
  };
}

export async function resolveAllTimeWindow(
  earliestYmd: string | null,
  now = new Date()
): Promise<AnalyticsWindow> {
  const ymdToday = easternYmd(now);
  const startYmd = earliestYmd ?? ymdToday;
  return {
    bucket: 'day',
    labels: buildDayLabels(startYmd, ymdToday),
    rangeStartUtc: easternMidnightUtc(startYmd),
    rangeEndExclusiveUtc: addDays(easternMidnightUtc(ymdToday), 1),
  };
}

export function parseRange(raw: string | null): AnalyticsRangeId {
  const allowed: AnalyticsRangeId[] = ['today', 'yesterday', '7d', '30d', 'mom', 'all'];
  if (raw && allowed.includes(raw as AnalyticsRangeId)) return raw as AnalyticsRangeId;
  return '30d';
}

export function parseDevice(raw: string | null): DeviceFilter {
  const allowed: DeviceFilter[] = ['all', 'mobile', 'tablet', 'desktop', 'unknown'];
  if (raw && allowed.includes(raw as DeviceFilter)) return raw as DeviceFilter;
  return 'all';
}

export function parseGeo(sp: URLSearchParams): GeoFilter {
  const split = (key: string) =>
    sp
      .getAll(key)
      .flatMap((v) => v.split(','))
      .map((v) => v.trim())
      .filter(Boolean)
      .slice(0, 40);
  return {
    countries: split('geoCountry'),
    regions: split('geoRegion'),
    cities: split('geoCity'),
    includeUnknown: sp.get('geoUnknown') === '1' || sp.get('geoUnknown') === 'true',
  };
}

export function geoActive(geo: GeoFilter): boolean {
  return geo.countries.length > 0 || geo.regions.length > 0 || geo.cities.length > 0 || geo.includeUnknown;
}

export function toNum(val: number | bigint | string | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'bigint' ? Number(val) : Number(val);
  return Number.isFinite(n) ? n : 0;
}
