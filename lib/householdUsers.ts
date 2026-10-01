/** Household QA profile. Left out of averages and exercise compare. */
export function isTestUserName(name: string | null | undefined): boolean {
  return String(name || '').trim().toLowerCase() === 'test';
}

export const SQL_EXCLUDE_TEST_USER = `LOWER(TRIM(u.name)) != 'test'`;

/** Automated-mail recipient filter: admin-blocked accounts (users.blocked_at) get no mail. Alias `u`. */
export const SQL_NOT_BLOCKED_USER = `u.blocked_at IS NULL`;

/**
 * Public /join sign-ups that saved their details but never set a PIN (no house membership,
 * can't log in). Kept out of mail and athlete lists until Finish. Alias `u`.
 */
export const SQL_NOT_JOIN_DRAFT = `NOT (u.pin_hash IS NULL AND u.invite_token IS NULL AND u.invited_by IS NULL)`;
