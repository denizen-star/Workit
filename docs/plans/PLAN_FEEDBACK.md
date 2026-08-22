# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Add a low-chrome household feedback loop: a Master Tom Iron “Talk to me” edge widget on logged-in pages except workout, per-exercise thumbs on workout cards, and required 1–5 stars when finishing or quitting a session. Notes email Kevin immediately. Thumbs and stars persist for `/admin/feedback` (list + seven enjoyment charts + digest). Athletes see their own enjoyment charts on `/home`. Hide any chart or table with no data.

## Critical Decisions

- **Placement:** Right-edge icon-only tab on logged-in pages. Hidden on `/workout` (thumbs only there). Never in the packed header or on the bottom (rest / timed-set UI).
- **Look + voice:** Work-It gold / glass / dark. Always Master Tom Iron. Name and email prefilled from the session and hidden.
- **Two tables, no avg cache:** `feedback` for notes and thumbs. `session_ratings` for stars (complete vs quit, week, day type, gym/travel). Averages are queries.
- **Mail:** Written notes email `leacock.kervin@gmail.com` on Send it. Thumbs and stars are digest-only. Digest button lives on `/admin/feedback` only and includes star averages plus stored thumbs/notes that did not already mail.
- **Stars:** Required to Complete it or Quitter. Stay for More discards any tapped star. Charts: overall + finished-vs-walked. Day types use `workout_type` (Upper A / Lower A / Upper B / Lower B), not per-exercise push/pull.
- **Auth:** Signed-in only. No `/who`, no middleware change.

## Tasks:

- [x] 🟩 **Step 1: Schema**
  - [x] 🟩 Add `database/migrate-feedback.sql`: `feedback` (user_id, kind `note|thumb`, topic nullable, reason nullable `broken_video|image_mismatch|other`, message, exercise_name nullable, session_id nullable, page_url, created_at). Unique `(user_id, session_id, exercise_name)` where kind is thumb.
  - [x] 🟩 Same file: `session_ratings` (user_id, session_id unique, stars 1–5, outcome `complete|quit`, week_number, day_number, workout_type, workout_mode, created_at).
  - [x] 🟩 Apply on PlanetScale by hand (same as other Work-It migrates).

- [x] 🟩 **Step 2: Feedback write/read API**
  - [x] 🟩 Read `node_modules/next/dist/docs/` before adding routes.
  - [x] 🟩 `POST /api/feedback` via `requireCurrentUser`: notes (message required, topic optional bug/idea/workout/other, exercise_name blank) and thumbs (session_id + exercise_name required; up has no reason; down reason one of the three chips; something else allows empty text). Reject a second thumb for the same user/session/exercise.
  - [x] 🟩 On note insert, email Kevin immediately (`sendNow`, Tom from-name). Do not email on thumbs.
  - [x] 🟩 `GET /api/feedback?sessionId=` for the current user’s thumbs this session (so cards can show the locked vote).

- [x] 🟩 **Step 3: Talk to me widget**
  - [x] 🟩 `components/FeedbackWidget.tsx`: right-edge gold speech icon (`aria-label` / title “Talk to me, man”). Panel copy: title “Talk to me, man.”; deck “Broken video, wrong picture, weird set, next idea. I want the truth. Don’t make me guess.”; placeholder “What’s wrong. What’s working. What’s next.”; optional About; Send it / Handing it over… / Got it. Now get back under the bar.
  - [x] 🟩 Mount from root layout. Hide on `/workout` and `/who`. Hide while rest / timed-set / takeover overlays are open if those share the logged-in chrome.

- [x] 🟩 **Step 4: Per-exercise thumbs**
  - [x] 🟩 On `ExerciseTracker` cards, under start/end photos: up / down. Down opens chips: broken video, image doesn’t match, something else (no text required).
  - [x] 🟩 Persist via `POST /api/feedback`. Remember for this `session_id` + exercise. Show the saved vote; no flip until a later session.

- [x] 🟩 **Step 5: Session stars**
  - [x] 🟩 `POST /api/session-ratings` via `requireCurrentUser`: stars 1–5, outcome `complete|quit`, session_id. Server fills week/day/type/mode from `workout_sessions`. One rating per session.
  - [x] 🟩 “Mark this workout complete?” modal: Tom line “How did that sit with you, man? One is weak. Five is you want it again.” Complete it disabled until a star is picked. Not yet saves nothing.
  - [x] 🟩 `ExitTakeover`: same stars, line “Before you walk, score this session. One is trash. Five means you still felt it.” Quitter disabled until a star is picked (then POST outcome `quit`). Stay for More closes and discards.

- [x] 🟩 **Step 6: Enjoyment charts**
  - [x] 🟩 `GET /api/ratings/stats`: athlete gets own rows; `requireAdmin` + `?scope=household` for Kevin. Return overall avg + count, per athlete, gym vs travel, weeks 1–6, day types, finished vs walked, week × day-type heatmap cells.
  - [x] 🟩 Shared chart component (existing Recharts look). Seven charts: personal/household score; per athlete (admin only); gym vs travel; week line; day type; finished vs walked; heatmap. Tom one-liner under the hero for the lowest day type. Omit any chart or table with no rows.
  - [x] 🟩 Mount on `/home` (own data) and `/admin/feedback` (household).

- [x] 🟩 **Step 7: Admin inbox + digest**
  - [x] 🟩 `GET /api/admin/feedback` (`requireAdmin`): notes and thumbs, newest first.
  - [x] 🟩 `POST /api/admin/feedback` action digest: email Kevin star averages plus stored thumbs/notes that did not already mail.
  - [x] 🟩 `/admin/feedback` page: list, charts, digest button next to the list. Link from `/admin` (not from the users-screen digest idea).
