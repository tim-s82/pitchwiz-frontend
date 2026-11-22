import React, { useState, useRef, useEffect } from "react";
import { api } from "../services/api";
import {
    Upload,
    FileSpreadsheet,
    Check,
    AlertTriangle,
    ArrowRight,
    ArrowLeft,
    ShieldAlert,
    Trash2,
    Clock,
    MapPin,
    CheckCircle2,
} from "lucide-react";

const formatDateWithDay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
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
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const fileInputRef = useRef(null);

    // Dropdown reference data
    const [teams, setTeams] = useState(initialTeams);
    const [pitches, setPitches] = useState(initialPitches);
    const [venues, setVenues] = useState(initialVenues);

    // Refresh & matching state
    const [rawRowsCache, setRawRowsCache] = useState([]);
    const [inferredSeason, setInferredSeason] = useState(new Date().getFullYear());
    const [detectedTeams, setDetectedTeams] = useState([]);
    const [selectedTeamIds, setSelectedTeamIds] = useState([]);
    const [parsedRows, setParsedRows] = useState([]);
    const [filterTab, setFilterTab] = useState("all");
    const [syncSummary, setSyncSummary] = useState({ synced: 0, updated: 0, deleted: 0 });

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
    }, [initialTeams, initialPitches, initialVenues]);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

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

                    const formattedRawRows = rawData.map((row) => {
                        const newRow = {};
                        Object.keys(row).forEach((k) => {
                            newRow[k] = row[k];
                        });
                        if (newRow.date) newRow.date = parseDateValue(newRow.date);
                        if (newRow.match_date) newRow.match_date = parseDateValue(newRow.match_date);
                        if (newRow.time) newRow.time = parseTimeValue(newRow.time);
                        return newRow;
                    });

                    setRawRowsCache(formattedRawRows);

                    const response = await api.previewSpreadsheetFixtures(formattedRawRows);
                    if (response && response.success) {
                        const teamsFound = response.detected_teams || [];
                        setInferredSeason(response.inferred_season || new Date().getFullYear());
                        setDetectedTeams(teamsFound);
                        setSelectedTeamIds(teamsFound.map((t) => t.team_id));
                        setParsedRows(response.rows || []);
                        setStep(2);
                        showToast(`Parsed spreadsheet: detected ${teamsFound.length} team(s) for season ${response.inferred_season || ""}.`);
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

    const handleToggleTeam = (teamId) => {
        setSelectedTeamIds((prev) =>
            prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
        );
    };

    const handleSelectAllTeams = () => {
        setSelectedTeamIds(detectedTeams.map((t) => t.team_id));
    };

    const handleDeselectAllTeams = () => {
        setSelectedTeamIds([]);
    };

    const handleProceedToReview = async () => {
        if (selectedTeamIds.length === 0) {
            showToast("Please select at least one team to proceed.", "error");
            return;
        }

        setLoading(true);
        try {
            const res = await api.previewSpreadsheetFixtures(rawRowsCache, selectedTeamIds);
            if (res && res.rows) {
                setParsedRows(res.rows);
                setStep(3);
                showToast(`Reviewing fixtures for ${selectedTeamIds.length} selected team(s).`);
            }
        } catch (err) {
            console.error("Failed to load fixtures for selected teams:", err);
            showToast("Failed to load selected teams fixtures.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRowToggle = (id) => {
        setParsedRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
        );
    };

    const handleAcceptSuggestion = (rowId, suggestedPitchId) => {
        setParsedRows((prev) =>
            prev.map((r) =>
                r.id === rowId
                    ? {
                        ...r,
                        pitchId: suggestedPitchId,
                        venueClash: false,
                        clashReason: null,
                        selected: true,
                    }
                    : r
            )
        );
        showToast("Accepted alternative venue pitch suggestion.");
    };

    const handleCommitImport = async () => {
        const selectedRows = parsedRows.filter((r) => r.selected && !r.clashReason);
        if (selectedRows.length === 0) {
            showToast("No valid rows selected for import.", "error");
            return;
        }

        setLoading(true);
        try {
            const result = await api.commitImportedFixtures(selectedRows);
            setSyncSummary({
                synced: result.synced_count || 0,
                updated: result.updated_count || 0,
                deleted: result.deleted_count || 0,
            });
            showToast(
                `Imported ${result.synced_count || 0} new, updated ${result.updated_count || 0
                }, deleted ${result.deleted_count || 0} fixtures!`
            );
            setStep(4);
            if (onImportComplete) onImportComplete();
        } catch (err) {
            console.error("Import commit failed:", err);
            showToast("Failed to commit imported fixtures.", "error");
        } finally {
            setLoading(false);
        }
    };

    const displayPitches = pitches
        .filter((p) => ["MAIN", "YOUTH"].includes((p.entity_type || "").toUpperCase()))
        .sort((a, b) => {
            const vA = venues.find((v) => v.id === a.venue) || {};
            const vB = venues.find((v) => v.id === b.venue) || {};

            const aDef = vA.is_default ? 1 : 0;
            const bDef = vB.is_default ? 1 : 0;
            if (aDef !== bDef) return bDef - aDef;

            const vNameA = vA.name || "";
            const vNameB = vB.name || "";
            const vComp = vNameA.localeCompare(vNameB);
            if (vComp !== 0) return vComp;

            const eA = (a.entity_type || "").toUpperCase();
            const eB = (b.entity_type || "").toUpperCase();
            const eWeightA = eA === "MAIN" ? 1 : eA === "YOUTH" ? 2 : 3;
            const eWeightB = eB === "MAIN" ? 1 : eB === "YOUTH" ? 2 : 3;
            if (eWeightA !== eWeightB) return eWeightA - eWeightB;

            const pNameA = a.name || "";
            const pNameB = b.name || "";
            return pNameA.localeCompare(pNameB);
        });

    const countNew = parsedRows.filter((r) => r.action === "NEW").length;
    const countRescheduled = parsedRows.filter((r) => r.action === "RESCHEDULED").length;
    const countClashes = parsedRows.filter((r) => r.venueClash || r.clashReason).length;
    const countRemoved = parsedRows.filter((r) => r.action === "REMOVED").length;
    const countUnchanged = parsedRows.filter((r) => r.action === "UNCHANGED").length;

    const filteredRows = parsedRows.filter((row) => {
        if (filterTab === "new") return row.action === "NEW";
        if (filterTab === "rescheduled") return row.action === "RESCHEDULED";
        if (filterTab === "clashes") return row.venueClash || row.clashReason;
        if (filterTab === "removed") return row.action === "REMOVED";
        if (filterTab === "unchanged") return row.action === "UNCHANGED";
        return true;
    });

    const selectedCount = parsedRows.filter((r) => r.selected && !r.clashReason).length;
    const selectedDeletions = parsedRows.filter((r) => r.selected && r.action === "REMOVED").length;

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
                            Fixture Spreadsheet Import & Refresh
                        </h2>
                        <p className="text-sm text-slate-400">
                            Upload spreadsheets for automated matching, rescheduling detection, and deletion review.
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
                    <span className={`px-2.5 py-1 rounded-lg ${step === 1 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800"}`}>1. Upload</span>
                    <span>→</span>
                    <span className={`px-2.5 py-1 rounded-lg ${step === 2 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800"}`}>2. Teams</span>
                    <span>→</span>
                    <span className={`px-2.5 py-1 rounded-lg ${step === 3 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800"}`}>3. Review</span>
                    <span>→</span>
                    <span className={`px-2.5 py-1 rounded-lg ${step === 4 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800"}`}>4. Done</span>
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
                                    {loading ? "Analyzing & Matching Spreadsheet..." : "Click to upload .xlsx or .csv spreadsheet"}
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

            {/* Step 2: Team Selection */}
            {step === 2 && (
                <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6 max-w-3xl mx-auto">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-100 font-display">
                                Select Teams to Import or Refresh
                            </h3>
                            <p className="text-xs text-slate-400">
                                Inferred Season: <b className="text-emerald-400">{inferredSeason}</b> — Discovered {detectedTeams.length} club team(s) in spreadsheet.
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleSelectAllTeams}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                            >
                                Select All
                            </button>
                            <button
                                onClick={handleDeselectAllTeams}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {detectedTeams.map((team) => {
                            const isSelected = selectedTeamIds.includes(team.team_id);
                            return (
                                <div
                                    key={team.team_id}
                                    onClick={() => handleToggleTeam(team.team_id)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${isSelected
                                        ? "bg-emerald-950/20 border-emerald-500/40 shadow-sm"
                                        : "bg-slate-900/40 border-slate-800 opacity-60 hover:opacity-100"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => { }}
                                        className="mt-1 rounded text-emerald-500 bg-slate-950 border-slate-700"
                                    />
                                    <div className="space-y-1">
                                        <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                                            {team.team_name}
                                            {team.ambiguous && (
                                                <AlertTriangle size={14} className="text-amber-400" title="Near-match team name" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                                                {team.incoming_count} in Spreadsheet
                                            </span>
                                            <span className="text-slate-500">
                                                ({team.existing_count} existing in DB)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                        <button
                            onClick={() => setStep(1)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
                        >
                            <ArrowLeft size={16} />
                            <span>Back / Upload Another</span>
                        </button>
                        <button
                            onClick={handleProceedToReview}
                            disabled={loading || selectedTeamIds.length === 0}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
                        >
                            <span>{loading ? "Matching..." : `Proceed to Review (${selectedTeamIds.length} Teams)`}</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Review Table */}
            {step === 3 && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-200 font-display">
                                Review & Confirm Spreadsheet Fixtures ({parsedRows.length} total)
                            </h3>
                            <p className="text-xs text-slate-400">
                                Check detected additions, reschedules, deletions, and pitch assignments before applying.
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setStep(2)}
                                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                            >
                                Back to Teams
                            </button>
                            <button
                                onClick={handleCommitImport}
                                disabled={loading || selectedCount === 0}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
                            >
                                <span>
                                    {loading
                                        ? "Applying Changes..."
                                        : `Confirm & Apply (${selectedCount} selected${selectedDeletions > 0 ? `, ${selectedDeletions} deletions` : ""})`}
                                </span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs">
                        {[
                            { key: "all", label: `All (${parsedRows.length})` },
                            { key: "new", label: `New (${countNew})`, count: countNew },
                            { key: "rescheduled", label: `Rescheduled (${countRescheduled})`, count: countRescheduled },
                            { key: "clashes", label: `Clashes / Suggestions (${countClashes})`, count: countClashes },
                            { key: "removed", label: `Deletions (${countRemoved})`, count: countRemoved },
                            { key: "unchanged", label: `Unchanged (${countUnchanged})`, count: countUnchanged },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilterTab(tab.key)}
                                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${filterTab === tab.key
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Apply</th>
                                    <th className="px-4 py-3">Action</th>
                                    <th className="px-4 py-3">Team & Opponent</th>
                                    <th className="px-4 py-3">Date & Slot</th>
                                    <th className="px-4 py-3">Ground / Pitch Allocation</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                                {filteredRows.map((row) => {
                                    const isRemoved = row.action === "REMOVED";
                                    const isRescheduled = row.action === "RESCHEDULED";
                                    const isNew = row.action === "NEW";

                                    return (
                                        <tr
                                            key={row.id}
                                            className={`hover:bg-slate-800/20 transition ${isRemoved
                                                ? "bg-rose-950/20 text-rose-200"
                                                : row.venueClash || row.clashReason
                                                    ? "bg-amber-950/20"
                                                    : ""
                                                }`}
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={row.selected}
                                                    disabled={Boolean(row.clashReason && !row.venueClash)}
                                                    onChange={() => handleRowToggle(row.id)}
                                                    className={`rounded text-emerald-500 bg-slate-950 border-slate-700 ${isRemoved ? "accent-rose-500" : ""
                                                        }`}
                                                />
                                            </td>

                                            <td className="px-4 py-3">
                                                {isNew && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                        New
                                                    </span>
                                                )}
                                                {isRescheduled && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                        Rescheduled
                                                    </span>
                                                )}
                                                {isRemoved && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                                        <Trash2 size={11} /> Delete
                                                    </span>
                                                )}
                                                {row.action === "UNCHANGED" && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                                                        Unchanged
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 space-y-1">
                                                <div className="font-semibold text-white">
                                                    {row.teamName || (teams.find((t) => t.id === row.teamId)?.name) || row.teamNameRaw}
                                                </div>
                                                <div className={`text-slate-300 ${isRemoved ? "line-through text-rose-300" : ""}`}>
                                                    vs {row.opponent}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                {isRescheduled && row.oldDate ? (
                                                    <div className="space-y-0.5">
                                                        <div className="text-[10px] text-slate-500 line-through">
                                                            Was: {formatDateWithDay(row.oldDate)}
                                                        </div>
                                                        <div className="text-amber-400 font-semibold flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {formatDateWithDay(row.date)}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400">
                                                            {row.time} ({row.timeSlot})
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className={isRemoved ? "line-through text-rose-300" : ""}>
                                                            {formatDateWithDay(row.date)}
                                                        </div>
                                                        <span className="text-[10px] text-emerald-400">
                                                            {row.time} ({row.timeSlot})
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 space-y-1">
                                                <div className="text-slate-400 text-[10px] flex items-center gap-1">
                                                    <MapPin size={11} />
                                                    Ground: <span className="text-slate-200">{row.pitchPref || "Unspecified"}</span>
                                                    {row.pitchPreserved && (
                                                        <span className="ml-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                            Pitch Preserved
                                                        </span>
                                                    )}
                                                </div>

                                                {row.venueClash && row.suggestedPitchId && (
                                                    <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-900/50 space-y-1 text-[11px]">
                                                        <div className="text-amber-300 font-medium">
                                                            ⚠️ Target venue full.
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-slate-300 text-[10px]">
                                                                Suggested: <b className="text-white">{row.suggestedPitchName}</b>
                                                            </span>
                                                            <button
                                                                onClick={() => handleAcceptSuggestion(row.id, row.suggestedPitchId)}
                                                                className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[10px] transition"
                                                            >
                                                                Accept
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {!isRemoved && (
                                                    <select
                                                        value={row.pitchId || ""}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value, 10);
                                                            setParsedRows((prev) =>
                                                                prev.map((p) =>
                                                                    p.id === row.id
                                                                        ? {
                                                                            ...p,
                                                                            pitchId: val,
                                                                            venueClash: false,
                                                                            clashReason: null,
                                                                        }
                                                                        : p
                                                                )
                                                            );
                                                        }}
                                                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500 w-full"
                                                    >
                                                        <option value="">-- Select Pitch --</option>
                                                        {displayPitches.map((p) => {
                                                            const vObj = venues.find((v) => v.id === p.venue);
                                                            return (
                                                                <option key={p.id} value={p.id}>
                                                                    {vObj ? `${vObj.name} - ${p.name}` : p.name}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                {isRemoved ? (
                                                    <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded">
                                                        <Trash2 size={11} /> Will be deleted
                                                    </span>
                                                ) : row.clashReason ? (
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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Step 4: Success View */}
            {step === 4 && (
                <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center space-y-6 max-w-xl mx-auto">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                        <CheckCircle2 size={36} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold font-display text-slate-100">
                            Spreadsheet Import & Refresh Complete!
                        </h3>
                        <p className="text-sm text-slate-400">
                            The database has been updated with your synchronized changes:
                        </p>
                        <div className="flex justify-center items-center gap-4 pt-2">
                            <span className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-semibold px-3 py-1 rounded-lg text-xs">
                                {syncSummary.synced} New
                            </span>
                            <span className="bg-amber-950/40 border border-amber-500/30 text-amber-400 font-semibold px-3 py-1 rounded-lg text-xs">
                                {syncSummary.updated} Rescheduled
                            </span>
                            <span className="bg-rose-950/40 border border-rose-500/30 text-rose-400 font-semibold px-3 py-1 rounded-lg text-xs">
                                {syncSummary.deleted} Deleted
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setStep(1);
                            setParsedRows([]);
                            setDetectedTeams([]);
                            setSelectedTeamIds([]);
                            setRawRowsCache([]);
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
