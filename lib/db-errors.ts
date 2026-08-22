/** Best-effort check for PlanetScale/MySQL missing-column errors. */
export function isUnknownColumnError(e: unknown, column: string): boolean {
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  const col = column.toLowerCase();
  return (
    (msg.includes('unknown column') ||
      msg.includes("doesn't exist") ||
      msg.includes('does not exist')) &&
    msg.includes(col)
  );
}
