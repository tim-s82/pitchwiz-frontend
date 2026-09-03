import React, { useState } from "react";
import { api } from "../services/api";
import {
    CloudDownload,
    Check,
    AlertTriangle,
    RefreshCw,
    Calendar,
    ShieldCheck,
    ArrowRight,
} from "lucide-react";

export default function PlayCricketSyncManager({ onSyncComplete }) {
    const [season, setSeason] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleRunSync = async () => {
        setLoading(true);
        setSyncResult(null);
        try {
            const res = await api.syncPlayCricketFixtures(season);
            setSyncResult(res);
            showToast("Play-Cricket sync completed successfully!");
            if (onSyncComplete) onSyncComplete();
        } catch (err) {
            console.error("Play-Cricket sync failed:", err);
            showToast(err.message || "Failed to synchronize with Play-Cricket.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Toast Notification */}
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
                        <CloudDownload size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-display text-slate-100">
                            ECB Play-Cricket Synchronization
                        </h2>
                        <p className="text-sm text-slate-400">
                            Directly fetch and update official club fixtures using your configured Play-Cricket API key.
                        </p>
                    </div>
                </div>
            </div>

            {/* Control Card */}
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 w-full sm:w-auto">
                        <label className="block text-xs font-medium text-slate-400">
                            Select Season Year
                        </label>
                        <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-emerald-400" />
                            <input
                                type="number"
                                value={season}
                                onChange={(e) => setSeason(parseInt(e.target.value, 10) || new Date().getFullYear())}
                                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 w-32 outline-none focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleRunSync}
                        disabled={loading}
                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold font-display rounded-xl hover:from-emerald-500 hover:to-teal-500 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        <span>{loading ? "Synchronizing..." : "Sync with Play-Cricket"}</span>
                    </button>
                </div>

                {/* Sync Summary Results */}
                {syncResult && (
                    <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 animate-in fade-in duration-300">
                        <h3 className="text-sm font-bold font-display uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-400" />
                            Sync Execution Summary
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
                                <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">New Fixtures Added</span>
                                <span className="text-2xl font-bold font-display text-emerald-400">{syncResult.synced_count}</span>
                            </div>
                            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
                                <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Fixtures Updated</span>
                                <span className="text-2xl font-bold font-display text-teal-400">{syncResult.updated_count}</span>
                            </div>
                            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
                                <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Skipped (Unmatched Teams)</span>
                                <span className="text-2xl font-bold font-display text-amber-400">{syncResult.skipped_count}</span>
                            </div>
                        </div>

                        {syncResult.errors && syncResult.errors.length > 0 && (
                            <div className="mt-4 p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
                                    Warnings & Errors ({syncResult.errors.length})
                                </span>
                                <ul className="text-xs text-rose-300 space-y-1 max-h-32 overflow-y-auto">
                                    {syncResult.errors.map((err, idx) => (
                                        <li key={idx}>• {err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}