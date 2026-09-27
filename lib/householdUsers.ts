/** Household QA profile. Left out of averages and exercise compare. */
export function isTestUserName(name: string | null | undefined): boolean {
  return String(name || '').trim().toLowerCase() === 'test';
}

export const SQL_EXCLUDE_TEST_USER = `LOWER(TRIM(u.name)) != 'test'`;

/** Automated-mail recipient filter: admin-blocked accounts (users.blocked_at) get no mail. Alias `u`. */
export const SQL_NOT_BLOCKED_USER = `u.blocked_at IS NULL`;
