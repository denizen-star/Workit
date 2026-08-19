# Work-It Workout Tracker

A Progressive Web App for tracking a 6-week upper/lower workout split program with badges, progress charts, rest timer, and detailed exercise tracking.

## Features

- **6-Week Structured Program**: Complete upper/lower split with progressive overload
- **Exercise Tracking**: Log weight and reps for every set
- **Rest Timer**: Built-in timer between sets with customizable duration
- **Badge System**: Earn achievements for milestones (first workout, streaks, weight lifted, etc.)
- **Progress Charts**: Visualize daily weight lifted and weekly completion
- **Travel Week Support**: Special Week 5 with hotel-friendly exercises
- **PWA Support**: Install on mobile/desktop, works offline
- **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: Next.js 14 (React), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PlanetScale MySQL
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: Service Worker with offline caching

## Prerequisites

- Node.js 18+ and npm
- PlanetScale account and database
- Domain: work-it.KervinApps.com

## Installation

### 1. Clone and Install Dependencies

```bash
cd workout-tracker
npm install
```

### 2. Set Up PlanetScale Database

1. Create a database on [PlanetScale](https://planetscale.com/)
2. Run the schema from `database/schema.sql`:

```bash
# Connect to your PlanetScale database
pscale shell <database-name> <branch-name>

# Copy and paste the contents of database/schema.sql
```

Or use the PlanetScale CLI:

```bash
pscale connect <database-name> <branch-name> --execute-protocol
mysql -h 127.0.0.1 -P 3306 -u root < database/schema.sql
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_HOST=aws.connect.psdb.cloud
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
```

Get these credentials from your PlanetScale database's "Connect" page.

### 4. Generate App Icons

Create two PNG icons in the `public` folder:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

You can use a tool like [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) or create custom icons with your logo.

Quick option using a placeholder:
```bash
# Install ImageMagick (if not installed)
# macOS: brew install imagemagick
# Linux: apt-get install imagemagick

# Create simple colored icons (replace with your design)
convert -size 192x192 xc:#2563eb -pointsize 60 -fill white -gravity center -annotate +0+0 "W" public/icon-192.png
convert -size 512x512 xc:#2563eb -pointsize 180 -fill white -gravity center -annotate +0+0 "W" public/icon-512.png
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. Go to [Vercel](https://vercel.com/) and import your repository

3. Configure environment variables in Vercel:
   - `DATABASE_HOST`
   - `DATABASE_USERNAME`
   - `DATABASE_PASSWORD`

4. Set up custom domain `work-it.KervinApps.com`:
   - Go to your project settings > Domains
   - Add your custom domain
   - Update your DNS records as instructed by Vercel

### Deploy to Other Platforms

The app can also be deployed to:
- **Netlify**: Similar to Vercel, supports Next.js
- **Railway**: Good for full-stack apps with databases
- **Fly.io**: If you prefer Docker deployment
- **AWS Amplify**: Enterprise option

## Database Schema

The app uses 6 main tables:

1. **users** - User information
2. **workout_sessions** - Each workout session (week/day)
3. **exercise_sets** - Individual exercise sets with weight/reps
4. **badges** - Available achievements
5. **user_badges** - Earned badges
6. **daily_stats** - Aggregated daily statistics

See `database/schema.sql` for full schema details.

## Usage

### Starting a Workout

1. Click "Start Workout" on the dashboard
2. Select the week and day you want to workout
3. Enter weight and reps for each set
4. Use the rest timer between sets
5. Mark sets as complete
6. Complete the workout when all exercises are done

### Tracking Progress

- Dashboard shows overall stats (workouts completed, streak, total weight)
- Weekly progress grid shows completion for each week
- Charts visualize daily weight lifted and weekly completion
- Badges are automatically awarded based on achievements

### Progressive Overload

- Weeks 1-2: Adaptation phase (conservative weights)
- Weeks 3-4: Building phase (add 2.5-5 lbs or 1-2 reps)
- Week 5: Travel week (hotel-friendly exercises)
- Week 6: Peak phase (match or beat Week 4)

## Customization

### Modify Workout Program

Edit `lib/workoutData.ts` to customize:
- Exercise names
- Set/rep schemes
- Weekly progression
- Travel week exercises

### Add More Badges

Edit the badges INSERT statement in `database/schema.sql`:

```sql
INSERT INTO badges (name, description, icon, requirement_type, requirement_value) VALUES
('Your Badge', 'Description', '🏅', 'requirement_type', value);
```

### Change Theme Colors

Edit `tailwind.config.ts` and update the color palette, or modify individual component colors in the components.

## Troubleshooting

### Database Connection Issues

- Verify environment variables are correct
- Check PlanetScale database is active and not sleeping
- Ensure your IP is allowed in PlanetScale settings
- Check connection string format

### PWA Not Installing

- Ensure you're using HTTPS (required for PWA)
- Check that `manifest.json` and `sw.js` are accessible
- Icons must be valid PNG files
- Clear browser cache and try again

### Notification Permission

To enable rest timer notifications:

```javascript
// In browser console or add to component
Notification.requestPermission();
```

## API Endpoints

- `GET /api/sessions` - Get workout sessions
- `POST /api/sessions` - Create new workout session
- `PUT /api/sessions` - Update workout session
- `GET /api/exercises` - Get exercise sets
- `POST /api/exercises` - Save exercise set
- `GET /api/stats` - Get user statistics
- `GET /api/badges` - Get badges and check for new awards

## Contributing

Feel free to customize this app for your own workouts!

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact support@kervinapps.com.
