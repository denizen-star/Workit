# Update Documentation Task

You are updating documentation after code changes.

## 1. Identify Changes
- Check git diff or recent commits for modified files
- Identify which features/modules were changed
- Note any new files, deleted files, or renamed files

## 2. Verify Current Implementation
**CRITICAL**: DO NOT trust existing documentation. Read the actual code.

For each changed file:
- Read the current implementation
- Understand actual behavior (not documented behavior)
- Note any discrepancies with existing docs

## 3. Update Relevant Documentation

- If the change touches **auth/middleware**, **the workout program**, **badges**, or **`/admin`**, verify **`CLAUDE.md`** (and touched pages) still describe actual behavior before updating narratives.
- **CHANGELOG.md**: Add entry under "Unreleased" section
  - Use categories: Added, Changed, Fixed, Security, Removed
  - Be concise, user-facing language
- Update application help files
- Update system documentation

## 4. Documentation Style Rules

✅ **Concise** - Sacrifice grammar for brevity
✅ **Practical** - Examples over theory
✅ **Accurate** - Code verified, not assumed
✅ **Current** - Matches actual implementation

❌ No enterprise fluff
❌ No outdated information
❌ No assumptions without verification

## 5. Ask if Uncertain

If you're unsure about intent behind a change or user-facing impact, **ask the user** - don't guess.

## 6. Always send user release notes

After the docs are updated, **always** mail household users. Do not skip this step.

1. Rewrite `lib/emails/currentRelease.ts` from **CHANGELOG Unreleased**. Sandwich: `intro` / `mid` / `close` in **Master Tom Iron** (quit as a noun, address **man** in the body, no orphan `Man.` greeting). The `groups` middle is **plain English and visual** (`label — fact`). No developer words. Sign **Master Tom Iron**. James Grey and Luna Meadows recipients get their own intro/mid/close automatically. No Add-to-Home-Screen block on release.
2. This mail is **for users**, not ops. No Netlify, env vars, cron secrets, Admin Mail, BCC, or deploy checklists.
3. Keep `version` / `title` / `groups` current. Feature lines are facts, not a dump.
4. Run `npm run mail:release` (needs `.env.local` SMTP). That sends to every `users.email` and BCCs `info@kervinapps.com`.
5. In the reply, say who it went to (count, not a dump of secrets) and the subject. If SMTP fails, say so — still finish the docs.
