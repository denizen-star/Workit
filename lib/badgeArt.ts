function slugFor(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function badgeArtSrc(name: string) {
  return `/badges/${slugFor(name)}.svg`;
}
