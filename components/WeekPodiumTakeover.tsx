'use client';

import { useEffect, useRef } from 'react';
import WeekMedal from '@/components/WeekMedal';
import { placeWord, type WeekPlace } from '@/lib/weekPodium';

export default function WeekPodiumTakeover({
  open,
  place,
  line,
  onClose,
}: {
  open: boolean;
  place: WeekPlace;
  line: string;
  onClose: () => void;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

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
      className="fixed inset-0 z-[80] flex cursor-pointer items-center justify-center overflow-hidden bg-[#07070a]/95 px-6"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: place === 1 ? '#e8c547' : place === 2 ? '#c5c5c5' : '#c08457',
            opacity: 0.28,
          }}
        />
      </div>
      <div className="relative max-w-xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.45em] text-[#e8c547]">
          Last week · {placeWord(place)}
        </p>
        <div className="mb-6">
          <WeekMedal place={place} size="lg" />
        </div>
        <h2 className="get-to-it-text text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.45)] sm:text-5xl">
          {line}
        </h2>
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
