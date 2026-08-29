import { addDays } from 'date-fns';
import { easternMidnightUtc, easternYmd, sqlUtc } from '@/lib/analyticsTime';
import { query } from '@/lib/db';

/** Inclusive Eastern calendar days for the Working the Gym list. */
export const WHO_ACTIVE_DAYS = 15;
/** Inclusive Eastern calendar days an unclaimed invite stays on /who. */
export const WHO_NEW_DAYS = 14;

export type WhoRosterUser = {
  id: number;
  name: string;
  email: string | null;
  has_pin: boolean;
  active: boolean;
  newToTraining: boolean;
};

export function easternInclusiveStartUtc(daysInclusive: number, now = new Date()): Date {
  const ymd = easternYmd(now);
  const noon = new Date(`${ymd}T12:00:00-05:00`);
  const startYmd = easternYmd(addDays(noon, -(Math.max(1, daysInclusive) - 1)));
  return easternMidnightUtc(startYmd);
}

export async function loadWhoRoster(includeAll: boolean): Promise<WhoRosterUser[]> {
  const now = new Date();
  const activeStart = easternInclusiveStartUtc(WHO_ACTIVE_DAYS, now);
  const newStart = easternInclusiveStartUtc(WHO_NEW_DAYS, now);
  const newStartSql = sqlUtc(newStart);

  const usersResult = await query(
    includeAll
      ? 'SELECT id, name, email, pin_hash, invited_at FROM users ORDER BY id ASC'
      : `SELECT id, name, email, pin_hash, invited_at FROM users
         WHERE pin_hash IS NOT NULL
            OR (pin_hash IS NULL AND invited_at IS NOT NULL AND invited_at >= ?)
         ORDER BY name ASC, id ASC`,
    includeAll ? [] : [newStartSql]
  );

  const users = usersResult.rows as {
    id: number;
    name: string;
    email: string | null;
    pin_hash: string | null;
    invited_at: string | Date | null;
  }[];

  if (users.length === 0) return [];

  const activity = await query(
    `SELECT user_id, MAX(GREATEST(
       IFNULL(UNIX_TIMESTAMP(completed_at), 0),
       IFNULL(UNIX_TIMESTAMP(ended_at), 0),
       IFNULL(UNIX_TIMESTAMP(started_at), 0),
       IFNULL(UNIX_TIMESTAMP(warmup_completed_at), 0),
       IFNULL(UNIX_TIMESTAMP(warmup_started_at), 0),
       IFNULL(UNIX_TIMESTAMP(cooldown_completed_at), 0),
       IFNULL(UNIX_TIMESTAMP(cooldown_started_at), 0),
       IFNULL(UNIX_TIMESTAMP(created_at), 0)
     )) as last_unix
     FROM workout_sessions
     GROUP BY user_id`
  );

  const lastByUser = new Map<number, number>();
  for (const row of activity.rows as { user_id: number; last_unix: number | string | null }[]) {
    const userId = Number(row.user_id);
    const unix = Number(row.last_unix || 0);
    if (userId && unix > 0) lastByUser.set(userId, unix * 1000);
  }

  const activeMs = activeStart.getTime();

  return users.map((row) => {
    const hasPin = row.pin_hash != null;
    const invitedMs = row.invited_at ? new Date(String(row.invited_at)).getTime() : 0;
    const lastMs = lastByUser.get(Number(row.id)) || 0;
    const active = lastMs >= activeMs;
    const newToTraining = !hasPin && invitedMs >= newStart.getTime();
    return {
      id: Number(row.id),
      name: row.name,
      email: row.email,
      has_pin: hasPin,
      active,
      newToTraining,
    };
  });
}
