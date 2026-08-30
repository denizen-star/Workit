# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Lower first-use and live-session load. Claim and login get short Tom copy plus an always-there **What is Work-It?** sheet and a cleaner home-screen `?`. Returning login gets **Forgot PIN** by mail (one-time link), not typing the email on the pad. Live cards drop always-on italic notes; those cues sit behind **How** on that movement. No new `?` on Home or Select. No onboarding wizard (gender, goals, voice, extra rest) — that is later.

## Critical Decisions

- **Reduce-load, not a tutorial product:** Help is off the main path. Gold stays the next move (Create PIN / Start / Complete). No first-visit takeover, no dismiss-forever, no `?` on every tile.
- **Tom on `/who`:** Claim happens before they pick a coach. Short Tom, not slang, not Grey/Luna.
- **Shared sheet, not a new page:** One portal sheet (`HelpSheet`) + small CircleHelp / How. Same overlay family as invite / talk-to-me. About program stays in the menu for the long read.
- **Home / Select stay Quiet:** Week lock and week performance keep tap-the-tile. No new helpers on those pages in this pass.
- **Live notes fold, they do not get a second `?` on rest / optional / Finish / Gym-Travel:** Card keeps name, target, stills, play, last-time, sets. `exercise.notes` opens from the movement name or a small How.
- **Forgot PIN is mail, not “type the email on `/who`”:** Roster already shows emails. Selected profile → send to stored address → `/who?reset=` with a short-lived HS256 JWT (`jose` + `AUTH_SECRET`, purpose reset). No new DB column. No email → hide Forgot. Dead claim: keep error, one Tom line, ask for a resend.
- **Same app after PIN:** Invitees and admin-added people share Home/Select/live. Only the first door differs (claim gets Tom lines + home-screen; login gets PIN + Forgot).
- **Out of this pass:** Onboarding wizard (gender, goals, voice, extra rest — already in Edit profile for voice/rest). Type-email reset with no mail. Recover PIN with no email. Grey/Luna on claim. Helpers on Home/Select/live chrome beyond How-on-notes.

## Tasks:

- [x] 🟩 **Step 1: Shared help chrome**
  - [x] 🟩 Read `node_modules/next/dist/docs/` before adding routes or client pages.
  - [x] 🟩 Add `components/HelpSheet.tsx`: portal to `document.body`, title, short bullets or lines, gold **Got it**. Reuse overlay spacing from `InviteFriendModal` / `FeedbackWidget`.
  - [x] 🟩 Small CircleHelp / How trigger (cream/gold, min tap 44px). No new colors.

- [x] 🟩 **Step 2: `/who` — claim, login, dead claim**
  - [x] 🟩 Claim / first PIN: three Tom lines under the name (four digits for next time; Home after confirm; gold Start is the work).
  - [x] 🟩 Always-available `?` **What is Work-It?** — four short bullets (four days lock a week; gold is the move; numbers stay on your name; home screen not a Safari tab).
  - [x] 🟩 Claim only: one gold home-screen line + `?` with three beats (Safari → Share → Add). Do not paste the full email essay.
  - [x] 🟩 Login: same What is Work-It `?`; no intro essay; no home-screen line.
  - [x] 🟩 Invalid / dead `?claim=`: keep picker, Tom line, ask them to get a resend.

- [x] 🟩 **Step 3: Forgot PIN (mail link)**
  - [x] 🟩 `lib/pinReset.ts`: sign/verify short-lived reset JWT (user id + purpose). `resetUrl()` next to `claimUrl()` in `lib/emailLayout.ts`.
  - [x] 🟩 `POST /api/auth/forgot-pin`: public; body `userId` of the selected login profile; if that row has email, queue Tom mail with reset CTA; always return the same success shape (do not leak whether mail exists). Hide the control when the selected row has no email.
  - [x] 🟩 `GET /api/auth/reset?token=` + `/who?reset=`: resolve name, open create-PIN → confirm.
  - [x] 🟩 `POST /api/auth/reset-pin`: valid reset token required; new 4-digit PIN + confirm; overwrite `pin_hash`; start session; clear login lockout for that id.
  - [x] 🟩 Template `pin_reset` in `lib/emails/ids.ts` + `templates.ts` + `lifecycle.ts`. Add to `/admin/mail` preview. Dedupe key can rotate with the token so resend works. BCC as usual.
  - [x] 🟩 `middleware.ts`: `/api/auth/*` already open; no new page exemptions.

- [x] 🟩 **Step 4: Live cards — notes behind How**
  - [x] 🟩 `ExerciseTracker`: remove the always-on italic `exercise.notes` block.
  - [x] 🟩 If notes exist, How (or tap the name) opens `HelpSheet` with that string only. Stills and video stay on the card.
  - [x] 🟩 No How when notes are empty.

- [x] 🟩 **Step 5: Copy + CLAUDE.md**
  - [x] 🟩 Tom copy in one small module (who lines, What is Work-It bullets, home-screen beats, forgot/reset/dead-claim). Address **man**. Quit is a noun. No slang.
  - [x] 🟩 Note in `CLAUDE.md` `/who` help + Forgot/reset routes. Do not invent extra routes.

- [x] 🟩 **Step 6: Browser check**
  - [x] 🟩 As Test (PIN `0000`): login pad has What is Work-It; Forgot only if Test has email; do not log sets as Kevin.
  - [x] 🟩 Claim copy + sheets without burning a real invite (invalid `?claim=` error path + local/dev claim if available).
  - [x] 🟩 Live session as Test: notes off the card; How shows the cue; Complete still works. Gym and Travel if a card has notes.
  - [x] 🟩 Forgot → mail preview on `/admin/mail` (`pin_reset`) → did not fire a live reset on Test or Kevin. Template + routes are in; sample is on Mail after Kevin logs in.
