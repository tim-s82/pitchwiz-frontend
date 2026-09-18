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
                }
                if (initialPitches.length === 0) {
                    const p = await api.getPitches();
                    setPitches(p);
                }
                if (initialVenues.length === 0) {
                    const v = await api.getVenues();
                    setVenues(v);
                }
            } catch (error) {
                console.error("Failed to load dropdown reference data:", error);
            }
        };
        fetchMissingData();
    }, [initialTeams, initialPitches, initialVenues]);

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
            // SINGLE API CALL replacing the loop!
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

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-semibold ${toast.type === "error" ? "bg-rose-500 text-white" : "bg-emerald-500 text-slate-950"
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
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold font-display rounded-xl hover:from-emerald-500 hover:to-teal-500 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
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
                                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition"
                            >
                                Back / Change Season
                            </button>
                            <button
                                onClick={handleCommitSync}
                                disabled={loading || parsedRows.filter((r) => r.selected).length === 0}
                                className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition disabled:opacity-50 flex items-center space-x-2"
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
                                    <th className="px-4 py-3">Play-Cricket Team &rarr; Matched Team</th>
                                    <th className="px-4 py-3">Opponent</th>
                                    <th className="px-4 py-3">Date & Time</th>
                                    <th className="px-4 py-3">Assigned Pitch (Ground: Match)</th>
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
                                                ECB Home: <span className="text-slate-200 font-medium">{row.teamNameRaw}</span>
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
                                            <div>{row.date}</div>
                                            <span className="text-[10px] text-emerald-400">
                                                {row.time} ({row.timeSlot})
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 space-y-1">
                                            <div className="text-slate-400 text-[10px]">
                                                Ground: <span className="text-slate-200">{row.pitchPref || "Unspecified"}</span>
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
                                                {pitches.map((p) => {
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
                        className="px-6 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition"
                    >
                        Sync Another Season
                    </button>
                </div>
            )}
        </div>
    );
}