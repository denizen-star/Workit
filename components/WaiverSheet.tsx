'use client';

import { createPortal } from 'react-dom';
import { WAIVER_TEXT, WAIVER_TITLE } from '@/lib/waiver';

export default function WaiverSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#12121a]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-black text-white">{WAIVER_TITLE}</h2>
          <button type="button" onClick={onClose} className="text-sm font-bold text-[#e8c547]">
            Close
          </button>
        </div>
        <pre className="max-h-[70vh] overflow-y-auto whitespace-pre-wrap px-5 py-4 text-xs leading-relaxed text-[#f6f1e3]/80">
          {WAIVER_TEXT}
        </pre>
      </div>
    </div>,
    document.body
  );
}
