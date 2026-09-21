import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';
import { defaultFrom, sendEmail } from '../lib/mailClient';

async function kevinTo() {
  const env = (process.env.WORKIT_SCOREBOARD_TO || '').trim();
  if (env) return env.split(',')[0].trim();
  const rows = await query(`SELECT email FROM users WHERE id = 1 AND email IS NOT NULL LIMIT 1`);
  const email = String((rows.rows[0] as { email?: string } | undefined)?.email || '').trim();
  return email || 'leacock.kervin@gmail.com';
}

async function main() {
  const htmlPath = join(process.cwd(), 'docs/samples/kpi-reorg.html');
  const sample = readFileSync(htmlPath, 'utf8');
  const to = await kevinTo();
  const id = await sendEmail({
    to,
    from: defaultFrom('Master Tom Iron'),
    subject: 'Work-It · four KPI sample (Kevin only)',
    text: [
      'Kevin.',
      '',
      'The four-KPI sample. Open the attached HTML in a browser.',
      'Home: new strip first, then trophies, lock, More load, Daily weight.',
      'Your performance: Current, Progress, Filter (period / workout / set / exercise).',
      'The house: Weight, Reps, Volume Load, Effective Load.',
      '',
      'Nobody else on this letter.',
      '',
      'Master Tom Iron',
    ].join('\n'),
    html: `<p>Kevin.</p>
<p>The four-KPI sample. Open the attached HTML in a browser.</p>
<p>Home: new strip first, then trophies, lock, More load, Daily weight.</p>
<p>Your performance: Current, Progress, Filter (period / workout / set / exercise).</p>
<p>The house: Weight, Reps, Volume Load, Effective Load.</p>
<p>Nobody else on this letter.</p>
<p>Master Tom Iron</p>`,
    attachments: [
      {
        filename: 'kpi-reorg.html',
        content: sample,
        contentType: 'text/html',
      },
    ],
    archive: { userId: 1, athleteName: 'Kevin', template: 'kpi_sample' },
  });
  if (!id) {
    console.error('Send failed');
    process.exit(1);
  }
  console.log('Sent to', to, id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
