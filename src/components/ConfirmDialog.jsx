import React, { useEffect } from "react";
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
  // prevent background scroll when dialog is open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  if (!open) return null;

  const toneClasses =
    tone === "danger"
      ? "bg-red-500 hover:bg-red-600 focus:ring-red-400"
      : "bg-neutral-700 hover:bg-neutral-600 focus:ring-neutral-400";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative z-[61] w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-2xl animate-fadeIn">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-300" />
          </div>
          <div className="flex-1">
            <h3 id="confirm-title" className="text-lg font-semibold text-white">
              {title}
            </h3>
            <p
              id="confirm-description"
              className="mt-1 text-sm text-neutral-300"
            >
              {description}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors duration-150"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 transition-colors duration-150"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 ${toneClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
