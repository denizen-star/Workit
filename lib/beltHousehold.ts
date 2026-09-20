import { progressFor } from '@/lib/belts';
import { query } from '@/lib/db';
import { sqlInHousehold } from '@/lib/household';
import { lockedWeeksByUserFromTable } from '@/lib/lockedWeeks';

export async function householdBeltRows(householdId?: number | null) {
  const house = sqlInHousehold('id', householdId);
  const [users, locked] = await Promise.all([
    query(
      `SELECT id, name, coach_tone FROM users WHERE pin_hash IS NOT NULL ${house.sql} ORDER BY name ASC`,
      house.params
    ),
    lockedWeeksByUserFromTable(householdId),
  ]);
  return (users.rows as { id: number; name: string; coach_tone?: string | null }[]).map((user) => {
    const lockedWeeks = locked.get(Number(user.id)) || 0;
    return {
      id: Number(user.id),
      name: user.name,
      ...progressFor(lockedWeeks, user.coach_tone, user.name),
    };
  });
}
