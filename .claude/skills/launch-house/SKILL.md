---
name: launch-house
description: Launches a new Work-It "house" (household) — the same mechanism behind The OG, Gowanus, Miami Beach, and Brooklyn. Use this skill whenever the user asks to create, add, launch, or set up a new house/household/location/gym/branch for Work-It, even if they just name a place ("make a Williamsburg house", "we need a house for the new gym location", "set up a house like Gowanus for X"). Also covers generating that house's join QR code, giving Kevin (the admin) access to it, and producing both its print-ready recruiting pamphlets (the 2-page form and the long form).
---

# Launch a new Work-It house

A "house" in Work-It is a row in the `households` table — nothing more. Every house built so far
(The OG, Gowanus, Miami Beach, Brooklyn) follows the identical recipe below, because the whole system
(join flow, scoreboard, belts, invites) is generic and reads from that table rather than hardcoding
house names anywhere in the app. See `CLAUDE.md`'s Database section for the full picture of how
households are modeled, and `database/migrate-households.sql` for how the table was seeded the first
time.

Because this writes directly to the **production** PlanetScale database, treat it the way this repo's
other `migrate-*.sql` scripts are treated: deliberate, logged, and confirmed with the user before the
write happens — not something to run silently.

## Step 1 — Get the specifics

Before touching the database, confirm with the user (don't assume):

1. **House name** — the display name, e.g. "Williamsburg". The slug is auto-derived (lowercase,
   spaces → hyphens, e.g. `williamsburg`) — show the user the derived slug and let them correct it if
   the auto-derived version is wrong (e.g. a name with an apostrophe or an abbreviation they'd rather
   spell differently in the URL).
2. **Public join or invite-only?** Always ask explicitly — don't default silently. Public join
   (`public_join = 1`, like Gowanus/Miami Beach/Brooklyn) means anyone with the join link/QR can
   self-register at `/join?h=<slug>`. Invite-only (`public_join = 0`, like The OG) means new members
   can only be added via the invite/claim flow.

Once confirmed, state back what you're about to create (slug, name, join type) before running anything.

## Step 2 — Create the household + give Kevin access

Run the bundled script, which is exactly the sequence used to create every prior house — insert the
`households` row (or reuse it if the slug already exists, so re-running is safe), then add Kevin
(user id 1, the standing admin of every house) as a `household_members` row so he can switch into it
from the app menu without going through public join himself:

```bash
npx tsx --env-file=.env.local .claude/skills/launch-house/scripts/create-house.ts <slug> "<name>" <0|1>
```

Example: `npx tsx --env-file=.env.local .claude/skills/launch-house/scripts/create-house.ts williamsburg "Williamsburg" 1`

Also write a `database/migrate-<slug>.sql` file recording the insert, matching the convention every
other `migrate-*.sql` file in this repo follows (a plain-language record of what was hand-applied to
prod, even though the script above is what actually ran it):

```sql
-- Run on PlanetScale by hand. Re-run = duplicate row (slug is UNIQUE).
INSERT INTO households (slug, name, public_join) VALUES
  ('<slug>', '<Name>', <0|1>);
```

## Step 3 — Generate the join QR code

The QR code is not an app feature — it's just an image encoding the join URL, generated with a
one-off tool (no dependency gets added to `package.json`):

```bash
npx -y qrcode "https://workitapp.fit/join?h=<slug>" -o <slug>-qr.png -w 800
```

Save it to the project root (matching `miami-beach-qr.png` / `brooklyn-qr.png`), and read the image
back once to visually confirm it rendered as a real QR pattern (not a blank or corrupted file) before
moving on — the pamphlet in the next step embeds this exact file, so a bad QR here means a bad
pamphlet.

## Step 4 — Generate the printable pamphlets

Every house so far gets **both** of these print-ready recruiting pieces. They're static HTML files
meant to be opened in a browser and printed (or "Print → Save as PDF") at US Letter size — no build
step or PDF library involved, and both are already fully generic templates (only house name, slug,
and QR filename change between houses).

**The 2-page form** (`pamphlet-template.html`) — front: pitch + QR + a live-session screenshot; back:
a plain gift-card-style cover with the QR again. This is the Gowanus/Miami Beach design.

**The long form** (`pamphlet-long-template.html`) — the fuller 4-page flyer (cover + QR, "one workout
then the year" walkthrough, feature grid + coach/belt showcase, a live-screenshot deep-dive page) that
became `Gowanus House Flyer.pdf`.

Copy both bundled templates and their shared assets:

```bash
cp .claude/skills/launch-house/assets/pamphlet-template.html <slug>-house.html
cp .claude/skills/launch-house/assets/pamphlet-long-template.html <slug>-house-long.html
cp .claude/skills/launch-house/assets/live-set-demo.png live-set-demo.png     # skip if already present from a prior house
cp .claude/skills/launch-house/assets/plank-hold-live.png plank-hold-live.png # skip if already present from a prior house
cp -r .claude/skills/launch-house/assets/characters characters               # skip if already present
cp -r .claude/skills/launch-house/assets/personas personas                   # skip if already present
```

Then replace, everywhere they appear in **both** `<slug>-house.html` and `<slug>-house-long.html`:
- `{{HOUSE_NAME}}` → the house's display name (e.g. `Williamsburg`) — in the 2-page form it sits on
  its own line above a fixed second line reading "House" (`<h1>{{HOUSE_NAME}}<br>House</h1>`), and in
  the long form it appears both as "{{HOUSE_NAME}} House" (title case, headers/footers) and
  "{{HOUSE_NAME}} house" (lowercase, mid-sentence body copy) — don't include the word "House"/"house"
  in the value itself either way.
- `{{SLUG}}` → the same slug used in Steps 2–3 — it feeds the join URL and the QR filename
  (`<slug>-qr.png`, matching what Step 3 already produced in the same folder).

`live-set-demo.png`, `plank-hold-live.png`, `characters/`, and `personas/` are all generic, shared
across every house's pamphlets — they only need to exist once per folder, not once per house.

Open both finished files (e.g. `open <slug>-house.html <slug>-house-long.html`) and glance at each
once to confirm the name, QR, and URL substituted cleanly and nothing still reads `{{HOUSE_NAME}}` or
`{{SLUG}}` before telling the user they're ready.

## Step 5 — Report back

Tell the user, concretely:
- The household row created (id, slug, name, public_join)
- That `/join?h=<slug>` is live
- That Kevin now has access and can switch into it from the house dropdown in the app menu
  (`components/AppMenu.tsx` — a `<select>` bound to `houseId`, since Work-It houses are meant to
  scale past two or three)
- Where the QR PNG and both pamphlets (`<slug>-house.html` and `<slug>-house-long.html`) landed,
  and that they're print-ready as-is (no further build step)

Do not touch `app/faq/page.tsx` or `app/login/page.tsx`'s hardcoded `/join?h=gowanus` marketing CTA
unless the user specifically asks the new house to be promoted there — every house built so far has
intentionally left that single public CTA pointed at Gowanus and relied on the QR code as the
distribution mechanism for other houses.
