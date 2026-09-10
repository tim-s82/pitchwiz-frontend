import React from "react";

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
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            {editingVenue ? "Update" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
          >
            Cancel
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
