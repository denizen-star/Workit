import { query } from '@/lib/db';

export const HOUSE_OG = 'og';
export const HOUSE_GOWANUS = 'gowanus';

export type Household = {
  id: number;
  slug: string;
  name: string;
  public_join: boolean;
};

export function sqlInHousehold(userColumn: string, householdId: number | null | undefined) {
  if (householdId == null || householdId <= 0) {
    return { sql: '', params: [] as number[] };
  }
  return {
    sql: ` AND ${userColumn} IN (SELECT user_id FROM household_members WHERE household_id = ?)`,
    params: [householdId],
  };
}

export async function getHouseholdBySlug(slug: string | null | undefined): Promise<Household | null> {
  const key = String(slug || '').trim().toLowerCase();
  if (!key) return null;
  const result = await query(
    'SELECT id, slug, name, public_join FROM households WHERE slug = ? LIMIT 1',
    [key]
  );
  const row = result.rows[0] as
    | { id: number; slug: string; name: string; public_join: number | boolean }
    | undefined;
  if (!row) return null;
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    public_join: Boolean(row.public_join),
  };
}

export async function getHouseholdById(id: number | null | undefined): Promise<Household | null> {
  const householdId = Number(id);
  if (!Number.isFinite(householdId) || householdId <= 0) return null;
  const result = await query(
    'SELECT id, slug, name, public_join FROM households WHERE id = ? LIMIT 1',
    [householdId]
  );
  const row = result.rows[0] as
    | { id: number; slug: string; name: string; public_join: number | boolean }
    | undefined;
  if (!row) return null;
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    public_join: Boolean(row.public_join),
  };
}

export async function listHouseholdsForUser(userId: number): Promise<Household[]> {
  const result = await query(
    `SELECT h.id, h.slug, h.name, h.public_join
     FROM households h
     INNER JOIN household_members m ON m.household_id = h.id
     WHERE m.user_id = ?
     ORDER BY h.id ASC`,
    [userId]
  );
  return (result.rows as { id: number; slug: string; name: string; public_join: number | boolean }[]).map(
    (row) => ({
      id: Number(row.id),
      slug: row.slug,
      name: row.name,
      public_join: Boolean(row.public_join),
    })
  );
}

export async function listHouseholdAthletes(householdId: number | null | undefined) {
  const id = Number(householdId);
  if (!Number.isFinite(id) || id <= 0) return [] as Array<{ id: number; name: string; displayName: string | null }>;
  const result = await query(
    `SELECT u.id, u.name, u.display_name
     FROM users u
     INNER JOIN household_members m ON m.user_id = u.id AND m.household_id = ?
     WHERE LOWER(TRIM(u.name)) != 'test'
     ORDER BY u.name ASC`,
    [id]
  );
  return (result.rows as { id: number; name: string; display_name: string | null }[]).map((row) => ({
    id: Number(row.id),
    name: row.name,
    displayName: row.display_name,
  }));
}

export async function userInHousehold(userId: number, householdId: number): Promise<boolean> {
  const result = await query(
    'SELECT user_id FROM household_members WHERE user_id = ? AND household_id = ? LIMIT 1',
    [userId, householdId]
  );
  return Boolean(result.rows[0]);
}

export async function addHouseholdMember(householdId: number, userId: number) {
  await query(
    'INSERT IGNORE INTO household_members (household_id, user_id) VALUES (?, ?)',
    [householdId, userId]
  );
}

export async function setLastHousehold(userId: number, householdId: number) {
  await query('UPDATE users SET last_household_id = ? WHERE id = ?', [householdId, userId]);
}

export async function householdIdForUser(userId: number, preferred?: number | null): Promise<number | null> {
  const houses = await listHouseholdsForUser(userId);
  if (houses.length === 0) return null;
  if (preferred && houses.some((house) => house.id === preferred)) return preferred;
  return houses[0].id;
}