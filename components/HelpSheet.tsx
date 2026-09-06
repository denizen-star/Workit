'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp } from 'lucide-react';

type HelpBody = {
  title: string;
  lead?: string;
  bullets?: readonly string[];
  body?: ReactNode;
};

function HelpCopy({ title, lead, bullets, body }: HelpBody) {
  return (
    <>
      <p className="text-sm font-black text-white">{title}</p>
      {lead ? <p className="mt-1.5 text-sm leading-relaxed text-[#f6f1e3]/80">{lead}</p> : null}
      {bullets && bullets.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-[#f6f1e3]/80 marker:text-[#e8c547]">
          {bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {body ? <div className="mt-2 text-sm leading-relaxed text-[#f6f1e3]/80">{body}</div> : null}
    </>
  );
}

let closeOpenTip: (() => void) | null = null;

/** Gold ? that opens a tooltip box. Not a full-screen sheet. */
export function HelpTip({
  label,
  title,
  lead,
  bullets,
  body,
  align = 'start',
}: HelpBody & {
  label: string;
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeTip = () => setOpen(false);
    closeOpenTip = closeTip;
    const place = () => {
      const button = rootRef.current?.querySelector('button');
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const width = Math.min(296, window.innerWidth - 16);
      let left = align === 'end' ? rect.right - width : rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      let top = rect.bottom + 6;
      const height = boxRef.current?.offsetHeight || 0;
      if (height && top + height > window.innerHeight - 8) {
        top = Math.max(8, rect.top - height - 6);
      }
      setPos({ top, left, width });
    };
    place();
    const frame = requestAnimationFrame(place);
    const onDoc = (event: MouseEvent) => {
      const node = event.target as Node;
      if (rootRef.current?.contains(node) || boxRef.current?.contains(node)) return;
      closeTip();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTip();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      if (closeOpenTip === closeTip) closeOpenTip = null;
    };
  }, [open, align]);

  return (
    <span ref={rootRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const rect = event.currentTarget.getBoundingClientRect();
          const width = Math.min(296, window.innerWidth - 16);
          let left = align === 'end' ? rect.right - width : rect.left;
          left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
          setPos({ top: rect.bottom + 6, left, width });
          setOpen((current) => {
            const next = !current;
            if (next) closeOpenTip?.();
            return next;
          });
        }}
        className="inline-flex h-11 min-w-11 items-center justify-center text-[#e8c547]"
      >
        <CircleHelp className="h-5 w-5" strokeWidth={2.25} />
      </button>
      {open && pos
        ? createPortal(
            <div
              ref={boxRef}
              role="tooltip"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
              className="fixed z-[320] rounded-2xl border border-white/15 bg-[#16161f] px-3.5 py-3 shadow-2xl"
            >
              <HelpCopy title={title} lead={lead} bullets={bullets} body={body} />
            </div>,
            document.body
          )
        : null}
    </span>
  );
}

/** @deprecated Use HelpTip. Kept for any leftover sheet callers — small box, not a takeover. */
export default function HelpSheet({
  open,
  title,
  lead,
  bullets,
  body,
  onClose,
}: HelpBody & {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center px-4 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#16161f] px-3.5 py-3 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <HelpCopy title={title} lead={lead} bullets={bullets} body={body} />
      </div>
    </div>
  );
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
export function HowTrigger({ notes }: { notes: string }) {
  return <HelpTip label="How" title="How" lead={notes} />;
}
