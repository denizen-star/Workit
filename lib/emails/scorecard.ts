import { query } from '@/lib/db';
import { SQL_NOT_BLOCKED_USER, SQL_NOT_JOIN_DRAFT } from '@/lib/householdUsers';
import { sendNow, claimAndSend } from '@/lib/emails/send';
import { wrapEmailHtml, p, bullets, cta, appUrl, coachPersonaArt } from '@/lib/emailLayout';
import { firstName } from '@/lib/profile';
import { type BuiltEmail } from '@/lib/emails/templates';

type ScorecardStats = {
  sessions: number;
  totalSets: number;
  avgHardness: string;
  avgSec: string;
  rushedRate: string;
  houseAvgSec: string;
  houseRushedRate: string;
};

export function buildScorecardEmail(name: string, stats: ScorecardStats): BuiltEmail {
  const shortName = firstName(name);
  const subject = 'The numbers are in... 📊';

  const rushedNum = parseFloat(stats.rushedRate);
  
  let coachNote = '';
  if (rushedNum > 30) {
    coachNote = `You are putting up massive volume on the scoreboard, but our telemetry flagged an anomaly in your pacing. Compared to the rest of the house, you have the highest rate of "speedrunning" by a wide margin—over ${stats.rushedRate}% of your sets are being logged and completed in under 15 seconds.<br><br>While we love the enthusiasm and the drive to crush the workout, rushing through sets this quickly means you are likely skipping the 90-second rest periods, or moving the weight much faster than prescribed.<br><br><strong>Watch out for injuries.</strong> If you rush through your accessory movements and core holds, you lose out on crucial time-under-tension and risk straining a muscle. It might feel like a cheat code to get the workout done faster, but your joints won't thank you for it! Take your full rests, focus on form, and let the clock do its job.`;
  } else if (rushedNum > 15) {
    coachNote = `You're putting up solid volume and stringing together a great run of workouts! You are moving a bit faster than the rest of the house (averaging ${stats.avgSec} seconds per set), but your pacing is still well within a healthy range.<br><br>Our telemetry did flag that about ${stats.rushedRate}% of your sets are being completed in under 15 seconds. We usually see this when athletes speed through their core work or lighter accessory movements at the end of a session. Don't be afraid to take a breath! Taking your full rests on those movements ensures you keep your form tight and gives your muscles the time under tension they need to actually grow.`;
  } else if (stats.sessions < 5) {
    coachNote = `You are off to an incredibly disciplined start. In your first few sessions, you averaged about ${stats.avgSec} seconds per set, and our telemetry shows less than ${stats.rushedRate}% of your sets were rushed—crushing the house average of ${stats.houseRushedRate}%. That means you are respecting the rest timers and taking the program seriously right out of the gate.<br><br>One tip as you keep building momentum: Make sure you are using the <strong>"How Hard?"</strong> slider at the bottom of your sets! Rating a set as Hard (4) or Max (5) actually acts as a multiplier on your scoreboard volume, so don't leave those points on the table.`;
  } else {
    coachNote = `You are locked in. You are pacing right in line with the house average (about ${stats.avgSec} seconds per set), but our telemetry shows you have one of the lowest "rushed" set rates on the board at just ${stats.rushedRate}%. This means you are respecting the prescribed 90-second rest timers perfectly between your lifts while others are rushing.<br><br>This kind of disciplined time-under-tension and proper rest is exactly what builds sustainable strength and prevents injury. Keep holding the line. Your consistency is exactly what the program is built for.`;
  }

  const html = wrapEmailHtml({
    eyebrow: 'Performance',
    title: 'The numbers are in...',
    childrenHtml: `
      ${p(`Hey ${shortName},`)}
      ${p('Now that we have enough data running through the Work-It boards, we’re rolling out personalized performance scorecards to show you how you’re attacking the program.')}
      
      ${p('<strong style="color:#e8c547;">Your Stats</strong>')}
      ${bullets([
        `Sessions Completed: ${stats.sessions}`,
        `Average Effort Score: ${stats.avgHardness} / 5.0`,
        `Total Sets Logged: ${stats.totalSets}`
      ])}
      
      ${p('<strong style="color:#e8c547;">Vs. The House (Pacing)</strong>')}
      ${bullets([
        `Your Pace: ${stats.avgSec}s per set <em>(House Avg: ${stats.houseAvgSec}s)</em>`,
        `Your Rushed Sets: ${stats.rushedRate}% <em>(House Avg: ${stats.houseRushedRate}%)</em>`
      ])}
      
      ${p('<strong style="color:#e8c547;">Coach’s Note on Pacing</strong>')}
      ${p(coachNote)}
      
      ${p('Keep pushing the iron,<br>— The Work-It Team')}
      
      <div style="text-align:center; margin-top:32px;">
        ${cta(appUrl() + '/home', 'Go to Home')}
      </div>
    `,
  });

  const text = `Hey ${shortName},\n\nNow that we have enough data running through the Work-It boards, we’re rolling out personalized performance scorecards to show you how you’re attacking the program.\n\nYour Stats:\n- Sessions Completed: ${stats.sessions}\n- Average Effort Score: ${stats.avgHardness} / 5.0\n- Total Sets Logged: ${stats.totalSets}\n\nVs. The House (Pacing):\n- Your Pace: ${stats.avgSec}s per set (House Avg: ${stats.houseAvgSec}s)\n- Your Rushed Sets: ${stats.rushedRate}% (House Avg: ${stats.houseRushedRate}%)\n\nCoach’s Note on Pacing:\n${coachNote.replace(/<br>/g, '\n').replace(/<strong>|<\/strong>|<em>|<\/em>/g, '')}\n\nKeep pushing the iron,\n— The Work-It Team`;

  return { from: 'workit-info', subject, html, text };
}

