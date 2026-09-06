'use client';

import { useRef, useState } from 'react';

type Props = {
  label?: string;
  optional?: boolean;
  onChange: (dataUrl: string | null) => void;
};

export default function PhotoCropField({ label = 'Photo', optional, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const crop = async (file: File, scale: number) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('bad image'));
      image.src = url;
    });
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const min = Math.min(image.width, image.height);
    const draw = min / scale;
    const sx = (image.width - draw) / 2;
    const sy = (image.height - draw) / 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, sx, sy, draw, draw, 0, 0, size, size);
    URL.revokeObjectURL(url);
    const data = canvas.toDataURL('image/jpeg', 0.82);
    setPreview(data);
    onChange(data);
  };

  return (
    <div>
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#f6f1e3]/50">
        {label}
        {optional ? ' · optional' : ''}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-20 w-20 overflow-hidden rounded-full border border-white/15 bg-black/40"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-[#f6f1e3]/40">Add</span>
          )}
        </button>
        <div className="flex-1">
          <input
            type="range"
            min={1}
            max={2.4}
            step={0.05}
            value={zoom}
            disabled={!inputRef.current?.files?.[0] && !preview}
            onChange={async (event) => {
              const file = inputRef.current?.files?.[0];
              const next = Number(event.target.value);
              setZoom(next);
              if (file) await crop(file, next);
            }}
            className="w-full"
          />
          <p className="mt-1 text-xs text-[#f6f1e3]/45">Zoom in or out into the circle</p>
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
            setPreview(null);
            onChange(null);
            return;
          }
          setZoom(1);
          await crop(file, 1);
        }}
      />
    </div>
  );
}
