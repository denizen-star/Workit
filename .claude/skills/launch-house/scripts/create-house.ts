/**
 * Creates a new Work-It household ("house") and adds Kevin (user id 1) as a member.
 *
 * Usage:
 *   npx tsx --env-file=.env.local .claude/skills/launch-house/scripts/create-house.ts <slug> <name> <public_join: 0|1>
 *
 * Example:
 *   npx tsx --env-file=.env.local .claude/skills/launch-house/scripts/create-house.ts williamsburg "Williamsburg" 1
 *
 * Idempotent: re-running for a slug that already exists reuses that row instead of failing,
 * and skips re-adding Kevin if he's already a member.
 */
import { query } from "@/lib/db";

async function main() {
  const [slug, name, publicJoinArg] = process.argv.slice(2);
  if (!slug || !name || publicJoinArg === undefined) {
    console.error("Usage: create-house.ts <slug> <name> <public_join: 0|1>");
    process.exit(1);
  }
  const publicJoin = Number(publicJoinArg) ? 1 : 0;

  const existing = await query(
    "SELECT id, slug, name, public_join FROM households WHERE slug = ?",
    [slug]
  );

  let householdId: number;
  if (existing.rows.length > 0) {
    const row = existing.rows[0] as any;
    console.log("Household already exists:", row);
    householdId = row.id;
  } else {
    await query(
      "INSERT INTO households (slug, name, public_join) VALUES (?, ?, ?)",
      [slug, name, publicJoin]
    );
    const check = await query(
      "SELECT id, slug, name, public_join FROM households WHERE slug = ?",
      [slug]
    );
    const row = check.rows[0] as any;
    console.log("Inserted household:", row);
    householdId = row.id;
  }

  const member = await query(
    "SELECT * FROM household_members WHERE household_id = ? AND user_id = 1",
    [householdId]
  );
  if (member.rows.length > 0) {
    console.log("Kevin already a member of", slug);
  } else {
    await query(
      "INSERT INTO household_members (household_id, user_id) VALUES (?, 1)",
      [householdId]
    );
    console.log(`Added Kevin (user_id=1) to ${slug} (household_id=${householdId})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
