# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR
Build a single static `/help` page — an in-app user guide — replacing `/how` and `/about`. Content and layout are locked in from the approved design preview ([artifact](https://claude.ai/code/artifact/bd38c0f0-e126-4e3e-9283-a587dabcf45a)): Summary, Getting Started, Running a Workout, App Pages, Training Mechanics, Program & Belts, Glossary. One plain page component, no new abstractions.

## Critical Decisions
- **One page component, plain JSX** — `app/help/page.tsx` renders all 7 sections inline with Tailwind classes matching the palette (gold/cream/earth-green/earth-red/copper). No new reusable "page-card" or "glossary" components — this is a single-use static page.
- **Reuse existing chrome only** — `YouPageShell` for header/back-link/menu, `.glass-card`/`glass-header` utility classes already in `globals.css` for card styling. No new design-system pieces.
- **No interactivity beyond anchor links** — jump-nav is plain `<a href="#section">`. No collapsible folds, no client state, no `HomeFold` — the artifact preview doesn't use folds either, so none needed.
- **Retire, don't redirect** — `/how` and `/about` are deleted outright (routes + menu entries + their content sources), not kept as redirects, since their content now lives on `/help`.
- **Screenshots are a separate follow-up step** — page ships with `public/help/*.png` paths wired using the same `onError`-hides-on-404 pattern as `/how`; images are captured afterward via the `run` skill and dropped in without further code changes.
- **Menu placement** — `/help` replaces the `/how` and `/about` rows in `AppMenu.tsx`'s athlete nav array as one entry: `{ href: '/help', label: 'Help', Icon: CircleHelp }`.
- **Coach cards reuse existing data** — Program & Belts pulls its 4 coach cards straight from `COACH_TONE_OPTIONS` in `lib/coachTone.ts` instead of duplicating coach copy. Belt list itself is not duplicated — the section links to `/belts` instead of re-listing every belt.

## Tasks:

- [x] 🟩 **Step 1: Build `app/help/page.tsx`**
  - [x] 🟩 Scaffold with `YouPageShell` (title "Help")
  - [x] 🟩 Summary section — anchor index list linking to the 7 sections below
  - [x] 🟩 Getting Started section — 3 numbered steps (home screen, login, first workout), each with a `public/help/*.png` image + onError hide
  - [x] 🟩 Running a Workout section — 5 numbered steps (start/resume, log a set, rest & rate, optional warmup/cooldown, finish it), each with a screenshot slot
  - [x] 🟩 Your Coach section (added after initial build, per follow-up feedback) — what the coach voices do, where they show up (live workout bubble, PR/gain-loss/effort moments, Finish/Awards, belt & badge unlocks, emails), plus the 4 coach cards from `COACH_TONE_OPTIONS`
  - [x] 🟩 App Pages section — 8 static cards (Home, Your performance, The house, Completed log, Belts, Medals, Edit profile, Invite a friend) with icon, description, bullets, screenshot
  - [x] 🟩 Training Mechanics section — 5 status rows (logging a set, Gym vs Travel, week lock, miss the week, bonus & optionals)
  - [x] 🟩 Program & Belts section — program summary only (coach cards moved to Your Coach)
  - [x] 🟩 Glossary section — 6 term/definition pairs (History, Avg Effective, Best, Volume, Effort, Noise Control)

- [x] 🟩 **Step 2: Retire `/how` and `/about`**
  - [x] 🟩 Delete `app/how/page.tsx` and `app/about/page.tsx`
  - [x] 🟩 Remove `HOW_TO_STEPS` / `HOW_TO_TITLE` / `HOW_TO_LEAD` from `lib/joinCopy.ts` (content now lives inline in `app/help/page.tsx`)
  - [x] 🟩 Confirm `components/ProgramInfo.tsx` had no other importers, then delete it
  - [x] 🟩 Update the Home banner link at `app/home/page.tsx` from `/how` to `/help`

- [x] 🟩 **Step 3: Update navigation**
  - [x] 🟩 In `components/AppMenu.tsx`, replace the `/how` and `/about` entries with a single `{ href: '/help', label: 'Help', Icon: CircleHelp }`
  - [x] 🟩 Swap the `Info` import for `CircleHelp` from `lucide-react` (confirmed `Info` had no other usages)

- [x] 🟩 **Step 4: Update docs**
  - [x] 🟩 `CLAUDE.md` — replace the `/how` and `/about` route entries with `/help`; update the Routes list and the athlete-hamburger menu description
  - [x] 🟩 `docs/PAGE_SECTIONS.md` — replace the `/how` and `/about` entries with one `/help` entry; update the menu-structure note
  - [x] 🟩 `docs/WHAT_IS_WORKIT.md` — updated its sync note to reference `app/help/page.tsx` instead of `ProgramInfo.tsx`

- [x] 🟩 **Step 5: Capture and wire screenshots**
  - [x] 🟩 Launched the dev server, drove it headless (Playwright, no project skill existed for this app) logged in as **Test**, captured 14 of 16 screenshots
  - [x] 🟩 Saved under `public/help/*.png`; verified via a headless load of `/help` that all 14 render (`naturalWidth` > 0) and the 2 missing ones hide cleanly with no console noise beyond their own 404
  - Skipped, documented: `start-home-screen.png` (Safari's Add-to-Home-Screen share sheet is OS chrome, not renderable in any browser automation) and `page-invite.png` (Invite a friend is hidden from the Test account by design — capturing it would require another account's real PIN, which isn't something to guess or assume access to)

- [x] 🟩 **Step 6: Verify**
  - [x] 🟩 `npx eslint app/help/page.tsx` clean; `next lint` is gone in Next 16 so pre-existing errors elsewhere confirmed unrelated via `git diff`
  - [x] 🟩 `npm run build` — clean production build, `/help` compiles static, `/how` and `/about` no longer in the route table
  - [x] 🟩 Headless QA as Test user: `/help` loads post-login, all wired images render, coach portraits render, page reads at 430px width (phone-sized viewport)
