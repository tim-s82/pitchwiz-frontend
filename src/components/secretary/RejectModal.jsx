import React from "react";

export default function RejectModal({
  isOpen,
  reason,
  setReason,
  onSubmit,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-white font-display">
          Denial Reason
        </h3>
        <p className="text-sm text-slate-400">
          A reason must be provided when denying a booking.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter the reason for denial..."
          className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl p-3 h-28 outline-none focus:border-red-500 resize-none"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
          >
            Deny Booking
          </button>
        </div>
      </div>
    </div>
  );
}
