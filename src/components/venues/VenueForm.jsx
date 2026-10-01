import React from "react";
import { Check } from "lucide-react";

export default function VenueForm({
  editingVenue,
  venueName,
  setVenueName,
  venueIsDefault,
  setVenueIsDefault,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-4"
    >
      <h4 className="text-sm font-bold text-slate-200 font-display">
        {editingVenue ? "Edit Venue" : "New Ground Venue"}
      </h4>
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          required
          placeholder="Venue Name (e.g. Main Ground, School Ground)"
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500"
        />
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold font-display border border-slate-700/60 hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold font-display text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-[0.97]"
          >
            <Check size={16} />
            {editingVenue ? "Update Venue" : "Save Venue"}
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-2 pt-1">
        <input
          id="venue-default"
          type="checkbox"
          checked={venueIsDefault}
          onChange={(e) => setVenueIsDefault(e.target.checked)}
          className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500/40"
        />
        <label
          htmlFor="venue-default"
          className="text-xs text-slate-300 select-none cursor-pointer font-medium"
        >
          Set as Default Venue (automatically selected in calendar)
        </label>
      </div>
    </form>
  );
}
