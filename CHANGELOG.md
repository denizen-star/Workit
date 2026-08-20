# Changelog

## Unreleased

## 2.0.1 - 2026-08-19

### Changed
- Live app is `workit.kervinapps.com` (not `work-it.kervinapps.com`)
- Household mail buttons open `/who` (pick name, PIN). Monday scoreboard still opens `/admin`

## 2.0.0 - 2026-08-19

First version shared with household users.

### Added
- Household mail from **Master Workit**: welcome (incl. iPhone Add to Home Screen), get-to-it / finish-it nudges, workout recap, badge, Monday scoreboard, release notes
- Admin **Mail** (`/admin/mail`): preview templates, send a sample, run today's nudges, send live scoreboard
- Netlify scheduled function `workit-mail-cron` (`0 12 * * *` UTC) → `POST /api/cron/mail` with `CRON_SECRET`
- Welcome headline includes **- by invitation only** (same size as "You're mine now")
- Household profiles with PIN login and editable user details
- Kevin-only Admin page for household user CRUD
- Coach takeovers, rest/complete sounds, and timed-set timer

### Changed
- Coach / mail honorific is **Master Workit**; "boy" is **man**
- Mail cron and site env live on **Netlify**, not Vercel
- `/document` always mails household users a Master Workit release note (`npm run mail:release`)

### Fixed
- First-time PIN setup when `has_pin` is a string zero
- Keep the admin menu above the dashboard hero on iPhone
