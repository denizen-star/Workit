// Nightly onboarding report to Kevin (8pm Eastern, netlify/functions/workit-onboarding-cron.mts).
// Three views: who opened /join and how far the wizard got (anonymous, from app_events
// `page_view` + `join_step`), invites not claimed yet, and every athlete who joined in the
// last ONBOARDING_WINDOW_DAYS — how far into verify → sign in → first workout they are and
// how they're doing since.
import { query } from '@/lib/db';
import { isUnknownColumnError } from '@/lib/db-errors';
import { APP_NAME } from '@/lib/analyticsTypes';
import { easternYmd } from '@/lib/analyticsTime';
import { sqlSetVolume } from '@/lib/exerciseKind';
import { hashInviteToken } from '@/lib/invite';
import { JOIN_SOURCE_LABEL, parseJoinStepContext, type JoinSource } from '@/lib/joinSource';
import { parseDbTime } from '@/lib/optionals';
import { athleteCallName } from '@/lib/profile';
import { testDriveState } from '@/lib/testDrive';
import { claimAndSend, sendNow } from '@/lib/emails/send';
import { todayInNewYork } from '@/lib/emails/nudge';
import {
  buildOnboardingReportEmail,
  type BuiltEmail,
  type OnboardingAthleteRow,
  type OnboardingFunnelRow,
  type OnboardingInviteRow,
  type OnboardingReportInput,
  type OnboardingVisitorRow,
} from '@/lib/emails/templates';
import { sqlSetCounts } from '@/lib/skippedSets';

export const ONBOARDING_WINDOW_DAYS = 14;
const FUNNEL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Furthest wizard screen, in order. `page_view` with no join_step = opened only. */
const STAGES = ['opened', 'agree', 'form', 'pin', 'joined'] as const;
type Stage = (typeof STAGES)[number];
const STAGE_FOR_STEP: Record<string, Stage> = {
  intro: 'opened',
  agree: 'agree',
  form: 'form',
  pin: 'pin',
  confirm: 'pin',
  done: 'joined',
  wait: 'joined',
};
const STAGE_LABEL: Record<Stage, string> = {
  opened: 'Opened the page',
  agree: 'On the 18+ screen',
  form: 'On their details',
  pin: 'On the PIN',
  joined: 'Joined',
};

function reportRecipient() {
  return (process.env.WORKIT_SCOREBOARD_TO || '').trim() || null;
}

function daysAgo(ms: number | null, now: number): number | null {
  return ms == null ? null : Math.floor((now - ms) / DAY_MS);
}

export function agoLabel(ms: number | null, now = Date.now()): string {
  if (ms == null) return 'never';
  const days = daysAgo(ms, now) ?? 0;
  if (days <= 0) {
    const hours = Math.floor((now - ms) / (60 * 60 * 1000));
    return hours <= 0 ? 'just now' : hours + 'h ago';
  }
  return days === 1 ? 'yesterday' : days + 'd ago';
}

function shortDate(ms: number) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
  }).format(new Date(ms));
}

function whereFrom(geo: unknown, device: string | null): string | null {
  let parsed: Record<string, unknown> | null = null;
  if (geo && typeof geo === 'object') parsed = geo as Record<string, unknown>;
  else if (typeof geo === 'string') {
    try {
      parsed = JSON.parse(geo);
    } catch {
      parsed = null;
    }
  }
  const place = [parsed?.city, parsed?.region].filter((part) => typeof part === 'string' && part).join(', ');
  return [place || null, device || null].filter(Boolean).join(' · ') || null;
}

function urlParams(pageUrl: string | null) {
  try {
    return new URL(pageUrl || '', 'https://workitapp.fit').searchParams;
  } catch {
    return new URLSearchParams();
  }
}

type EventRow = {
  visitor_id: string | null;
  event_type: string;
  cta_type: string | null;
  article_context: string | null;
  page_url: string | null;
  timestamp: string;
  ip_geolocation: unknown;
  device_type: string | null;
  user_id: number | null;
};

type Visitor = {
  id: string;
  house: string;
  source: JoinSource;
  stage: Stage;
  firstMs: number;
  lastMs: number;
  where: string | null;
  signedIn: boolean;
  claimHash: string | null;
};

