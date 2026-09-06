# Page sections

Top-to-bottom on each route. Overlays sit on top and are listed last. Folded = closed when the page opens.

## `/` (`app/page.tsx`)

Redirect. Session → `/home`. Else `/who`. Middleware usually handles this.

## `/who` — Who are you

- Header: logo + What is Work-It? (`?`)
- Claim / reset PIN flow when `?claim=` or `?reset=` (create PIN → confirm)
- Profile picker
  - Working the Gym (open)
  - Getting back on it! (folded)
- PIN pad after a pick
- Forgot PIN (only if that profile has email)
- Help sheets: What is Work-It?, Add to Home Screen
- Dead claim/reset stays on the picker with Tom resend copy

## `/home` — Home Quiet

- Header: logo + menu
- Today card (`gold-hero`)
  - Rest / Today / Pick back up / Program-done title
  - Focus · Est. (live day)
  - Hold line or resume line
  - Start WO / Resume WO · Select WO · Invite (Invite hidden for Test)
  - Restart (open session)
  - Last-week medal in the header row if you placed (not over the whole card)
  - Four window KPIs (last 15 days vs last time those lifts ran). Totals abbreviate (`12k`) app-wide; logged set load stays exact.
- Week lock (four required days)
- Week performance (More load / More reps / Less drop / Less cut)
- Daily weight lifted (`?` helper)
- **Your performance** (folded): next workout, or last workout the day after a finish / when the week is locked. Card deep-links to `/performance?tab=analytics` with period, that day, grain=workout
- **Session stories** (folded): Last session · Best lift · Did not improve · Week vs last time
- **Your trophies** (folded): Yours / Aiming / Next. Opens `/belts`
- **You vs** (folded, hidden for Test): last 7 days vs next in line

Overlays: Invite · week podium (1st–3rd) · missed-week roast. Test never places or gets the miss roast.

## `/workout` — Select + live

**Select Workout**

- Header: back + title + menu
- Week list (locked weeks start folded; open session opens that week)
- Day cards: Gym/Travel pill on unstarted or in-progress days
- Finished days: `CompletedSessionCard` + Do Again
- Bonus Extra credit copy + rest-between-uppers hint (when relevant)

**Live session**

- Belt wash from last earned / aiming belt
- Phone header: Exit / Restart / clock / sound, then week + focus
- Resume takeover (`pickResumeLine`) when opening an existing session
- Optional warmup (`OptionalCard`)
- Exercise cards: thumbs, How (`?`), Gym/Travel pill, sets, How hard 1–5, extra sets
- Rest overlay (`SetRestTimer`)
- Live KPIs after a completed set
- Sticky Today / All-time bar (Volume · Effective)
- Optional cooldown
- Finish it
- Bonus pick (week 7+: core or class)

Overlays: resume / exit (no stars; leave early does not score the session) / restart / finish (1–5 stars, then Complete it) / recap (four KPIs vs last same day) / Complete (coach line only) / awards (`YOU EARNED IT!` in current-belt color; full diploma card if unlocked + next diploma line; new badges in rows of three) / error / How / PR / set flash / video / bonus pick.

## `/performance` — Your performance

Header via `YouPageShell` (Dashboard back + title + menu). On for Test.

- Tabs: Current · Progress · Analytics
- Kevin only: athlete multi-select (Test in)
- **Current:** window four KPIs · last session · best / held · This window · lifts (bars + last-time tick) · Hard sets / muscle
- **Progress:** intro · up / down count · Summary · last session · By workout vs last same day · Moving up / Moving down / Held
- **Analytics:** Eastern pills T / T-1 / T-7 / T-15 / T-30 / All · grain workout / exercise / set · workout multi-select · spikes and lists. Deep link: `?tab=analytics&period=t-15&grain=workout&workout=Lower%20Body%20B`

## `/scoreboard` — The house

- Kevin: Week medals table (gold / silver / bronze counts, Test out)
- You vs (hidden for Test)
- Pack weight chart
- Household table (Belt column)
- Honor rolls: Bonus work · Optionals
- Vs the house (hidden for Test)

Period pills: 7 days / 30 days / All time.

## `/history` — Completed

- Week folds (check at 4/4)
- Closed session cards (`CompletedSessionCard`): check + lbs · reps · time
- `?week=` `&day=` still used by View leftovers

## `/medals` — Medals

- Last weeks (weekly gold / silver / bronze history)
- Achievements / badges

## `/belts` — Belts

- What you are aiming for (copy + locked-week count)
- The house (pack rows + belt chips). Test sees own belts
- How each diploma looks (Before / During / After glossary + each belt)

## `/about` — About

- About program (48-week year)
- Weeks 1 to 6
- Week 7 onward
- Belts
- Progressive overload + Gym / Travel note

## Menu (home + You pages + admin)

Athlete: Your performance · The house · Completed log · Medals · Belts · About program. Your performance + Belts on for Test. You vs still hidden on Home / The house.

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

- Template picker (welcome, invite, PIN reset, nudges, recap, week, program, badge, diploma, scoreboard, What's new)
- Preview
- Sample send
- Run nudges / force scoreboard

## Shared overlays (any logged-in page)

- Talk to me
- Edit profile (coach, sound, extra rest minutes)
- Invite a friend
