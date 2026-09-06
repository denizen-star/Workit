import { WAIVER_TEXT, WAIVER_TITLE } from '@/lib/waiver';

export default function WaiverPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#e8c547]/80">Work-It</p>
      <h1 className="mt-2 text-3xl font-black text-white">{WAIVER_TITLE}</h1>
      <pre className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-[#f6f1e3]/80">{WAIVER_TEXT}</pre>
    </main>
  );
}
