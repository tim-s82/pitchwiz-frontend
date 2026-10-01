import React, { useState, useRef, useEffect } from "react";
import { api } from "../services/api";
import {
    Upload,
    FileSpreadsheet,
    Check,
    AlertTriangle,
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

export default function FixtureImportManager({
    teams: initialTeams = [],
    pitches: initialPitches = [],
    venues: initialVenues = [],
    onImportComplete,
}) {
    const [step, setStep] = useState(1);
    const [parsedRows, setParsedRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const fileInputRef = useRef(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

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

    // Dynamically load SheetJS parser library for robust .xlsx and .csv support
    const loadXLSXLibrary = () => {
        return new Promise((resolve, reject) => {
            if (window.XLSX) {
                resolve(window.XLSX);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
            script.onload = () => resolve(window.XLSX);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // Parse date value safely (handles JS Date objects, Excel serial numbers, or strings)
    const parseDateValue = (dateVal) => {
        if (!dateVal) return "";
        if (dateVal instanceof Date) {
            const year = dateVal.getFullYear();
            const month = String(dateVal.getMonth() + 1).padStart(2, "0");
            const day = String(dateVal.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }
        if (typeof dateVal === "number") {
            const utcDays = Math.floor(dateVal - 25569);
            const dateInfo = new Date(utcDays * 86400 * 1000);
            const year = dateInfo.getUTCFullYear();
            const month = String(dateInfo.getUTCMonth() + 1).padStart(2, "0");
            const day = String(dateInfo.getUTCDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }
        return String(dateVal).trim();
    };

    // Parse time value safely (handles Date objects, decimals, or strings)
    const parseTimeValue = (timeVal) => {
        if (!timeVal) return "14:00";
        if (timeVal instanceof Date) {
            const hours = String(timeVal.getHours()).padStart(2, "0");
            const minutes = String(timeVal.getMinutes()).padStart(2, "0");
            return `${hours}:${minutes}`;
        }
        if (typeof timeVal === "number") {
            const totalSeconds = Math.round(timeVal * 86400);
            const hours = String(Math.floor(totalSeconds / 3600) % 24).padStart(2, "0");
            const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
            return `${hours}:${minutes}`;
        }
        const cleanStr = String(timeVal).trim();
        return cleanStr || "14:00";
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const XLSX = await loadXLSXLibrary();
            const reader = new FileReader();

            reader.onload = async (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: "array", cellDates: true });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                    if (rawData.length === 0) {
                        showToast("The uploaded file appears empty.", "error");
                        setLoading(false);
                        return;
                    }

                    // Format dates and times cleanly before sending raw rows to backend
                    const formattedRawRows = rawData.map((row) => {
                        const newRow = {};
                        Object.keys(row).forEach((k) => {
                            newRow[k] = row[k];
                        });
                        // Pre-sanitize date/time values if they are Excel serials/dates
                        if (newRow.date) newRow.date = parseDateValue(newRow.date);
                        if (newRow.match_date) newRow.match_date = parseDateValue(newRow.match_date);
                        if (newRow.time) newRow.time = parseTimeValue(newRow.time);
                        return newRow;
                    });

                    // Send raw rows to backend for matching and validation
                    const response = await api.previewSpreadsheetFixtures(formattedRawRows);

                    if (response && response.rows) {
                        setParsedRows(response.rows);
                        setStep(2);
                        showToast(`Successfully parsed and matched ${response.rows.length} fixture rows.`);
                    } else {
                        showToast("Invalid response received from server preview.", "error");
                    }
                } catch (parseErr) {
                    console.error("Workbook parse or preview error:", parseErr);
                    showToast("Failed to process spreadsheet structure.", "error");
                } finally {
                    setLoading(false);
                }
            };

            reader.readAsArrayBuffer(file);
        } catch (libErr) {
            console.error("Library load error:", libErr);
            showToast("Failed to load spreadsheet parser.", "error");
            setLoading(false);
        }
    };

    const handleRowToggle = (id) => {
        setParsedRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
        );
    };

    const handleCommitImport = async () => {
        const selectedRows = parsedRows.filter((r) => r.selected && !r.clashReason);
        if (selectedRows.length === 0) {
            showToast("No valid rows selected for import.", "error");
            return;
        }

        setLoading(true);
        try {
            // SINGLE API CALL replacing the loop!
            const result = await api.commitImportedFixtures(selectedRows);

            showToast(`Successfully imported ${result.synced_count + result.updated_count} fixtures!`);
            setStep(3);
            if (onImportComplete) onImportComplete();
        } catch (err) {
            console.error("Import commit failed:", err);
            showToast("Failed to commit imported fixtures.", "error");
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
                        <FileSpreadsheet size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-display text-slate-100">
                            Fixture Spreadsheet Import
                        </h2>
                        <p className="text-sm text-slate-400">
                            Upload .xlsx or .csv spreadsheets for automated backend matching and review.
                        </p>
                    </div>
                </div>
            </div>

            {/* Step 1: Upload View */}
            {step === 1 && (
                <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center space-y-6">
                    <div className="max-w-md mx-auto space-y-3">
                        <div
                            onClick={() => !loading && fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-900/50 p-10 rounded-2xl cursor-pointer transition flex flex-col items-center space-y-3 group"
                        >
                            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
                                <Upload size={32} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-200">
                                    {loading ? "Analyzing & Matching..." : "Click to upload .xlsx or .csv spreadsheet"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Required columns: team, opponent, date, time, pitch_preference
                                </p>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>
                </div>
            )}

            {/* Step 2: Preview & Interactive Mapping */}
            {step === 2 && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-bold text-slate-200 font-display">
                            Review & Adjust Mappings ({parsedRows.length} rows found)
                        </h3>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setStep(1)}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold font-display border border-slate-700/60 hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-[0.97]"
                            >
                                Back / Upload Another
                            </button>
                            <button
                                onClick={handleCommitImport}
                                disabled={loading || parsedRows.filter((r) => r.selected).length === 0}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold font-display text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-[0.97] disabled:opacity-50"
                            >
                                <span>{loading ? "Importing..." : "Confirm & Import Selected"}</span>
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
                                                Raw: <span className="text-slate-200 font-medium">{row.teamNameRaw}</span>
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
                                        <td className="px-4 py-3">
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
                <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center space-y-6">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                        <Check size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold font-display text-slate-100">
                            Import Completed Successfully!
                        </h3>
                        <p className="text-sm text-slate-400">
                            All selected fixtures and approved pitch bookings have been recorded.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setStep(1);
                            setParsedRows([]);
                        }}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm rounded-xl hover:from-emerald-400 hover:to-teal-400 transition shadow-lg shadow-emerald-500/25"
                    >
                        Import Another Spreadsheet
                    </button>
                </div>
            )}
        </div>
    );
}