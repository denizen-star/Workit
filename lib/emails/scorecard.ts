import { query } from '@/lib/db';
import { isTestUserName, SQL_NOT_BLOCKED_USER, SQL_NOT_JOIN_DRAFT } from '@/lib/householdUsers';
import { sendNow } from '@/lib/emails/send';
import { wrapEmailHtml, p, bullets, cta, appUrl, esc } from '@/lib/emailLayout';
import { firstName } from '@/lib/profile';
import { defaultFrom } from '@/lib/mailClient';
import { MAIL_FROM } from '@/lib/mailFrom';
import { voiceFromName } from '@/lib/coachCatalog';
import { type BuiltEmail } from '@/lib/emails/templates';

type ScorecardStats = {
  sessions: number;
  totalSets: number;
  avgHardness: string;
  avgSec: string;
  rushedRate: string;
  houseAvgSec: string;
  houseRushedRate: string;
  fasterThanHouse: boolean;
  highestRushed: boolean;
  lowestRushed: boolean;
};

const SAMPLE_STATS: ScorecardStats = {
  sessions: 20,
  totalSets: 300,
  avgHardness: '3.5',
  avgSec: '110.0',
  rushedRate: '15.0',
  houseAvgSec: '115.0',
  houseRushedRate: '25.0',
  fasterThanHouse: false,
  highestRushed: false,
  lowestRushed: true,
};

function tomFrom() {
  return defaultFrom(voiceFromName('master'), MAIL_FROM.tom);
}

function coachNote(stats: ScorecardStats): string {
  const rushedNum = parseFloat(stats.rushedRate);
  const houseRushed = parseFloat(stats.houseRushedRate);

  if (rushedNum > 30) {
    const rank = stats.highestRushed
      ? `Compared to the rest of the house, you have the highest share of rushed sets — ${stats.rushedRate}% logged in under 15 seconds (house average ${stats.houseRushedRate}%).`
      : `Your share of rushed sets is ${stats.rushedRate}%, well above the house average of ${stats.houseRushedRate}%. Those are sets logged in under 15 seconds.`;
    return `You are putting up volume on the scoreboard, but the clock flagged an anomaly in your pacing. ${rank}<br><br>Rushing through sets this quickly usually means the 90-second rest is being skipped, or the weight is moving faster than prescribed.<br><br><strong>Watch out for injuries.</strong> If accessory work and core holds get tapped through, you lose time-under-tension and risk straining a muscle. Take the full rests, keep the form, and let the clock do its job.`;
  }

  if (rushedNum > 15) {
    const vsHouse =
      Number.isFinite(houseRushed) && rushedNum > houseRushed
        ? `That is above the house average of ${stats.houseRushedRate}%.`
        : `The house average is ${stats.houseRushedRate}%.`;
    const paceLine = stats.fasterThanHouse
      ? `You are moving a bit faster than the rest of the house (averaging ${stats.avgSec} seconds per set; house ${stats.houseAvgSec}s).`
      : `You are averaging ${stats.avgSec} seconds per set (house ${stats.houseAvgSec}s).`;
    return `${paceLine} About ${stats.rushedRate}% of your sets are completed in under 15 seconds. ${vsHouse}<br><br>That usually shows up on core or lighter accessories at the end of a session. Take the breath. Full rests keep form tight and give the muscle the time under tension it needs to grow.`;
  }

  if (stats.sessions < 5) {
    return `You are off to a disciplined start. In your first few sessions you averaged about ${stats.avgSec} seconds per set, and ${stats.rushedRate}% of sets were rushed (house ${stats.houseRushedRate}%). That is respecting the rest timers.<br><br>One tip as you keep building: use the <strong>How hard?</strong> slider. Hard (4) or Max (5) multiplies scoreboard volume, so do not leave those points on the table.`;
  }

  const rank = stats.lowestRushed
    ? `your rushed-set rate is among the lowest on the board at ${stats.rushedRate}%`
    : `your rushed-set rate is ${stats.rushedRate}%`;
  return `You are locked in. Average pace is ${stats.avgSec} seconds per set (house ${stats.houseAvgSec}s), and ${rank} (house ${stats.houseRushedRate}%). That is respecting the 90-second rest.<br><br>Time-under-tension and proper rest are what build strength without picking up an injury. Keep holding the line.`;
}

function stripNoteHtml(html: string) {
  return html.replace(/<br\s*\/?>/g, '\n').replace(/<\/?strong>/g, '');
}

