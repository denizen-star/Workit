import type { WeekPlace } from '@/lib/weekPodium';

function storageKey(userId: number, weekMonday: string) {
  return `workit_week_podium:${userId}:${weekMonday}`;
}

export function weekPodiumSeen(userId: number, weekMonday: string) {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(storageKey(userId, weekMonday)) === '1';
}

export function markWeekPodiumSeen(userId: number, weekMonday: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(userId, weekMonday), '1');
}

export function shouldShowWeekPodiumTakeover(
  userId: number | null,
  you: { weekMonday: string; place: WeekPlace } | null
) {
  if (userId == null || !you) return false;
  return !weekPodiumSeen(userId, you.weekMonday);
}
