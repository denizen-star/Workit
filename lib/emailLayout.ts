const FONT = "Arial, Helvetica, sans-serif";
const GOLD = '#e8c547';
const INK = '#f6f1e3';
const MUTED = '#b9b1a0';
const BG = '#07070a';
const CARD = '#12121a';

const LIVE_APP_URL = 'https://workit.kervinapps.com';

export function appUrl() {
  // Do not read NEXT_PUBLIC_APP_URL. Next.js inlines those at build time, so a
  // later Netlify env fix never reaches already-deployed mail.
  const raw = (process.env.APP_URL || process.env.URL || LIVE_APP_URL).replace(/\/$/, '');
  if (/^https?:\/\/work-it\.kervinapps\.com$/i.test(raw)) return LIVE_APP_URL;
  return raw;
}

export function whoUrl() {
  return appUrl() + '/who';
}

export function esc(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function wrapEmailHtml(opts: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  childrenHtml: string;
  footer?: string;
  signer?: string;
}) {
  const signer = opts.signer ?? 'Master Tom Iron';
  const footer = opts.footer ?? 'Work-It · you answer to ' + signer;
  const titleBlock = opts.subtitle
    ? '<h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:800;color:#fff;">' +
      esc(opts.title) +
      '</h1>' +
      '<p style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:800;color:#fff;">' +
      esc(opts.subtitle) +
      '</p>'
    : '<h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:800;color:#fff;">' +
      esc(opts.title) +
      '</h1>';
  return (
    '<!DOCTYPE html><html><body style="margin:0;padding:0;background:' +
    BG +
    ';font-family:' +
    FONT +
    ';">' +
    '<div style="max-width:560px;margin:0 auto;padding:28px 16px;">' +
    '<div style="background:' +
    CARD +
    ';border:1px solid rgba(232,197,71,0.35);border-radius:16px;padding:22px 20px;">' +
    '<p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:' +
    GOLD +
    ';font-weight:700;">' +
    esc(opts.eyebrow) +
    '</p>' +
    titleBlock +
    opts.childrenHtml +
    '<p style="margin:20px 0 0;font-size:17px;font-weight:800;color:#e8c547;">' +
    esc(signer) +
    '</p>' +
    '<p style="margin:14px 0 0;font-size:12px;color:' +
    MUTED +
    ';">' +
    esc(footer) +
    '</p>' +
    '</div></div></body></html>'
  );
}

export function p(html: string) {
  return (
    '<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:' +
    INK +
    ';">' +
    html +
    '</p>'
  );
}

export function bullets(items: string[]) {
  const lis = items
    .map(
      (item) =>
        '<li style="margin:0 0 8px;font-size:15px;line-height:1.5;color:' +
        INK +
        ';">' +
        item +
        '</li>'
    )
    .join('');
  return '<ul style="margin:0 0 14px;padding-left:18px;">' + lis + '</ul>';
}

export function statRow(label: string, value: string) {
  return (
    '<tr>' +
    '<td style="padding:8px 0;font-size:13px;color:' +
    MUTED +
    ';border-bottom:1px solid rgba(255,255,255,0.08);">' +
    esc(label) +
    '</td>' +
    '<td style="padding:8px 0;font-size:15px;font-weight:800;color:#fff;text-align:right;border-bottom:1px solid rgba(255,255,255,0.08);">' +
    esc(value) +
    '</td>' +
    '</tr>'
  );
}

export function statsTable(rows: Array<[string, string]>) {
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse;">' +
    rows.map(([label, value]) => statRow(label, value)).join('') +
    '</table>'
  );
}

export function cta(href: string, label: string) {
  return (
    '<p style="margin:20px 0 8px;"><a href="' +
    esc(href) +
    '" style="display:inline-block;padding:14px 20px;background:' +
    GOLD +
    ';color:#1a1404;text-decoration:none;font-size:14px;font-weight:800;border-radius:8px;">' +
    esc(label) +
    '</a></p>'
  );
}

export function emailTextHeader(eyebrow: string, title: string) {
  return [eyebrow.toUpperCase(), title, ''].join('\n');
}

