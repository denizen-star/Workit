# Quick Start Guide

## Initial Setup (5 minutes)

### 1. Install Dependencies

```bash
cd workout-tracker
npm install
```

### 2. Set Up Database

Copy `.env.example` to `.env.local` and add your PlanetScale credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` — at minimum database + `AUTH_SECRET`. Mail keys are in `.env.example` (copy those if you want local sends).

### 3. Initialize Database Schema

Run the SQL from `database/schema.sql` in your PlanetScale console or CLI:

```bash
# Using PlanetScale CLI
pscale shell your-database-name main < database/schema.sql
```

Or copy/paste the contents into PlanetScale web console.

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 5. Optional: Generate Custom Icons

Replace the placeholder icons:

```bash
npm run generate-icons  # Creates icon.svg
# Then convert to PNG or use online tool
```

See DEPLOYMENT.md for icon generation options.

## Quick Test

1. Click "Start Workout"
2. Select Week 1, Day 1 (Upper Body A)
3. Enter weight/reps for a set
4. Mark it complete
5. Check dashboard for updated stats

## Deployment

See DEPLOYMENT.md for full deployment instructions to work-it.kervinapps.com

### Quick Deploy (Netlify)

1. Push to GitHub (`main` auto-deploys)
2. Netlify → Environment variables (`.env.example` keys, Production)
3. Run `database/migrate-email.sql` on PlanetScale once
4. Deploy / wait for the build

## Troubleshooting

**Database connection error?**
- Check .env.local credentials
- Verify PlanetScale database is active

**Icons not showing?**
- Replace placeholder icons in public/ folder
- Use 192x192 and 512x512 PNG files

**API errors?**
- Check browser console
- Verify database schema is loaded

## Next Steps

1. Customize icons (public/icon-192.png, public/icon-512.png)
2. Test all features
3. Deploy to production
4. Add your first workout!

For detailed documentation, see:
- README.md - Full feature documentation
- DEPLOYMENT.md - Complete deployment guide
- database/schema.sql - Database structure
