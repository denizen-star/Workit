/**
 * Netlify scheduled function — workout reminder pushes (docs/plans/PLAN_PUSH_REMINDERS.md).
 * Every 15 minutes, so reminder times come in 15-minute steps. /api/cron/mail?task=push
 * sends whoever's chosen time passed in the last hour, once per local day.
 */
const SCHEDULE = '*/15 * * * *';

export default async function handler() {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error('workit-push-cron: CRON_SECRET missing');
    return new Response('CRON_SECRET missing', { status: 500 });
  }

  const base = (
    process.env.APP_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    'https://workit.kervinapps.com'
  )
    .replace(/\/$/, '')
    .replace(/^https?:\/\/work-it\.kervinapps\.com$/i, 'https://workit.kervinapps.com');

  const res = await fetch(base + '/api/cron/mail?task=push', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + secret,
      'Content-Type': 'application/json',
    },
  });
  const text = await res.text();
  console.log('workit-push-cron: ' + res.status + ' ' + text.slice(0, 500));
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = {
  schedule: SCHEDULE,
};
