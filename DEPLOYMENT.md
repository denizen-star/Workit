# Deployment Guide for Work-It Tracker

This guide covers deploying your workout tracker to work-it.KervinApps.com with PlanetScale MySQL.

## Prerequisites

- [Vercel Account](https://vercel.com)
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

Keep these for Vercel configuration.

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

## Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Select `workout-tracker`

### 3.2 Configure Build Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (or leave empty)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3.3 Add Environment Variables

In the Vercel project configuration, add these environment variables:

```
DATABASE_HOST=aws.connect.psdb.cloud
DATABASE_USERNAME=<your-planetscale-username>
DATABASE_PASSWORD=<your-planetscale-password>
```

**Important**: Use the production branch credentials from PlanetScale.

### 3.4 Deploy

Click "Deploy" and wait for the build to complete.

## Step 4: Configure Custom Domain

### 4.1 Add Domain in Vercel

1. Go to your project > Settings > Domains
2. Click "Add Domain"
3. Enter: `work-it.kervinapps.com`
4. Vercel will provide DNS configuration

### 4.2 Update DNS Records

Go to your domain provider (where KervinApps.com is registered) and add:

**Option A: CNAME Record (Recommended)**
```
Type: CNAME
Name: work-it
Value: cname.vercel-dns.com
TTL: 3600
```

**Option B: A Record**
```
Type: A
Name: work-it
Value: 76.76.21.21
TTL: 3600
```

### 4.3 Verify Domain

1. Wait for DNS propagation (can take up to 48 hours, usually 5-15 minutes)
2. Vercel will automatically verify and issue SSL certificate
3. Check status in Vercel dashboard

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

Vercel will automatically redeploy.

## Step 6: Test Deployment

### 6.1 Test Website

Visit `https://work-it.kervinapps.com` and verify:
- [ ] Homepage loads
- [ ] Can navigate to workout page
- [ ] Dashboard shows stats
- [ ] No console errors

### 6.2 Test Database Connection

1. Click "Start Workout"
2. Select Week 1, Day 1
3. Enter weight and reps for a set
4. Click complete
5. Verify it saves (check dashboard stats)

### 6.3 Test PWA

**On Mobile (iOS/Android):**
1. Visit site in Safari/Chrome
2. Tap share button
3. Select "Add to Home Screen"
4. Open the installed app
5. Verify it works like a native app

**On Desktop (Chrome/Edge):**
1. Visit site
2. Look for install icon in address bar
3. Click "Install"
4. Open installed app
5. Test offline mode (disconnect internet)

## Step 7: Monitor and Maintain

### 7.1 Set Up Vercel Analytics (Optional)

1. Go to project > Analytics
2. Enable Web Analytics
3. Monitor page views and performance

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
1. Verify environment variables in Vercel
2. Check PlanetScale database is not sleeping (upgrade from free tier if needed)
3. Ensure production branch is promoted
4. Check PlanetScale connection string is correct

```bash
# Test connection locally
node -e "const { connect } = require('@planetscale/database'); const conn = connect({ host: 'HOST', username: 'USER', password: 'PASS' }); conn.execute('SELECT 1').then(() => console.log('Connected!')).catch(console.error);"
```

### Domain Not Working

**Problem**: work-it.kervinapps.com not loading

**Solutions**:
1. Check DNS propagation: `dig work-it.kervinapps.com`
2. Verify CNAME record is correct in DNS settings
3. Wait up to 48 hours for full propagation
4. Check Vercel domain status in project settings

### PWA Not Installing

**Problem**: No install prompt on mobile

**Solutions**:
1. Verify HTTPS is enabled (required for PWA)
2. Check manifest.json is accessible: `https://work-it.kervinapps.com/manifest.json`
3. Ensure icons exist and are valid PNG files
4. Clear browser cache and reload
5. Check browser console for service worker errors

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

Vercel automatically deploys on push to main branch.

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

### 1. Enable Vercel Edge Cache

Add to `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, stale-while-revalidate=86400',
        },
      ],
    },
  ]
}
```

### 2. Optimize Database Queries

- Add indexes to frequently queried columns
- Use connection pooling
- Cache API responses where appropriate

### 3. Monitor Performance

- Use Vercel Analytics
- Check Core Web Vitals
- Monitor API response times in PlanetScale

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Database Access**: Use read-only credentials where possible
3. **API Rate Limiting**: Add rate limiting to API routes
4. **Input Validation**: Validate all user inputs
5. **HTTPS Only**: Ensure HTTPS is enforced
6. **Regular Updates**: Keep dependencies updated

## Cost Estimates

### Free Tier Limits

**Vercel Free Tier:**
- Unlimited deployments
- 100GB bandwidth/month
- Generous build minutes

**PlanetScale Free Tier:**
- 5GB storage
- 1 billion row reads/month
- 10 million row writes/month

### When to Upgrade

Upgrade if:
- Database > 5GB
- High traffic (>100GB bandwidth/month)
- Need more database branches
- Want better support

## Support

- Vercel Docs: https://vercel.com/docs
- PlanetScale Docs: https://planetscale.com/docs
- Next.js Docs: https://nextjs.org/docs

For app-specific issues, check the main README.md or contact support@kervinapps.com.