async function loadJoinEvents() {
  try {
    const result = await query(
      `SELECT visitor_id, event_type, cta_type, article_context, page_url, timestamp,
              ip_geolocation, device_type, user_id
       FROM app_events
       WHERE app_name = ?
         AND timestamp >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${ONBOARDING_WINDOW_DAYS} DAY)
         AND (page_category = 'join' OR event_type IN ('join_step', 'join_pass'))
       ORDER BY timestamp ASC`,
      [APP_NAME]
    );
    return result.rows as EventRow[];
  } catch (error) {
    console.warn('[onboarding] app_events read failed', error);
    return [];
  }
}

function foldVisitors(events: EventRow[]) {
  const visitors = new Map<string, Visitor>();
  const passes: number[] = [];
  for (const event of events) {
    const ms = parseDbTime(event.timestamp);
    if (ms == null) continue;
    if (event.event_type === 'join_pass') {
      passes.push(ms);
      continue;
    }
    if (!event.visitor_id) continue;
    const params = urlParams(event.page_url);
    const context = parseJoinStepContext(event.article_context);
    const claim = params.get('claim');
    const source: JoinSource =
      context.source || (claim ? 'invite' : params.get('src') === 'qr' ? 'qr' : 'link');
    const house = context.house || (params.get('h') || 'gowanus').toLowerCase();
    const stage: Stage =
      event.event_type === 'join_step' ? STAGE_FOR_STEP[event.cta_type || ''] || 'opened' : 'opened';

    const current = visitors.get(event.visitor_id);
    if (!current) {
      visitors.set(event.visitor_id, {
        id: event.visitor_id,
        house,
        source,
        stage,
        firstMs: ms,
        lastMs: ms,
        where: whereFrom(event.ip_geolocation, event.device_type),
        // Signed in on their very first /join hit = an existing athlete browsing, not a sign-up.
        signedIn: event.user_id != null,
        claimHash: claim ? hashInviteToken(claim) : null,
      });
      continue;
    }
    current.lastMs = ms;
    current.house = house;
    if (source !== 'link') current.source = source;
    if (STAGES.indexOf(stage) > STAGES.indexOf(current.stage)) current.stage = stage;
    if (!current.where) current.where = whereFrom(event.ip_geolocation, event.device_type);
    if (claim && !current.claimHash) current.claimHash = hashInviteToken(claim);
  }
  return { visitors: [...visitors.values()].filter((v) => !v.signedIn), passes };
}

/** Visitors whose browser has ever been signed in — they got an account, so they're not "stuck". */
async function visitorsWithAccounts(ids: string[]) {
  if (ids.length === 0) return new Set<string>();
  try {
    const result = await query(
      `SELECT DISTINCT visitor_id FROM app_events
       WHERE app_name = ? AND user_id IS NOT NULL AND visitor_id IN (${ids.map(() => '?').join(',')})`,
      [APP_NAME, ...ids]
    );
    return new Set((result.rows as { visitor_id: string }[]).map((row) => row.visitor_id));
  } catch {
    return new Set<string>();
  }
}

type UserRow = {
  id: number;
  name: string;
  first_name: string | null;
  display_name: string | null;
  email: string | null;
  created_at: string;
  joined_at: string | null;
  invited_at: string | null;
  email_verified_at: string | null;
  quickstart_seen_at: string | null;
  blocked_at: string | null;
  has_pin: number;
  invite_token: string | null;
  schedule_days_per_week: number | null;
  join_source?: string | null;
  house_slug: string | null;
  house_name: string | null;
  inviter_name: string | null;
};

async function loadRecentUsers(): Promise<UserRow[]> {
  const select = (withSource: boolean) => `
    SELECT u.id, u.name, u.first_name, u.display_name, u.email, u.created_at,
           COALESCE(u.adult_risk_confirmed_at, u.waiver_accepted_at) AS joined_at,
           u.invited_at, u.email_verified_at, u.quickstart_seen_at, u.blocked_at,
           u.pin_hash IS NOT NULL AS has_pin, u.invite_token, u.schedule_days_per_week,
           ${withSource ? 'u.join_source,' : ''}
           h.slug AS house_slug, h.name AS house_name, inv.name AS inviter_name
    FROM users u
    LEFT JOIN households h ON h.id = COALESCE(
      u.last_household_id,
      (SELECT MIN(m.household_id) FROM household_members m WHERE m.user_id = u.id)
    )
    LEFT JOIN users inv ON inv.id = u.invited_by
    WHERE LOWER(TRIM(u.name)) != 'test'
      AND (
        (u.pin_hash IS NOT NULL AND COALESCE(u.adult_risk_confirmed_at, u.created_at)
          >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${ONBOARDING_WINDOW_DAYS} DAY))
        OR (u.pin_hash IS NULL AND u.invite_token IS NOT NULL
          AND COALESCE(u.invited_at, u.created_at) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 30 DAY))
        OR (u.pin_hash IS NULL AND u.invite_token IS NULL AND u.invited_by IS NULL
          AND u.email_verified_at IS NULL
          AND u.created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${ONBOARDING_WINDOW_DAYS} DAY))
      )
    ORDER BY COALESCE(u.adult_risk_confirmed_at, u.invited_at, u.created_at) DESC`;
  try {
    return (await query(select(true))).rows as UserRow[];
  } catch (error) {
    if (!isUnknownColumnError(error, 'join_source')) throw error;
    return (await query(select(false))).rows as UserRow[];
  }
}

