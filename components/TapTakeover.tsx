'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const CLOSE_KEYS = ['Escape', 'Enter', ' '];

/**
 * Full-screen "tap anywhere to continue" shell shared by the week, recap, complete and
 * awards takeovers: dark overlay, a soft glow in the moment's color, and a tap or
 * Escape / Enter / Space on it to close. Each takeover supplies its own content.
 */
export default function TapTakeover({
  onClose,
  glow,
  glowOpacity = 0.28,
  secondGlow = false,
  scroll = false,
  closeOnWindowKeys = false,
  children,
}: {
  onClose: () => void;
  /** Glow color behind the content. */
  glow: string;
  glowOpacity?: number;
  /** Adds the faint white glow bottom-right (the finish screens). */
  secondGlow?: boolean;
  /** Content taller than the screen scrolls (Awards) instead of clipping. */
  scroll?: boolean;
  /** Also close on those keys anywhere on the page, not only while the overlay has focus. */
  closeOnWindowKeys?: boolean;
  children: ReactNode;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!closeOnWindowKeys) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (CLOSE_KEYS.includes(event.key)) onCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeOnWindowKeys]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(event) => {
        if (CLOSE_KEYS.includes(event.key)) onClose();
      }}
      className={`fixed inset-0 z-[80] flex cursor-pointer items-center justify-center bg-[#07070a]/95 px-6 ${
        scroll ? 'overflow-y-auto py-10' : 'overflow-hidden'
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: glow, opacity: glowOpacity }}
        />
        {secondGlow ? <div className="absolute bottom-10 right-8 h-64 w-64 rounded-full bg-white/15 blur-3xl" /> : null}
      </div>
      {children}
    </div>
  );
}
