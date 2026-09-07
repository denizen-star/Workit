'use client';

import { useRef, useState } from 'react';

type Props = {
  label?: string;
  optional?: boolean;
  onChange: (dataUrl: string | null) => void;
};

export default function PhotoCropField({ label = 'Photo', optional, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [hasFile, setHasFile] = useState(false);

  const applyCrop = (scale: number, panX: number, panY: number) => {
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
    const data = canvas.toDataURL('image/jpeg', 0.82);
    setPreview(data);
    onChange(data);
  };

  const loadFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('bad image'));
      image.src = url;
    });
    URL.revokeObjectURL(url);
    imageRef.current = image;
    setHasFile(true);
    panRef.current = { x: 0, y: 0 };
    setZoom(1);
    applyCrop(1, 0, 0);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!hasFile) {
      inputRef.current?.click();
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !hasFile) return;
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
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/50">
        {label}
        {optional ? ' · optional' : ''}
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
            disabled={!hasFile}
            onChange={(event) => {
              const next = Number(event.target.value);
              setZoom(next);
              applyCrop(next, panRef.current.x, panRef.current.y);
            }}
            className="w-full"
          />
          <p className="mt-1 text-xs text-[#f6f1e3]/45">
            {hasFile ? 'Drag the photo to center it. Zoom in or out.' : 'Zoom in or out into the circle'}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs font-black text-[#e8c547]"
            >
              {hasFile ? 'Change' : 'Choose'}
            </button>
            {hasFile ? (
              <button
                type="button"
                onClick={() => {
                  panRef.current = { x: 0, y: 0 };
                  applyCrop(zoom, 0, 0);
                }}
                className="text-xs font-black text-[#f6f1e3]/70"
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
          if (!file) {
            imageRef.current = null;
            setHasFile(false);
            setPreview(null);
            onChange(null);
            return;
          }
          await loadFile(file);
        }}
      />
    </div>
  );
}
