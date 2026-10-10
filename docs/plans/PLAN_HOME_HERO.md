# Home Hero Simplification Plan

**Overall Progress:** `96%` (24 of 25 subtasks)

## TLDR
Replace the busy Home hero with a **Workout box** (Start Next + Pick one), one headline number (Effective · 15 days), and an Invite footer row. Add a Monday encouragement note after a broken streak, a Focus filter + Add/Swap toggle in the Your pick sheet, and fix streak badges so later runs can still earn them. Mockups: `public/hero-options.html` (G2, H, I, K, L, M1).

## Critical Decisions
- Workout box, not four buttons: **Start Next** (starts the next program day) + **Pick one** (opens the Your pick sheet). Select WO, Pick and Invite leave the button row.
- Your pick slot day: **Pick one** is the only gold button; no Start Next.
- Pick one → existing Your pick sheet over `/workout?yourPick=<week>`; falls back to `/workout` when the sheet is unavailable (locked week, Test Drive). No new combined picker.
- Button text: Start = `Legs est 52m`; Pick one = `Upper, Lower, Yoga, Core, Full body or Run`. Both buttons equal width and height. The line under the title is dropped (it now lives on the buttons).
- Effective is the only KPI kept on the hero; the other three stay in Week performance / Your performance.
- Invite moves to a footer row (G2). Medal stays top-right.
- Sheet filter = **M1**: a FOCUS row (Gym / Core / Home · 2 DB / Travel) above Category, defaulting to the athlete's own focus, multi-select. Tagged by Your pick category, not per pack (`FOCUS_PICK_CATEGORIES` in `lib/focusRotation.ts`): Upper/Lower/Full body → Build muscle; Core & other + Pilates → Core Inspired; Home · 2 Dumbbells → Home; Travel → Travel; Run under every focus.
- Add/Swap becomes one-row segmented toggle. One unstarted day → "Swap for <day>"; several → "Swap for…" opens a day list; none → toggle hidden.
- Break note: Monday (Eastern), two back-to-back weeks trained, last week missed, nothing done yet this week. Text: "One week break is fine. Let's get back to the iron." Coach happy face, regular weight, soft gold box above Invite.
- Streak badges count the **longest** back-to-back run (not only the first). Awarded on the athlete's next finished workout.
- Past-week credit idea is **dropped** (written to prod, then removed; nothing pending).

## Tasks:

- [x] 🟩 **Step 1: Streak badge fix**
  - [x] 🟩 `lib/badges.ts` counts the longest consecutive run
  - [x] 🟩 Typecheck clean

- [x] 🟩 **Step 2: Monday break note**
  - [x] 🟩 `lib/streakBreak.ts` condition + wired into `app/home/page.tsx`
  - [x] 🟩 Restyle: athlete's coach happy portrait (`coachPersonaSrc(userTone, 'happy')`), regular weight, gold-tinted box above Invite

- [x] 🟩 **Step 3: Start / resume hero**
  - [x] 🟩 Workout box, Effective number, Invite footer, smaller title
  - [x] 🟩 Pick one → `pickHref ?? '/workout'`
  - [x] 🟩 Start button text `Legs est 52m` (focus + estimate)
  - [x] 🟩 Pick one text `Upper, Lower, Yoga, Core, Full body or Run` (also on the Your pick day button)
  - [x] 🟩 Equal width and height for both buttons (single button fills the row)
  - [x] 🟩 Remove the focus line under the title

- [x] 🟩 **Step 4: Rest-day and all-complete hero**
  - [x] 🟩 Rest day (K): Workout box with a single gold **Pick one**; Effective + Invite footer; medal kept
  - [x] 🟩 All complete (L): single gold **Browse** (→ `/workout`) with "Every week, any session"; Effective + Invite footer
  - [x] 🟩 Fix stale copy "All 6 weeks complete" → "All 48 weeks complete"

- [x] 🟩 **Step 5: Your pick sheet — Focus filter (M1)**
  - [x] 🟩 Add a focus tag to each pick variant (`lib/yourPick.ts`) per the mapping above
  - [x] 🟩 FOCUS chip row above Category in `components/YourPickSheet.tsx`, labels from `FOCUS_OPTIONS`
  - [x] 🟩 Default to the athlete's own focus(es); allow multi-select
  - [x] 🟩 Focus narrows Category chips and the Workout dropdown

- [x] 🟩 **Step 6: Your pick sheet — Add/Swap toggle**
  - [x] 🟩 Replace the stacked pills with a one-row segmented toggle
  - [x] 🟩 Several swap targets: "Swap for…" opens a day list, then shows the chosen day
  - [x] 🟩 Hide the toggle when there is nothing to swap; keep the day-card Swap pre-selection

- [x] 🟩 **Step 7: Docs**
  - [x] 🟩 Update `docs/WHAT_IS_WORKIT.md` (Home hero, Pick one sheet, break note, streak badges)
  - [x] 🟩 Update the Home / Your pick / badges sections of `CLAUDE.md`

- [x] 🟩 **Step 8: Verify and clean up**
  - [x] 🟩 One `tsc --noEmit`
  - [ ] 🟥 One screenshot of Home as Test (PIN 0000), start day — no browser tool in this session; needs a look on your side
  - [ ] 🟨 Delete `public/hero-options.html`, `public/hero-original.png` (kept for side-by-side until the real hero is checked); `scripts/weeks-per-athlete.ts` already deleted
