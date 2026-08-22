'use client';

import { useEffect, useRef } from 'react';

interface SetProgressFlashProps {
  open: boolean;
  title: string;
  body: string;
  variant: 'up' | 'down';
  onClose: () => void;
}

const DISMISS_MS = 5000;

export default function SetProgressFlash({
  open,
  title,
  body,
  variant,
  onClose,
}: SetProgressFlashProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    try {
      navigator.vibrate?.(variant === 'up' ? [80, 40, 160] : [200, 80, 200]);
    } catch {
      // Ignore missing vibration support.
    }

    const timeout = window.setTimeout(() => onCloseRef.current(), DISMISS_MS);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, variant]);

  if (!open) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
          onClose();
        }
      }}
      className="fixed inset-0 z-[90] flex cursor-pointer items-center justify-center overflow-hidden px-6"
      style={{
        background:
          'linear-gradient(180deg, rgba(232, 197, 71, 0.55), rgba(232, 197, 71, 0.28) 55%, rgba(232, 197, 71, 0.4))',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-[#e8c547]/50 blur-3xl" />
        <div className="absolute bottom-10 right-8 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
      </div>
      <div className="relative max-w-xl text-center">
        <h2
          className={`get-to-it-text text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl ${
            variant === 'up' ? 'text-[#22c55e]' : 'text-[#ff1a1a]'
          }`}
          style={{
            textShadow:
              variant === 'up'
                ? '0 0 28px rgba(34, 197, 94, 0.55)'
                : '0 0 28px rgba(255, 26, 26, 0.55)',
          }}
        >
          {title}
        </h2>
        <p
          className={`mt-6 text-2xl font-black leading-tight sm:text-4xl ${
            variant === 'up' ? 'text-[#16a34a]' : 'text-[#ff2a2a]'
          }`}
        >
          {body}
        </p>
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.25em] text-[#1a1404]/70">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
