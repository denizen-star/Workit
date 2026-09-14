# New-Athlete Onboarding Fixes

**Overall Progress:** `100%`

## TLDR
Four fixes surfaced from onboarding a real new athlete (Panayiotis): a false "you missed last week" takeover fires for brand-new accounts, missing profile photos show broken instead of an initials fallback, other athletes' real names leak into athlete-facing comparison screens instead of their alias, and the "How to use" page needs to become a real step-by-step walkthrough with screenshots. (A fifth reported issue — exercise video not playing inline in Chrome — was confirmed to be a browser/incognito third-party-cookie restriction, not an app bug, and is out of scope.)

## Critical Decisions
- **Missed-week eligibility**: a user is only eligible for the `WeekMissTakeover` if their account existed before the closed week's Monday. Requires adding `users.created_at` to `getCurrentUser()`'s SELECT (`lib/auth.ts:64`) and gating the `miss` computation in `app/api/week-podium/route.ts` on it.
- **Avatar fallback**: build one reusable initials-avatar component (alias-else-first-name initial, via existing `athleteCallName` from `lib/profile.ts`), applied to `components/AppMenu.tsx`'s own-profile avatar spots (both occurrences, ~line 164-171 and ~325-332) where a missing photo currently renders nothing.
- **Alias scope**: alias-else-first-name (`athleteCallName`) replaces raw names for *other* athletes only on athlete-facing screens — `components/HouseholdScoreboard.tsx` (The house table + honor rolls) and `components/YouVsLeader.tsx` (You vs leader). Admin/Kevin-only tools (`AdminAnalyticsDashboard.tsx`, `AdminAthletePerformance.tsx`, `WeekMedalCountTable.tsx`, `PerformanceDesk.tsx`'s athlete picker) keep showing real names, since Kevin needs to identify people unambiguously. `WeightRanking.tsx` is shared by both contexts — its existing `names === 'full'` toggle (admin) vs first-name mode (athlete-facing) is extended so only the non-`'full'` path becomes alias-aware.
- **Alias data plumbing**: this requires adding `display_name` to the underlying SQL in `lib/scoreboard.ts` (household rows, bonus/optional/cardio honor) and `lib/weekPodium.ts` (week volume rows used by You vs leader / Home), and to the corresponding row types, so the alias is actually available to the components in scope. Admin-only queries are left untouched.
- **How-to-use page**: rebuilt as a numbered step-by-step layout (still linked from the same hamburger entry + Home banner). Screenshots are user-provided (not auto-captured); stored as static files under `public/how-to/` and referenced with plain `<img>` (matching the existing `public/badges/`, `public/belts/` pattern — no `next/image` used anywhere in this app). Copy is restructured from the current 5 bullets in `lib/joinCopy.ts` into a step sequence, not rewritten with new claims.
- **Video regression**: dropped from scope — confirmed as Chrome/incognito blocking YouTube's iframe embed (works on iPhone/Safari), not an app defect.

## Tasks:

- [x] 🟩 **Step 1: Stop the false "missed week" takeover for new accounts**
  - [x] 🟩 Add `created_at` to `getCurrentUser()`'s SELECT and returned user object (`lib/auth.ts:64`, `:123`)
  - [x] 🟩 Gate the `miss` computation in `app/api/week-podium/route.ts:41-51` so it only runs when the user's account existed before that closed week's Monday (`accountExistedBeforeWeek` in `lib/weekPodium.ts`)
  - [x] 🟩 Verified against the real Panayiotis account: old logic computed `missedTheWeek=true` (would have shown the takeover), fixed logic correctly returns `false` since his account (created 2026-09-08) postdates the closed week (2026-08-31)

- [x] 🟩 **Step 2: Initials-avatar fallback**
  - [x] 🟩 Build a small reusable initials-avatar component (`components/InitialsAvatar.tsx`) — takes an alias-aware call name, shows its first letter
  - [x] 🟩 Replace the "render nothing when no photo" branches in `components/AppMenu.tsx` (header avatar + menu-drawer avatar) with the new fallback, using the already alias-aware `callName` state

- [x] 🟩 **Step 3: Show alias instead of real name for other athletes (athlete-facing screens)**
  - [x] 🟩 Add `display_name` to the relevant queries in `lib/scoreboard.ts` (household rows, bonus honor), `lib/optionals.ts` (optional/cardio honor), and their row types in `lib/scoreboardTypes.ts`
  - [x] 🟩 Update `components/HouseholdScoreboard.tsx` (pack volume bar, honor rows, main ranked rows) via a shared `houseAthleteLabel` helper — every row shows `athleteCallName`, except the current user always sees their own real name
  - [x] 🟩 Update `components/YouVsLeader.tsx` to use `athleteCallName` for the rival instead of raw `firstName(rival.name)`
  - [x] 🟩 Threaded `display_name` through `lib/exerciseCompare.ts`'s athlete/ranking pipeline and extended `components/WeightRanking.tsx`'s non-`'full'` name mode to use `athleteCallName` (admin `'full'` mode untouched)
  - [x] 🟩 Confirmed admin-only surfaces (`AdminAnalyticsDashboard.tsx`, `AdminAthletePerformance.tsx`, `WeekMedalCountTable.tsx`, `PerformanceDesk.tsx` picker, `HouseholdAthleteCard.tsx`'s multi-athlete Kevin view) are untouched and still show real names
  - Note: shared coach-commentary sentence generators (`tomScoreboardLine`, `emptyWindowLine` in `lib/scoreboardTypes.ts`) were intentionally left as-is — they're reused by an admin/self-snapshot path, and changing their embedded wording was outside the scoped "name label" fix. The house's per-row commentary sentence still says the real first name mid-sentence even though the row label above it now shows the alias.

- [x] 🟩 **Step 4: Rebuild How-to-use as a step-by-step walkthrough**
  - [x] 🟩 Restructured `lib/joinCopy.ts`'s `HOW_TO_*` content into `HOW_TO_STEPS` — 5 numbered steps (title + description per step), same substance as the original 5 bullets, no new claims
  - [x] 🟩 Rebuilt `app/how/page.tsx` to render numbered step cards with an image slot per step (broken/missing image hides itself via `onError`, matching the existing exercise-image fallback pattern)
  - [x] 🟩 Created `public/how-to/` — waiting on you to drop in the 5 screenshots (`step-1-home-screen.png` ... `step-5-travel.png`); page already renders correctly today with images hidden until then
  - [x] 🟩 Confirmed the hamburger-menu link (`AppMenu.tsx`) and the Home "How to use Work-It" banner still point to `/how` unchanged
