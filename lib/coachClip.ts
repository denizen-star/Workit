/** Stable lookup text for a stored coach clip. `{name}` stays in the template. */
export function coachClipTemplate(title: string | null | undefined, body: string): string {
  const heading = title ?? '';
  if (heading && body) return `${heading}\n${body}`;
  return body || heading;
}
