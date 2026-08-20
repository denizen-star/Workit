'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MAIL_TEMPLATES, type MailTemplateId } from '@/lib/emails/ids';

type PreviewResponse = {
  enabled: boolean;
  from: string;
  adminEmail: string | null;
  templates: MailTemplateId[];
  template: MailTemplateId;
  email: { from: string; subject: string; html: string; text: string };
};

const LABELS: Record<MailTemplateId, string> = {
  welcome: 'Welcome',
  nudge: 'Get to it',
  resume: 'Finish it',
  complete: 'Workout recap',
  week: 'Week locked',
  program: 'Program complete',
  badge: 'Badge',
  scoreboard: 'Scoreboard',
  release: "What's new",
};

export default function AdminMailPage() {
  const router = useRouter();
  const [template, setTemplate] = useState<MailTemplateId>('welcome');
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (next: MailTemplateId) => {
    const response = await fetch('/api/admin/mail?template=' + next + (next === 'scoreboard' ? '&live=1' : ''));
    if (response.status === 401 || response.status === 403) {
      router.replace('/');
      return;
    }
    if (!response.ok) {
      setStatus('Could not load preview');
      return;
    }
    setPreview(await response.json());
  };

  useEffect(() => {
    load(template);
  }, [template]);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch('/api/admin/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error || 'Send failed');
        return;
      }
      setStatus(
        body.action === 'nudge'
          ? 'Nudges ran'
          : body.action === 'scoreboard'
            ? 'Scoreboard sent'
            : 'Sample sent to ' + data.to
      );
    } catch {
      setStatus('Send failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="glass-header">
        <div className="container mx-auto px-4 py-4">
          <div className="relative flex min-h-11 items-center">
            <Link
              href="/admin"
              className="relative z-10 flex min-h-11 shrink-0 items-center gap-2 text-[#f6f1e3]/75 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm sm:text-base">Admin</span>
            </Link>
            <h1 className="pointer-events-none absolute inset-x-0 text-center text-lg font-black whitespace-nowrap text-[#f5d76e] sm:text-2xl">
              Mail
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">Mailing suite</p>
        <h2 className="mt-1 text-3xl font-black text-white">Preview and send</h2>
        <p className="mt-2 text-sm text-[#f6f1e3]/60">
          SMTP {preview?.enabled ? 'is on' : 'is off or not loaded'}. Samples go to {preview?.adminEmail || 'your profile email'}.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {MAIL_TEMPLATES.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTemplate(id)}
              className={
                'min-h-10 rounded-2xl px-3 text-sm font-semibold ' +
                (template === id
                  ? 'bg-[#e8c547] text-[#1a1404]'
                  : 'border border-white/10 text-[#f6f1e3]/80')
              }
            >
              {LABELS[id]}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => post({ action: 'sample', template })}
            className="min-h-11 rounded-2xl bg-[#e8c547] px-4 font-black text-[#1a1404] disabled:opacity-50"
          >
            Send this sample
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => post({ action: 'nudge' })}
            className="min-h-11 rounded-2xl border border-white/10 px-4 font-semibold text-[#f6f1e3]/85 disabled:opacity-50"
          >
            Run today&apos;s nudges
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => post({ action: 'scoreboard' })}
            className="min-h-11 rounded-2xl border border-white/10 px-4 font-semibold text-[#f6f1e3]/85 disabled:opacity-50"
          >
            Send live scoreboard
          </button>
        </div>

        {status && <p className="mt-4 text-sm font-semibold text-[#e8c547]">{status}</p>}

        {preview && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]">
            <div className="space-y-1 border-b border-white/10 px-4 py-3 text-sm text-[#f6f1e3]/70">
              <p>
                <span className="text-[#e8c547]">From:</span> {preview.email.from}
              </p>
              <p>
                <span className="text-[#e8c547]">Subject:</span> {preview.email.subject}
              </p>
            </div>
            <iframe
              title="Email preview"
              className="h-[720px] w-full bg-[#07070a]"
              srcDoc={preview.email.html}
            />
          </div>
        )}
      </div>
    </div>
  );
}
