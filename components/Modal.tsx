"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmDisabled?: boolean;
  variant?: "info" | "success" | "danger";
  /** Saving: both buttons and the backdrop stop responding, confirm shows a spinner + `busyLabel`. */
  busy?: boolean;
  busyLabel?: string;
}

export default function Modal({
  open,
  title,
  children,
  confirmLabel = "OK",
  cancelLabel,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  variant = "info",
  busy = false,
  busyLabel,
}: ModalProps) {
  if (!open) return null;

  const confirmClass =
    variant === "success"
      ? "bg-white text-black hover:bg-gray-200"
      : variant === "danger"
        ? "bg-rose-500 text-white hover:bg-rose-400"
        : "bg-white text-black hover:bg-gray-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={busy ? undefined : onCancel ?? onConfirm}
      />
      <div className="glass-card relative w-full max-w-md overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-white/40 via-white to-white/80" />
        <div className="p-6">
          <h2 className="text-2xl font-black tracking-tight text-white">{title}</h2>
          <div className="mt-3 leading-relaxed text-[#f6f1e3]/80">{children}</div>
          <div className="mt-6 flex justify-end gap-3">
            {cancelLabel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="min-h-12 rounded-2xl px-4 py-2.5 font-semibold text-[#f6f1e3]/80 hover:bg-white/5 disabled:opacity-40"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              disabled={confirmDisabled || busy}
              aria-busy={busy}
              onClick={onConfirm ?? onCancel}
              className={`min-h-12 rounded-2xl px-5 py-2.5 font-black transition-colors disabled:cursor-not-allowed ${
                busy ? "inline-flex items-center gap-2" : "disabled:opacity-40"
              } ${confirmClass}`}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {busyLabel || confirmLabel}
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
