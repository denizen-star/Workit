# Mail on workitapp.fit (aliases → info@kervinapps.com)

Website cutover is [`DOMAIN_WORKITAPP_FIT.md`](./DOMAIN_WORKITAPP_FIT.md). This file is **only** inbound mail at `@workitapp.fit`.

Goal: `tom@`, `luna@`, `grey@`, `news@`, `help@`, and `info@` **workitapp.fit** all land in the existing **info@kervinapps.com** Zoho inbox. Reply From those aliases in Zoho after the domain is verified.

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

Still GoDaddy DNS for **workitapp.fit**. Use the **MX / SPF / DKIM values Zoho shows you** (host is region-specific: `.com` vs `.ca` vs `.eu`). Typical shape:

| Type | Name | Value | Priority |
|------|------|--------|----------|
| MX | `@` | `mx.zoho.com` (or the `.ca` Zoho lists) | 10 |
| MX | `@` | `mx2.zoho.com` | 20 |
| MX | `@` | `mx3.zoho.com` | 50 |
| TXT | `@` | SPF Zoho gives you (do not invent one) | |
| TXT or CNAME | Zoho’s DKIM host | Zoho’s DKIM value | |

Rules:

- **MX** and **A** on `@` can both exist. MX is mail; A is the website.
- Delete any **GoDaddy parking / Email Forwarding MX** that fights Zoho.
- In Zoho, wait until **MX verified**.

---

## D. Aliases on info@kervinapps.com

1. Admin Console → **Users** → the **info@kervinapps.com** user.
2. **Mailbox Settings** → **Email Alias** → **Add**.
3. Add each, domain `workitapp.fit`:
   - `tom@workitapp.fit`
   - `luna@workitapp.fit`
   - `grey@workitapp.fit`
   - `news@workitapp.fit`
   - `help@workitapp.fit`
   - `info@workitapp.fit`
4. Do **not** set any of these as the primary mailbox address. Keep **info@kervinapps.com**.

Mail to those six addresses lands in the **info@** inbox. In Zoho you can reply **From** an alias once the domain is verified (pick the From address).

Official: [Create an email alias](https://www.zoho.com/mail/how-to/create-email-alias.html).

---

## E. App sending (leave unless you change From)

The app still sends as `SENDER_EMAIL=info@kervinapps.com` (`lib/mailClient.ts`) with coach **display names**. Every send BCCs `info@kervinapps.com` (`OPS_BCC`).

Aliases do **not** change that. Only change SMTP / `SENDER_EMAIL` if you later want the envelope From to be e.g. `tom@workitapp.fit`.

Cron (`workit-mail-cron` → `POST /api/cron/mail`) does not use these aliases. Keep `CRON_SECRET` and set `APP_URL` to `https://workitapp.fit` as in the domain runbook.

---

## F. Check

1. From a personal account, mail `info@workitapp.fit` and `tom@workitapp.fit`. Both should appear in **info@kervinapps.com**.
2. `https://workitapp.fit` still loads (A record unchanged).
3. If mail never arrives: Zoho MX not verified, leftover GoDaddy Email Forwarding MX, or aliases on the wrong user.
4. If the site dies after adding MX: someone edited or deleted the Netlify **A** on `@`. Put `75.2.60.5` back.
