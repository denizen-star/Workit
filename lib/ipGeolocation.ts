// Server-only IP geo. ip-api.com primary, ipapi.co fallback. 1h in-process cache.

export type IpGeoResult = {
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  timezone?: string;
};

const cache = new Map<string, { result: IpGeoResult; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 3000;

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fromIpApi(ip: string): Promise<IpGeoResult | null> {
  try {
    const res = await fetchWithTimeout(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,lat,lon,isp,timezone`,
      TIMEOUT_MS
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'success') return null;
    return {
      country: data.country,
      country_code: data.countryCode,
      region: data.regionName,
      city: data.city,
      latitude: data.lat,
      longitude: data.lon,
      isp: data.isp,
      timezone: data.timezone,
    };
  } catch {
    return null;
  }
}

async function fromIpApiCo(ip: string): Promise<IpGeoResult | null> {
  try {
    const res = await fetchWithTimeout(
      `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
      TIMEOUT_MS
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return {
      country: data.country_name,
      country_code: data.country_code,
      region: data.region,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      isp: data.org,
      timezone: data.timezone,
    };
  } catch {
    return null;
  }
}

export async function getGeolocationFromIP(ip: string): Promise<IpGeoResult | null> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') return null;

  const cached = cache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const result = (await fromIpApi(ip)) ?? (await fromIpApiCo(ip));
  if (result) {
    cache.set(ip, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  }
  return result;
}
