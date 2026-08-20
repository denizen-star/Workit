/**
 * Netlify scheduled function — 12:00 UTC (8am Eastern during EDT).
 * Hits /api/cron/mail with CRON_SECRET, same pattern as papamkt / hit-list.
 */
const SCHEDULE = '0 12 * * *';

export default async function handler() {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error('workit-mail-cron: CRON_SECRET missing');
    return new Response('CRON_SECRET missing', { status: 500 });
  }

  const base = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    'https://workit.kervinapps.com'
  ).replace(/\/$/, '');

  const url = base + '/api/cron/mail';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + secret,
      'Content-Type': 'application/json',
    },
  });
  const text = await res.text();
  console.log('workit-mail-cron: ' + res.status + ' ' + text.slice(0, 500));
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const config = {
  schedule: SCHEDULE,
};