export function emailTextSignOff(signer = 'Master Tom Iron') {
  return '\n' + signer;
}

function stepNumber(n: number) {
  return (
    '<td valign="top" width="40" style="padding:0 12px 0 0;">' +
    '<div style="width:32px;height:32px;line-height:32px;text-align:center;background:#e8c547;color:#1a1404;font-size:16px;font-weight:800;border-radius:8px;">' +
    String(n) +
    '</div></td>'
  );
}

function shareGlyph() {
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 4px;border-collapse:collapse;">' +
    '<tr><td align="center" style="width:56px;padding:8px 10px;border:2px solid #e8c547;border-radius:12px;color:#e8c547;">' +
    '<div style="font-size:22px;font-weight:800;line-height:1;">↑</div>' +
    '<div style="margin-top:4px;width:22px;height:16px;border:2px solid #e8c547;border-top:0;margin-left:auto;margin-right:auto;font-size:1px;line-height:1;">&nbsp;</div>' +
    '</td></tr></table>'
  );
}

function homeScreenRow() {
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 4px;border-collapse:collapse;width:100%;max-width:280px;">' +
    '<tr>' +
    '<td width="36" align="center" style="padding:10px;border:1px solid rgba(232,197,71,0.35);border-right:0;border-radius:10px 0 0 10px;background:#07070a;color:#e8c547;font-size:20px;font-weight:800;">+</td>' +
    '<td style="padding:10px 12px;border:1px solid rgba(232,197,71,0.35);border-radius:0 10px 10px 0;background:#07070a;color:#fff;font-size:14px;font-weight:700;">Add to Home Screen</td>' +
    '</tr></table>'
  );
}

export function iosHomeScreenStepsHtml() {
  const steps: Array<{ title: string; body: string; extra?: string }> = [
    {
      title: 'Open it in Safari',
      body: 'Tap REPORT IN. If Mail tries to keep you inside the email, tap <strong style="color:#fff;">Open in Safari</strong>. Chrome does not count. Safari only.',
    },
    {
      title: 'Tap Share',
      body: 'iPhone: the square with the arrow up, bottom of Safari. iPad: same icon, top of the screen.',
      extra: shareGlyph(),
    },
    {
      title: 'Add to Home Screen',
      body: 'Scroll the share sheet. Tap Add to Home Screen. Then tap <strong style="color:#fff;">Add</strong> in the top right.',
      extra: homeScreenRow(),
    },
    {
      title: 'Open it from the home screen',
      body: 'Work-It sits there like a real app. That is how you report in from now on. Browser tabs are for people who go soft.',
    },
  ];

  const rows = steps
    .map((step, index) => {
      return (
        '<tr>' +
        stepNumber(index + 1) +
        '<td valign="top" style="padding:0 0 18px 0;">' +
        '<p style="margin:0 0 4px;font-size:16px;font-weight:800;color:#fff;">' +
        esc(step.title) +
        '</p>' +
        (step.extra || '') +
        '<p style="margin:0;font-size:14px;line-height:1.5;color:#f6f1e3;">' +
        step.body +
        '</p></td></tr>'
      );
    })
    .join('');

  return (
    '<p style="margin:22px 0 10px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#e8c547;font-weight:700;">Put it on the home screen</p>' +
    p('I want an app icon. Not a Safari tab. Follow this on your iPhone. No shortcuts. No excuses.') +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' +
    rows +
    '</table>'
  );
}

export function iosHomeScreenStepsText() {
  return [
    'PUT IT ON THE HOME SCREEN',
    'I want an app icon. Not a Safari tab. iPhone only. Safari only.',
    '',
    '1. Open it in Safari',
    '   Tap REPORT IN. If Mail keeps you inside the email, tap Open in Safari. Chrome does not count.',
    '',
    '2. Tap Share',
    '   The square with the arrow pointing up. iPhone: bottom of Safari. iPad: top of the screen.',
    '',
    '3. Add to Home Screen',
    '   Scroll the share sheet. Tap Add to Home Screen. Then tap Add in the top right.',
    '',
    '4. Open it from the home screen',
    '   Work-It sits there like a real app. That is how you report in from now on.',
  ].join('\n');
}
