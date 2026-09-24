# Git Release & Versioning Task
Analyze the current changes and prepare a formal Git release.

## 1. Determine Version Bump:
- **Minor (0.1.0)**: New features, but backward compatible.
- **Major (1.0.0)**: Breaking changes or massive architectural shifts.
- **Patch (0.0.1)**: Bug fixes only.

## 2. Generate Release Notes:
- Summarize all commits since the last tag.
- Group by: Features, Fixes, and Internal.

## 3. Execute Commands:
Ask for permission to run:
1. `git add .`
2. `git commit -m "chore: release v[version]"`
3. `git tag -a v[version] -m "[Summary of changes]"`
4. `git push origin main --tags`

## 4. Send Release Notes (after the push, once production has the code)

Only run this after step 3 has pushed successfully — this mail tells athletes about a change that's live, not one still deploying.

1. Rewrite `lib/emails/currentRelease.ts` from the **CHANGELOG Unreleased** section you just released. Sandwich: `intro` / `mid` / `close` in **Eli Sparks** (high-energy, encouraging, believes-in-you; quit as a noun). Every athlete gets the same Eli letter whatever their own coach is (`BROADCAST_TONE` in `lib/mailFrom.ts`). The `groups` middle is **plain English and visual** (`label — fact`). No developer words. The signer is Eli automatically — do not set `signer` / `tone`. No Add-to-Home-Screen block on release.
2. This mail is **for users**, not ops. No Netlify, env vars, cron secrets, Admin Mail, BCC, or deploy checklists.
3. Keep `version` / `title` / `groups` current (match the version you just tagged). Feature lines are facts, not a dump.
4. Set `onlyAthletesWithWorkouts: true` and `activeInDays: 14` so it only goes to athletes who've trained in the last two weeks.
5. Run `npm run mail:release` (needs `.env.local` SMTP). That sends to every qualifying `users.email` from `news@workitapp.fit` and BCCs `info@workitapp.fit`.
6. In the reply, say who it went to (count, not a dump of secrets) and the subject. If SMTP fails, say so — still finish the release.
