import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
    CloudDownload,
    Check,
    AlertTriangle,
    RefreshCw,
    Calendar,
    ArrowRight,
    ShieldAlert,
} from "lucide-react";

const formatDateWithDay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // fallback to raw if invalid
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${dateString} (${days[date.getDay()]})`;
};

export default function PlayCricketSyncManager({
    teams: initialTeams = [],
    pitches: initialPitches = [],
    venues: initialVenues = [],
    onSyncComplete,
}) {
    const [season, setSeason] = useState(new Date().getFullYear());
    const [step, setStep] = useState(1);
    const [parsedRows, setParsedRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Internal state for dropdown data
    const [teams, setTeams] = useState(initialTeams);
    const [pitches, setPitches] = useState(initialPitches);
    const [venues, setVenues] = useState(initialVenues);

    // Automatically fetch dropdown data if the parent component didn't provide it
    useEffect(() => {
        const fetchMissingData = async () => {
            try {
                if (initialTeams.length === 0) {
                    const t = await api.getTeams();
                    setTeams(t);
                } else {
                    setTeams(initialTeams);
                }

                if (initialPitches.length === 0) {
                    const p = await api.getPitches();
                    setPitches(p);
                } else {
                    setPitches(initialPitches);
                }

                if (initialVenues.length === 0) {
                    const v = await api.getVenues();
                    setVenues(v);
                } else {
                    setVenues(initialVenues);
                }
            } catch (error) {
                console.error("Failed to load dropdown reference data:", error);
            }
        };
        fetchMissingData();
        // FIX: Depend on the .length of the arrays, not the array references themselves.
        // This breaks the infinite loop caused by default empty arrays re-rendering.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialTeams.length, initialPitches.length, initialVenues.length]);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleFetchPreview = async () => {
        setLoading(true);
        try {
            const res = await api.previewPlayCricketFixtures(season);
            if (res && res.rows) {
                setParsedRows(res.rows);
                setStep(2);
                showToast(`Fetched ${res.rows.length} fixtures from Play-Cricket for review.`);
            } else {
                showToast("Failed to retrieve preview results.", "error");
            }
        } catch (err) {
            console.error("Play-Cricket preview failed:", err);
            showToast(err.message || "Failed to synchronize with Play-Cricket.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRowToggle = (id) => {
        setParsedRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
        );
    };

    const handleCommitSync = async () => {
        const selectedRows = parsedRows.filter((r) => r.selected && !r.clashReason);
        if (selectedRows.length === 0) {
            showToast("No valid rows selected for sync.", "error");
            return;
        }

        setLoading(true);
        try {
            const result = await api.commitImportedFixtures(selectedRows);

            showToast(`Successfully synchronized ${result.synced_count + result.updated_count} fixtures!`);
            setStep(3);
            if (onSyncComplete) onSyncComplete();
        } catch (err) {
            console.error("Sync commit failed:", err);
            showToast("Failed to commit synchronized fixtures.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Filter and Sort Pitches Logic
    const displayPitches = pitches
        .filter((p) => ["MAIN", "YOUTH"].includes((p.entity_type || "").toUpperCase()))
        .sort((a, b) => {
            const vA = venues.find((v) => v.id === a.venue) || {};
            const vB = venues.find((v) => v.id === b.venue) || {};

            // 1. Default venue first
            const aDef = vA.is_default ? 1 : 0;
            const bDef = vB.is_default ? 1 : 0;
            if (aDef !== bDef) return bDef - aDef; // 1 before 0

            // 2. Venues alphabetically
            const vNameA = vA.name || "";
            const vNameB = vB.name || "";
            const vComp = vNameA.localeCompare(vNameB);
            if (vComp !== 0) return vComp;

            // 3. MAIN before YOUTH
            const eA = (a.entity_type || "").toUpperCase();
            const eB = (b.entity_type || "").toUpperCase();
            const eWeightA = eA === "MAIN" ? 1 : eA === "YOUTH" ? 2 : 3;
            const eWeightB = eB === "MAIN" ? 1 : eB === "YOUTH" ? 2 : 3;
            if (eWeightA !== eWeightB) return eWeightA - eWeightB;

            // 4. Pitches alphabetically
            const pNameA = a.name || "";
            const pNameB = b.name || "";
            return pNameA.localeCompare(pNameB);
        });

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-semibold ${toast.type === "error"
                        ? "bg-rose-600 text-white shadow-rose-500/20"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20"
                        }`}
                >
                    {toast.type === "error" ? <AlertTriangle size={18} /> : <Check size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                        <CloudDownload size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-display text-slate-100">
                            ECB Play-Cricket Synchronization
                        </h2>
                        <p className="text-sm text-slate-400">
                            Fetch, preview, and sync official club fixtures using your configured Play-Cricket API key.
                        </p>
                    </div>
                </div>
            </div>

            {/* Step 1: Initial Trigger */}
            {step === 1 && (
                <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6 max-w-xl mx-auto text-center">
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Select Season Year
                        </label>
                        <div className="flex items-center justify-center space-x-2">
                            <Calendar size={18} className="text-emerald-400" />
                            <input
                                type="number"
                                value={season}
                                onChange={(e) => setSeason(parseInt(e.target.value, 10) || new Date().getFullYear())}
                                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 w-36 text-center font-bold outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleFetchPreview}
                        disabled={loading}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold font-display text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-[0.97] disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        <span>{loading ? "Fetching Fixtures..." : "Fetch & Preview Play-Cricket Fixtures"}</span>
                    </button>
                </div>
            )}

            {/* Step 2: Review & Adjust Mappings */}
            {step === 2 && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-bold text-slate-200 font-display">
                            Review Play-Cricket Fixtures ({parsedRows.length} found)
                        </h3>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setStep(1)}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold font-display border border-slate-700/60 hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-[0.97]"
                            >
                                Back / Change Season
                            </button>
                            <button
                                onClick={handleCommitSync}
                                disabled={loading || parsedRows.filter((r) => r.selected).length === 0}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold font-display text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-[0.97] disabled:opacity-50"
                            >
                                <span>{loading ? "Syncing..." : "Confirm & Import Selected"}</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Import</th>
                                    <th className="px-4 py-3">Matched Team</th>
                                    <th className="px-4 py-3">Opponent</th>
                                    <th className="px-4 py-3">Date & Slot</th>
                                    <th className="px-4 py-3">Matched Venue/Pitch</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                                {parsedRows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={`hover:bg-slate-800/20 transition ${row.clashReason ? "bg-rose-950/10" : ""
                                            }`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={row.selected}
                                                disabled={Boolean(row.clashReason)}
                                                onChange={() => handleRowToggle(row.id)}
                                                className="rounded text-emerald-500 bg-slate-950 border-slate-700"
                                            />
                                        </td>
                                        <td className="px-4 py-3 space-y-1">
                                            <div className="text-slate-400 text-[10px]">
                                                Home Team (from P-C): <span className="text-slate-200 font-medium">{row.teamNameRaw}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={row.teamId || ""}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value, 10);
                                                        setParsedRows((prev) =>
                                                            prev.map((p) => (p.id === row.id ? { ...p, teamId: val, teamAmbiguous: false } : p))
                                                        );
                                                    }}
                                                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 outline-none focus:border-emerald-500"
                                                >
                                                    {teams.map((t) => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {row.teamAmbiguous && (
                                                    <span
                                                        title="Multiple similar teams found. Please verify."
                                                        className="inline-flex items-center text-amber-400 bg-amber-950/40 border border-amber-900/50 p-1 rounded"
                                                    >
                                                        <AlertTriangle size={13} />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-white">{row.opponent}</td>
                                        <td className="px-4 py-3">
                                            <div>{formatDateWithDay(row.date)}</div>
                                            <span className="text-[10px] text-emerald-400">
                                                {row.time} ({row.timeSlot})
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 space-y-1">
                                            <div className="text-slate-400 text-[10px]">
                                                Ground (from P-C): <span className="text-slate-200">{row.pitchPref || "Unspecified"}</span>
                                            </div>
                                            <select
                                                value={row.pitchId || ""}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    setParsedRows((prev) =>
                                                        prev.map((p) => (p.id === row.id ? { ...p, pitchId: val } : p))
                                                    );
                                                }}
                                                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500"
                                            >
                                                {displayPitches.map((p) => {
                                                    const vObj = venues.find((v) => v.id === p.venue);
                                                    return (
                                                        <option key={p.id} value={p.id}>
                                                            {vObj ? `${vObj.name} - ${p.name}` : p.name}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.clashReason ? (
                                                <span className="inline-flex items-center gap-1 text-rose-400 font-semibold bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded">
                                                    <ShieldAlert size={12} />
                                                    {row.clashReason}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                                                    <Check size={12} />
                                                    Ready
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Step 3: Success View */}
            {step === 3 && (
                <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center space-y-6 max-w-xl mx-auto">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                        <Check size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold font-display text-slate-100">
                            Play-Cricket Synchronization Complete!
                        </h3>
                        <p className="text-sm text-slate-400">
                            Selected fixtures and pitch bookings have been successfully updated.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setStep(1);
                            setParsedRows([]);
                        }}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm rounded-xl hover:from-emerald-400 hover:to-teal-400 transition shadow-lg shadow-emerald-500/25"
                    >
                        Sync Another Season
                    </button>
                </div>
            )}
        </div>
    );
}