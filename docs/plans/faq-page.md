# Feature Implementation Plan — Public FAQ Page (`/faq`)

**Overall Progress:** `100%`

## TLDR
Add a new public `/faq` page making the case for Work-It against common fitness-tracker complaints, backed by an honest, positive-framed answer for each of 9 audited claims. Linked from `/join`, `/login`, `/help`, and the athlete menu, visible to both logged-out prospects and logged-in athletes.

## Critical Decisions
- **9 items, not 10** — "No Spam" (guilt-tripping streak notifications) dropped per user request; `WeekMissTakeover`'s guilt-tone remains an open product tension, out of scope here.
- **Standalone public shell, not `YouPageShell`** — `/help` reuses `YouPageShell`, which calls `/api/me` and assumes an authenticated athlete (hamburger menu, profile data). `/faq` must work for logged-out visitors too, so it gets its own lightweight header/footer in the visual style of `/join`/`/login` (logo, back link), independent of session state.
- **Copy lives in its own data file** (`lib/faqCopy.ts`), following the existing `lib/joinCopy.ts` / `lib/quickstartCopy.ts` pattern — keeps content separate from page layout.
- **Neutral voice, generic competitor framing** — no coach persona, no named competitor apps.
- **Positive framing over disclosure** — PARTIAL/FALSE items get copy built around what's real (e.g. Gym/Travel toggle, Optional warmup/cooldown, historical KPI tiles) without asserting the unbuilt parts (general equipment swaps, load-based warmup calculator, computed overload targets, warmup/cooldown time in estimates).

## Tasks:

- [x] 🟩 **Step 1: Middleware — make `/faq` public**
  - [x] 🟩 In `middleware.ts`, add `pathname === '/faq'` to the public-route check alongside `/waiver` (line ~39)

- [x] 🟩 **Step 2: FAQ copy data**
  - [x] 🟩 Create `lib/faqCopy.ts` exporting an ordered list of 9 `{ question, answer }` entries:
    1. Zero-Friction Logging
    2. Gym-Smart Routines
    3. Instant Exercise Swaps (Gym ↔ Travel toggle)
    4. Clean, Focused UI
    5. Fair Pricing
    6. Accurate Timers (working sets + rest)
    7. Automated Plate Math → reframed as intentional simplicity
    8. Auto Warm-Up Sets → reframed around real Optional warmup/cooldown tracks
    9. Built-In Overload → reframed around real historical KPI tiles / last-time chip

- [x] 🟩 **Step 3: `/faq` page**
  - [x] 🟩 Create `app/faq/page.tsx`: standalone public layout (logo header, no auth-gated shell), title framed as "Why Work-It", renders the 9 Q&A entries from `lib/faqCopy.ts`
  - [x] 🟩 Footer links: back to `/login` (logged-out) and `/join?h=gowanus`, matching the link style already used on `/login` and `/join`; logged-in visitors see a "Back to Home" link instead

- [x] 🟩 **Step 4: Entry-point links**
  - [x] 🟩 `app/login/page.tsx` — added a link to `/faq` below the existing `/join?h=gowanus` link
  - [x] 🟩 `app/join/page.tsx` — added a link to `/faq` below the existing `/login` link on the intro step
  - [x] 🟩 `app/help/page.tsx` — added a cross-link to `/faq` below the intro paragraph
  - [x] 🟩 `components/AppMenu.tsx` — added a `/faq` ("Why Work-It") entry to the athlete menu, next to `/help`

- [x] 🟩 **Step 5: Docs sync**
  - [x] 🟩 `CLAUDE.md` — added `app/faq/page.tsx` to the Routes list, and added `/faq` to the Auth flow's public-routes sentence
