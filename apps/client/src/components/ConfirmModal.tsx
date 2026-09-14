import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDanger
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{message}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary text-xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-500 text-white disabled:opacity-50'
                : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
            }`}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
