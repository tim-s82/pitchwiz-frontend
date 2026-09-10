import React from "react";

export default function DeleteConfirmModal({ target, onConfirm, onClose }) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <h3 className="text-lg font-bold text-white font-display">Confirm Deletion</h3>
        <p className="text-sm text-slate-300">
          Are you sure you want to delete{" "}
          <span className="font-bold text-emerald-400">{target.name}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
