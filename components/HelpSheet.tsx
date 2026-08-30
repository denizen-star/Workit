'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp } from 'lucide-react';

/** Always-available help. Gold Got it. Same overlay family as invite. */
export default function HelpSheet({
  open,
  title,
  lead,
  bullets,
  body,
  onClose,
}: {
  open: boolean;
  title: string;
  lead?: string;
  bullets?: readonly string[];
  body?: ReactNode;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !mounted) return null;

  const sheet = (
    <div className="fixed inset-0 z-[300] flex items-stretch justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative flex h-full min-h-0 w-full max-w-md flex-col bg-[#12121a] sm:h-auto sm:max-h-[min(88dvh,560px)] sm:rounded-3xl sm:border sm:border-white/10 sm:shadow-2xl">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <h2 className="mb-4 text-2xl font-black text-white">{title}</h2>
          {lead ? <p className="mb-4 text-base leading-relaxed text-[#f6f1e3]/80">{lead}</p> : null}
          {bullets && bullets.length > 0 ? (
            <ul className="list-disc space-y-2.5 pl-5 text-base leading-relaxed text-[#f6f1e3]/80 marker:text-[#e8c547]">
              {bullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {body}
        </div>
        <div className="flex shrink-0 border-t border-white/10 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 w-full rounded-2xl bg-[#e8c547] font-black text-[#1a1404]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

export function HelpTrigger({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-11 min-w-11 items-center justify-center text-[#e8c547]"
    >
      <CircleHelp className="h-5 w-5" strokeWidth={2.25} />
    </button>
  );
}

/** Live card How. Same ? as /who. */
export function HowTrigger({ onClick }: { onClick: () => void }) {
  return <HelpTrigger label="How" onClick={onClick} />;
}
