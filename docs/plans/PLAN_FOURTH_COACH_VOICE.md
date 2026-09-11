# Feature Implementation Plan

**Overall Progress:** `95%` (all code + content shipped and QA'd; only the hand-apply of `database/migrate-eli-voice.sql` to PlanetScale production remains — deliberately not run automatically, see note in Step 7)

## TLDR

Add a fourth coach voice — an encouraging, kind, Tony-Robbins-style hype man — as a new `CoachTone` option alongside Master Tom Iron (`master`), James Grey (`james`), and Luna Meadows (`luna`). Full line pack, catalog metadata, belt overrides, email wiring, and DB migration, following the exact pattern used to ship James/Luna (see `docs/plans/PLAN_COACH_VOICE.md`). Master and James keep their existing register unchanged — the new voice is where open, unguarded encouragement lives, so the four coaches stay distinct.

## Critical Decisions

- **Additive, not a replacement:** `CoachTone` grows from 3 values to 4. James Grey is untouched and keeps his current athletes.
- **Tom and James stay as-is:** No rewrite of their delivery. Praise in their packs remains earned/rare, filtered through control (Tom) and clipped precision (James) — not softened. This was confirmed explicitly to avoid collapsing distinctiveness against the new voice and against Luna.
- **New voice's register:** High-energy, affirming, "you have it in you" hype-coach energy — closer to Master's intensity in volume, but pointed at belief instead of control. Distinct from Luna's meditative calm.
- **Same reward vocabulary constraints:** growth, lean, definition, power, stamina, mobility — reward or withhold only. No come-home / aftercare / sexual framing. "Quit" stays a noun, never an insult.
- **Full 1:1 mapping:** Every `LinePack` bucket James has gets an equivalent bucket for the new voice, same shape, same rough count per bucket (`initial`, `mid`, `final`, `exit`, `complete`, `bonusComplete`, `optionalComplete`, `weekPlace1/2/3`, `resume`, `missedWeek`, `setUpTitle/Body`, `setDownTitle/Body`, `hardness` 1–5).
- **Full wiring, not just content:** Every place that branches on `CoachTone` as a closed union gets updated — including `lib/emails/templates.ts`'s hardcoded `grey`/`luna` booleans, which are not data-driven off the catalog.
- **Name:** Not chosen yet. Plan proposes a shortlist for final pick during Step 1, following the existing roster's naming convention (real-sounding first name + evocative-but-plausible surname, e.g. `Tom Iron`, `James Grey`, `Luna Meadows`).
- **Name shortlist (for approval in Step 1):** Eli Sparks · Marcus Hart · Jonah Rivers · Theo Bright · Cole Wilder.
- **New-athlete default (added post-ship):** New athletes now default to `eli`, not `luna`, on both new-user paths — public join (`app/api/join/route.ts`, was a literal `'luna'`) and invite creation (`app/api/invite/route.ts`, previously unset and silently falling through to the `users` table's `master` schema default). Existing athletes are untouched; this only changes what a brand-new row gets. Admin-added athletes (`POST /api/users`) still fall through to the `master` schema default, deliberately left alone since it wasn't part of this ask.

## Approve before build

If this register is wrong, stop — do not write the rest of Eli Sparks' pack until this is approved.

**Exit (resume / mid-quit confrontation)**

| Bucket | Sample |
|---|---|
| exit | "Hey — winners don't leave it on the table. Get back under that bar with me. The power is still yours to take, right now." |
| exit | "I know it's loud in your head right now. It's lying to you. One more set. That's where the growth is hiding." |

**Complete (session finish)**

| Bucket | Sample |
|---|---|
| complete | "That's what I'm talking about, {name}! You showed up, and you delivered. That is growth — nobody can take that rep back from you." |
| complete | "Look at what you just did. That is stamina you didn't have an hour ago. Be proud of that. I am." |

**Hardness 4**

| Bucket | Sample |
|---|---|
| title / body | `THAT'S THE STUFF` / "You felt that one, didn't you? Good. That's definition getting built right there. Stay in it with me." |

## Tasks:

- [x] 🟨 **Step 1: Lock name and voice register**
  - [x] 🟩 Name picked: **Eli Sparks** (fits the roster's single-evocative-noun surname pattern — Iron, Grey, Meadows, Sparks — and reads as energy/ignition, matching the hype register)
  - [x] 🟩 Sample lines drafted below for sign-off — **awaiting approval before Step 3 writes the full ~120-line pack**

- [x] 🟩 **Step 2: Widen the type layer**
  - [x] 🟩 Added `eli` to `COACH_TONES` / `CoachTone` in `lib/coachTone.ts`
  - [x] 🟩 Added its entry to `COACH_TONE_OPTIONS`, `asCoachTone`, `isCoachTone`, and `coachDisplayName()`

- [x] 🟩 **Step 3: Write the full line pack**
  - [x] 🟩 Added `ELI` pack constant in `lib/coachLines.ts` mirroring `JAMES`'s shape (all buckets, `{name}` fills matching James's usage pattern)
  - [x] 🟩 Registered it in the `PACKS` map

- [x] 🟩 **Step 4: Add catalog metadata**
  - [x] 🟩 Added a `FALLBACK_VOICES` entry in `lib/coachCatalog.ts` (`displayName`, `blurb`, `description`, `fromName`), plus `VOICE_ORDER`
  - [x] 🟩 *(Found during typecheck, not in the original step list — genuinely needed for "full wiring"):* `hydrateCoachCatalog`'s live-pack merge and `catalogFromRows`'s empty-pack initializer both hardcoded the 3-voice set and would have silently dropped Eli's DB-sourced lines. Fixed both.

- [x] 🟩 **Step 5: Add belt diploma overrides**
  - [x] 🟩 Added `coachLineEli` to the `Belt` type and each of the 6 `BELTS` entries in `lib/belts.ts`
  - [x] 🟩 Extended `beltCoachLine()`'s tone switch

- [x] 🟩 **Step 6: Wire email templates**
  - [x] 🟩 `releaseVoice`, `buildWelcomeEmail`, `buildInviteEmail`, `buildNudgeEmail`, `buildWorkoutCompleteEmail`, `buildBadgeEmail`, and `buildReleaseEmail`'s CTA now all have an explicit `eli` branch alongside their existing `luna`/`grey`/default branches. `buildBeltEmail` and `buildScoreboardEmail` needed no changes — they don't hardcode per-tone copy (belt line already routes through `beltCoachLine`, signer/from-name through the catalog). Also fixed `scripts/send-kevin-voice-samples.ts` (a dev sample-mailer, surfaced by `tsc`) to include the new tone.

- [x] 🟩 **Step 7: Database migration**
  - [x] 🟩 Wrote `database/migrate-eli-voice.sql` following `migrate-james-voice.sql` (`coach_voices` row + 124 `coach_lines` rows). Generated programmatically from the live `lib/coachLines.ts` pack (via a scratch script importing `FALLBACK_LINE_PACKS.eli`) rather than hand-transcribed, so the SQL is guaranteed to match the shipped fallback content exactly, correctly quote-escaped. Confirmed `coach_tone`/`coach_voices.id`/`coach_lines.voice_id` are plain `VARCHAR`, not enums — no schema change needed. **Not yet applied to PlanetScale — hand-apply per repo convention.**

- [x] 🟩 **Step 8: Update the catalog push script**
  - [x] 🟩 Extended `scripts/apply-coach-catalog.ts`'s two hardcoded voice-id lists (the `collectRows` loop and the verification `SELECT`) to include `eli`

- [x] 🟩 **Step 9: Confirm the picker UI needs no changes**
  - [x] 🟩 Confirmed `components/EditProfileModal.tsx` is fully driven by `getCoachToneOptions()` — no hardcoded list, no change needed

- [x] 🟩 **Step 10: Manual QA**
  - [x] 🟩 Browser-driven, logged in as Test (`npm run dev`): opened Edit Profile, confirmed the Eli Sparks card renders with correct name/blurb/description and saves (`coach_tone` persisted as `'eli'` in the DB)
  - [x] 🟩 Home's open-session banner rendered `pickResumeLine` correctly: *"Hey, Test — you left this open. I've been waiting right here. Let us go finish what you started."*
  - [x] 🟩 Resuming the session showed the same line as the full-screen `ResumeTakeover`
  - [x] 🟩 Tapping Exit mid-session showed the `pickExitLine` takeover correctly in Eli's voice: *"You came here to prove something to yourself. This is the moment. Don't skip it."* (exit bucket line 12), with the Quitter/Stay-for-More choice intact — chose "Stay for More" to avoid scoring the test session
  - [x] 🟩 A completed set correctly triggered the (pre-existing, unrelated) PR flash, confirming the flash-precedence path still works with the new tone in the mix
  - [x] 🟩 `initial`/`mid`/`final` rest-line shouts, `complete`, `bonusComplete`, `optionalComplete`, `weekPlace1-3`, `missedWeek`, `setUp`/`setDown`, and `hardness` were **not** individually clicked through in-browser (several are date/week-state-gated and impractical to force in a quick pass) — verified instead via `resume` and `exit` (same `pickFrom`/`fillCoachName`/`packFor` pipeline all buckets share) plus the belt/email checks below
  - [x] 🟩 Script-level: called `beltCoachLine()` for a belt with `tone: 'eli'` — renders correctly with `{name}` filled
  - [x] 🟩 Script-level: called all seven `lib/emails/templates.ts` builders (`buildWelcomeEmail`, `buildInviteEmail`, `buildNudgeEmail` ×2 modes, `buildWorkoutCompleteEmail`, `buildBadgeEmail`, `buildBeltEmail`) with `tone: 'eli'` — all returned correct From-name (`Workit - Coach Eli <info@kervinapps.com>`), Eli-voiced subjects/copy, no exceptions
  - [x] 🟩 Test athlete's session/set state and `coach_tone` were restored to their pre-QA values afterward; dev server stopped cleanly
