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

function missKey(userId: number, weekMonday: string) {
  return `workit_week_miss:${userId}:${weekMonday}`;
}

export function markWeekMissSeen(userId: number, weekMonday: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(missKey(userId, weekMonday), '1');
}

export function shouldShowWeekMissTakeover(
  userId: number | null,
  miss: { weekMonday: string } | null
) {
  if (userId == null || !miss) return false;
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(missKey(userId, miss.weekMonday)) !== '1';
}
