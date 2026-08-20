# Code Review Task
Perform comprehensive code review. Be thorough but concise.

**Application:** This repository is **Work-It** — a household workout tracker PWA (dashboard `/`, active workout `/workout`, login `/who`) plus **`/admin`**. UX and routing are described in **`CLAUDE.md`** and **`README.md`** (treat ambiguity by reading affected files).

## Check For:

**Consistency with Work-It UX** — dashboard stats/weekly progress/charts; active workout flow (set logging, rest timer, complete takeover); badges awarded consistently with `lib/badges.ts`.

**Logging** — Server-side prefers `console.error`/`console.log` with clear context where logging is needed.
**Error Handling** — Async paths handle failures; API routes return sensible HTTP statuses (see `AuthError` pattern in `lib/auth.ts`).
**Production Readiness** — No stray debug prints, no secrets in source, no accidental TODOs left for production.
**Architecture** — Follow existing patterns:
- **Next.js/TypeScript (frontend):** App Router, client components under `app/` and `components/`.
- **API routes:** Under `app/api/*/route.ts`; auth enforced by `middleware.ts` plus `requireCurrentUser`/`requireAdmin` from `lib/auth.ts` where needed.
- **Database (PlanetScale):** Use `lib/db.ts`'s `query()`. Schema changes go through `database/schema.sql` plus a new `migrate-*.sql` file — there's no migration runner, so call out any schema change explicitly.
- **Workout program:** Static in `lib/workoutData.ts` — flag any PR that tries to make it database-driven without discussion.
- **Email/cron:** Mailers live in `lib/mailClient.ts` + `lib/emails/`; `/api/cron/mail` is intentionally exempted from session auth in `middleware.ts` and instead checks `CRON_SECRET`.

**Security:** Parameterized SQL via `query()`; env vars for secrets (`AUTH_SECRET`, `CRON_SECRET`, DB/SMTP creds); PIN handling must go through `hashPin`/`verifyPin`/`isValidPin` in `lib/auth.ts`, never raw comparison. Verify new routes are actually covered by `middleware.ts`'s matcher/exemption logic rather than assumed.

**Accessibility:** Sensible focus and labels on interactive controls; readable contrast, especially on the rest timer and set-tracking UI.

## Output Format

### Looks Good
- [Item 1]
- [Item 2]

### Issues Found
- **[Severity]** [[File:line](File:line)] - [Issue description]
  - Fix: [Suggested fix]

### Risk / regression
- [Note anything that could break auth/middleware, workout logging, badges, or admin]
