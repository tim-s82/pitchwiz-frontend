import React, { useState, useMemo } from "react";
import { Wrench, X, AlertTriangle, Check, Calendar } from "lucide-react";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";

export default function GroundMaintenanceModal({
  isOpen,
  onClose,
  venues,
  pitches,
  onMaintenanceCreated,
}) {
  useLockBodyScroll(isOpen);

  // 1. Sort venues alphabetically, bringing the default venue to the top
  const sortedVenues = useMemo(() => {
    return [...venues].sort((a, b) => {
      if (a.is_default) return -1;
      if (b.is_default) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [venues]);

  // 2. Initialize venue state directly without a cascading effect hook
  const [selectedVenueId, setSelectedVenueId] = useState(() => {
    const defaultV = venues.find((v) => v.is_default) || sortedVenues[0];
    return defaultV ? defaultV.id.toString() : "";
  });

  const [selectedPitches, setSelectedPitches] = useState([]);
  const [startDate, setStartDate] = useState("");
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
        end_date: startDate,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 flex items-center justify-center">
              <Wrench size={16} />
            </div>
            <h3 className="font-bold font-display text-slate-100 text-base sm:text-lg">
              Schedule Ground Maintenance
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          {/* Scrollable Form Body */}
          <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
            {/* Venue Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Venue <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedVenueId}
                onChange={(e) => {
                  setSelectedVenueId(e.target.value);
                  setSelectedPitches([]); // Reset pitch selection on venue change
                }}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">— Select Venue —</option>
                {sortedVenues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pitches Multi-select */}
            {selectedVenueId && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Affected Pitches <span className="text-red-400">*</span>
                  </label>
                  <span className="text-xxs text-slate-400">
                    {selectedPitches.length} pitch{selectedPitches.length !== 1 ? "es" : ""} selected
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800 custom-scrollbar">
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border text-left transition flex items-center justify-between ${
                            isSelected
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          {isSelected && (
                            <Check size={14} className="text-emerald-400 shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Date & Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Date <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 pr-9 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <Calendar
                    size={16}
                    className="absolute right-3 text-emerald-500 pointer-events-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Time Slot <span className="text-red-400">*</span>
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Maintenance Notes / Reason
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Verti-draining and harrowing"
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/60 text-slate-100 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
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
          </div>

          {/* Pinned Action Buttons Footer */}
          <div className="p-4 sm:px-6 bg-slate-900/60 border-t border-slate-800/80 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold font-display border border-slate-700/60 hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-[0.97]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || selectedPitches.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold font-display text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                "Scheduling..."
              ) : (
                <>
                  <Check size={16} /> Confirm Maintenance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