async function getScorecardData() {
  const usersResult = await query(`SELECT id, name, email FROM users WHERE ${SQL_NOT_BLOCKED_USER} AND ${SQL_NOT_JOIN_DRAFT}`);
  const users = usersResult.rows || usersResult;

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
  
  const userStats: Record<number, any> = {};
  for (const u of (users as any[])) {
    userStats[u.id] = { totalTime: 0, setCount: 0, fastSets: 0, veryFastSets: 0, name: u.name, email: u.email, id: u.id };
  }

  for (const row of (timings.rows as any[])) {
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

    if (durationMs > 0 && durationMs < 15 * 60 * 1000) {
      const uId = row.user_id;
      
      if (userStats[uId]) {
        userStats[uId].totalTime += durationMs;
        userStats[uId].setCount++;
        
        // Exclude Test user (usually 'Test' or id 3) from house avg to avoid skewing
        if (uId !== 3 && userStats[uId].name.toLowerCase() !== 'test') {
          houseTotalTime += durationMs;
          houseSetCount++;
          if (durationMs < 15 * 1000) {
            houseFastSets++;
          }
        }
        
        if (durationMs < 45 * 1000) {
          userStats[uId].fastSets++;
        }
        if (durationMs < 15 * 1000) {
          userStats[uId].veryFastSets++;
        }
      }
    }
  }

  const houseAvgSec = houseSetCount > 0 ? (houseTotalTime / houseSetCount / 1000).toFixed(1) : '110.0';
  const houseRushedRate = houseSetCount > 0 ? ((houseFastSets / houseSetCount) * 100).toFixed(1) : '25.0';

  const otherStats = await query(`
    SELECT 
      ws.user_id,
      COUNT(DISTINCT ws.id) as sessions,
      AVG(es.hardness) as avg_hardness
    FROM workout_sessions ws
    JOIN exercise_sets es ON ws.id = es.workout_session_id
    WHERE ws.is_completed = 1 AND es.is_completed = 1
    GROUP BY ws.user_id
  `);

  const results: any[] = [];
  
  for (const u of users as any[]) {
    const stats = (otherStats.rows as any[]).find(s => s.user_id === u.id);
    const timing = userStats[u.id];
    
    // Only send to athletes with a meaningful amount of sets (e.g., > 10)
    if (!stats || !timing || timing.setCount < 10) continue;

    const avgSec = (timing.totalTime / timing.setCount / 1000).toFixed(1);
    const rushedRate = ((timing.veryFastSets / timing.setCount) * 100).toFixed(1);
    
    const avgHardnessNum = parseFloat(stats.avg_hardness || '3');
    // For users who skip hardness, it defaults to NULL in DB, but AVG ignores nulls. 
    // If it's NaN, default to 3.0
    const avgHardness = isNaN(avgHardnessNum) ? '3.0' : avgHardnessNum.toFixed(1);

    results.push({
      id: u.id,
      name: u.name,
      email: u.email,
      stats: {
        sessions: parseInt(stats.sessions, 10),
        totalSets: timing.setCount,
        avgHardness,
        avgSec,
        rushedRate,
        houseAvgSec,
        houseRushedRate
      }
    });
  }
  
  return results;
}

export async function buildLiveScorecardsPreview(): Promise<BuiltEmail> {
  const data = await getScorecardData();
  if (data.length === 0) {
    return buildScorecardEmail('Sample', {
      sessions: 20,
      totalSets: 300,
      avgHardness: '3.5',
      avgSec: '110.0',
      rushedRate: '15.0',
      houseAvgSec: '115.0',
      houseRushedRate: '25.0'
    });
  }
  // Return the first one for preview
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
