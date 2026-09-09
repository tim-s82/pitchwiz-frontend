import React, { useState, useRef } from "react";
import { api } from "../services/api";
import {
    Upload,
    FileSpreadsheet,
    Check,
    AlertTriangle,
    X,
    ArrowRight,
    ShieldAlert,
    Calendar,
} from "lucide-react";

export default function FixtureImportManager({
    teams,
    pitches,
    venues,
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

    // Normalizer for smart matching
    const normalizeText = (str) => {
        if (!str) return "";
        return String(str)
            .toLowerCase()
            .replace(/\bfirst\b/g, "1st")
            .replace(/\bsecond\b/g, "2nd")
            .replace(/\bthird\b/g, "3rd")
            .replace(/\bfourth\b/g, "4th")
            .replace(/[^\w\s]/g, " ");
    };

    // Smart Team Matcher with ambiguity detection
    const findBestTeamMatch = (importedName, teamsList) => {
        const normImported = normalizeText(importedName);
        const importedTokens = new Set(normImported.split(/\s+/).filter(Boolean));

        let matches = [];
        for (const team of teamsList) {
            const normTeam = normalizeText(team.name);
            const teamTokens = new Set(normTeam.split(/\s+/).filter(Boolean));

            if (normTeam === normImported) {
                matches.push({ team, score: 100 });
                continue;
            }

            let intersectionCount = 0;
            for (const token of importedTokens) {
                if (teamTokens.has(token)) intersectionCount++;
            }

            if (intersectionCount === importedTokens.size && importedTokens.size > 0) {
                matches.push({ team, score: 80 + intersectionCount });
            } else if (intersectionCount > 0) {
                matches.push({ team, score: intersectionCount * 10 });
            }
        }

        matches.sort((a, b) => b.score - a.score);

        if (matches.length === 0) {
            return { defaultId: teamsList[0]?.id || null, ambiguous: false };
        }

        const topScore = matches[0].score;
        const topCandidates = matches.filter((m) => m.score === topScore);
        const isAmbiguous = topCandidates.length > 1 || (matches.length > 1 && matches[0].score - matches[1].score < 5);

        return {
            defaultId: matches[0].team.id,
            ambiguous: isAmbiguous,
        };
    };

    // Smart Pitch Matcher combining venue and pitch names
    const findBestPitchMatch = (importedPitchStr, pitchesList, venuesList) => {
        if (!importedPitchStr) return pitchesList[0]?.id || null;
        const normImported = normalizeText(importedPitchStr);
        const importedTokens = new Set(normImported.split(/\s+/).filter(Boolean));

        let bestPitchId = null;
        let maxScore = -1;

        for (const pitch of pitchesList) {
            const venueObj = venuesList.find((v) => v.id === pitch.venue);
            const venueName = venueObj ? venueObj.name : "";
            const fullPitchStr = `${venueName} ${pitch.name}`;
            const normFull = normalizeText(fullPitchStr);
            const pitchTokens = new Set(normFull.split(/\s+/).filter(Boolean));

            let score = 0;
            for (const token of importedTokens) {
                if (pitchTokens.has(token)) {
                    score += 15;
                }
            }

            if (normFull.includes(normImported) || normImported.includes(normFull)) {
                score += 50;
            }

            if (score > maxScore) {
                maxScore = score;
                bestPitchId = pitch.id;
            }
        }

        return bestPitchId || pitchesList[0]?.id || null;
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
            // Excel decimal fraction of a day
            const totalSeconds = Math.round(timeVal * 86400);
            const hours = String(Math.floor(totalSeconds / 3600) % 24).padStart(2, "0");
            const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
            return `${hours}:${minutes}`;
        }
        const cleanStr = String(timeVal).trim();
        return cleanStr || "14:00";
    };

    // Helper: Derive time slot from absolute time string
    const deriveTimeSlot = (timeStr) => {
        if (!timeStr) return "AFTERNOON";
        const hour = parseInt(timeStr.split(":")[0], 10);
        if (isNaN(hour)) return "AFTERNOON";
        if (hour < 12) return "MORNING";
        if (hour >= 17) return "EVENING";
        return "AFTERNOON";
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const XLSX = await loadXLSXLibrary();
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: "array", cellDates: true });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                    if (rawData.length === 0) {
                        showToast("The uploaded file appears empty.", "error");
                        return;
                    }

                    const processed = rawData.map((row, index) => {
                        const normRow = {};
                        Object.keys(row).forEach((k) => {
                            const cleanKey = k.trim().toLowerCase().replace(/[\s_-]+/g, "_");
                            normRow[cleanKey] = row[k];
                        });

                        const teamNameRaw = String(normRow.team || normRow.club_team || normRow.club || "").trim();
                        const opponent = String(normRow.opponent || normRow.opposition || "").trim();
                        const date = parseDateValue(normRow.date || normRow.match_date || normRow.day);
                        const time = parseTimeValue(normRow.time || normRow.start_time || normRow.match_time);
                        const pitchPref = String(normRow.pitch_preference || normRow.pitch || normRow.venue || "").trim();

                        const teamMatch = findBestTeamMatch(teamNameRaw, teams);
                        const matchedPitchId = findBestPitchMatch(pitchPref, pitches, venues);
                        const timeSlot = deriveTimeSlot(time);

                        let clashReason = null;
                        if (!teamNameRaw) clashReason = "Missing team name";
                        else if (!opponent) clashReason = "Missing opponent name";
                        else if (!date) clashReason = "Missing match date";

                        return {
                            id: index,
                            teamNameRaw,
                            teamId: teamMatch.defaultId,
                            teamAmbiguous: teamMatch.ambiguous,
                            opponent,
                            date,
                            time,
                            timeSlot,
                            pitchPref,
                            pitchId: matchedPitchId,
                            clashReason,
                            selected: !clashReason,
                        };
                    });

                    setParsedRows(processed);
                    setStep(2);
                    showToast(`Successfully parsed ${processed.length} fixture rows.`);
                } catch (parseErr) {
                    console.error("Workbook parse error:", parseErr);
                    showToast("Failed to read spreadsheet structure.", "error");
                }
            };

            reader.readAsArrayBuffer(file);
        } catch (libErr) {
            console.error("Library load error:", libErr);
            showToast("Failed to load spreadsheet parser.", "error");
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
            for (const row of selectedRows) {
                const fixturePayload = {
                    team: row.teamId,
                    opponent: row.opponent,
                    start_date: row.date,
                    end_date: row.date,
                };
                const createdFixture = await api.createFixture(fixturePayload);

                const bookingPayload = {
                    fixture: createdFixture.id,
                    pitch: row.pitchId,
                    start_date: row.date,
                    end_date: row.date,
                    time_slot: row.timeSlot,
                    status: "APPROVED",
                    notes: `Imported via spreadsheet (Time: ${row.time})`,
                };
                await api.createBooking(bookingPayload);
            }

            showToast(`Successfully imported ${selectedRows.length} fixtures!`);
            setStep(3);
            if (onImportComplete) onImportComplete();
        } catch (err) {
            console.error("Import commit failed:", err);
            showToast("Failed to commit imported fixtures.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-semibold ${toast.type === "error"
                        ? "bg-rose-500 text-white"
                        : "bg-emerald-500 text-slate-950"
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
                            Upload .xlsx or .csv spreadsheets with smart team and pitch matching.
                        </p>
                    </div>
                </div>
            </div>

            {/* Step 1: Upload View */}
            {step === 1 && (
                <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center space-y-6">
                    <div className="max-w-md mx-auto space-y-3">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-900/50 p-10 rounded-2xl cursor-pointer transition flex flex-col items-center space-y-3 group"
                        >
                            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
                                <Upload size={32} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-200">
                                    Click to upload .xlsx or .csv spreadsheet
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
                                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition"
                            >
                                Back / Upload Another
                            </button>
                            <button
                                onClick={handleCommitImport}
                                disabled={loading || parsedRows.filter((r) => r.selected).length === 0}
                                className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition disabled:opacity-50 flex items-center space-x-2"
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
                                    <th className="px-4 py-3">Spreadsheet Team $\rightarrow$ Matched Team</th>
                                    <th className="px-4 py-3">Opponent</th>
                                    <th className="px-4 py-3">Date & Slot</th>
                                    <th className="px-4 py-3">Assigned Pitch</th>
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
                                                        title="Multiple similar teams found. Please verify the selected team."
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
                <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center space-y-6">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                        <Check size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold font-display text-slate-100">
                            Import Completed Successfully!
                        </h3>
                        <p className="text-sm text-slate-400">
                            All selected fixtures and approved pitch bookings have been recorded in PitchWiz.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setStep(1);
                            setParsedRows([]);
                        }}
                        className="px-6 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition"
                    >
                        Import Another Spreadsheet
                    </button>
                </div>
            )}
        </div>
    );
}