type SessionRow = {
  week_number: number;
  day_number: number;
  workout_type: string;
  is_completed: number | null;
  started_at: string | null;
  created_at: string | null;
  completed_at: string | null;
};

async function athleteRow(
  user: UserRow,
  now: number
): Promise<{ row: OnboardingAthleteRow; firstDoneMs: number | null }> {
  const sessions = (
    await query(
      `SELECT week_number, day_number, workout_type, is_completed, started_at, created_at, completed_at
       FROM workout_sessions WHERE user_id = ? ORDER BY COALESCE(started_at, created_at) ASC`,
      [user.id]
    )
  ).rows as SessionRow[];
  const sets = (
    await query(
      `SELECT COUNT(*) AS sets, COALESCE(SUM(${sqlSetVolume('es')}), 0) AS volume, AVG(es.hardness) AS effort
       FROM exercise_sets es
       JOIN workout_sessions ws ON ws.id = es.workout_session_id
       WHERE ws.user_id = ? AND ${sqlSetCounts('es')}`,
      [user.id]
    )
  ).rows[0] as { sets: number; volume: number; effort: number | null } | undefined;
  const rating = await query(
    'SELECT AVG(stars) AS stars, COUNT(*) AS n FROM session_ratings WHERE user_id = ?',
    [user.id]
  )
    .then((r) => r.rows[0] as { stars: number | null; n: number } | undefined)
    .catch(() => undefined);
  const lastSeenMs = await query(
    'SELECT MAX(timestamp) AS ts FROM app_events WHERE app_name = ? AND user_id = ?',
    [APP_NAME, user.id]
  )
    .then((r) => parseDbTime((r.rows[0] as { ts: string | null } | undefined)?.ts))
    .catch(() => null);

  const joinedMs = parseDbTime(user.joined_at) ?? parseDbTime(user.created_at) ?? now;
  const finished = sessions.filter((s) => Number(s.is_completed) === 1);
  const open = sessions.filter((s) => Number(s.is_completed) !== 1);
  const firstStartMs = sessions.length ? parseDbTime(sessions[0].started_at || sessions[0].created_at) : null;
  const lastDone = finished.reduce<SessionRow | null>(
    (best, s) =>
      (parseDbTime(s.completed_at) ?? 0) > (parseDbTime(best?.completed_at) ?? 0) ? s : best,
    null
  );
  const lastDoneMs = parseDbTime(lastDone?.completed_at);
  const firstDoneMs = finished.reduce<number | null>((min, s) => {
    const ms = parseDbTime(s.completed_at);
    return ms != null && (min == null || ms < min) ? ms : min;
  }, null);
  const doneThisWeek = finished.filter((s) => (parseDbTime(s.completed_at) ?? 0) >= now - 7 * DAY_MS).length;
  const verified = Boolean(user.email_verified_at);
  const signedIn = Boolean(user.quickstart_seen_at) || lastSeenMs != null || sessions.length > 0;
  const blocked = Boolean(user.blocked_at);
  const days = daysAgo(joinedMs, now) ?? 0;
  const perWeek = Number(user.schedule_days_per_week || 4);

  const steps = [
    { label: 'Joined', done: true },
    { label: 'Verified', done: verified },
    { label: 'Signed in', done: signedIn },
    { label: 'Started a workout', done: sessions.length > 0 },
    { label: 'Finished one', done: finished.length > 0 },
  ];

  let flag: OnboardingAthleteRow['flag'] = 'good';
  let status: string;
  if (blocked) {
    flag = 'stuck';
    status = 'Blocked';
  } else if (!verified) {
    flag = days >= 1 ? 'stuck' : 'watch';
    status = "Hasn't verified their email";
  } else if (!signedIn) {
    flag = days >= 1 ? 'stuck' : 'watch';
    status = "Verified but hasn't signed in";
  } else if (sessions.length === 0) {
    flag = days >= 2 ? 'stuck' : 'watch';
    status = 'Signed in, no workout yet';
  } else if (finished.length === 0) {
    flag = 'watch';
    status = 'First workout started, not finished';
  } else if (lastDoneMs != null && now - lastDoneMs > 5 * DAY_MS) {
    flag = 'watch';
    status = 'Quiet since ' + agoLabel(lastDoneMs, now);
  } else {
    status = 'On track';
  }

  const how: string[] = [];
  if (finished.length > 0) {
    how.push(
      finished.length +
        (finished.length === 1 ? ' workout' : ' workouts') +
        ' finished · ' +
        doneThisWeek +
        ' in the last 7 days (plans ' +
        perWeek +
        '/wk)'
    );
    how.push(
      Math.round(Number(sets?.volume || 0)).toLocaleString() +
        ' lb · ' +
        Number(sets?.sets || 0) +
        ' sets' +
        (sets?.effort != null ? ' · Effort ' + Number(sets.effort).toFixed(1) : '') +
        (rating && Number(rating.n) > 0 ? ' · ' + Number(rating.stars).toFixed(1) + '★ enjoyment' : '')
    );
    if (lastDone) how.push('Last: ' + lastDone.workout_type + ' · ' + agoLabel(lastDoneMs, now));
  } else if (firstStartMs != null) {
    how.push('First start ' + agoLabel(firstStartMs, now) + ' · ' + sessions[0].workout_type);
  }
  if (open.length > 0) how.push('Left open: ' + open[open.length - 1].workout_type);
  const drive = testDriveState(user.created_at, sessions);
  if (drive?.active) {
    how.push(
      'Test Drive · ' +
        drive.doneDayNumbers.length +
        ' of ' +
        drive.days.length +
        ' done · Week 1 starts in ' +
        drive.daysUntilMonday +
        (drive.daysUntilMonday === 1 ? ' day' : ' days')
    );
  }
  how.push('Last seen in the app: ' + agoLabel(lastSeenMs, now));

  const source = (user.join_source as JoinSource | null) || null;
  const row: OnboardingAthleteRow = {
    name: user.name,
    callName: athleteCallName(user),
    email: user.email,
    house: user.house_name || '—',
    source: source ? JOIN_SOURCE_LABEL[source] : 'Unknown',
    invitedBy: user.inviter_name,
    joinedLabel: agoLabel(joinedMs, now) + ' · ' + shortDate(joinedMs),
    steps,
    status,
    flag,
    how,
  };
  return { row, firstDoneMs };
}