export function buildScorecardEmail(name: string, stats: ScorecardStats): BuiltEmail {
  const shortName = firstName(name);
  const subject = 'The numbers are in...';
  const note = coachNote(stats);

  const html = wrapEmailHtml({
    eyebrow: 'Performance',
    title: 'The numbers are in...',
    signer: 'Master Tom Iron',
    childrenHtml: `
      ${p('Hey ' + esc(shortName) + ',')}
      ${p('Now that we have enough data running through the Work-It boards, we are sending personalized pacing scorecards so you can see how you are attacking the program.')}
      
      ${p('<strong style="color:#e8c547;">Your Stats</strong>')}
      ${bullets([
        'Sessions Completed: ' + stats.sessions,
        'Average Effort Score: ' + stats.avgHardness + ' / 5.0',
        'Total Sets Logged: ' + stats.totalSets,
      ])}
      
      ${p('<strong style="color:#e8c547;">Vs. The House (Pacing)</strong>')}
      ${bullets([
        `Your Pace: ${stats.avgSec}s per set <em>(House Avg: ${stats.houseAvgSec}s)</em>`,
        `Your Rushed Sets: ${stats.rushedRate}% <em>(House Avg: ${stats.houseRushedRate}%)</em>`,
      ])}
      
      ${p('<strong style="color:#e8c547;">Coach\u2019s Note on Pacing</strong>')}
      ${p(note)}
      
      ${p('Keep pushing the iron,<br>\u2014 Master Tom Iron')}
      
      <div style="text-align:center; margin-top:32px;">
        ${cta(appUrl() + '/home', 'Go to Home')}
      </div>
    `,
  });

  const text = [
    'Hey ' + shortName + ',',
    '',
    'Now that we have enough data running through the Work-It boards, we are sending personalized pacing scorecards so you can see how you are attacking the program.',
    '',
    'Your Stats:',
    '- Sessions Completed: ' + stats.sessions,
    '- Average Effort Score: ' + stats.avgHardness + ' / 5.0',
    '- Total Sets Logged: ' + stats.totalSets,
    '',
    'Vs. The House (Pacing):',
    '- Your Pace: ' + stats.avgSec + 's per set (House Avg: ' + stats.houseAvgSec + 's)',
    '- Your Rushed Sets: ' + stats.rushedRate + '% (House Avg: ' + stats.houseRushedRate + '%)',
    '',
    "Coach's Note on Pacing:",
    stripNoteHtml(note),
    '',
    'Keep pushing the iron,',
    '— Master Tom Iron',
  ].join('\n');

  return { from: tomFrom(), subject, html, text };
}

type AthleteRow = {
  id: number;
  name: string;
  email: string | null;
  stats: ScorecardStats;
};

