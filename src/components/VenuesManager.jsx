import React, { useState } from "react";
import { api } from "../services/api";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Ruler,
  AlertTriangle,
  Layers,
  Grid,
} from "lucide-react";

export default function VenuesManager({
  venues,
  pitches,
  pitchLengths,
  onDataChanged,
}) {
  const [activeSubTab, setActiveSubTab] = useState("venues"); // 'venues', 'pitches', 'lengths'
  const [toast, setToast] = useState(null);

  // --- VENUE FORM STATE ---
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [venueName, setVenueName] = useState("");

  // --- PITCH FORM STATE ---
  const [showPitchForm, setShowPitchForm] = useState(false);
  const [editingPitch, setEditingPitch] = useState(null);
  const [pitchVenueId, setPitchVenueId] = useState("");
  const [pitchName, setPitchName] = useState("");
  const [pitchType, setPitchType] = useState("GRASS");
  const [entityType, setEntityType] = useState("PITCH");
  const [pitchSupportedLengths, setPitchSupportedLengths] = useState([]);
  const [pitchBlocksPitches, setPitchBlocksPitches] = useState([]);
  const [pitchIsActive, setPitchIsActive] = useState(true);

  // --- PITCH LENGTH FORM STATE ---
  const [showLengthForm, setShowLengthForm] = useState(false);
  const [editingLength, setEditingLength] = useState(null);
  const [lengthYards, setLengthYards] = useState("");
  const [lengthDescription, setLengthDescription] = useState("");

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'venue'|'pitch'|'length', id, name }

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ------------------ VENUE HANDLERS ------------------
  const resetVenueForm = () => {
    setVenueName("");
    setEditingVenue(null);
    setShowVenueForm(false);
  };

  const handleVenueSubmit = async (e) => {
    e.preventDefault();
    if (!venueName.trim()) return;

    try {
      if (editingVenue) {
        await api.updateVenue(editingVenue.id, { name: venueName.trim() });
        showToast(`Venue "${venueName.trim()}" updated`);
      } else {
        await api.createVenue({ name: venueName.trim() });
        showToast(`Venue "${venueName.trim()}" created`);
      }
      resetVenueForm();
      onDataChanged();
    } catch (err) {
      showToast("Failed to save venue", "error");
    }
  };

  // ------------------ PITCH HANDLERS ------------------
  const resetPitchForm = () => {
    setPitchVenueId(venues[0]?.id ? String(venues[0].id) : "");
    setPitchName("");
    setPitchType("GRASS");
    setPitchSupportedLengths([]);
    setPitchBlocksPitches([]);
    setPitchIsActive(true);
    setEditingPitch(null);
    setShowPitchForm(false);
  };

  const openAddPitch = () => {
    resetPitchForm();
    if (venues.length > 0) setPitchVenueId(String(venues[0].id));
    setShowPitchForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditPitch = (pitch) => {
    setEditingPitch(pitch);
    setPitchVenueId(String(pitch.venue));
    setPitchName(pitch.name);
    setPitchType(pitch.pitch_type);
    setEntityType(pitch.entity_type ?? false);
    setPitchSupportedLengths(pitch.supported_lengths || []);
    setPitchBlocksPitches(pitch.blocks_pitches || []);
    setPitchIsActive(pitch.is_active);
    setShowPitchForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePitchSubmit = async (e) => {
    e.preventDefault();
    if (!pitchName.trim() || !pitchVenueId) return;

    const payload = {
      venue: parseInt(pitchVenueId, 10),
      name: pitchName.trim(),
      pitch_type: pitchType,
      entity_type: entityType,
      supported_lengths: pitchSupportedLengths,
      blocks_pitches: pitchBlocksPitches,
      is_active: pitchIsActive,
    };

    try {
      if (editingPitch) {
        await api.updatePitch(editingPitch.id, payload);
        showToast(`Pitch "${payload.name}" updated`);
      } else {
        await api.createPitch(payload);
        showToast(`Pitch "${payload.name}" created`);
      }
      resetPitchForm();
      onDataChanged();
    } catch (err) {
      showToast("Failed to save pitch", "error");
    }
  };

  // ------------------ PITCH LENGTH HANDLERS ------------------
  const resetLengthForm = () => {
    setLengthYards("");
    setLengthDescription("");
    setEditingLength(null);
    setShowLengthForm(false);
  };

  const handleLengthSubmit = async (e) => {
    e.preventDefault();
    if (!lengthYards || !lengthDescription.trim()) return;

    const payload = {
      length_yards: parseInt(lengthYards, 10),
      description: lengthDescription.trim(),
    };

    try {
      if (editingLength) {
        await api.updatePitchLength(editingLength.id, payload);
        showToast(`${payload.length_yards} Yards updated`);
      } else {
        await api.createPitchLength(payload);
        showToast(`${payload.length_yards} Yards added`);
      }
      resetLengthForm();
      onDataChanged();
    } catch (err) {
      showToast("Failed to save pitch length", "error");
    }
  };

  // ------------------ DELETE EXECUTION ------------------
  const executeDelete = async () => {
    if (!deleteTarget) return;
    const { type, id, name } = deleteTarget;

    try {
      if (type === "venue") {
        await api.deleteVenue(id);
        showToast(`Venue "${name}" deleted`);
      } else if (type === "pitch") {
        await api.deletePitch(id);
        showToast(`Pitch "${name}" deleted`);
      } else if (type === "length") {
        await api.deletePitchLength(id);
        showToast(`Pitch length "${name}" deleted`);
      }
      setDeleteTarget(null);
      onDataChanged();
    } catch (err) {
      showToast(`Failed to delete ${type}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === "error"
              ? "bg-rose-500 text-white shadow-rose-500/20"
              : "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
          }`}
        >
          {toast.type === "error" ? (
            <AlertTriangle size={18} />
          ) : (
            <Check size={18} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
            <MapPin size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-slate-100">
              Venues & Pitch Management
            </h2>
            <p className="text-sm text-slate-400">
              Manage ground venues, pitches, outfield overlaps, and pitch
              lengths.
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab("venues")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition ${
              activeSubTab === "venues"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Venues ({venues.length})
          </button>
          <button
            onClick={() => setActiveSubTab("pitches")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition ${
              activeSubTab === "pitches"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pitches ({pitches.length})
          </button>
          <button
            onClick={() => setActiveSubTab("lengths")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition ${
              activeSubTab === "lengths"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pitch Lengths ({pitchLengths.length})
          </button>
        </div>
      </div>

      {/* ================= TAB 1: VENUES ================= */}
      {activeSubTab === "venues" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold font-display text-slate-200">
              Ground Venues
            </h3>
            {!showVenueForm && (
              <button
                onClick={() => {
                  resetVenueForm();
                  setShowVenueForm(true);
                }}
                className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/10"
              >
                <Plus size={16} />
                <span>Add Venue</span>
              </button>
            )}
          </div>

          {/* Add/Edit Form */}
          {showVenueForm && (
            <form
              onSubmit={handleVenueSubmit}
              className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-4"
            >
              <h4 className="text-sm font-bold text-slate-200 font-display">
                {editingVenue ? "Edit Venue" : "New Ground Venue"}
              </h4>
              <div className="flex gap-4">
                <input
                  type="text"
                  required
                  placeholder="Venue Name (e.g. Main Ground, School Ground)"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  {editingVenue ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={resetVenueForm}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Venues Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((v) => {
              const venuePitches = pitches.filter((p) => p.venue === v.id);
              return (
                <div
                  key={v.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-100 font-display text-base">
                        {v.name}
                      </h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setEditingVenue(v);
                            setVenueName(v.name);
                            setShowVenueForm(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: "venue",
                              id: v.id,
                              name: v.name,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {venuePitches.length} Pitch
                      {venuePitches.length !== 1 ? "es" : ""} Allocated
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-850">
                    {venuePitches.map((p) => (
                      <span
                        key={p.id}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: PITCHES ================= */}
      {activeSubTab === "pitches" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold font-display text-slate-200">
              Pitches & Outfield Rules
            </h3>
            {!showPitchForm && (
              <button
                onClick={openAddPitch}
                className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/10"
              >
                <Plus size={16} />
                <span>Add Pitch</span>
              </button>
            )}
          </div>

          {/* Add/Edit Pitch Form */}
          {showPitchForm && (
            <form
              onSubmit={handlePitchSubmit}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                              : [...prev, l.id],
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

              {/* Outfield Overlap - Blocks Pitches */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Outfield Overlap Rules (Pitch Blocks Others)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Select pitches at this venue that become unavailable when THIS
                  pitch is booked.
                </p>
                <div className="flex flex-wrap gap-2">
                  {pitches
                    .filter(
                      (p) =>
                        p.venue === parseInt(pitchVenueId, 10) &&
                        (!editingPitch || p.id !== editingPitch.id),
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
                                : [...prev, p.id],
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
                  {pitches.filter(
                    (p) =>
                      p.venue === parseInt(pitchVenueId, 10) &&
                      (!editingPitch || p.id !== editingPitch.id),
                  ).length === 0 && (
                    <span className="text-xs text-slate-500 italic">
                      No other pitches available at this venue to block.
                    </span>
                  )}
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
                  onClick={resetPitchForm}
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
          )}

          {/* Pitches List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pitches.map((p) => {
              const venueObj = venues.find((v) => v.id === p.venue);
              const blockedPitchNames = (p.blocks_pitches || [])
                .map((id) => pitches.find((target) => target.id === id)?.name)
                .filter(Boolean);

              return (
                <div
                  key={p.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xxs uppercase tracking-wider font-bold text-emerald-400 font-display">
                          {venueObj?.name}
                        </span>
                        <h4 className="font-bold text-slate-100 font-display text-base">
                          {p.name}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            p.is_active
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/50"
                              : "bg-rose-950/60 text-rose-400 border border-rose-900/50"
                          }`}
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                        <button
                          onClick={() => openEditPitch(p)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: "pitch",
                              id: p.id,
                              name: p.name,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-semibold border border-slate-800">
                        {p.pitch_type}
                      </span>
                    </div>

                    {/* Supported lengths */}
                    <div className="text-xs space-y-1">
                      <span className="text-slate-500 font-semibold block text-xxs uppercase tracking-wider">
                        Supported Lengths:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(p.supported_lengths || []).map((lenId) => {
                          const lObj = pitchLengths.find((l) => l.id === lenId);
                          return (
                            <span
                              key={lenId}
                              className="text-xxs px-2 py-0.5 rounded bg-slate-900/80 text-emerald-300 border border-slate-800"
                            >
                              {lObj
                                ? `${lObj.length_yards} Yards`
                                : `ID ${lenId}`}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Overlaps */}
                    {blockedPitchNames.length > 0 && (
                      <div className="bg-amber-950/20 border border-amber-900/40 p-2 rounded-xl text-xs text-amber-300 space-y-0.5">
                        <span className="font-bold text-xxs block uppercase tracking-wider">
                          Overlap Rules:
                        </span>
                        <p className="text-xxs">
                          Booking this pitch automatically blocks:{" "}
                          {blockedPitchNames.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: PITCH LENGTHS ================= */}
      {activeSubTab === "lengths" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold font-display text-slate-200">
              Pitch Length Standards
            </h3>
            {!showLengthForm && (
              <button
                onClick={() => {
                  resetLengthForm();
                  setShowLengthForm(true);
                }}
                className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/10"
              >
                <Plus size={16} />
                <span>Add Pitch Length</span>
              </button>
            )}
          </div>

          {/* Add/Edit Length Form */}
          {showLengthForm && (
            <form
              onSubmit={handleLengthSubmit}
              className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-4"
            >
              <h4 className="text-sm font-bold text-slate-200 font-display">
                {editingLength
                  ? "Edit Pitch Length"
                  : "New Pitch Length Standard"}
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
                    onClick={resetLengthForm}
                    className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Pitch Lengths Table */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Length (Yards)</th>
                  <th className="px-6 py-3.5">Target Age / Description</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {pitchLengths.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4 font-bold text-emerald-400 font-display text-base">
                      {l.length_yards} Yards
                    </td>
                    <td className="px-6 py-4 text-slate-200">
                      {l.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingLength(l);
                            setLengthYards(String(l.length_yards));
                            setLengthDescription(l.description);
                            setShowLengthForm(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: "length",
                              id: l.id,
                              name: `${l.length_yards} Yards`,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white font-display">
              Confirm Deletion
            </h3>
            <p className="text-sm text-slate-300">
              Are you sure you want to delete{" "}
              <span className="font-bold text-emerald-400">
                {deleteTarget.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
