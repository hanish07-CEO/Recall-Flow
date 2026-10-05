import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  warningDetail?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  warningDetail,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 id="confirm-modal-title" className="text-lg font-semibold text-slate-100">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-500"
            aria-label="Close confirmation dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-300">{description}</p>

        {warningDetail && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
            {warningDetail}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500 whitespace-nowrap"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
