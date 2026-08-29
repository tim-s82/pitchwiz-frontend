import React, { useState } from "react";
import { Wrench, X, AlertTriangle, Check } from "lucide-react";

export default function GroundMaintenanceModal({
  isOpen,
  onClose,
  venues,
  pitches,
  onMaintenanceCreated,
}) {
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [selectedPitches, setSelectedPitches] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("ALL_DAY"); // MORNING, AFTERNOON, EVENING, ALL_DAY
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  // Filter pitches belonging to the selected venue
  const venuePitches = pitches.filter(
    (p) => p.venue === Number(selectedVenueId),
  );

  const handlePitchToggle = (pitchId) => {
    setSelectedPitches((prev) =>
      prev.includes(pitchId)
        ? prev.filter((id) => id !== pitchId)
        : [...prev, pitchId],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVenueId || selectedPitches.length === 0 || !startDate) return;

    setSaving(true);
    try {
      const payload = {
        venue: Number(selectedVenueId),
        pitches: selectedPitches,
        start_date: startDate,
        end_date: endDate || startDate,
        time_slot: timeSlot,
        booking_type: "GROUND_MAINTENANCE",
        notes: notes.trim(),
      };

      // Call API endpoint to create maintenance booking & handle overrides
      await onMaintenanceCreated(payload);
      onClose();
    } catch (err) {
      console.error("Failed to create ground maintenance:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 flex items-center justify-center">
              <Wrench size={16} />
            </div>
            <h3 className="font-bold font-display text-slate-100">
              Schedule Ground Maintenance
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Venue Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Venue <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedVenueId}
              onChange={(e) => {
                setSelectedVenueId(e.target.value);
                setSelectedPitches([]); // Reset pitch selection on venue change
              }}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="">— Select Venue —</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pitches Multi-select */}
          {selectedVenueId && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Affected Pitches <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                {venuePitches.length === 0 ? (
                  <span className="text-xs text-slate-500 col-span-2 p-2">
                    No pitches found for this venue.
                  </span>
                ) : (
                  venuePitches.map((p) => {
                    const isSelected = selectedPitches.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handlePitchToggle(p.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition flex items-center justify-between ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        }`}
                      >
                        <span>{p.name}</span>
                        {isSelected && (
                          <Check size={14} className="text-emerald-400" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Date & Slot */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Time Slot <span className="text-red-400">*</span>
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="ALL_DAY">All Day</option>
                <option value="MORNING">Morning (09:00 - 13:00)</option>
                <option value="AFTERNOON">Afternoon (13:30 - 18:00)</option>
                <option value="EVENING">Evening (18:00 - 21:00)</option>
              </select>
            </div>
          </div>

          {/* Notes & Warning */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Maintenance Notes / Reason
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verti-draining and harrowing"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 flex items-start gap-2.5 text-emerald-300 text-xs">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              <strong>Warning:</strong> Scheduling ground maintenance will
              automatically override and cancel any existing conflicting
              bookings on the selected pitches.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || selectedPitches.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition disabled:opacity-50"
            >
              {saving ? "Scheduling..." : "Confirm Maintenance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
