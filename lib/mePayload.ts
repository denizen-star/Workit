import type { SessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { listHouseholdsForUser } from '@/lib/household';

/**
 * `GET /api/me`'s body: the signed-in profile, the houses they're in, and how many
 * workouts they've finished (Home's "How to use" banner). Sign-in already read the
 * houses; `completedWorkouts` skips the count read when the caller already has the rows.
 */
export async function mePayload(user: SessionUser, completedWorkouts?: number) {
  // `households` goes out as `houses` only.
  const { households, ...profile } = user;
  const [houses, done] = await Promise.all([
    households ?? listHouseholdsForUser(user.id).catch(() => []),
    completedWorkouts != null
      ? completedWorkouts
      : query('SELECT COUNT(*) as total FROM workout_sessions WHERE user_id = ? AND is_completed = 1', [user.id])
          .then((result) => Number((result.rows[0] as { total: number } | undefined)?.total || 0))
          .catch(() => 0),
  ]);
  return { user: profile, houses, completedWorkouts: done };
}
