"use client";

import { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: "info" | "success" | "danger";
}

export default function Modal({
  open,
  title,
  children,
  confirmLabel = "OK",
  cancelLabel,
  onConfirm,
  onCancel,
  variant = "info",
}: ModalProps) {
  if (!open) return null;

  const confirmClass =
    variant === "success"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : variant === "danger"
        ? "bg-rose-600 hover:bg-rose-700"
        : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={onCancel ?? onConfirm}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
          <div className="mt-3 text-slate-600 leading-relaxed">{children}</div>
          <div className="mt-6 flex justify-end gap-3">
            {cancelLabel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm ?? onCancel}
              className={`rounded-xl px-5 py-2.5 font-semibold text-white transition-colors ${confirmClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
