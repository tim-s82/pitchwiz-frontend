import React from "react";
import { Calendar, ChevronLeft, ChevronRight, Filter, CheckCircle2 } from "lucide-react";

export default function CalendarToolbar({
  startDateStr,
  onShiftWeek,
  sortedVenues,
  selectedVenueId,
  setSelectedVenueId,
  sortedTeams,
  selectedTeamId,
  setSelectedTeamId,
  selectedStatus,
  setSelectedStatus,
  viewMode,
  setViewMode,
  mobileLayoutMode,
  setMobileLayoutMode,
  filteredTeam,
  pitchLengths,
}) {
  return (
    <div className="space-y-4">
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Week navigation (Desktop) */}
        <div className="hidden md:flex items-center space-x-3">
          <button
            onClick={() => onShiftWeek(-1)}
            className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-[0.97]"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center space-x-2 text-lg font-semibold tracking-wide font-display text-slate-100 px-2">
            <Calendar className="text-emerald-500" size={22} />
            <span>
              Week Starting{" "}
              {new Date(startDateStr).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <button
            onClick={() => onShiftWeek(1)}
            className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-[0.97]"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Mobile Layout Switcher */}
        <div className="flex md:hidden flex-col gap-2 w-full">
          <div className="flex items-center justify-between bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMobileLayoutMode("singleDay")}
              className={`flex-1 py-1.5 text-xs font-semibold font-display rounded-lg transition-all ${mobileLayoutMode === "singleDay"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
            >
              Single Day View
            </button>
            <button
              onClick={() => setMobileLayoutMode("singlePitch")}
              className={`flex-1 py-1.5 text-xs font-semibold font-display rounded-lg transition-all ${mobileLayoutMode === "singlePitch"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
            >
              Single Pitch View
            </button>
          </div>
        </div>

        {/* Filters and View Toggles */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="hidden md:flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode("transposed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition-all ${viewMode === "transposed"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
            >
              Pitches Across
            </button>
            <button
              onClick={() => setViewMode("standard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition-all ${viewMode === "standard"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
            >
              Days Across
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
            {/* Sorted Venue Dropdown */}
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-slate-400 shrink-0" />
              <select
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(e.target.value)}
                className="bg-slate-800 text-slate-200 text-sm rounded-xl py-2 px-3 outline-none border border-slate-700 w-full focus:border-emerald-500"
              >
                {sortedVenues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorted Team Dropdown */}
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-slate-800 text-slate-200 text-sm rounded-xl py-2 px-3 outline-none border border-slate-700 w-full focus:border-emerald-500"
            >
              <option value="all">Filter by Team</option>
              {sortedTeams
                .filter((t) => !t.is_external)
                .map((t) => {
                  const length = pitchLengths.find(
                    (l) => l.id === t.required_length
                  );
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} ({length ? `${length.length_yards}y` : "No length"})
                    </option>
                  );
                })}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 text-slate-200 text-sm rounded-xl py-2 px-3 outline-none border border-slate-700 w-full focus:border-emerald-500"
            >
              <option value="all">All Booking Statuses</option>
              <option value="APPROVED">Confirmed Only</option>
              <option value="PENDING">Pending Only</option>
            </select>
          </div>
        </div>
      </div>

      {filteredTeam && (
        <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl flex items-center space-x-3 text-emerald-300 text-sm">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>
            Filtering pitches compatible with <strong>{filteredTeam.name}</strong> (Requires{" "}
            <strong>
              {pitchLengths.find((l) => l.id === filteredTeam.required_length)?.length_yards} Yards
            </strong>{" "}
            strip). Unsupported pitches are hidden.
          </span>
        </div>
      )}
    </div>
  );
}
