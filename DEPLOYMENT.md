# Deployment Guide for Work-It Tracker

This guide covers deploying your workout tracker to workit.kervinapps.com with PlanetScale MySQL.

## Prerequisites

- [Netlify Account](https://app.netlify.com) (this app's host)
- [PlanetScale Account](https://planetscale.com)
- Domain access to KervinApps.com
- GitHub repository (or Git provider)

## Step 1: Set Up PlanetScale Database

### 1.1 Create Database

1. Go to [PlanetScale Dashboard](https://app.planetscale.com/)
2. Click "Create database"
3. Name it: `workout-tracker` (or your preferred name)
4. Select region closest to your users
5. Choose free tier or paid plan based on needs

### 1.2 Create Production Branch

```bash
# Install PlanetScale CLI (optional but recommended)
brew install planetscale/tap/pscale

# Login
pscale auth login

# Create production branch
pscale branch create workout-tracker production
```

### 1.3 Run Database Schema

**Option A: Using PlanetScale Console**

1. Go to your database in PlanetScale dashboard
2. Click "Console" tab
3. Copy contents of `database/schema.sql`
4. Paste and execute in the console

**Option B: Using CLI**

```bash
# Connect to database
pscale shell workout-tracker production

# Then paste the SQL from database/schema.sql
# Or run:
pscale shell workout-tracker production < database/schema.sql
```

### 1.4 Get Connection String

1. Go to database > "Connect"
2. Select "Connect with: Prisma" or "Node.js"
3. Copy the connection details:
   - Host
   - Username
   - Password

Keep these for Netlify environment variables.

### 1.5 Promote Branch to Production

```bash
# Make the branch production-ready
pscale branch promote workout-tracker production
```

## Step 2: Prepare GitHub Repository

### 2.1 Initialize Git (if not already)

```bash
cd workout-tracker
git init
git add .
git commit -m "Initial commit: Work-It Tracker"
```

### 2.2 Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create new repository: `workout-tracker`
3. Don't initialize with README (we already have one)

### 2.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/workout-tracker.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Netlify

### 3.1 Connect the repo

1. [Netlify dashboard](https://app.netlify.com) → add site from Git
2. Select this repository / `main`
3. Build: `npm run build`, publish `.next`, plugin `@netlify/plugin-nextjs` (see `netlify.toml`)

### 3.2 Environment variables

Site configuration → Environment variables. Scope **Production**. Database:

```
DATABASE_HOST=...
DATABASE_USERNAME=...
DATABASE_PASSWORD=...
AUTH_SECRET=...
```

Mail (same Zoho SMTP as hit-list/Gowanus):

```
EMAIL_ENABLED=TRUE
SENDER_EMAIL=info@kervinapps.com
SENDER_PASSWORD=<zoho app password>
SMTP_SERVER=smtp.zohocloud.ca
SMTP_PORT=465
NEXT_PUBLIC_APP_URL=https://workit.kervinapps.com
WORKIT_SCOREBOARD_TO=<Kevin's email>
CRON_SECRET=<long random string, match .env.local>
```

Use PlanetScale **production** credentials.

### 3.3 Mail table

Run `database/migrate-email.sql` on PlanetScale once (`email_sends`). Without it, send still works but dedupe may warn.

### 3.4 Deploy

Push to `main` or trigger Deploy. Cron: `netlify/functions/workit-mail-cron.mts` at `0 12 * * *` UTC → `POST /api/cron/mail`.

## Step 4: Configure Custom Domain

### 4.1 Add domain in Netlify

1. Site → Domain management → Add `workit.kervinapps.com`
2. Follow Netlify's DNS instructions (usually CNAME `workit` → the Netlify site hostname)

### 4.2 Verify

1. Wait for DNS
2. Confirm HTTPS on `https://workit.kervinapps.com`

## Step 5: Generate App Icons

### 5.1 Create Icons

You need two PNG files:
- `public/icon-192.png` (192x192 pixels)
- `public/icon-512.png` (512x512 pixels)

**Option 1: Use Design Tool**
- Figma, Adobe XD, Photoshop, or Canva
- Create a square icon with your logo/design
- Export as PNG at 192x192 and 512x512

**Option 2: Use Online Tool**
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [Favicon Generator](https://realfavicongenerator.net/)

**Option 3: Quick CLI (ImageMagick)**

```bash
# Install ImageMagick
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Create simple icons (replace with your design)
convert -size 192x192 xc:#2563eb -fill white -pointsize 80 -gravity center -annotate +0+0 "💪" public/icon-192.png
convert -size 512x512 xc:#2563eb -fill white -pointsize 240 -gravity center -annotate +0+0 "💪" public/icon-512.png
```

### 5.2 Deploy Icons

```bash
git add public/icon-*.png
git commit -m "Add PWA icons"
git push
```

Netlify redeploys on push to `main`.

## Step 6: Test Deployment

### 6.1 Test Website

Visit `https://workit.kervinapps.com` and verify:
- [ ] Homepage loads
- [ ] Can navigate to workout page
- [ ] Dashboard shows stats
- [ ] No console errors
- [ ] Admin → Mail preview loads (Kevin)

### 6.2 Test Database Connection

1. Click "Start Workout"
2. Select Week 1, Day 1
3. Enter weight and reps for a set
4. Click complete
5. Verify it saves (check dashboard stats)

### 6.3 Test PWA

**On Mobile (iOS):**
1. Open the site in **Safari** (not Chrome)
2. Tap Share (square + arrow up)
3. Add to Home Screen → Add
4. Open the home-screen icon

Welcome mail repeats those steps.

**On Desktop (Chrome/Edge):**
1. Visit site
2. Look for install icon in address bar
3. Click "Install"
4. Open installed app
5. Test offline mode (disconnect internet)

## Step 7: Monitor and Maintain

### 7.1 Netlify

Deploys and function logs (including `workit-mail-cron`) live in the Netlify site dashboard.

### 7.2 PlanetScale Monitoring

1. Monitor database usage in PlanetScale dashboard
2. Check query insights
3. Set up alerts for errors

### 7.3 Regular Backups

```bash
# Backup database regularly
pscale backup create workout-tracker production

# List backups
pscale backup list workout-tracker production
```

## Troubleshooting

### Database Connection Failed

**Problem**: API routes return 500 errors

**Solutions**:
1. Verify environment variables in Netlify (Production)
2. Check PlanetScale database is not sleeping (upgrade from free tier if needed)
3. Ensure production branch is promoted
4. Check PlanetScale connection string is correct

```bash
# Test connection locally
node -e "const { connect } = require('@planetscale/database'); const conn = connect({ host: 'HOST', username: 'USER', password: 'PASS' }); conn.execute('SELECT 1').then(() => console.log('Connected!')).catch(console.error);"
```

### Domain Not Working

**Problem**: workit.kervinapps.com not loading

**Solutions**:
1. Check DNS propagation: `dig workit.kervinapps.com`
2. Verify CNAME record is correct in DNS settings
3. Wait up to 48 hours for full propagation
4. Check the custom domain on the Netlify site

### PWA Not Installing

**Problem**: No install prompt on mobile

**Solutions**:
1. Verify HTTPS is enabled (required for PWA)
2. Check manifest.json is accessible: `https://workit.kervinapps.com/manifest.json`
3. Ensure icons exist and are valid PNG files
4. Clear browser cache and reload
5. Check browser console for service worker errors

### Mail not sending

1. Netlify Production env: `EMAIL_ENABLED`, `SENDER_*`, `SMTP_*`, `CRON_SECRET`
2. Admin → Mail → Send this sample
3. Check spam; From is `Master Tom Iron <SENDER_EMAIL>` (or Luna Meadows if that voice is set)
4. Confirm `email_sends` exists (`database/migrate-email.sql`)
5. Function log: `workit-mail-cron` (needs `CRON_SECRET` + site URL)

### Icons Not Showing

**Problem**: Default icons appear instead of custom ones

**Solutions**:
1. Verify files exist: `public/icon-192.png` and `public/icon-512.png`
2. Check file sizes are exactly 192x192 and 512x512 pixels
3. Redeploy after adding icons
4. Clear cache and reinstall PWA

## Updating the App

### Deploy Updates

```bash
# Make changes to code
git add .
git commit -m "Description of changes"
git push
```

Netlify deploys on push to `main`.

### Database Migrations

```bash
# Create new branch for schema changes
pscale branch create workout-tracker migration-name

# Connect and make changes
pscale shell workout-tracker migration-name

# Test changes, then create deploy request
pscale deploy-request create workout-tracker migration-name

# Review and deploy
pscale deploy-request deploy workout-tracker <deploy-request-number>
```

## Performance Optimization

- PWA/cache headers live in `next.config.js`
- Index hot columns; watch PlanetScale insights
- Mail cron logs: Netlify → Functions → `workit-mail-cron`

## Security Best Practices

1. Never commit `.env` / `.env.local`
2. Scope Netlify mail vars to Production
3. `CRON_SECRET` required on `/api/cron/mail`
4. HTTPS only (PWA + SMTP clients)

## Cost Estimates

Netlify + PlanetScale free tiers are enough for household use. Upgrade PlanetScale if the DB outgrows the free storage/read limits.

## Support

- Netlify Docs: https://docs.netlify.com
- PlanetScale Docs: https://planetscale.com/docs
- Next.js Docs: https://nextjs.org/docs

For app-specific issues, see README.md or support@kervinapps.com.