export async function loadOnboardingReport(now = Date.now()): Promise<OnboardingReportInput> {
  const today = easternYmd(new Date(now));
  const [events, users, housesResult] = await Promise.all([
    loadJoinEvents(),
    loadRecentUsers(),
    query('SELECT slug, name FROM households'),
  ]);
  const houseNames = new Map(
    (housesResult.rows as { slug: string; name: string }[]).map((row) => [row.slug.toLowerCase(), row.name])
  );
  const houseName = (slug: string) => houseNames.get(slug) || slug;
  const isToday = (ms: number | null) => ms != null && easternYmd(new Date(ms)) === today;

  const { visitors, passes } = foldVisitors(events);
  const withAccounts = await visitorsWithAccounts(visitors.map((v) => v.id));

  // Funnel: last FUNNEL_DAYS, per house. Accounts come from users (the truth), not events.
  const funnelSince = now - FUNNEL_DAYS * DAY_MS;
  const funnel = new Map<string, OnboardingFunnelRow>();
  const funnelRow = (slug: string) => {
    let row = funnel.get(slug);
    if (!row) {
      row = { house: houseName(slug), opened: 0, agree: 0, form: 0, pin: 0, joined: 0, qr: 0, link: 0, invite: 0 };
      funnel.set(slug, row);
    }
    return row;
  };
  for (const visitor of visitors) {
    if (visitor.firstMs < funnelSince) continue;
    const row = funnelRow(visitor.house);
    const rank = STAGES.indexOf(visitor.stage);
    row.opened += 1;
    if (rank >= 1) row.agree += 1;
    if (rank >= 2) row.form += 1;
    if (rank >= 3) row.pin += 1;
    row[visitor.source] += 1;
  }
  for (const user of users) {
    if (!Number(user.has_pin)) continue;
    const joinedMs = parseDbTime(user.joined_at) ?? parseDbTime(user.created_at) ?? 0;
    if (joinedMs >= funnelSince) funnelRow(user.house_slug || 'unknown').joined += 1;
  }

  // Public sign-ups that saved their details (form Next) but never set a PIN.
  const isJoinDraft = (user: UserRow) => !Number(user.has_pin) && !user.invite_token;
  const draftVisitors: OnboardingVisitorRow[] = users
    .filter(isJoinDraft)
    .map((user) => ({
      name: user.name,
      email: user.email,
      house: user.house_name || '—',
      source: user.join_source ? JOIN_SOURCE_LABEL[user.join_source as JoinSource] : 'Unknown',
      furthest: 'Gave details, no PIN yet',
      lastSeen: agoLabel(parseDbTime(user.created_at), now),
      where: null,
    }));

  const stuckVisitors: OnboardingVisitorRow[] = [
    ...draftVisitors,
    ...visitors
      .filter((v) => v.lastMs >= funnelSince && v.stage !== 'joined' && !withAccounts.has(v.id) && !v.claimHash)
      .sort((a, b) => b.lastMs - a.lastMs)
      .slice(0, 20)
      .map((v) => ({
        house: houseName(v.house),
        source: JOIN_SOURCE_LABEL[v.source],
        furthest: STAGE_LABEL[v.stage],
        lastSeen: agoLabel(v.lastMs, now),
        where: v.where,
      })),
  ];

  const invites: OnboardingInviteRow[] = users
    .filter((user) => !Number(user.has_pin) && user.invite_token)
    .map((user) => {
      const opened = visitors
        .filter((v) => v.claimHash && v.claimHash === user.invite_token)
        .sort((a, b) => STAGES.indexOf(b.stage) - STAGES.indexOf(a.stage))[0];
      const sentMs = parseDbTime(user.invited_at) ?? parseDbTime(user.created_at);
      return {
        name: user.name,
        house: user.house_name || '—',
        invitedBy: user.inviter_name,
        sentLabel: agoLabel(sentMs, now),
        progress: opened ? STAGE_LABEL[opened.stage] + ' · ' + agoLabel(opened.lastMs, now) : 'Link not opened',
      };
    });

  const athletes: OnboardingAthleteRow[] = [];
  let firstWorkoutsToday = 0;
  for (const user of users) {
    if (!Number(user.has_pin)) continue;
    const { row, firstDoneMs } = await athleteRow(user, now);
    athletes.push(row);
    if (isToday(firstDoneMs)) firstWorkoutsToday += 1;
  }


  return {
    dateLabel: new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date(now)),
    windowDays: ONBOARDING_WINDOW_DAYS,
    funnelDays: FUNNEL_DAYS,
    today: {
      opened: visitors.filter((v) => isToday(v.firstMs)).length,
      joined: users.filter(
        (u) => Number(u.has_pin) && isToday(parseDbTime(u.joined_at) ?? parseDbTime(u.created_at))
      ).length,
      qr: visitors.filter((v) => isToday(v.firstMs) && v.source === 'qr').length,
      firstWorkouts: firstWorkoutsToday,
      passed: passes.filter((ms) => isToday(ms)).length,
    },
    funnel: [...funnel.values()].sort((a, b) => b.opened + b.joined - (a.opened + a.joined)),
    passed7d: passes.filter((ms) => ms >= funnelSince).length,
    stuckVisitors,
    invites,
    athletes,
  };
}

export async function buildLiveOnboardingReport(): Promise<BuiltEmail> {
  return buildOnboardingReportEmail(await loadOnboardingReport());
}

/** Daily at 8pm Eastern. `force` (admin) skips the hour gate and the once-a-day dedupe. */
export async function sendOnboardingReport(opts?: { force?: boolean }) {
  const to = reportRecipient();
  if (!to) return { sent: false, skipped: 'no-WORKIT_SCOREBOARD_TO' };
  const email = await buildLiveOnboardingReport();
  if (opts?.force) {
    const id = await sendNow(to, email, { template: 'onboarding' });
    return { sent: Boolean(id), id };
  }
  const { date } = todayInNewYork();
  return claimAndSend({ template: 'onboarding', dedupeKey: 'onboarding:' + date, to, email });
}
