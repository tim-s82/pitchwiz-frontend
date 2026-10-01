import React from "react";
import { Check } from "lucide-react";

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
            {editingLength ? "Update Length" : "Save Length"}
          </button>
        </div>
      </div>
    </form>
  );
}
