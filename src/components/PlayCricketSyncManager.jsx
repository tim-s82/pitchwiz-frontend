import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
    CloudDownload,
    Check,
    AlertTriangle,
    RefreshCw,
    Calendar,
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

export default function PlayCricketSyncManager({
    teams: initialTeams = [],
    pitches: initialPitches = [],
    venues: initialVenues = [],
    onSyncComplete,
}) {
    const [season, setSeason] = useState(new Date().getFullYear());
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Dropdown reference data
    const [teams, setTeams] = useState(initialTeams);
    const [pitches, setPitches] = useState(initialPitches);
    const [venues, setVenues] = useState(initialVenues);

    // Refresh & matching state
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialTeams.length, initialPitches.length, initialVenues.length]);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Step 1: Initial fetch from Play-Cricket
    const handleFetchPreview = async () => {
        setLoading(true);
        try {
            const res = await api.previewPlayCricketFixtures(season);
            if (res && res.success) {
                const teamsFound = res.detected_teams || [];
                setDetectedTeams(teamsFound);
                setSelectedTeamIds(teamsFound.map((t) => t.team_id));
                setParsedRows(res.rows || []);
                setStep(2);
                showToast(`Found ${teamsFound.length} teams and ${res.rows?.length || 0} fixtures in Play-Cricket.`);
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

    // Step 2: Team toggle handlers
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

    // Step 2 -> Step 3: Proceed to review with selected teams
    const handleProceedToReview = async () => {
        if (selectedTeamIds.length === 0) {
            showToast("Please select at least one team to proceed.", "error");
            return;
        }

        setLoading(true);
        try {
            const res = await api.previewPlayCricketFixtures(season, selectedTeamIds);
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

    // Step 3: Row toggle and modification handlers
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

    const handleCommitSync = async () => {
        const selectedRows = parsedRows.filter((r) => r.selected && !r.clashReason);
        if (selectedRows.length === 0) {
            showToast("No valid rows selected for sync.", "error");
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
                `Synced ${result.synced_count || 0} new, updated ${result.updated_count || 0
                }, deleted ${result.deleted_count || 0} fixtures!`
            );
            setStep(4);
            if (onSyncComplete) onSyncComplete();
        } catch (err) {
            console.error("Sync commit failed:", err);
            showToast("Failed to commit synchronized fixtures.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Sorted and filtered pitches for dropdown
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

    // Counts for tab badges
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
                        <CloudDownload size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-display text-slate-100">
                            ECB Play-Cricket Synchronization & Refresh
                        </h2>
                        <p className="text-sm text-slate-400">
                            Import initial fixtures or refresh changes, moved venues, rescheduled dates, and cancellations.
                        </p>
                    </div>
                </div>
                {/* Step indicator */}
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
                    <span className={`px-2.5 py-1 rounded-lg ${step === 1 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800"}`}>1. Season</span>
                    <span>→</span>
                    <span className={`px-2.5 py-1 rounded-lg ${step === 2 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800"}`}>2. Teams</span>
                    <span>→</span>
                    <span className={`px-2.5 py-1 rounded-lg ${step === 3 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800"}`}>3. Review</span>
                    <span>→</span>
                    <span className={`px-2.5 py-1 rounded-lg ${step === 4 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800"}`}>4. Done</span>
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
                        <span>{loading ? "Fetching & Analyzing Fixtures..." : "Fetch Fixtures & Detect Teams"}</span>
                    </button>
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
                                Discovered {detectedTeams.length} club team(s) in Play-Cricket for season {season}.
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
                                        onChange={() => { }} // Managed by parent onClick
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
                                                {team.incoming_count} in Play-Cricket
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
                            <span>Back / Change Season</span>
                        </button>
                        <button
                            onClick={handleProceedToReview}
                            disabled={loading || selectedTeamIds.length === 0}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50"
                        >
                            <span>{loading ? "Loading Fixtures..." : `Proceed to Review (${selectedTeamIds.length} Teams)`}</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Review & Adjust Mappings */}
            {step === 3 && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-200 font-display">
                                Review & Confirm Fixtures ({parsedRows.length} total)
                            </h3>
                            <p className="text-xs text-slate-400">
                                Inspect additions, reschedules, deletions, and pitch allocations before confirming.
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
                                onClick={handleCommitSync}
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

                    {/* Review Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Apply</th>
                                    <th className="px-4 py-3">Change Action</th>
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
                                            {/* Checkbox */}
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

                                            {/* Action Badge */}
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

                                            {/* Team & Opponent */}
                                            <td className="px-4 py-3 space-y-1">
                                                <div className="font-semibold text-white">
                                                    {row.teamName || (teams.find((t) => t.id === row.teamId)?.name) || row.teamNameRaw}
                                                </div>
                                                <div className={`text-slate-300 ${isRemoved ? "line-through text-rose-300" : ""}`}>
                                                    vs {row.opponent}
                                                </div>
                                            </td>

                                            {/* Date & Slot */}
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

                                            {/* Ground & Pitch */}
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

                                                {/* Alternative Venue Alert & Quick Accept */}
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

                                            {/* Status / Clashes */}
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
                            Play-Cricket Synchronization Complete!
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
