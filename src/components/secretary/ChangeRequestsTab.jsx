import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { GitPullRequestArrow, Check, X } from "lucide-react";

export default function ChangeRequestsTab({
  pitches,
  onDataChanged,
  onPendingCountChange,
}) {
  const [changeRequests, setChangeRequests] = useState([]);
  const [changeRejectModal, setChangeRejectModal] = useState({
    open: false,
    crId: null,
    reason: "",
  });

  const fetchChangeRequests = async () => {
    try {
      const data = await api.getBookingChangeRequests();
      setChangeRequests(data || []);
      const pending = (data || []).filter((cr) => cr.status === "PENDING");
      if (onPendingCountChange) {
        onPendingCountChange(pending.length);
      }
    } catch (e) {
      console.warn("Could not fetch change requests", e);
    }
  };

  useEffect(() => {
    fetchChangeRequests();
  }, []);

  const handleApproveChange = async (crId) => {
    try {
      await api.updateBookingChangeRequest(crId, { status: "APPROVED" });
      await fetchChangeRequests();
      if (onDataChanged) onDataChanged();
    } catch (e) {
      console.error(e);
      alert("Failed to approve change request: " + e.message);
    }
  };

  const handleRejectChange = (crId) => {
    setChangeRejectModal({ open: true, crId, reason: "" });
  };

  const submitChangeRejection = async () => {
    if (!changeRejectModal.reason.trim()) {
      alert("A rejection reason is required.");
      return;
    }
    try {
      await api.updateBookingChangeRequest(changeRejectModal.crId, {
        status: "REJECTED",
        rejection_reason: changeRejectModal.reason,
      });
      setChangeRejectModal({ open: false, crId: null, reason: "" });
      await fetchChangeRequests();
      if (onDataChanged) onDataChanged();
    } catch (e) {
      console.error(e);
      alert("Failed to reject change request: " + e.message);
    }
  };

  const pendingChangeRequests = changeRequests.filter(
    (cr) => cr.status === "PENDING"
  );

  return (
    <div className="space-y-4">
      {pendingChangeRequests.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
          No pending change requests.
        </div>
      ) : (
        pendingChangeRequests.map((cr) => {
          const newPitch = cr.new_pitch
            ? pitches.find((p) => p.id === cr.new_pitch)
            : null;

          return (
            <div
              key={cr.id}
              className="glass-panel p-6 rounded-2xl border border-indigo-900/40 bg-indigo-950/5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <GitPullRequestArrow
                  size={16}
                  className="text-indigo-400"
                />
                <span className="text-sm font-bold text-indigo-300">
                  Change Request #{cr.id}
                </span>
                <span className="text-xxs bg-indigo-900/50 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded">
                  Original Booking #{cr.original_booking}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300">
                {cr.new_start_date && (
                  <div>
                    <span className="text-slate-500">New Start:</span>{" "}
                    {cr.new_start_date}
                  </div>
                )}
                {cr.new_end_date && (
                  <div>
                    <span className="text-slate-500">New End:</span>{" "}
                    {cr.new_end_date}
                  </div>
                )}
                {cr.new_time_slot && (
                  <div>
                    <span className="text-slate-500">New Slot:</span>{" "}
                    {cr.new_time_slot}
                  </div>
                )}
                {newPitch && (
                  <div>
                    <span className="text-slate-500">New Pitch:</span>{" "}
                    {newPitch.name}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleApproveChange(cr.id)}
                  className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1 transition"
                >
                  <Check size={14} /> Approve
                </button>
                <button
                  onClick={() => handleRejectChange(cr.id)}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1 transition"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Change Request Rejection Modal */}
      {changeRejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white font-display">
              Rejection Reason
            </h3>
            <p className="text-sm text-slate-400">
              A reason must be provided when rejecting a change request.
            </p>
            <textarea
              value={changeRejectModal.reason}
              onChange={(e) =>
                setChangeRejectModal({
                  ...changeRejectModal,
                  reason: e.target.value,
                })
              }
              placeholder="Enter the reason for rejection..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl p-3 h-28 outline-none focus:border-red-500 resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setChangeRejectModal({ open: false, crId: null, reason: "" })
                }
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={submitChangeRejection}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
              >
                Reject Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
