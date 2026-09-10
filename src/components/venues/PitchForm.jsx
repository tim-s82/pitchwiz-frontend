import React from "react";

export default function PitchForm({
  editingPitch,
  pitchVenueId,
  setPitchVenueId,
  pitchName,
  setPitchName,
  pitchType,
  setPitchType,
  entityType,
  setEntityType,
  pitchSupportedLengths,
  setPitchSupportedLengths,
  pitchBlocksPitches,
  setPitchBlocksPitches,
  pitchIsActive,
  setPitchIsActive,
  venues,
  pitches,
  pitchLengths,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="glass-panel p-6 rounded-2xl border border-emerald-500/30 space-y-4"
    >
      <h4 className="text-sm font-bold text-slate-200 font-display">
        {editingPitch ? "Edit Pitch" : "New Pitch Configuration"}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Venue *
          </label>
          <select
            value={pitchVenueId}
            onChange={(e) => setPitchVenueId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
            required
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Pitch Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Main Grass, Pitch 2 Astro"
            value={pitchName}
            onChange={(e) => setPitchName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Surface Type
          </label>
          <select
            value={pitchType}
            onChange={(e) => setPitchType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
          >
            <option value="GRASS">Grass</option>
            <option value="ASTRO">Artificial / Astro</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Entity Type
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
          >
            <option value="MAIN">Main Pitch</option>
            <option value="YOUTH">Youth Pitch</option>
            <option value="OUTFIELD">Outfield</option>
            <option value="NET">Net</option>
          </select>
        </div>
      </div>

      {/* Supported Lengths Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Supported Pitch Lengths
        </label>
        <div className="flex flex-wrap gap-3">
          {pitchLengths.map((l) => {
            const isSelected = pitchSupportedLengths.includes(l.id);
            return (
              <button
                type="button"
                key={l.id}
                onClick={() => {
                  setPitchSupportedLengths((prev) =>
                    isSelected
                      ? prev.filter((id) => id !== l.id)
                      : [...prev, l.id]
                  );
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  isSelected
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {l.length_yards} Yards ({l.description})
              </button>
            );
          })}
        </div>
      </div>

      {/* Overlap Rules */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Overlap Rules (Pitch Blocks Others)
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Select pitches at this venue that become unavailable when THIS pitch is booked.
        </p>
        <div className="flex flex-wrap gap-2">
          {pitches
            .filter(
              (p) =>
                p.venue === parseInt(pitchVenueId, 10) &&
                (!editingPitch || p.id !== editingPitch.id)
            )
            .map((p) => {
              const isBlocked = pitchBlocksPitches.includes(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    setPitchBlocksPitches((prev) =>
                      isBlocked
                        ? prev.filter((id) => id !== p.id)
                        : [...prev, p.id]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    isBlocked
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/50"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  Blocks: {p.name}
                </button>
              );
            })}
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="pitchIsActive"
          checked={pitchIsActive}
          onChange={(e) => setPitchIsActive(e.target.checked)}
          className="rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500"
        />
        <label
          htmlFor="pitchIsActive"
          className="text-xs font-semibold text-slate-300"
        >
          Pitch Active / Available for Bookings
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
        >
          {editingPitch ? "Update Pitch" : "Save Pitch"}
        </button>
      </div>
    </form>
  );
}
