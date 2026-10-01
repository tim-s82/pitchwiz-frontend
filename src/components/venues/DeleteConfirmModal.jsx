import React from "react";
import { Trash2 } from "lucide-react";

export default function DeleteConfirmModal({ target, onConfirm, onClose }) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <h3 className="text-lg font-bold text-white font-display">Confirm Deletion</h3>
        <p className="text-sm text-slate-300">
          Are you sure you want to delete{" "}
          <span className="font-bold text-emerald-400">{target.name}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold font-display border border-slate-700/60 hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-sm font-semibold font-display text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:from-rose-500 hover:to-red-500 transition-all active:scale-[0.97]"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
