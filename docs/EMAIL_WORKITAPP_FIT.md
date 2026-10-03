# Mail on workitapp.fit (aliases → info@kervinapps.com)

Website cutover is [`DOMAIN_WORKITAPP_FIT.md`](./DOMAIN_WORKITAPP_FIT.md). This file is **only** inbound mail at `@workitapp.fit`.

Goal: every **workitapp.fit** address below lands in the existing **info@kervinapps.com** Zoho inbox. The app sends from the aliases (`lib/mailFrom.ts`); `info@` is receive-only (the BCC on every send). SMTP still logs in as **info@kervinapps.com**.

Netlify does **not** receive mail. You add **MX on workitapp.fit** at GoDaddy and create **email aliases** in Zoho (same org as `info@kervinapps.com`).

Do **not** use Zoho **domain alias** for the whole domain. That maps the **same local part** across domains (`tom@workitapp.fit` → `tom@kervinapps.com`). You want every local part → **one** mailbox.

---

## A. What you need

- GoDaddy DNS for **workitapp.fit** (same zone as the Netlify **A** / **www** records)
- Zoho Mail admin for the org that already owns **info@kervinapps.com**
- [Zoho Mail Admin Console](https://mailadmin.zoho.com)

Do **not** change nameservers. Do **not** touch **kervinapps.com** DNS. Do **not** buy SSL for mail.

---

## B. Add workitapp.fit in Zoho

1. Admin Console → **Domains** → **Add** → `workitapp.fit`.
2. Verify ownership. Zoho shows a **TXT** or **CNAME**. GoDaddy → **workitapp.fit** → **DNS** → add **exactly** that record.
3. Leave the website records alone:
   - **A** `@` → `75.2.60.5` (or whatever Netlify lists)
   - **CNAME** `www` → `workit-kervinapps.netlify.app`

---

## C. Point mail at Zoho (MX / SPF / DKIM)

Still GoDaddy DNS for **workitapp.fit**. This Zoho org is Canada (`zohocloud.ca`). `mx.zoho.com` will not verify. Copy the values Zoho shows. The records that verified:

| Type | Name | Value | Priority |
|------|------|--------|----------|
| MX | `@` | `mx.zohocloud.ca` | 10 |
| MX | `@` | `mx2.zohocloud.ca` | 20 |
| MX | `@` | `mx3.zohocloud.ca` | 50 |
| TXT | `@` | `v=spf1 include:zohocloud.ca ~all` | |
| TXT | `zmail._domainkey` | the `v=DKIM1` string from Zoho → Email Configuration → DKIM → Configure manually | |

Rules:

- **MX** and **A** on `@` can both exist. MX is mail; A is the website.
- Delete any **GoDaddy parking / Email Forwarding MX** that fights Zoho.
- In Zoho, wait until **MX verified**.

---

## D. Aliases on info@kervinapps.com

1. Admin Console → **Users** → the **info@kervinapps.com** user.
2. **Mailbox Settings** → **Email Alias** → **Add**.
3. Add each, domain `workitapp.fit`:
   - `tom@workitapp.fit` (Tom Iron)
   - `luna@workitapp.fit` (Luna Meadows)
   - `grey@workitapp.fit` (James Grey)
   - `eli.sparks@workitapp.fit` (Eli Sparks)
   - `workit-welcome@workitapp.fit`
   - `workit-help@workitapp.fit`
   - `workit-news@workitapp.fit`
   - `workit-info@workitapp.fit`
4. Do **not** set any of these as the primary mailbox address. Keep **info@kervinapps.com**.
5. Zoho error **AS101** blocks `eli`, `info`, `help`, `news` and `welcome` as aliases (those names are groups). That's why the app uses `eli.sparks@` and the `workit-*` names. A From that isn't an alias of the SMTP login 553s (`Sender is not allowed to relay`), so the app never sends **as** a group.
6. `info@workitapp.fit` stays a **Group** (member **info@kervinapps.com**): receive-only, BCC on every send.

`workit-welcome@`, `workit-help@` and `workit-news@` were added 2026-10-02 and confirmed by a live test send to Kevin.

Official: [Create an email alias](https://www.zoho.com/mail/how-to/create-email-alias.html).

---

## E. App sending

SMTP login stays `SENDER_EMAIL=info@kervinapps.com`. The address on the message is `lib/mailFrom.ts`. Display name stays the coach (`voiceFromName`). Every send BCCs `info@workitapp.fit`.

| Mail | From |
|------|------|
| Welcome, invite (including resend), verify email | `workit-welcome@` (coach display name) |
| New PIN | `workit-help@` |
| Workout recap, badge, belt | Athlete's coach: `tom@` / `grey@` / `luna@` / `eli.sparks@` |
| Nudge, resume | `eli.sparks@` (broadcast voice) |
| Days-per-week check-in, release notes, "your feature is live", "I will not do this" | `workit-news@` |
| Scoreboard, invite alert to Kevin, Talk to me, feedback digest | `workit-info@` |
| Nightly onboarding report | SMTP login itself (`info@kervinapps.com`) |

Release notes: `npm run mail:release` sends to **Kevin only**. `npm run mail:release:house` sends to the household — run it only when Kevin asks.

Cron (`workit-mail-cron` → `POST /api/cron/mail`, 8am Eastern; `workit-onboarding-cron` → `?task=onboarding`, 8pm Eastern) does not use these aliases. Keep `CRON_SECRET` and set `APP_URL` to `https://workitapp.fit` as in the domain runbook.

---

## F. Check

1. From a personal account, mail `info@workitapp.fit` and `tom@workitapp.fit`. Both should appear in **info@kervinapps.com**.
2. `https://workitapp.fit` still loads (A record unchanged).
3. If mail never arrives: Zoho MX not verified, leftover GoDaddy Email Forwarding MX, or aliases on the wrong user.
4. If the site dies after adding MX: someone edited or deleted the Netlify **A** on `@`. Put `75.2.60.5` back.
