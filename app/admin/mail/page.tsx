'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type MailTemplateId } from '@/lib/emails/ids';

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
  verify: 'Verify email',
  invite: 'Invite',
  pin_reset: 'PIN reset',
  nudge: 'Get to it',
  resume: 'Finish it',
  complete: 'Workout recap',
  week: 'Week locked',
  program: 'Program complete',
  badge: 'Badge',
  belt: 'Diploma',
  scoreboard: 'Scoreboard',
  release: "What's new",
  scorecard: 'Scorecard',
  schedule_days_ask: 'Days per week check-in',
  onboarding: 'Onboarding report',
};

export default function AdminMailPage() {
  const router = useRouter();
  const [template, setTemplate] = useState<MailTemplateId>('welcome');
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (next: MailTemplateId) => {
    const response = await fetch('/api/admin/mail?template=' + next + ((next === 'scoreboard' || next === 'onboarding' || next === 'scorecard') ? '&live=1' : ''));
    if (response.status === 401 || response.status === 403) {
      router.replace('/home');
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
            : body.action === 'onboarding'
              ? data.result?.sent
                ? 'Onboarding report sent'
                : 'Onboarding report not sent (' + (data.result?.skipped || 'SMTP') + ')'
            : body.action === 'scorecards'
              ? data.result?.sent
                ? 'Scorecards sent to ' + data.result?.count + ' athletes'
                : 'Scorecards not sent (' + (data.result?.skipped || 'SMTP') + ')'
              : 'Sample sent to ' + data.to
      );
    } catch {
      setStatus('Send failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#e8c547]">Mailing suite</p>
        <h2 className="mt-1 text-3xl font-black text-white">Preview and send</h2>
        <p className="mt-2 text-sm text-[#f6f1e3]/60">
          SMTP {preview?.enabled ? 'is on' : 'is off or not loaded'}. Samples go to {preview?.adminEmail || 'your profile email'}.
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
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
          <button
            type="button"
            disabled={busy}
            onClick={() => post({ action: 'onboarding' })}
            className="min-h-11 rounded-2xl border border-white/10 px-4 font-semibold text-[#f6f1e3]/85 disabled:opacity-50"
          >
            Send onboarding report
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => post({ action: 'scorecards' })}
            className="min-h-11 rounded-2xl border border-white/10 px-4 font-semibold text-[#f6f1e3]/85 disabled:opacity-50"
          >
            Send Pacing
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <label className="w-full max-w-sm">
            <span className="mb-2 block text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-[#e8c547]">
              Email template
            </span>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as MailTemplateId)}
              aria-label="Email template"
              className="min-h-11 w-full rounded-2xl border border-white/10 bg-[#12121a] px-4 py-2 text-sm font-semibold text-[#f6f1e3] outline-none focus:border-[#e8c547]"
            >
            <optgroup label="Onboarding & Auth">
              <option value="welcome">{LABELS.welcome}</option>
              <option value="verify">{LABELS.verify}</option>
              <option value="invite">{LABELS.invite}</option>
              <option value="pin_reset">{LABELS.pin_reset}</option>
            </optgroup>
            <optgroup label="Active Workouts">
              <option value="nudge">{LABELS.nudge}</option>
              <option value="resume">{LABELS.resume}</option>
              <option value="complete">{LABELS.complete}</option>
            </optgroup>
            <optgroup label="Achievements">
              <option value="week">{LABELS.week}</option>
              <option value="program">{LABELS.program}</option>
              <option value="badge">{LABELS.badge}</option>
              <option value="belt">{LABELS.belt}</option>
            </optgroup>
            <optgroup label="Reports & Broadcasts">
              <option value="scoreboard">{LABELS.scoreboard}</option>
              <option value="scorecard">{LABELS.scorecard}</option>
              <option value="schedule_days_ask">{LABELS.schedule_days_ask}</option>
              <option value="onboarding">{LABELS.onboarding}</option>
              <option value="release">{LABELS.release}</option>
            </optgroup>
          </select>
          </label>
        </div>

        {status && <p className="mt-4 text-center text-sm font-semibold text-[#e8c547]">{status}</p>}

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
  );
}
