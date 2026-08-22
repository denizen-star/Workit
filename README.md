# Work-It Workout Tracker

A Progressive Web App for tracking a 6-week upper/lower workout split program with badges, progress charts, rest timer, and detailed exercise tracking.

## Features

- **6-Week Structured Program**: Complete upper/lower split with progressive overload
- **Exercise Tracking**: Log weight and reps for every set
- **Rest Timer**: Built-in timer between sets with customizable duration
- **Badge System**: Earn achievements for milestones (first workout, streaks, weight lifted, etc.)
- **Progress Charts**: Visualize daily weight lifted and weekly completion
- **Gym / Travel**: any day can run gym or no-equipment travel substitutions
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
- Domain: workit.kervinapps.com

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

Create a `.env.local` file in the root directory (copy `.env.example`):

```env
DATABASE_HOST=aws.connect.psdb.cloud
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
AUTH_SECRET=at-least-32-characters

EMAIL_ENABLED=TRUE
SENDER_EMAIL=info@kervinapps.com
SENDER_PASSWORD=your_zoho_app_password
SMTP_SERVER=smtp.zohocloud.ca
SMTP_PORT=465
NEXT_PUBLIC_APP_URL=https://workit.kervinapps.com
WORKIT_SCOREBOARD_TO=you@example.com
CRON_SECRET=long-random-string
```

PlanetScale credentials: database "Connect" page. SMTP: same Zoho vars as hit-list/Gowanus. Mail is off if `SENDER_PASSWORD` is missing; `EMAIL_ENABLED=false` also skips send.

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

Live host is **Netlify** (`netlify.toml`, `@netlify/plugin-nextjs`) at `workit.kervinapps.com`.

1. Push to GitHub (Netlify continuous deploy on `main`)
2. Site configuration → Environment variables — database + mail keys from `.env.example`
3. Run `database/migrate-email.sql` once on PlanetScale if `email_sends` is missing
4. Custom domain `workit.kervinapps.com` in Netlify Domain management

Admin → **Mail** to preview/send samples after deploy.

## Database Schema

7 tables that matter:

1. **users** — household profiles (name, email, PIN hash)
2. **workout_sessions** — each workout session (week/day)
3. **exercise_sets** — sets with weight/reps
4. **badges** / **user_badges** — achievements
5. **daily_stats** — dashboard aggregates
6. **exercises** — catalog + images
7. **email_sends** — mail dedupe (`database/migrate-email.sql`)

See `database/schema.sql` + migrate-*.sql.

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
- Weeks 3-5: Building phase (add 2.5-5 lbs or 1-2 reps)
- Week 6: Peak phase (match or beat Week 4)
- Any day: Gym (default from Home Start) or Travel (no equipment) from Select Workout

## Customization

### Modify Workout Program

Edit `lib/workoutData.ts` to customize:
- Exercise names
- Set/rep schemes
- Weekly progression
- Travel substitutions (`lib/travelExercises.ts`)

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

- Welcome mail (when an admin adds you) includes iPhone steps: Safari → Share → Add to Home Screen
- Household mail buttons (welcome, nudge, recap, badge, release) open `/who`. Monday scoreboard opens `/admin`.

## API Endpoints

- `GET /api/sessions` - Get workout sessions
- `POST /api/sessions` - Create new workout session
- `PUT /api/sessions` - Complete/update session (queues recap mail)
- `GET /api/exercises` - Get exercise sets
- `POST /api/exercises` - Save exercise set
- `GET /api/stats` - Get user statistics
- `GET /api/badges` - Get badges and check for new awards
- `GET|POST /api/cron/mail` - Daily nudges + Monday scoreboard (`Bearer CRON_SECRET`)
- `GET|POST /api/admin/mail` - Admin preview / sample send (`requireAdmin`)

## Contributing

Feel free to customize this app for your own workouts!

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact support@kervinapps.com.
