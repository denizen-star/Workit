# Move live host to workitapp.fit

The app stays on the **same Netlify site**. You only add a new domain. Production today is [https://workit.kervinapps.com/](https://workit.kervinapps.com/). Target is **https://workitapp.fit**.

Do the DNS steps below **now**. Code and Netlify env (`APP_URL`, mail links, `/login`) ship with the join implementation. Until that ships, both hosts can serve the **current** app.

Registrar: **GoDaddy** (workitapp.fit). Host: **Netlify**. Keep GoDaddy as DNS (do not switch nameservers to Netlify unless you want to manage all DNS there).

Netlify’s current apex load-balancer IP is **`75.2.60.5`**. If Domain management shows a different value, use **Netlify’s**.

---

## A. What you need in front of you

- GoDaddy account that owns **workitapp.fit**
- Netlify account for the Work-It site
- That site’s `*.netlify.app` name (Site configuration → Domain management — looks like `something.netlify.app`)

Do **not** delete **workit.kervinapps.com** from Netlify. Old mail, home-screen icons, and bookmarks still use it. After cutover it should **redirect** to workitapp.fit.

---

## B. Add the domain on Netlify (do this first)

1. Open [Netlify](https://app.netlify.com) → the Work-It site (the one that already serves workit.kervinapps.com).
2. **Site configuration** → **Domain management** → **Add a domain** (or **Add custom domain**).
3. Enter `workitapp.fit`. Add it. If Netlify offers **www.workitapp.fit**, add that too.
4. Set **workitapp.fit** as the **primary** domain when Netlify lets you (HTTPS on the new name must work first — you can set primary after step D).
5. Leave **workit.kervinapps.com** on the site. Later: Domain management → that domain → **Options** → redirect to primary (workitapp.fit).
6. On the new domain row, open **Set up Netlify DNS** only if you intend to move nameservers. **Skip that.** Use **external DNS** at GoDaddy.
7. Copy the exact records Netlify lists (A / CNAME). They override this doc if they disagree.

---

## C. Point GoDaddy at Netlify

1. GoDaddy → **My Products** → **workitapp.fit** → **DNS** (DNS Management).
2. **Remove** parking / lander records that will fight Netlify:
   - Extra **A** on `@` (Parked, GoDaddy landing, old IPs)
   - **CNAME** on `@` if one exists
   - Leave **NS** records that GoDaddy set for itself
   - Leave **MX** if you will use mail on this domain later (Zoho still uses info@kervinapps.com today). Aliases at `@workitapp.fit`: [`EMAIL_WORKITAPP_FIT.md`](./EMAIL_WORKITAPP_FIT.md)
3. Add **exactly one** apex **A**:

   | Type | Name | Value | TTL |
   |------|------|--------|-----|
   | A | `@` | `75.2.60.5` | 600 or default |

4. Add **www**:

   | Type | Name | Value | TTL |
   |------|------|--------|-----|
   | CNAME | `www` | `YOUR-SITE.netlify.app` | 600 or default |

   The Value is the site’s **Netlify subdomain**, not `apex-loadbalancer.netlify.com`.

5. Save. GoDaddy often takes **30 minutes to a few hours**; worst case ~24–48 hours.

6. **Do not** change nameservers for **kervinapps.com**. That is a different domain. workit.kervinapps.com keeps working until you choose to redirect it.

---

## D. HTTPS

1. Back in Netlify → Domain management → workitapp.fit.
2. Wait until DNS shows **as expected** (green / verified).
3. Netlify issues Let’s Encrypt on its own. If it fails: only **one** A on `@`, www CNAME correct, no leftover Parked A. Retry **Provision certificate**.
4. Open a private window: `https://workitapp.fit` — you should see the **same** Work-It app as [workit.kervinapps.com](https://workit.kervinapps.com/). `https://www.workitapp.fit` should land on the apex (Netlify redirect) once www is attached.

Check from your machine:

```bash
dig +short workitapp.fit A
# expect 75.2.60.5

dig +short www.workitapp.fit CNAME
# expect YOUR-SITE.netlify.app
```

Or [dnschecker.org](https://dnschecker.org) for A on `workitapp.fit`.

---

## E. After DNS works — still do in this implementation (code / env)

Not optional for mail and join links. Until this ships, new mail may still say workit.kervinapps.com.

1. Netlify → **Environment variables** (Production):
   - Set **`APP_URL`** = `https://workitapp.fit` (this is what `appUrl()` reads; not only `NEXT_PUBLIC_APP_URL`).
   - Set **`NEXT_PUBLIC_APP_URL`** = `https://workitapp.fit` if that key exists (PWA / client).
   - Redeploy after saving.
2. In repo (with join work): change `LIVE_APP_URL` in `lib/emailLayout.ts` from `https://workit.kervinapps.com` to `https://workitapp.fit`. Update claim/reset/welcome/waiver links to the new host (`/login`, `/join?h=gowanus`, waiver URL in welcome mail).
3. Netlify: keep **workitapp.fit** primary. Keep **workit.kervinapps.com** assigned to the site (do not remove). There is **no** Domain management **Options → redirect** for that hostname (Netlify only auto-redirects apex ↔ www). The 301 lives in `netlify.toml` (`workit.kervinapps.com/*` → `https://workitapp.fit/:splat`). Deploy after `APP_URL` is `https://workitapp.fit`.
4. Manifest / home-screen: athletes who pinned the old URL should **Add to Home Screen** again from Safari on workitapp.fit.
5. Cron and Zoho: no domain change required if cron still hits the Netlify site URL or the new host. BCC stays `info@kervinapps.com` unless you later add mail on .fit. To receive at `tom@` / `info@` / etc. **workitapp.fit**, follow [`EMAIL_WORKITAPP_FIT.md`](./EMAIL_WORKITAPP_FIT.md).

---

## F. What you should see when DNS is done (before code ships)

| URL | Result |
|-----|--------|
| https://workitapp.fit | Current app (who / home) |
| https://www.workitapp.fit | Same site |
| https://workit.kervinapps.com | Still works until you turn on the redirect |

---

## G. If it fails

- **GoDaddy lander** — leftover Parked **A**. Delete it. Only `75.2.60.5` on `@`.
- **Certificate pending** — DNS not worldwide yet. Wait, then retry provision.
- **www works, apex does not** — missing or wrong **A** on `@`.
- **Added Netlify nameservers by mistake** — either finish Netlify DNS, or set GoDaddy nameservers back and use the A + CNAME above.

Official Netlify notes: [DNS quick start](https://answers.netlify.com/t/support-guide-dns-quick-start-how-to-set-up-dns/24773), [SSL troubleshooting](https://docs.netlify.com/manage/domains/troubleshooting/troubleshoot-ssl-and-https).
