/**
 * Netlify scheduled function — the nightly onboarding report to Kevin at 8pm Eastern.
 * Netlify schedules are UTC, so this fires at 00:00 UTC (8pm EDT) and 01:00 UTC (8pm EST);
 * /api/cron/mail?task=onboarding only sends when it's 20:00 in New York, and dedupes per day.
 */
const SCHEDULE = '0 0,1 * * *';

export default async function handler() {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error('workit-onboarding-cron: CRON_SECRET missing');
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

  const res = await fetch(base + '/api/cron/mail?task=onboarding', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + secret,
      'Content-Type': 'application/json',
    },
  });
  const text = await res.text();
  console.log('workit-onboarding-cron: ' + res.status + ' ' + text.slice(0, 500));
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = {
  schedule: SCHEDULE,
};
