# Feature Implementation Plan — Workout reminder notifications

**Overall Progress:** `100%`

## TLDR
Athletes pick a time and the days of the week they want a push notification reminding them to work out. Everything lives in a **Reminders** section of its own at the top of the hamburger menu, which also invites them to set it up. It carries a `?` helper (`HelpTip`) explaining that Work-It must be saved to the Home Screen for notifications to work, and that reminders can be turned on or off any time. It uses web push (VAPID + `web-push` + a push-only service worker + a Netlify check every 15 minutes), adapted from the mealtracker handoff. Routines and checklists are not part of this.

## Critical Decisions
- **Push-only service worker:** `public/sw.js` gets only `push` + `notificationclick` handlers, with no `fetch` handler and no caching. This replaces today's self-unregistering kill switch. The 2026-08 outage (`2d04be4`) came from a caching worker; this one can't cache.
- **The layout's unregister script spares the new worker:**
  - [app/layout.tsx](../../app/layout.tsx) keeps clearing caches, but stops unregistering a registration whose script is `/sw.js`.
  - It unregisters in **both** places: the startup sweep and the dead-CSS `clearAndReload`.
  - Missing either one makes reminders look on but never arrive. That's the main risk; the app itself can't break.
- **Guard against a future caching handler:** a comment at the top of `sw.js` says never to add a `fetch` handler, because that brings back the August risk.
- **One reminder time per athlete:** `HH:MM` in 15-minute steps, saved with the browser's IANA time zone so 6:30pm is local time.
- **Days are the athlete's choice:** a checkbox per weekday, stored as `users.reminder_days` (7 chars Mon→Sun, `1`/`0`), all seven checked by default.
- **Same "owes a workout" rule as the email nudge, on the athlete's checked days only:**
  - Send only if `getTodayTarget` is `start` or `resume` and they haven't trained today.
  - Skip during Test Drive, the weekend hold, once the program is done, and for blocked accounts.
  - Factor the shared check out of [lib/emails/nudge.ts](../../lib/emails/nudge.ts) rather than copy it.
- **Open session:** the push says pick it back up and opens `/workout`. Otherwise it opens `/home`.
- **Copy:** the athlete's own coach, from a small code-bank set (`pickReminderLine` in `lib/coachLines.ts`, two buckets `reminder` / `reminderResume` per voice, `{name}` via `fillCoachName`). Same code-bank-only precedent as `sessionStart`.
- **Email nudges are unchanged** and keep going to everyone.
- **Switches:**
  - **Account on/off:** `users.reminders_on` pauses reminders everywhere and keeps the time.
  - **Per device:** each device subscribes when its owner taps **Allow notifications** on it.
- **Settings home:** a **Reminders** section by itself at the top of the menu, above Admin and More programs (not Edit profile). Shown to everyone, Test included. It contains:
  - the title + `HelpTip`
  - an on/off switch
  - a time picker
  - a checkbox per day of the week
  - an **Allow notifications** button
  - a **Send a test** button
- **Setup prompt:** until this device is subscribed with reminders on, the section leads with a gold "Get a reminder to train" line. A ✕ folds the section to one line (account-wide, `users.reminder_banner_dismissed_at`); a tap on that line opens it again, so settings stay reachable.
- **Not saved to the Home Screen** (not `display-mode: standalone` on iOS): the section shows the Add to Home Screen steps instead of the Allow button.
- **Sending is claimed once a day per user:** `INSERT IGNORE` into `push_log (user_id, for_date)`, released if every send throws. Late cron runs only send within 60 minutes of the chosen time.
- **VAPID:** `VAPID_SUBJECT` = `https://workitapp.fit`. Keys are generated once; Kevin adds all three to Netlify Production.

## Tasks:

- [x] 🟩 **Step 1: Schema + env**
  - [x] 🟩 `database/migrate-push-reminders.sql`:
    - `users.reminder_time` VARCHAR(5) NULL, `users.reminder_tz` VARCHAR(64) NULL, `users.reminders_on` TINYINT DEFAULT 0, `users.reminder_days` CHAR(7) DEFAULT '1111111', `users.reminder_banner_dismissed_at` DATETIME NULL
    - `push_subscriptions` (id, user_id, endpoint UNIQUE, subscription JSON, created_at)
    - `push_log` (user_id, for_date, sent_at, PK user_id+for_date)
  - [x] 🟩 Apply with `scripts/apply-migration.ts`; add it to the migration list in CLAUDE.md
  - [x] 🟩 `npm i web-push`; add `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` to `.env.example`; generate keys for `.env.local` + Netlify

