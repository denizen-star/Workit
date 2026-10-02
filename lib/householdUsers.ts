/** Household QA profile (Test, Test Tester, …). Left out of averages, boards, and pacing mail. */
export function isTestUserName(name: string | null | undefined): boolean {
  const n = String(name || '').trim().toLowerCase();
  return n === 'test' || n.startsWith('test ');
}

export const SQL_EXCLUDE_TEST_USER = `(LOWER(TRIM(u.name)) != 'test' AND LOWER(TRIM(u.name)) NOT LIKE 'test %')`;

/** Automated-mail recipient filter: admin-blocked accounts (users.blocked_at) get no mail. Alias `u`. */
export const SQL_NOT_BLOCKED_USER = `u.blocked_at IS NULL`;

/**
 * Public /join sign-ups that saved their details but never set a PIN (no house membership,
 * can't log in). Kept out of mail and athlete lists until Finish. Alias `u`.
 */
export const SQL_NOT_JOIN_DRAFT = `NOT (u.pin_hash IS NULL AND u.invite_token IS NULL AND u.invited_by IS NULL)`;
