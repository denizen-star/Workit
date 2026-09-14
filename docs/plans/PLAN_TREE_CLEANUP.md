# Working Tree Cleanup Plan

Not implemented yet — this is the plan for review before anything gets deleted or moved.

## Delete outright (junk / scratch debug output)

Nothing depends on these; they're accidental or one-off debug artifacts.

- `temp.txt` — raw dump of `ExerciseTracker.tsx` contents captured mid-edit, not a real file.
- `exercises.json` — a DB dump of `{id, name: null}` rows (looks like a one-off check for exercises with missing names). Nothing in the codebase references it.

## Archive/delete (plans marked complete, work already shipped)

- `docs/plans/PLAN_NEW_ATHLETE_FIXES.md` — 100% done. Matches shipped work: week-takeover gating, alias plumbing, how-to rebuild.
- `docs/plans/PLAN_JOIN_WIZARD_NAV.md` — 100% done. Matches shipped `/join` nav work.
- `docs/samples/kpi-filter-board.json` — Sep 5 sample data, tied to the now-merged KPI tile commits.
- `docs/samples/kpi-reorg.html` — same batch, same reasoning.
- `public/belt-wash-preview.html` — standalone static mockup, unreferenced by any code.
- `docs/plans/comparison-table-preview.html` — standalone static mockup, unreferenced by any code.
- `docs/plans/week-podium-preview.html` — standalone static mockup, unreferenced by any code.
- `scripts/sample-kpi-filter-board.ts` — one-off DB query script used to build the (now-shipped) KPI tile feature.
- `scripts/sample-kpi-house.ts` — same batch.
- `scripts/sample-kpi-incline-bench.ts` — same batch.
- `scripts/sample-kpi-kevin.ts` — same batch.
- `scripts/sample-kpi-last-session.ts` — same batch.
- `scripts/sample-kpi-progression.ts` — same batch.
- `scripts/send-kpi-sample-kevin.ts` — one-off sample email send script, same feature batch.

## Keep

- **`docs/plans/PLAN_SET_HISTORY_TILES.md`** — 95% complete. Its scope (`LiveSetKpis.tsx`, `ExerciseTracker.tsx`, `lib/setHistory.ts`) is exactly what's sitting in the currently uncommitted diff. This is the live plan for in-progress work — don't touch until that diff lands.
- **`app/preview-finish/`** — a real, unlinked dev-only route for click-through preview of the finish takeover flow. Not referenced anywhere in the app, doesn't ship to users, harmless to keep as a dev tool. Flagging it because it's a live route sitting in `app/` rather than `scripts/` or `docs/` — your call whether it belongs long-term or should go.

## Summary

- 2 items: delete outright (junk)
- 10 items: archive/delete (finished work)
- 2 items: keep (1 active, 1 your call)

Reply with go-ahead (and any category overrides) before I touch anything.
