import { query } from '@/lib/db';

export const NAME_TAKEN_MESSAGE =
  'That name is already on the roster. Add a last name or nickname.';

export function normalizeName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Live copy under the email field. Empty until they type. */
export function emailFieldHint(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return '';
  if (!isValidEmailFormat(trimmed)) return 'Enter a valid email';
  return '';
}

export function normalizeEmail(email: unknown): string | null | undefined {
  if (email == null || email === '') return null;
  if (typeof email !== 'string') return undefined;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;
  if (!EMAIL_RE.test(trimmed)) return undefined;
  return trimmed;
}

/** US display: (347) 555-1234. Digits only while typing. */
export function formatUsPhone(raw: string): string {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (!digits) return '';
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
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

/** Coach and mail address: alias, else first name, else first token of name. */
export function athleteCallName(user: {
  display_name?: string | null;
  first_name?: string | null;
  name?: string | null;
} | null | undefined): string {
  const alias = (user?.display_name || '').trim();
  if (alias) return alias;
  const first = (user?.first_name || '').trim();
  if (first) return first;
  return firstName(user?.name);
}

export function composeFullName(first?: string | null, last?: string | null, fallback?: string | null) {
  const parts = [first, last].map((part) => (part || '').trim()).filter(Boolean);
  if (parts.length) return parts.join(' ');
  return normalizeName(fallback) || '';
}

/** First token / remainder of a stored full name. */
export function splitFullName(fullName: string | null | undefined): { first: string; last: string } {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return { first: '', last: '' };
  const [first, ...rest] = trimmed.split(/\s+/);
  return { first: first || '', last: rest.join(' ') };
}

export function normalizeOptionalText(value: unknown, max = 120): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function isAliasTakenInHouse(
  householdId: number,
  alias: string,
  exceptUserId?: number
): Promise<boolean> {
  const result = await query(
    `SELECT u.id FROM users u
     INNER JOIN household_members m ON m.user_id = u.id AND m.household_id = ?
     WHERE LOWER(TRIM(COALESCE(u.display_name, u.name))) = LOWER(?)
     LIMIT 1`,
    [householdId, alias]
  );
  const row = result.rows[0] as { id: number } | undefined;
  if (!row) return false;
  return exceptUserId == null || row.id !== exceptUserId;
}

export async function isNameTaken(name: string, exceptUserId?: number): Promise<boolean> {
  const result = await query(
    'SELECT id FROM users WHERE LOWER(TRIM(name)) = LOWER(?) LIMIT 1',
    [name]
  );
  const row = result.rows[0] as { id: number } | undefined;
  if (!row) return false;
  return exceptUserId == null || row.id !== exceptUserId;
}
