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
    setZoom(1);
    setReady(true);
    if (emit) applyCrop(1, 0, 0, true);
    else setPreview(src);
  };

  useEffect(() => {
    imageRef.current = null;
    panRef.current = { x: 0, y: 0 };
    dragRef.current = null;
    setZoom(1);
    setReady(false);
    setPreview(initialSrc || null);
    onChange(null);
    if (!initialSrc) return;
    loadFromSrc(initialSrc, false).catch(() => {
      setPreview(initialSrc);
    });
    // Reset when the saved photo URL changes. onChange is stable enough for this field.
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
      x: Math.max(-1, Math.min(1, panRef.current.x - dx / 80)),
      y: Math.max(-1, Math.min(1, panRef.current.y - dy / 80)),
    };
    panRef.current = next;
    applyCrop(zoom, next.x, next.y);
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
          lead="Drag the circle to move the face. Use the slider to zoom. Center puts it back in the middle."
          bullets={[
            'Tap Choose or Change to pick a picture',
            'Drag inside the circle to slide the photo',
            'Center resets the crop. It is always on.',
          ]}
        />
      </p>
      <div className="flex items-center gap-3">
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
          className="flex h-20 w-20 shrink-0 cursor-grab touch-none items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/40 active:cursor-grabbing"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="pointer-events-none h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-[#f6f1e3]/40">Add</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={1}
            max={2.4}
            step={0.05}
            value={zoom}
            disabled={!ready}
            onChange={(event) => {
              const next = Number(event.target.value);
              setZoom(next);
              applyCrop(next, panRef.current.x, panRef.current.y);
            }}
            className="w-full"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="min-h-9 rounded-xl bg-[#e8c547] px-3 text-xs font-black text-[#1a1404]"
            >
              {preview ? 'Change' : 'Choose'}
            </button>
            {ready ? (
              <button
                type="button"
                onClick={() => {
                  panRef.current = { x: 0, y: 0 };
                  applyCrop(zoom, 0, 0);
                }}
                className="min-h-9 rounded-xl border border-[#e8c547]/60 px-3 text-xs font-black text-[#e8c547]"
              >
                Center
              </button>
            ) : null}
          </div>
        </div>
      </div>
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
