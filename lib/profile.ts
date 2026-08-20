export function normalizeName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeEmail(email: unknown): string | null | undefined {
  if (email == null || email === '') return null;
  if (typeof email !== 'string') return undefined;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
  return trimmed;
}

export function isDuplicateEmailError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /duplicate/i.test(message) && /email/i.test(message);
}

export function firstName(fullName: string | null | undefined): string {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0];
}
