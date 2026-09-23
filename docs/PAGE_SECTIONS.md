# Page sections

Top-to-bottom on each route. Overlays sit on top and are listed last. Folded = closed when the page opens.

## `/` (`app/page.tsx`)

Redirect. Session → `/home`. Else `/login`. Middleware usually handles this.

## `/login`

- Email + 4-digit PIN. Last email stays on this phone after logout. Autofill on.
- Session already on this phone → `/home`
- Unverified new join: “email has not been verified”
- Forgot PIN (mails `/login?reset=`)
- Join the movement → `/join?h=gowanus`
- `?verify=` completes Gowanus verify and opens Home

## `/who`

Redirect to `/login`. Old `?claim=` → `/join?claim=`. Old `?reset=` → `/login?reset=`

## `/join`

- No query or `h=og` without claim → `/login`
- `h=gowanus`: intro → form (first, last, alias, email, optional phone/weight/photo, days-per-week slider 1-5 default 4) + waiver checkbox/sheet → PIN
- `h=` + `claim=`: same steps for that house; no verify mail; session on finish
- New Gowanus: account after PIN; Home after verify mail
- Draft on the phone until PIN

## `/waiver`

Public waiver text.

## `/home` — Home Quiet

- Header: gold dumbbell + Work-It. Photo sits left of the hamburger. Menu: house dropdown if in more than one; one house is a text label
- First visit without waiver: Update your profile (prefilled) + required waiver
- How to use banner until 5 finished workouts (links to `/quickstart`)
- Today card (`gold-hero`)
  - Rest / Today / Pick back up / Program-done title
  - Focus · Est. (live day)
  - Hold line or resume line
  - Start WO / Resume WO · Select WO · Invite (Invite hidden for Test)
  - Restart (open session)
  - Last-week medal in the header row if you placed (not over the whole card)
  - Four window KPIs (last 15 days vs last time those lifts ran). Totals abbreviate (`12k`) app-wide; logged set load stays exact. Effort under Effective is How hard · factor (`4.3 · 1.13`), not a percent.
