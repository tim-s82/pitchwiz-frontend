import React, { useState, useMemo } from "react";
import { api } from "../services/api";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import Toast from "./shared/Toast";
import VenueForm from "./venues/VenueForm";
import PitchForm from "./venues/PitchForm";
import PitchLengthForm from "./venues/PitchLengthForm";
import DeleteConfirmModal from "./venues/DeleteConfirmModal";

export default function VenuesManager({
  venues,
  pitches,
  pitchLengths,
  onDataChanged,
}) {
  // Persist active tab across data re-fetches using sessionStorage
  const [activeSubTab, setActiveSubTab] = useState(() => {
    return sessionStorage.getItem("venues_manager_active_tab") || "venues";
  });

  const handleTabChange = (tabName) => {
    setActiveSubTab(tabName);
    sessionStorage.setItem("venues_manager_active_tab", tabName);
  };

  const [toast, setToast] = useState(null);

  // --- VENUE FORM STATE ---
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [venueName, setVenueName] = useState("");
  const [venueIsDefault, setVenueIsDefault] = useState(false);

  // --- PITCH FORM STATE ---
  const [selectedPitchVenueFilter, setSelectedPitchVenueFilter] = useState("");
  const [showPitchForm, setShowPitchForm] = useState(false);
  const [editingPitch, setEditingPitch] = useState(null);
  const [pitchVenueId, setPitchVenueId] = useState("");
  const [pitchName, setPitchName] = useState("");
  const [pitchType, setPitchType] = useState("GRASS");
  const [entityType, setEntityType] = useState("MAIN");
  const [pitchSupportedLengths, setPitchSupportedLengths] = useState([]);
  const [pitchBlocksPitches, setPitchBlocksPitches] = useState([]);
  const [pitchIsActive, setPitchIsActive] = useState(true);

  // --- PITCH LENGTH FORM STATE ---
  const [showLengthForm, setShowLengthForm] = useState(false);
  const [editingLength, setEditingLength] = useState(null);
  const [lengthYards, setLengthYards] = useState("");
  const [lengthDescription, setLengthDescription] = useState("");

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Active filter falls back to first venue when not explicitly selected
  const activePitchVenueFilter =
    selectedPitchVenueFilter || (venues.length > 0 ? String(venues[0].id) : "");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ------------------ VENUE HANDLERS ------------------
  const resetVenueForm = () => {
    setVenueName("");
    setVenueIsDefault(false);
    setEditingVenue(null);
    setShowVenueForm(false);
  };

  const handleVenueSubmit = async (e) => {
    e.preventDefault();
    if (!venueName.trim()) return;

    try {
      const payload = {
        name: venueName.trim(),
        is_default: venueIsDefault,
      };

      if (editingVenue) {
        await api.updateVenue(editingVenue.id, payload);
        showToast(`Venue "${venueName.trim()}" updated`);
      } else {
        await api.createVenue(payload);
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
    setPitchVenueId(venues.length > 0 ? String(venues[0].id) : "");
    setPitchName("");
    setPitchType("GRASS");
    setEntityType("MAIN");
    setPitchSupportedLengths([]);
    setPitchBlocksPitches([]);
    setPitchIsActive(true);
    setEditingPitch(null);
    setShowPitchForm(false);
  };

  const openAddPitch = () => {
    resetPitchForm();
    if (activePitchVenueFilter) {
      setPitchVenueId(activePitchVenueFilter);
    }
    setShowPitchForm(true);
  };

  const openEditPitch = (pitch) => {
    setEditingPitch(pitch);
    setPitchVenueId(String(pitch.venue));
    setPitchName(pitch.name);
    setPitchType(pitch.pitch_type);
    setEntityType(pitch.entity_type || "MAIN");
    setPitchSupportedLengths(pitch.supported_lengths || []);
    setPitchBlocksPitches(pitch.blocks_pitches || []);
    setPitchIsActive(pitch.is_active ?? true);
    setShowPitchForm(true);
  };

  const handlePitchSubmit = async (e) => {
    e.preventDefault();
    if (!pitchName.trim() || !pitchVenueId) return;

    try {
      const payload = {
        venue: parseInt(pitchVenueId, 10),
        name: pitchName.trim(),
        pitch_type: pitchType,
        entity_type: entityType,
        supported_lengths: pitchSupportedLengths,
        blocks_pitches: pitchBlocksPitches,
        is_active: pitchIsActive,
      };

      if (editingPitch) {
        await api.updatePitch(editingPitch.id, payload);
        showToast(`Pitch "${pitchName.trim()}" updated`);
      } else {
        await api.createPitch(payload);
        showToast(`Pitch "${pitchName.trim()}" created`);
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
    if (!lengthYards) return;

    try {
      const payload = {
        length_yards: parseInt(lengthYards, 10),
        description: lengthDescription.trim(),
      };

      if (editingLength) {
        await api.updatePitchLength(editingLength.id, payload);
        showToast(`Pitch length ${lengthYards}y updated`);
      } else {
        await api.createPitchLength(payload);
        showToast(`Pitch length ${lengthYards}y created`);
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

  // Filtered and entity-type prioritized sorted pitches
  const displayedPitches = useMemo(() => {
    const filtered = pitches.filter((p) => {
      if (activePitchVenueFilter && p.venue !== parseInt(activePitchVenueFilter, 10)) {
        return false;
      }
      return true;
    });

    const typeRank = {
      main: 1,
      youth: 2,
      outfield: 3,
      net: 4,
    };

    return [...filtered].sort((a, b) => {
      const rankA = typeRank[(a.entity_type || "").toLowerCase()] || 99;
      const rankB = typeRank[(b.entity_type || "").toLowerCase()] || 99;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
    });
  }, [pitches, activePitchVenueFilter]);

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

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
              Manage ground venues, pitches, outfield overlaps, and pitch lengths.
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => handleTabChange("venues")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-display transition ${activeSubTab === "venues"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
              }`}
          >
            Ground Venues ({venues.length})
          </button>
          <button
            onClick={() => handleTabChange("pitches")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-display transition ${activeSubTab === "pitches"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
              }`}
          >
            Pitches ({pitches.length})
          </button>
          <button
            onClick={() => handleTabChange("lengths")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-display transition ${activeSubTab === "lengths"
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
              Registered Grounds & Venues
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

          {showVenueForm && (
            <VenueForm
              editingVenue={editingVenue}
              venueName={venueName}
              setVenueName={setVenueName}
              venueIsDefault={venueIsDefault}
              setVenueIsDefault={setVenueIsDefault}
              onSubmit={handleVenueSubmit}
              onCancel={resetVenueForm}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((v) => {
              const venuePitches = pitches.filter((p) => p.venue === v.id);
              return (
                <div
                  key={v.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-100 font-display text-base">
                          {v.name}
                        </h4>
                        {v.is_default && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/40">
                            Default Venue
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setEditingVenue(v);
                            setVenueName(v.name);
                            setVenueIsDefault(v.is_default || false);
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
                    <p className="text-xs text-slate-400">
                      {venuePitches.length} Pitch{venuePitches.length !== 1 ? "es" : ""} Allocated
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <h3 className="text-base font-bold font-display text-slate-200 shrink-0">
                Pitches & Outfield Rules
              </h3>
              <select
                value={activePitchVenueFilter}
                onChange={(e) => setSelectedPitchVenueFilter(e.target.value)}
                className="bg-slate-900 text-slate-200 text-xs rounded-xl py-1.5 px-3 outline-none border border-slate-700 focus:border-emerald-500"
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            {!showPitchForm && (
              <button
                onClick={openAddPitch}
                className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/10 shrink-0"
              >
                <Plus size={16} />
                <span>Add Pitch</span>
              </button>
            )}
          </div>

          {showPitchForm && (
            <PitchForm
              editingPitch={editingPitch}
              pitchVenueId={pitchVenueId}
              setPitchVenueId={setPitchVenueId}
              pitchName={pitchName}
              setPitchName={setPitchName}
              pitchType={pitchType}
              setPitchType={setPitchType}
              entityType={entityType}
              setEntityType={setEntityType}
              pitchSupportedLengths={pitchSupportedLengths}
              setPitchSupportedLengths={setPitchSupportedLengths}
              pitchBlocksPitches={pitchBlocksPitches}
              setPitchBlocksPitches={setPitchBlocksPitches}
              pitchIsActive={pitchIsActive}
              setPitchIsActive={setPitchIsActive}
              venues={venues}
              pitches={pitches}
              pitchLengths={pitchLengths}
              onSubmit={handlePitchSubmit}
              onCancel={resetPitchForm}
            />
          )}

          {/* Pitches List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedPitches.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-slate-500 text-xs italic glass-panel rounded-2xl">
                No pitches found for the selected venue.
              </div>
            ) : (
              displayedPitches.map((p) => {
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
                          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 font-display">
                            {venueObj?.name}
                          </span>
                          <h4 className="font-bold text-slate-100 font-display text-base flex items-center gap-2">
                            {p.name}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal">
                              {p.entity_type || "MAIN"}
                            </span>
                          </h4>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${p.is_active
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
                        <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">
                          Supported Lengths:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {(p.supported_lengths || []).map((lenId) => {
                            const lObj = pitchLengths.find((l) => l.id === lenId);
                            return (
                              <span
                                key={lenId}
                                className="text-[10px] px-2 py-0.5 rounded bg-slate-900/80 text-emerald-300 border border-slate-800"
                              >
                                {lObj ? `${lObj.length_yards} Yards` : `ID ${lenId}`}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Overlaps */}
                      {blockedPitchNames.length > 0 && (
                        <div className="bg-amber-950/20 border border-amber-900/40 p-2 rounded-xl text-xs text-amber-300 space-y-0.5">
                          <span className="font-bold text-[10px] block uppercase tracking-wider">
                            Overlap Rules:
                          </span>
                          <p className="text-[10px]">
                            Booking this pitch automatically blocks: {blockedPitchNames.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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

          {showLengthForm && (
            <PitchLengthForm
              editingLength={editingLength}
              lengthYards={lengthYards}
              setLengthYards={setLengthYards}
              lengthDescription={lengthDescription}
              setLengthDescription={setLengthDescription}
              onSubmit={handleLengthSubmit}
              onCancel={resetLengthForm}
            />
          )}

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
                    <td className="px-6 py-4 text-slate-200">{l.description}</td>
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
      <DeleteConfirmModal
        target={deleteTarget}
        onConfirm={executeDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}