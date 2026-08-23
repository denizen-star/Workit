export type SessionTiming = {
  started_at?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  ended_at?: string | null;
};

export function sessionDurationSeconds(session: SessionTiming) {
  const start = new Date(session.started_at || session.created_at || '').getTime();
  const end = new Date(session.completed_at || session.ended_at || '').getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.round((end - start) / 1000);
}

export function sessionDateLabel(session: SessionTiming) {
  const raw = session.completed_at || session.ended_at || session.started_at || session.created_at;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}