- Week lock (1-5 required days per your own setting; volume + % vs last time on tiles; an already-locked week's count stays fixed even after you change your setting; optionals n/8 under the row)
- Week performance (More load / More reps / Less drop / Less cut; count / compared + %)
- Daily weight lifted (`?` helper)
- **Your performance** (folded): next workout, or last workout the day after a finish / when the week is locked. Card deep-links to `/performance?tab=analytics` with period, that day, grain=workout
- **Session stories** (folded): Last session This | Last per lift. What moved = session volume, best lift, lifts down, week volume
- **Your trophies** (folded): Yours / Aiming / Next. Opens `/belts`
- **You vs** (folded, hidden for Test): 7d / 30d / All time. You | Last | them (House if you are alone). Next + up/down arrows rank this house only, Test out, including zeros. Last = last time you posted those numbers. Place, Best day, honor, optional lbs, run+bike in the table.

Overlays: Invite · week podium (1st–3rd) · missed-week roast · first-login Quickstart takeover (see below) · days-per-week check-in every 6 program weeks (`ScheduleDaysAskTakeover`; Save updates the count, ignoring it keeps it until the next boundary). Test never places or gets the miss roast.

**First-login sequence**: waiver gate (`UpdateProfileGate`, if `waiverAccepted` is false) runs first and blocks everything else; once it closes, a brand-new athlete gets the `QuickstartTakeover` (same 3 steps as `/quickstart`, full-screen, "Let's go" or "Read the full guide" both dismiss it) exactly once, gated on `users.quickstart_seen_at` (`migrate-quickstart-seen.sql`; already on prod — re-run = duplicate column). If `quickstart_seen_at` is ever unselectable (column missing), `quickstartSeen` reads as `true` and the takeover just never fires — no crash. Note: `lib/auth.ts`'s column-fallback mode is cached per server process, so a running dev server needs a restart after this migration lands to pick the column back up.

## `/workout` — Select + live

**Select Workout**

- Header: back + title + menu
- Week list (locked weeks start folded; open session opens that week)
- Day cards: Gym/Travel pill on unstarted or in-progress days. 1-3 day/week athletes see Full Body days instead of the split; 5-day athletes see the bonus day badged "Bonus · Required" instead of plain "Bonus"
- Finished days: `CompletedSessionCard` + Do Again
- Bonus Extra credit copy + rest-between-uppers hint (when relevant)

**Live session**

- Belt wash from last earned / aiming belt
- Phone header: Exit / Restart / clock / sound, then week + focus
- Floating coach avatar dock (`CoachBubble`) bottom-right for the whole session; opening an existing session fires a Welcome bubble (`pickResumeLine`), starting a brand-new one fires a different Welcome bubble (`pickSessionStartCopy`). Those lines, the rest "get to it" call, and the last-set PR / gain-loss / effort calls play a stored clip when Coach voices and workout sound are both on. Finish, exit, week, and email lines stay text
- Optional warmup (`OptionalCard`)
- Exercise cards: thumbs, How (`?`), Gym/Travel pill, sets, How hard 1–5, extra sets
- Rest overlay (`SetRestTimer`) — coach dock lifts clear of it while open
- Live KPIs after a completed set; on the last planned set, PR, gain/loss, and effort-call moments queue on the coach bubble in that order (each still follows its Noise Control switch)
- Sticky Today / All-time bar (Volume · Effective)
- Optional cooldown
- Finish it
- Bonus pick (week 7+: core or class)

Overlays: resume / exit (no stars; leave early does not score the session) / restart / finish (1–5 stars, then Complete it) / recap (This | Last per exercise vs last time that lift ran, plus warmup / cooldown / optional lbs) / Complete (coach line only) / awards (`YOU EARNED IT!` in current-belt color; full diploma card if unlocked + next diploma line; new badges in rows of three) / error / How / PR / set flash / video / bonus pick.

## `/performance` — Your performance

Header via `YouPageShell` (Dashboard back + title + menu). On for Test.

- Tabs: Current · Progress · Analytics
- Kevin only: athlete multi-select (Test in)
- **Current:** window four KPIs (Effort under Effective is How hard · factor, not a percent) · last session · best / held · This window · lifts (bars + last-time tick) · Hard sets / muscle
- **Progress:** intro · up / down count · Summary · last session · By workout vs last same day · Moving up / Moving down / Held
- **Analytics:** Eastern pills T / T-1 / T-7 / T-15 / T-30 / All · grain workout / exercise / set · workout multi-select · spikes and lists. Deep link: `?tab=analytics&period=t-15&grain=workout&workout=Lower%20Body%20B`

## `/scoreboard` — The house

- Kevin: Week medals table (gold / silver / bronze counts, Test out)
- Period pills: 7d / 30d / All time (You vs, pack, and athlete cards share one window)
- You vs (hidden for Test): You | Last | Next+arrows / House. Always three columns (House if you are alone). Honor, Place, Best day in this table. Rank is this house only.
- Pack weight chart
- Household athlete cards (Belt column)

## `/history` — Completed

- Week folds (check at your required count, or the locked count if that week already locked under a different setting)
- Closed session cards (`CompletedSessionCard`): check + lbs · reps · time
- `?week=` `&day=` still used by View leftovers

## `/medals` — Medals

- Last weeks (weekly gold / silver / bronze history)
- Achievements / badges

## `/belts` — Belts

- What you are aiming for (copy + locked-week count)
- The house (pack rows + belt chips). Test sees own belts
- How each diploma looks (Before / During / After glossary + each belt)

## `/quickstart` — Quickstart

Short first-look page for brand-new athletes: 3 numbered steps (start it, move through it, finish it) in fresh, tighter copy, ending in a link to `/help`. Linked from the Home banner (until 5 finished workouts); not in the athlete menu.

## `/help` — Help

Single-page user guide, replacing the old `/how` and `/about`. Linked from the menu, and from the bottom of `/quickstart`.

- Summary (jump-to index of the sections below)
- Getting Started (3 numbered steps: home screen, login, first workout)
- Running a Workout (5 numbered steps: start/resume, log a set, rest & rate, optional warmup/cooldown, finish it)
- Your Coach (what the coach voices do, where they show up, that welcome / rest / PR / gain-loss / effort are spoken when Coach voices and Workout sound are both on, the 4 coach cards from `COACH_TONE_OPTIONS`)
- App Pages (one card per athlete-menu destination: Home, Your performance, The house, Completed log, Belts, Medals, Edit profile, Invite a friend)
- Training Mechanics (logging a set, Gym vs Travel, week lock, miss the week, bonus & optionals)
- Program & Belts (48-week shape; days-per-week setting and that a locked week stays locked)
- Glossary (History, Avg Effective, Best, Volume, Effort, Noise Control)

## Menu (home + You pages + admin)

Athlete: Your performance · The house · Completed log · Medals · Belts · Help. Your performance + Belts on for Test. You vs still hidden on Home / The house.

Pinned footer: Edit profile · Invite a friend (not Test) · Switch profile.

Admin extra: Analytics · Users · Feedback · Mail.

## `/admin` (`app/admin/page.tsx`)

Redirects to `/admin/analytics`.

Shared admin chrome: Dashboard back + page title + hamburger.

## `/admin/analytics` — Analytics

Kevin only.

- Traffic range
- Vs the house (folded; every athlete except Test)
- Athletes (folded): By lift / By athlete. Eastern pills T / T-1 / T-7 / T-15 / T-30 / All
- Sessions + page views
- Cumulative
- Avg by weekday
- Avg by hour (EST)
- Events · CTAs · Device · Session depth
- People
- Geo
- Exit rate by page
- Recent events

## `/admin/users` — Users

- Household table (`GET /api/users?all=1`)
- Add (stays on this page; PIN required)
- Edit / delete
- Resend mail on rows with no PIN

## `/admin/feedback` — Feedback

- Household enjoyment charts
- Open / Done / Won't do pills
- Folded note groups
- Mark done (`resolved_at`)

## `/admin/mail` — Mail

- Template picker (welcome, invite, PIN reset, nudges, recap, week, program, badge, diploma, scoreboard, days-per-week check-in, What's new)
- Preview
- Sample send
- Run nudges / force scoreboard

## Shared overlays (any logged-in page)

- Talk to me
- Edit profile (which coach, Coach voices speech switch, Noise Control, workout sound, extra rest minutes, days per week)
- Invite a friend
