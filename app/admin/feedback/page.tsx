'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import EnjoymentCharts from '@/components/EnjoymentCharts';
import { isDone, isWontDo, reasonLabel, topicLabel } from '@/lib/feedback';
import type { RatingStats } from '@/lib/ratings';

type FeedbackItem = {
  id: number;
  kind: string;
  topic: string | null;
  reason: string | null;
  message: string;
  exercise_name: string | null;
  mailed_at: string | null;
  resolved_at: string | null;
  resolution: string | null;
  created_at: string;
  user_name: string;
};

type InboxTab = 'open' | 'done' | 'wont_do';

const CATEGORY_ORDER = [
  'Bug',
  'Idea',
  'Workout',
  'Other',
  'Open',
  'Broken video',
  'Image does not match',
  'Something else',
  'Looks good',
];

function inboxCategory(item: FeedbackItem) {
  return item.kind === 'thumb' ? reasonLabel(item.reason) : topicLabel(item.topic);
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<InboxTab>('open');
  const [folded, setFolded] = useState<Record<string, boolean>>({});

  const load = async () => {
    const [listRes, statsRes] = await Promise.all([
      fetch('/api/admin/feedback'),
      fetch('/api/ratings/stats?scope=household'),
    ]);
    if (listRes.status === 401 || listRes.status === 403) {
      router.replace('/home');
      return;
    }
    if (listRes.ok) {
      const data = await listRes.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    }
    if (statsRes.ok) {
      setStats(await statsRes.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () =>
      items.filter((item) => {
        if (tab === 'open') return !item.resolved_at;
        if (tab === 'wont_do') return isWontDo(item);
        return isDone(item);
      }),
    [items, tab]
  );

  const groups = useMemo(() => {
    const buckets = new Map<string, FeedbackItem[]>();
    for (const item of visible) {
      const title = inboxCategory(item);
      const list = buckets.get(title) || [];
      list.push(item);
      buckets.set(title, list);
    }
    const known = CATEGORY_ORDER.filter((title) => buckets.has(title)).map((title) => ({
      title,
      items: buckets.get(title) || [],
    }));
    const extra = [...buckets.keys()]
      .filter((title) => !CATEGORY_ORDER.includes(title))
      .sort()
      .map((title) => ({ title, items: buckets.get(title) || [] }));
    return [...known, ...extra];
  }, [visible]);

  const markResolved = async (
    item: FeedbackItem,
    resolved: boolean,
    resolution: 'done' | 'wont_do' = 'done'
  ) => {
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', id: item.id, resolved, resolution }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error || 'Could not update this note');
        return;
      }
      await load();
    } catch {
      setStatus('Could not update this note');
    } finally {
      setBusy(false);
    }
  };

  const sendDigest = async () => {
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'digest' }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error || 'Could not send digest');
        return;
      }
      setStatus('Digest sent to ' + data.to);
      await load();
    } catch {
      setStatus('Could not send digest');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-2xl font-black text-[#e8c547]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
        {stats ? <div className="mb-8"><EnjoymentCharts stats={stats} scope="household" /></div> : null}

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">Inbox</p>
            <h2 className="mt-1 text-3xl font-black text-white">Notes and thumbs</h2>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={sendDigest}
            className="inline-flex min-h-11 shrink-0 items-center rounded-2xl bg-[#e8c547] px-4 font-black text-[#1a1404] disabled:opacity-60"
          >
            Email digest
          </button>
        </div>
        {status ? <p className="mb-4 text-sm font-semibold text-[#e8c547]">{status}</p> : null}

        <div className="mb-4 flex flex-wrap gap-2">
          {([
            ['open', 'Open'],
            ['done', 'Done'],
            ['wont_do', "Won't do"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`min-h-11 rounded-2xl border px-4 text-sm font-black ${
                tab === id
                  ? 'border-[#e8c547] bg-[#e8c547]/15 text-[#e8c547]'
                  : 'border-white/10 text-[#f6f1e3]/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-[#f6f1e3]/55">
            {items.length === 0
              ? 'No notes yet. I am waiting.'
              : tab === 'done'
                ? 'Nothing marked done yet.'
                : tab === 'wont_do'
                  ? "Nothing marked won't do."
                  : 'Inbox is clear.'}
          </p>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => {
              const open = Boolean(folded[group.title]);
              return (
                <section key={group.title}>
                  <button
                    type="button"
                    onClick={() =>
                      setFolded((current) => ({ ...current, [group.title]: !current[group.title] }))
                    }
                    className="flex min-h-11 w-full items-center gap-2 border-b border-white/10 py-2 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#e8c547]">
                      {group.title}
                    </span>
                    <span className="ml-auto text-xs text-[#f6f1e3]/50">{group.items.length}</span>
                    {open ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-[#f6f1e3]/65" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#f6f1e3]/65" />
                    )}
                  </button>
                  {open ? (
                    <ul className="mt-3 space-y-3">
                      {group.items.map((item) => (
                        <li key={item.id} className="glass-card p-4">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="font-black text-white">{item.user_name}</p>
                            <p className="text-xs text-[#f6f1e3]/45">
                              {new Date(item.created_at).toLocaleString()}
                              {item.mailed_at ? ' · mailed' : ''}
                              {isWontDo(item) ? " · won't do" : item.resolved_at ? ' · done' : ''}
                            </p>
                          </div>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#e8c547]">
                            {item.kind === 'thumb'
                              ? reasonLabel(item.reason) +
                                (item.exercise_name ? ' · ' + item.exercise_name : '')
                              : topicLabel(item.topic)}
                          </p>
                          {item.message ? (
                            <p className="mt-2 whitespace-pre-wrap text-sm text-[#f6f1e3]/80">
                              {item.message}
                            </p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.resolved_at ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => markResolved(item, false)}
                                className="inline-flex min-h-10 items-center rounded-xl border border-[#e8c547]/50 px-3 text-sm font-black text-[#e8c547] disabled:opacity-60"
                              >
                                Open again
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => markResolved(item, true, 'done')}
                                  className="inline-flex min-h-10 items-center rounded-xl border border-[#e8c547]/50 px-3 text-sm font-black text-[#e8c547] disabled:opacity-60"
                                >
                                  Mark done
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => markResolved(item, true, 'wont_do')}
                                  className="inline-flex min-h-10 items-center rounded-xl border border-[#a35d52]/60 px-3 text-sm font-black text-[#a35d52] disabled:opacity-60"
                                >
                                  Won't do
                                </button>
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}
    </div>
  );
}
