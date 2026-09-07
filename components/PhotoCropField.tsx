'use client';

import { useEffect, useRef, useState } from 'react';
import { HelpTip } from '@/components/HelpSheet';

type Props = {
  label?: string;
  optional?: boolean;
  initialSrc?: string | null;
  onChange: (dataUrl: string | null) => void;
};

export default function PhotoCropField({ label = 'Photo', optional, initialSrc, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const zoomRef = useRef(1);
  const [preview, setPreview] = useState<string | null>(initialSrc || null);
  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false);

  const applyCrop = (scale: number, panX: number, panY: number, emit = true) => {
    const image = imageRef.current;
    if (!image) return;
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const min = Math.min(image.width, image.height);
    const draw = min / scale;
    const leftoverX = Math.max(0, image.width - draw);
    const leftoverY = Math.max(0, image.height - draw);
    const sx = leftoverX * (0.5 + panX * 0.5);
    const sy = leftoverY * (0.5 + panY * 0.5);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, sx, sy, draw, draw, 0, 0, size, size);
    const data = canvas.toDataURL('image/jpeg', 0.78);
    setPreview(data);
    if (emit) onChange(data);
  };

  const loadFromSrc = async (src: string, emit: boolean) => {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('bad image'));
      image.src = src;
    });
    imageRef.current = image;
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    setZoom(1);
    setReady(true);
    if (emit) applyCrop(1, 0, 0, true);
    else setPreview(src);
  };

  useEffect(() => {
    imageRef.current = null;
    panRef.current = { x: 0, y: 0 };
    dragRef.current = null;
    zoomRef.current = 1;
    setZoom(1);
    setReady(false);
    setPreview(initialSrc || null);
    onChange(null);
    if (!initialSrc) return;
    loadFromSrc(initialSrc, false).catch(() => {
      setPreview(initialSrc);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSrc]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!ready) {
      inputRef.current?.click();
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !ready) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    const next = {
      x: Math.max(-1, Math.min(1, panRef.current.x - dx / 48)),
      y: Math.max(-1, Math.min(1, panRef.current.y - dy / 48)),
    };
    panRef.current = next;
    applyCrop(zoomRef.current, next.x, next.y);
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div>
      <p className="mb-2 flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/50">
        {label}
        {optional ? ' · optional' : ''}
        <HelpTip
          label="Photo help"
          title="Photo"
          lead="Drag the circle to move the picture. Slide zoom if you need it tighter."
          bullets={['Tap Change to pick a picture', 'Drag the circle to move it']}
        />
      </p>
      <div className="flex items-center gap-4">
        <div
          role="button"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
          }}
          className="flex h-28 w-28 shrink-0 cursor-grab touch-none items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/40 active:cursor-grabbing"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="pointer-events-none h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-[#f6f1e3]/40">Add</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="min-h-11 rounded-2xl bg-[#e8c547] px-4 text-sm font-black text-[#1a1404]"
        >
          {preview ? 'Change' : 'Choose'}
        </button>
      </div>
      <input
        type="range"
        min={1}
        max={2.4}
        step={0.02}
        value={zoom}
        disabled={!ready}
        onChange={(event) => {
          const next = Number(event.target.value);
          zoomRef.current = next;
          setZoom(next);
          applyCrop(next, panRef.current.x, panRef.current.y);
        }}
        className="mt-4 h-11 w-full accent-[#e8c547] disabled:opacity-40"
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          const url = URL.createObjectURL(file);
          try {
            await loadFromSrc(url, true);
          } finally {
            URL.revokeObjectURL(url);
          }
        }}
      />
    </div>
  );
}
