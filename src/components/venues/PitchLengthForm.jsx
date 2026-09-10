import React from "react";

export default function PitchLengthForm({
  editingLength,
  lengthYards,
  setLengthYards,
  lengthDescription,
  setLengthDescription,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-4"
    >
      <h4 className="text-sm font-bold text-slate-200 font-display">
        {editingLength ? "Edit Pitch Length" : "New Pitch Length Standard"}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="number"
          required
          placeholder="Length in Yards (e.g. 22)"
          value={lengthYards}
          onChange={(e) => setLengthYards(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500"
        />
        <input
          type="text"
          required
          placeholder="Description (e.g. Adult / U15+)"
          value={lengthDescription}
          onChange={(e) => setLengthDescription(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500"
        />
        <div className="flex space-x-2">
          <button
            type="submit"
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            {editingLength ? "Update" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
