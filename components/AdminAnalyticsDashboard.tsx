'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ExerciseCompareCells from '@/components/ExerciseCompareCells';
import WeightRanking from '@/components/WeightRanking';
import AdminAthletePerformance from '@/components/AdminAthletePerformance';
import type { AdminAnalyticsPayload } from '@/lib/adminAnalytics';
import type { AnalyticsRangeId, DeviceFilter } from '@/lib/analyticsTime';
import type { ExerciseCompareRow, WeightRank } from '@/lib/exerciseCompare';

const tooltipStyle = {
  backgroundColor: 'rgba(12, 12, 16, 0.92)',
  border: '1px solid rgba(232, 197, 71, 0.35)',
  borderRadius: 12,
  color: '#f6f1e3',
};

const RANGES: { id: AnalyticsRangeId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'mom', label: 'Mo / Mo' },
  { id: 'all', label: 'All' },
];

const DEVICES: { id: DeviceFilter; label: string }[] = [
  { id: 'all', label: 'All devices' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'unknown', label: 'Unknown' },
];

function shortLabel(label: string) {
  if (label.length >= 16) return label.slice(11, 16);
  return label.slice(5);
}

function hasCount(value: unknown) {
  const amount = Number(value);
  return value != null && Number.isFinite(amount) && amount > 0;
}

function TrafficTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: unknown; color?: string; dataKey?: string }[];
  label?: string;
}) {
  if (!active || !payload) return null;
  const items = payload.filter((item) => hasCount(item.value));
  if (items.length === 0) return null;
  return (
    <div className="px-3 py-2 text-xs" style={tooltipStyle}>
      <p className="mb-1 font-semibold text-[#e8c547]">{label}</p>
      {items.map((item) => (
        <p key={String(item.dataKey)} style={{ color: item.color || '#f6f1e3' }}>
          {item.name}: {Math.round(Number(item.value)).toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function TrafficTrendChart({
  data,
  lines,
  height,
}: {
  data: Record<string, string | number | null>[];
  lines: { key: string; name: string; color: string }[];
  height: number;
}) {
  const visible = lines.filter((line) => data.some((row) => hasCount(row[line.key])));
  if (data.length === 0 || visible.length === 0) {
    return <p className="text-sm text-[#f6f1e3]/55">No traffic in this window.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="label" tick={{ fill: '#e8c547', fontSize: 11 }} />
        <YAxis tick={{ fill: '#f6f1e3', fontSize: 11 }} allowDecimals={false} />
        <Tooltip content={<TrafficTooltip />} filterNull />
        <Legend />
        {visible.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function shortUrl(url: string) {
  try {
    const u = new URL(url);
    return u.pathname || url;
  } catch {
    return url;
  }
}

export default function AdminAnalyticsDashboard() {
  const [range, setRange] = useState<AnalyticsRangeId>('30d');
  const [device, setDevice] = useState<DeviceFilter>('all');
  const [country, setCountry] = useState('');
  const [unknownGeo, setUnknownGeo] = useState(false);
  const [person, setPerson] = useState('');
  const [data, setData] = useState<AdminAnalyticsPayload | null>(null);
  const [compareRows, setCompareRows] = useState<ExerciseCompareRow[]>([]);
  const [compareRanking, setCompareRanking] = useState<WeightRank[]>([]);
  const [compareReady, setCompareReady] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ range, device });
      if (country) params.set('geoCountry', country);
      if (unknownGeo) params.set('geoUnknown', '1');
      if (person) params.set('userId', person);
      const res = await fetch('/api/admin/analytics?' + params.toString());
      if (res.status === 401 || res.status === 403) {
        setError('Admin only');
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError('Could not load analytics');
        setLoading(false);
        return;
      }
      const json = (await res.json()) as AdminAnalyticsPayload;
      if (!cancelled) {
        setData(json);
        setLoading(false);
      }
    };
    load().catch(() => {
      if (!cancelled) {
        setError('Could not load analytics');
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [range, device, country, unknownGeo, person]);

  useEffect(() => {
    let cancelled = false;
    setCompareReady(false);
    fetch('/api/exercise-compare?range=' + range)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        setCompareRows(Array.isArray(json?.rows) ? json.rows : []);
        setCompareRanking(Array.isArray(json?.ranking) ? json.ranking : []);
        setCompareReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setCompareRows([]);
          setCompareRanking([]);
          setCompareReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const series = useMemo(() => {
    if (!data) return [];
    let sessionsCum = 0;
    let pageViewsCum = 0;
    return data.labels.flatMap((label, index) => {
      const sessions = Number(data.sessions[index] || 0);
      const pageViews = Number(data.pageViews[index] || 0);
      if (sessions <= 0 && pageViews <= 0) return [];
      sessionsCum += Math.max(0, sessions);
      pageViewsCum += Math.max(0, pageViews);
      return [
        {
          label: shortLabel(label),
          sessions: sessions > 0 ? sessions : null,
          pageViews: pageViews > 0 ? pageViews : null,
          sessionsCum: sessionsCum > 0 ? sessionsCum : null,
          pageViewsCum: pageViewsCum > 0 ? pageViewsCum : null,
        },
      ];
    });
  }, [data]);

  const countries = useMemo(() => {
    const set = new Set(data?.geo.map((g) => g.country).filter((c) => c && c !== 'Unknown'));
    return [...set].sort();
  }, [data]);

  const peopleOptions = data?.people.filter((p) => p.userId != null) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {RANGES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setRange(item.id)}
            className={`min-h-10 rounded-2xl px-3 text-sm font-black ${
              range === item.id ? 'bg-[#e8c547] text-[#1a1404]' : 'border border-white/10 text-[#f6f1e3]/70'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {DEVICES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setDevice(item.id)}
            className={`min-h-10 rounded-2xl px-3 text-sm font-semibold ${
              device === item.id ? 'bg-white/10 text-white' : 'border border-white/10 text-[#f6f1e3]/60'
            }`}
          >
            {item.label}
          </button>
        ))}
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="min-h-10 rounded-2xl border border-white/10 bg-[#12121a] px-3 text-sm text-white"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/10 px-3 text-sm text-[#f6f1e3]/70">
          <input type="checkbox" checked={unknownGeo} onChange={(e) => setUnknownGeo(e.target.checked)} />
          Unknown geo
        </label>
        <select
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          className="min-h-10 rounded-2xl border border-white/10 bg-[#12121a] px-3 text-sm text-white"
        >
          <option value="">All people</option>
          {peopleOptions.map((p) => (
            <option key={p.userId ?? 'x'} value={String(p.userId)}>
              {p.name}
              {p.email ? ` · ${p.email}` : ''}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm font-semibold text-rose-400">{error}</p>}
      {loading && <p className="text-sm text-[#f6f1e3]/55">Loading…</p>}

      {compareReady && (
        <section className="glass-card p-5">
          <button
            type="button"
            onClick={() => setCompareOpen((current) => !current)}
            className="flex w-full items-center gap-2 text-left"
            aria-expanded={compareOpen}
          >
            <h3 className="text-lg font-black text-white">Vs the house</h3>
            <span className="ml-auto text-sm text-[#f6f1e3]/65">
              {compareRows.length ? `${compareRows.length} athletes` : 'Empty'}
            </span>
            {compareOpen ? (
              <ChevronUp className="h-5 w-5 text-[#f6f1e3]/65" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#f6f1e3]/65" />
            )}
          </button>
          {compareOpen && (
            <div className="mt-4">
              <p className="mb-4 text-sm text-[#f6f1e3]/60">
                Best day and total weight are after Effort. Place stays on raw iron. Follows the
                range above.
              </p>
              {compareRows.length === 0 ? (
                <p className="text-sm text-[#f6f1e3]/55">No finished workouts in this range.</p>
              ) : (
                <div className="space-y-4">
                  <WeightRanking ranking={compareRanking} names="full" />
                  {compareRows.map((row) => (
                    <div key={row.userId} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                      <p className="mb-3 text-lg font-black text-white">{row.name}</p>
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#e8c547]">
                        By weight
                      </p>
                      <ExerciseCompareCells trio={row.weight} athleteName={row.name} layout="row" />
                      <p className="mb-2 mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#e8c547]">
                        By reps
                      </p>
                      <ExerciseCompareCells trio={row.reps} athleteName={row.name} layout="row" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <AdminAthletePerformance filterUserId={person} />

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {(
              [
                ['Sessions', data.funnel.sessions],
                ['Page views', data.funnel.pageViews],
                ['Logins', data.funnel.logins],
                ['Starts', data.funnel.starts],
                ['Completes', data.funnel.completes],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="glass-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e8c547]">{label}</p>
                <p className="mt-2 text-3xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          <section className="glass-card p-5">
            <h3 className="mb-4 text-lg font-black text-white">Sessions + page views</h3>
            <TrafficTrendChart
              data={series}
              height={280}
              lines={[
                { key: 'sessions', name: 'sessions', color: '#e8c547' },
                { key: 'pageViews', name: 'page views', color: '#f6f1e3' },
              ]}
            />
          </section>

          <section className="glass-card p-5">
            <h3 className="mb-4 text-lg font-black text-white">Cumulative</h3>
            <TrafficTrendChart
              data={series}
              height={240}
              lines={[
                { key: 'sessionsCum', name: 'sessions', color: '#e8c547' },
                { key: 'pageViewsCum', name: 'page views', color: '#f6f1e3' },
              ]}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="glass-card p-5">
              <h3 className="mb-4 text-lg font-black text-white">Avg by weekday</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.avgByWeekday}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" tick={{ fill: '#e8c547' }} />
                  <YAxis tick={{ fill: '#f6f1e3', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="sessions" fill="#e8c547" />
                  <Bar dataKey="pageViews" fill="#8a7a4a" />
                </BarChart>
              </ResponsiveContainer>
            </section>
            <section className="glass-card p-5">
              <h3 className="mb-4 text-lg font-black text-white">Avg by hour (EST)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.avgByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="hour" tick={{ fill: '#e8c547', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#f6f1e3', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="sessions" fill="#e8c547" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="glass-card p-5">
              <h3 className="mb-4 text-lg font-black text-white">Events</h3>
              <BarList rows={data.events.map((e) => ({ label: e.type, value: e.count }))} />
            </section>
            <section className="glass-card p-5">
              <h3 className="mb-4 text-lg font-black text-white">CTAs</h3>
              <BarList rows={data.ctas.map((e) => ({ label: e.type, value: e.count }))} />
            </section>
            <section className="glass-card p-5">
              <h3 className="mb-4 text-lg font-black text-white">Device</h3>
              <BarList rows={data.devices.map((e) => ({ label: e.name, value: e.count }))} />
            </section>
            <section className="glass-card p-5">
              <h3 className="mb-4 text-lg font-black text-white">Session depth</h3>
              <BarList rows={data.sessionDepth.map((e) => ({ label: e.bucket, value: e.count }))} />
            </section>
          </div>

          <section className="glass-card p-5">
            <h3 className="mb-4 text-lg font-black text-white">People</h3>
            <div className="space-y-2">
              {data.people.map((p) => (
                <div key={String(p.userId ?? 'unsigned')} className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate font-black text-white">{p.name}</p>
                    <p className="truncate text-sm text-[#f6f1e3]/50">{p.email || 'No email'}</p>
                  </div>
                  <p className="shrink-0 text-lg font-black text-[#e8c547]">{p.events}</p>
                </div>
              ))}
              {data.people.length === 0 && (
                <p className="text-sm text-[#f6f1e3]/50">No identified events in this range.</p>
              )}
            </div>
          </section>

          <section className="glass-card p-5">
            <h3 className="mb-4 text-lg font-black text-white">Geo</h3>
            <div className="space-y-2">
              {data.geo.map((g) => (
                <div key={`${g.country}-${g.region}-${g.city}`} className="flex justify-between gap-3 text-sm">
                  <span className="text-[#f6f1e3]/80">
                    {g.city}, {g.region}, {g.country}
                  </span>
                  <span className="font-black text-[#e8c547]">{g.events}</span>
                </div>
              ))}
              {data.geo.length === 0 && <p className="text-sm text-[#f6f1e3]/50">No geo yet.</p>}
            </div>
          </section>

          <section className="glass-card p-5">
            <h3 className="mb-4 text-lg font-black text-white">Exit rate by page</h3>
            <div className="space-y-2">
              {data.exitRate.map((row) => (
                <div key={row.url} className="flex justify-between gap-3 text-sm">
                  <span className="truncate text-[#f6f1e3]/80" title={row.url}>
                    {shortUrl(row.url)}
                  </span>
                  <span className="shrink-0 text-[#e8c547]">
                    {Math.round(row.rate * 100)}% · {row.exits}/{row.views}
                  </span>
                </div>
              ))}
              {data.exitRate.length === 0 && <p className="text-sm text-[#f6f1e3]/50">No page exits yet.</p>}
            </div>
          </section>

          <section className="glass-card p-5">
            <h3 className="mb-4 text-lg font-black text-white">Recent events</h3>
            <div className="space-y-2">
              {data.recent.map((row, i) => (
                <div key={`${row.at}-${i}`} className="border-b border-white/5 py-2 text-sm last:border-0">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-black text-white">{row.eventType}</span>
                    <span className="text-[#f6f1e3]/45">{row.at}</span>
                  </div>
                  <p className="text-[#f6f1e3]/70">
                    {row.name}
                    {row.email ? ` · ${row.email}` : ''}
                    {row.pageCategory ? ` · ${row.pageCategory}` : ''}
                    {row.ctaType ? ` · ${row.ctaType}` : ''}
                    {row.context ? ` · ${row.context}` : ''}
                  </p>
                </div>
              ))}
              {data.recent.length === 0 && <p className="text-sm text-[#f6f1e3]/50">No events yet.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function BarList({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-[#f6f1e3]/50">None yet.</p>;
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-[#f6f1e3]/80">{row.label}</span>
            <span className="font-black text-[#e8c547]">{row.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#e8c547]" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