- [x] 🟩 **Step 2: Service worker**
  - [x] 🟩 Rewrite `public/sw.js`:
    - `push` → `showNotification(title, { body, icon: '/icon-192.png', data: { url } })`
    - `notificationclick` → focus an open app window and navigate it, else `clients.openWindow(url)`
    - No `fetch` handler; warning comment at the top
  - [x] 🟩 [app/layout.tsx](../../app/layout.tsx) unregister script: skip registrations whose `active.scriptURL` ends in `/sw.js`, in both the startup sweep and `clearAndReload`
  - [x] 🟩 Register `/sw.js` only from the Allow tap (`lib/pushClient.ts`), not on every load

- [x] 🟩 **Step 3: Server push lib + API**
  - [x] 🟩 `lib/push.ts`: `sendToUser(userId, { title, body, url })`. Uses `web-push` and deletes subscriptions that answer 404/410.
  - [x] 🟩 `GET /api/push`: public key, the user's `reminders_on` / `reminder_time` / `reminder_tz` / `reminder_days`, folded flag
  - [x] 🟩 `POST /api/push` (session-gated), one route with `action`:
    - `subscribe` (upsert by endpoint)
    - `unsubscribe` (this endpoint)
    - `settings` (`on`, `time`, `tz`, `days`; validate 15-minute steps and a 7-char `0`/`1` days string)
    - `fold` { folded } (the ✕ / reopen on the menu section)
    - `test` (send now to this user's devices)
  - [x] 🟩 Track `push_enabled` / `push_disabled` / `push_test` through `lib/trackServerEvent.ts`

- [x] 🟩 **Step 4: Reminder sender + cron**
  - [x] 🟩 Factor the shared "owes a workout today" check out of [lib/emails/nudge.ts](../../lib/emails/nudge.ts) (Test Drive / done / hold / trained today → skip; returns `start` or `resume`) and have `sendNudgesForUser` use it
  - [x] 🟩 `lib/pushReminders.ts` `sendDueReminders()`:
    - **Who:** users with `reminders_on = 1`, a subscription, and not blocked (`SQL_NOT_BLOCKED_USER`)
    - **When:** today (in their time zone) is a checked day, and their local time is within 0–60 minutes past `reminder_time`
    - **Claim and send:** claim `push_log` for their local date, then send the coach line
    - **Track:** `push_sent`
  - [x] 🟩 `pickReminderLine(tone, kind, name)` + 3–5 lines per voice per bucket in `lib/coachLines.ts`
  - [x] 🟩 `?task=push` on [app/api/cron/mail/route.ts](../../app/api/cron/mail/route.ts) (never part of `task=all`)
  - [x] 🟩 `netlify/functions/workit-push-cron.mts`, `*/15 * * * *`, same shape as `workit-onboarding-cron.mts`

- [x] 🟩 **Step 5: Client helper**
  - [x] 🟩 `lib/pushClient.ts`:
    - `pushSupport()` (`unsupported` / `needs-home-screen` / `ready`)
    - `deviceSubscribed()`
    - `enablePush()` (called from a tap: `requestPermission` → register SW → `subscribe` → POST)
  - [x] 🟩 Shared copy in `lib/reminderCopy.ts`: setup line, `?` helper text (save to Home Screen; on/off any time), iPhone Add to Home Screen steps

- [x] 🟩 **Step 6: Reminders section at the top of the menu**
  - [x] 🟩 `components/RemindersMenuSection.tsx`, rendered by [components/AppMenu.tsx](../../components/AppMenu.tsx) at the top of the scroll area, above Admin and More programs, in its own bordered block:
    - title + `HelpTip`
    - on/off switch (styled like Coach voices)
    - time `<select>` (15-minute steps)
    - Mon–Sun checkboxes
    - **Allow notifications** (gold) when this device isn't subscribed
    - **Send a test**
  - [x] 🟩 Changes save on change through `POST /api/push {action:'settings'}`
  - [x] 🟩 `needs-home-screen` → show the steps instead of Allow; permission `denied` → one line on turning it back on in iOS Settings
  - [x] 🟩 Setup prompt + ✕ fold (`fold`); the folded line reopens the section

- [x] 🟩 **Step 7: Docs + verify**
  - [x] 🟩 CLAUDE.md (Email/cron, Routes → hamburger), `docs/WHAT_IS_WORKIT.md` one line, Help → App Pages mention
  - [x] 🟩 One typecheck. One API test of `POST /api/push` settings + `test` as Test. One screenshot of the menu's Reminders section. **Send a test**, then reload the app and send again, proves the layout script spared the worker.
