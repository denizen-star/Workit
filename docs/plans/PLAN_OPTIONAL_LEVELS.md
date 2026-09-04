# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR

Stretch and core Optionals get **Easy / Medium / Hard**. The athlete picks stretch or core, then a level. The day’s region (upper or lower) silently picks which **six** holds they get. Easy is gym-mobility. Medium and Hard are short pilates / yoga mat classes. Run and bike stay as they are. +500, kicker, badges, and honor roll do not change.

## Critical Decisions

- **Pick order:** Track first (Stretch / Core), then Easy / Medium / Hard. Run and bike start immediately. No region picker.
- **Silent region:** Upper A/B, Extra Upper, Bonus Upper, Bonus Core → upper. Lower A/B → lower. Derived from the program day name (`Lower` in the name). Passed into `OptionalCard`. Not stored.
- **Six holds:** Stretch and core are always six Done steps at every level. Last Done still credits +500 (`circuitComplete`). 10-minute clock stays the fallback.
- **Easy vs Medium vs Hard:** Easy = current tone (floor, wall, talk through it) rewritten as six holds for that region. Medium / Hard = named yoga / pilates shapes, longer holds. Hard is still Optional, not Bonus Core.
- **Warmup vs cooldown:** Same six moves per track + region + level. Cooldown uses softer cue copy. Do not build 24 unique movement lists.
- **Track labels:** Stretch and Core (drop the leading “Easy”). Run / bike stay Easy run / Easy bike.
- **Persist level:** `warmup_level` / `cooldown_level` (`easy` | `medium` | `hard`) on `workout_sessions` so resume shows the same circuit. Apply on PlanetScale by hand.
- **Out of scope:** Run/bike levels, push vs pull as a fourth menu, changing +500 / kicker / badges / honor roll, Bonus Core logged day, new coach lines, About page.

## Circuits

Holds: Easy ~45s, Medium ~60s, Hard ~75s (90s only on the last Hard stretch / breath step). Upper B Medium/Hard core skips crunch / hanging-raise stacking (use bird dog + side kicks). Lower B Hard core swaps long glute-bridge work for a long dead bug (hip thrust is the day).

### Stretch — Upper

| # | Easy | Medium | Hard |
|---|---|---|---|
| 1 | Neck | Cat-cow | Down dog into puppy, stay |
| 2 | Shoulders | Thread-the-needle | Thread-the-needle, stay in the bind |
| 3 | Chest (wall) | Puppy pose | Dolphin or long puppy |
| 4 | Lats (child’s pose or wall) | Eagle or cow-face arms | Cow-face arms, longer |
| 5 | Thoracic (cat-cow / open book) | Mermaid | Mermaid, deeper |
| 6 | Wrists / triceps | Seated or supine twist | Supine twist, then child’s pose |

### Stretch — Lower

| # | Easy | Medium | Hard |
|---|---|---|---|
| 1 | Ankles / calves | Down dog, pedal the heels | Down dog, long |
| 2 | Hip flexors | Low lunge, both sides | Low lunge with a reach |
| 3 | Adductors (side lunge) | Lizard | Lizard, stay |
| 4 | Quads | Half split | Half split, longer fold |
| 5 | Figure-four | Reclined pigeon / figure-four | Pigeon (fold only if the hip allows) |
| 6 | Hamstrings (soft fold) | Butterfly or happy baby | Frog or wide-knee child’s pose, then a hamstring fold |

### Core — Upper

| # | Easy | Medium | Hard |
|---|---|---|---|
| 1 | Dead bug | Pilates breath | The hundred, knees bent |
| 2 | Bird dog (not a long front plank) | Single-leg stretch | Double-leg stretch |
| 3 | Heel taps | Bird dog, pause | Criss-cross, slow (skip on Upper B; keep bird dog) |
| 4 | Side-lying hold, knees down | Criss-cross, small (skip on Upper B; side-lying kick) | Side kick series |
| 5 | Easy hollow, knees bent | Side-lying kick, small | Teaser prep, tabletop |
| 6 | Breathe down | Knees in / hands on ribs | Child’s pose |

### Core — Lower

| # | Easy | Medium | Hard |
|---|---|---|---|
| 1 | Dead bug | Shoulder bridge | Shoulder bridge, 2-count (Lower B: long dead bug) |
| 2 | Glute bridge (short on Lower B) | Marching bridge | Single-leg bridge (Lower B: skip; stay on dead bug) |
| 3 | Heel taps or marching bridge | Toe taps in tabletop | Roll-up or half roll-up |
| 4 | Bear hold, knees an inch off | Saw, soft knees | Saw, fuller twist |
| 5 | Easy side plank, knees down | Side-lying clams or small side kicks | Side kick series |
| 6 | Cat-cow, then child’s pose | Child’s pose | Boat / teaser, knees bent, then 90/90 breath |

## Tasks:

- [x] 🟩 **Step 1: Circuits + region helper**
  - [x] 🟩 `lib/optionals.ts`: `OptionalLevel` (`easy` | `medium` | `hard`), `OptionalRegion` (`upper` | `lower`). `optionalCircuit(slot, track, region, level)` for stretch/core (six steps). Run/bike ignore region/level.
  - [x] 🟩 `optionalRegionFromDay(name)` → lower if the day name contains `Lower`, else upper.
  - [x] 🟩 Stills + `videoId` on every new hold (free-exercise-db + YouTube, same `guided()` helper). Closest existing still if a pose has no exact id.
  - [x] 🟩 Track labels: Stretch / Core. Level labels: Easy / Medium / Hard.

- [x] 🟩 **Step 2: Persist level**
  - [x] 🟩 `database/migrate-optional-levels.sql`: `warmup_level` / `cooldown_level` VARCHAR(8) NULL. Apply on PlanetScale by hand. Re-run = duplicate column.
  - [x] 🟩 `POST /api/optionals` start: require level when track is stretch or core; write the slot level column. Resume returns the stored level.
  - [x] 🟩 `OptionalCard` hydrate + start body include level. Missing level on an old in-progress stretch/core row treats as easy.

- [x] 🟩 **Step 3: Workout UI**
  - [x] 🟩 `OptionalCard`: Stretch / Core → Easy / Medium / Hard (gold), then the overlay. Run / bike unchanged (one tap).
  - [x] 🟩 Overlay title shows track + level. Progress is `n of 6`.
  - [x] 🟩 `app/workout/page.tsx` passes `region={optionalRegionFromDay(workout.name)}` into both Optional cards. Cooldown cue can stay “Easy cooldown” in the lift-done hint (that word means unhurried, not the level).

- [x] 🟩 **Step 4: Browser QA (Test, PIN 0000)**
  - [x] 🟩 Lower Body A: Stretch → Easy / Medium / Hard, then Medium opened Down dog / Low lunge (lower six). Region helper: Bonus Core / Extra Upper → upper.
  - [x] 🟩 Overlay is  n of 6, stills + video + how-to. Reload kept Stretch · Medium · 2 of 6. Last Done still uses existing `circuitComplete` +500. Run/bike unchanged. Did not Finish.
  - [x] 🟩 Did not log sets or start sessions as Kevin.
