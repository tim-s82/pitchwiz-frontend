import React from "react";
import { AlertTriangle, Check, X } from "lucide-react";

export default function ConfirmApproveModal({
  isOpen,
  booking,
  competingBookings,
  isSubmitting,
  onConfirm,
  onClose,
  teams,
  fixtures,
  pitches,
  venues,
}) {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-amber-800/60 rounded-2xl shadow-2xl p-6 w-full max-w-lg space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">
              Competing Requests Exist
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Approving this booking will automatically{" "}
              <span className="text-red-400 font-semibold">deny</span> the
              following conflicting pending request
              {competingBookings.length > 1 ? "s" : ""}:
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {competingBookings.map((cb) => {
            const fix = cb.fixture
              ? fixtures.find((f) => f.id === cb.fixture)
              : null;
            const team = fix ? teams.find((t) => t.id === fix.team) : null;
            const cbPitch = pitches.find((p) => p.id === cb.pitch);
            const cbVenue = cbPitch
              ? venues.find((v) => v.id === cbPitch.venue)
              : null;
            const cbLabel = team
              ? `${team.name} vs ${fix.opponent}`
              : cb.external_contact_name || "External Booking";
            return (
              <li
                key={cb.id}
                className="flex items-start gap-2.5 bg-red-950/30 border border-red-900/50 rounded-xl p-3"
              >
                <X size={14} className="text-red-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-slate-200">{cbLabel}</p>
                  <p className="text-slate-400 mt-0.5">
                    {cbVenue?.name} · {cbPitch?.name} · {cb.start_date}
                    {cb.start_date !== cb.end_date ? ` → ${cb.end_date}` : ""} ·{" "}
                    {cb.time_slot.toLowerCase().replace("_", " ")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-slate-500">
          This action cannot be undone. The denied parties will see their
          requests marked as rejected.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 text-sm font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            <Check size={15} />
            {isSubmitting ? "Processing…" : "Approve & Auto-Reject Conflicts"}
          </button>
        </div>
      </div>
    </div>
  );
}