async function getScorecardData(): Promise<AthleteRow[]> {
  const usersResult = await query(
    `SELECT u.id, u.name, u.email FROM users u WHERE ${SQL_NOT_BLOCKED_USER} AND ${SQL_NOT_JOIN_DRAFT}`
  );
  const users = usersResult.rows as { id: number; name: string; email: string | null }[];

  const timings = await query(`
    SELECT 
      ws.user_id,
      ws.id as session_id,
      ws.started_at,
      es.created_at
    FROM exercise_sets es
    JOIN workout_sessions ws ON es.workout_session_id = ws.id
    WHERE ws.is_completed = 1 AND es.is_completed = 1
    ORDER BY ws.user_id, ws.started_at ASC, es.created_at ASC
  `);

  let lastSetTime: Date | null = null;
  let currentSessionId = -1;

  let houseTotalTime = 0;
  let houseSetCount = 0;
  let houseFastSets = 0;

  const userStats: Record<
    number,
    { totalTime: number; setCount: number; veryFastSets: number; name: string; email: string | null; id: number }
  > = {};
  for (const u of users) {
    userStats[u.id] = {
      totalTime: 0,
      setCount: 0,
      veryFastSets: 0,
      name: u.name,
      email: u.email,
      id: u.id,
    };
  }

  for (const row of timings.rows as {
    user_id: number;
    session_id: number;
    started_at: string;
    created_at: string;
  }[]) {
    const created_at = new Date(row.created_at);
    const started_at = new Date(row.started_at);

    let durationMs = 0;
    if (row.session_id !== currentSessionId) {
      durationMs = created_at.getTime() - started_at.getTime();
      currentSessionId = row.session_id;
    } else if (lastSetTime) {
      durationMs = created_at.getTime() - lastSetTime.getTime();
    }

    lastSetTime = created_at;

    if (durationMs <= 0 || durationMs >= 15 * 60 * 1000) continue;

    const timing = userStats[row.user_id];
    if (!timing) continue;

    timing.totalTime += durationMs;
    timing.setCount++;
    if (durationMs < 15 * 1000) timing.veryFastSets++;

    if (!isTestUserName(timing.name)) {
      houseTotalTime += durationMs;
      houseSetCount++;
      if (durationMs < 15 * 1000) houseFastSets++;
    }
  }

  const houseAvgSec = houseSetCount > 0 ? (houseTotalTime / houseSetCount / 1000).toFixed(1) : '—';
  const houseRushedRate = houseSetCount > 0 ? ((houseFastSets / houseSetCount) * 100).toFixed(1) : '—';
  const houseAvgSecNum = houseSetCount > 0 ? houseTotalTime / houseSetCount / 1000 : 0;
  const houseRushedNum = houseSetCount > 0 ? (houseFastSets / houseSetCount) * 100 : 0;

  const otherStats = await query(`
    SELECT 
      ws.user_id,
      COUNT(DISTINCT ws.id) as sessions,
      AVG(COALESCE(es.hardness, 3)) as avg_hardness
    FROM workout_sessions ws
    JOIN exercise_sets es ON ws.id = es.workout_session_id
    WHERE ws.is_completed = 1 AND es.is_completed = 1
    GROUP BY ws.user_id
  `);
  const statsByUser = new Map(
    (otherStats.rows as { user_id: number; sessions: string; avg_hardness: string }[]).map((row) => [
      Number(row.user_id),
      row,
    ])
  );

  const results: AthleteRow[] = [];

  for (const u of users) {
    if (isTestUserName(u.name)) continue;
    const stats = statsByUser.get(u.id);
    const timing = userStats[u.id];
    if (!stats || !timing || timing.setCount < 10) continue;

    const avgSecNum = timing.totalTime / timing.setCount / 1000;
    const rushedNum = (timing.veryFastSets / timing.setCount) * 100;
    const avgHardnessNum = parseFloat(stats.avg_hardness || '3');

    results.push({
      id: u.id,
      name: u.name,
      email: u.email,
      stats: {
        sessions: parseInt(String(stats.sessions), 10),
        totalSets: timing.setCount,
        avgHardness: Number.isFinite(avgHardnessNum) ? avgHardnessNum.toFixed(1) : '3.0',
        avgSec: avgSecNum.toFixed(1),
        rushedRate: rushedNum.toFixed(1),
        houseAvgSec,
        houseRushedRate,
        fasterThanHouse: houseSetCount > 0 && avgSecNum < houseAvgSecNum,
        highestRushed: false,
        lowestRushed: false,
      },
    });
  }

  if (results.length > 0) {
    const rushed = results.map((row) => parseFloat(row.stats.rushedRate));
    const maxRushed = Math.max(...rushed);
    const minRushed = Math.min(...rushed);
    for (const row of results) {
      const rate = parseFloat(row.stats.rushedRate);
      row.stats.highestRushed = rate === maxRushed;
      row.stats.lowestRushed = rate === minRushed;
    }
  }

  return results;
}

export async function buildLiveScorecardsPreview(): Promise<BuiltEmail> {
  const data = await getScorecardData();
  if (data.length === 0) return buildScorecardEmail('Sample', SAMPLE_STATS);
  return buildScorecardEmail(data[0].name, data[0].stats);
}

export async function sendScorecards(opts?: { force?: boolean }) {
  const data = await getScorecardData();
  if (data.length === 0) return { sent: false, skipped: 'no-recipients', results: [] };

  const results = [];

  for (const athlete of data) {
    if (!athlete.email) continue;

    const email = buildScorecardEmail(athlete.name, athlete.stats);

    if (opts?.force) {
      const sentId = await sendNow(athlete.email, email, {
        userId: athlete.id,
        athleteName: athlete.name,
        template: 'scorecard',
      });
      results.push({
        to: athlete.email,
        name: athlete.name,
        subject: email.subject,
        sent: !!sentId,
      });
    } else {
      results.push({
        to: athlete.email,
        name: athlete.name,
        subject: email.subject,
        sent: false,
        dryRun: true,
      });
    }
  }

  return { sent: true, count: results.length, results };
}
