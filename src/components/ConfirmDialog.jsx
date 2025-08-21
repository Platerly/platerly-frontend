import React from "react";
import { X, AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "danger", // "danger" | "neutral"
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const toneClasses =
    tone === "danger"
      ? "bg-red-500 hover:bg-red-600 focus:ring-red-400"
      : "bg-neutral-700 hover:bg-neutral-600 focus:ring-neutral-400";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative z-[61] w-[92%] max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <AlertTriangle className="h-5 w-5 text-yellow-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-neutral-300">{description}</p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring ${toneClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
