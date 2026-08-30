import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireAdmin } from '@/lib/auth';
import { isEmailEnabled, defaultFrom } from '@/lib/mailClient';
import { sendNow } from '@/lib/emails/send';
import { sampleEmail } from '@/lib/emails/templates';
import { MAIL_TEMPLATES, type MailTemplateId } from '@/lib/emails/ids';
import { sendDailyNudges } from '@/lib/emails/nudge';
import { sendScoreboardEmail, buildLiveScoreboard } from '@/lib/emails/scoreboard';
import { trackServerEvent } from '@/lib/trackServerEvent';

function isTemplate(value: string): value is MailTemplateId {
  return (MAIL_TEMPLATES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const templateParam = request.nextUrl.searchParams.get('template') || 'welcome';
    const live = request.nextUrl.searchParams.get('live') === '1';

    if (!isTemplate(templateParam)) {
      return NextResponse.json({ error: 'Unknown template' }, { status: 400 });
    }

    const email =
      templateParam === 'scoreboard' && live
        ? await buildLiveScoreboard()
        : sampleEmail(templateParam);

    void trackServerEvent({
      eventType: 'admin_mail',
      pageCategory: 'admin-mail',
      ctaType: 'preview',
      articleSlug: templateParam,
    });

    return NextResponse.json({
      enabled: isEmailEnabled(),
      from: defaultFrom(),
      adminEmail: admin.email,
      templates: MAIL_TEMPLATES,
      template: templateParam,
      email,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[admin/mail] preview failed', error);
    return NextResponse.json({ error: 'Failed to load preview' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const action = String(body.action || 'sample');

    if (action === 'nudge') {
      const results = await sendDailyNudges();
      void trackServerEvent({
        eventType: 'admin_mail',
        pageCategory: 'admin-mail',
        ctaType: 'nudge',
      });
      return NextResponse.json({ ok: true, results });
    }

    if (action === 'scoreboard') {
      const result = await sendScoreboardEmail({ force: true });
      void trackServerEvent({
        eventType: 'admin_mail',
        pageCategory: 'admin-mail',
        ctaType: 'scoreboard',
      });
      return NextResponse.json({ ok: true, result });
    }

    const template = String(body.template || 'welcome');
    if (!isTemplate(template)) {
      return NextResponse.json({ error: 'Unknown template' }, { status: 400 });
    }

    const to = String(body.to || admin.email || '').trim();
    if (!to) {
      return NextResponse.json({ error: 'No destination email' }, { status: 400 });
    }

    const email = sampleEmail(template);
    const id = await sendNow(to, email, {
      userId: admin.id,
      athleteName: admin.name,
      template,
    });
    if (!id) {
      return NextResponse.json({ error: 'Send failed — check SMTP' }, { status: 500 });
    }
    void trackServerEvent({
      eventType: 'admin_mail',
      pageCategory: 'admin-mail',
      ctaType: 'sample',
      articleSlug: template,
    });
    return NextResponse.json({ ok: true, id, to, subject: email.subject });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[admin/mail] send failed', error);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
