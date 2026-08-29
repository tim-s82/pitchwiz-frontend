import React, { useState, useMemo, useEffect } from "react";
import { api } from "../services/api";
import {
  Calendar,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Pencil,
  Trash2,
  Shovel,
  Smartphone,
  Monitor,
} from "lucide-react";

export default function CalendarView({
  venues,
  pitches,
  teams,
  fixtures,
  bookings,
  pitchLengths,
  onBookingCreated,
  onBookingUpdated,
  onBookingDeleted,
  currentUser,
}) {
  const [selectedVenueId, setSelectedVenueId] = useState("all");
  const [selectedTeamId, setSelectedTeamId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState("transposed"); // 'standard' (pitches down) or 'transposed' (pitches across)

  // Mobile-specific layout toggles & selectors
  const [mobileLayoutMode, setMobileLayoutMode] = useState("singleDay"); // 'singleDay' or 'singlePitch'
  const [mobileSelectedDateStr, setMobileSelectedDateStr] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [mobileSelectedPitchId, setMobileSelectedPitchId] = useState("");

  // Date range state: start at current week or today
  const [startDateStr, setStartDateStr] = useState(() => {
    const today = new Date();
    // Default to current Monday
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split("T")[0];
  });

  // Modal State (create)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    pitchId: "",
    date: "",
    timeSlot: "ALL_DAY",
    teamId: "",
    opponent: "",
    requiresTeas: false,
    requiresDrinks: false,
    notes: "",
    isMultiDay: false,
    endDate: "",
  });

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null); // the booking being edited
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (venues.length > 0 && selectedVenueId === "all") {
      setSelectedVenueId(venues[0].id.toString());
    }
  }, [venues, selectedVenueId]);

  // Find compatible pitch lengths for the filtered team
  const filteredTeam = useMemo(() => {
    if (selectedTeamId === "all") return null;
    return teams.find((t) => t.id === parseInt(selectedTeamId));
  }, [selectedTeamId, teams]);

  // Filter Pitches based on venue and selected team compatibility
  const filteredPitches = useMemo(() => {
    const filtered = pitches.filter((pitch) => {
      // 1. Venue Filter
      if (
        selectedVenueId !== "all" &&
        pitch.venue !== parseInt(selectedVenueId)
      ) {
        return false;
      }
      // 2. Team Length Compatibility Filter
      if (filteredTeam && filteredTeam.required_length) {
        if (!pitch.supported_lengths.includes(filteredTeam.required_length)) {
          return false;
        }
      }
      return true;
    });

    // Sort alphabetically by Venue Name, then by Pitch Name
    return [...filtered].sort((a, b) => {
      const venueA = venues.find((v) => v.id === a.venue)?.name || "";
      const venueB = venues.find((v) => v.id === b.venue)?.name || "";
      const venueCompare = venueA.localeCompare(venueB, undefined, {
        sensitivity: "base",
        numeric: true,
      });
      if (venueCompare !== 0) return venueCompare;
      return a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });
  }, [pitches, selectedVenueId, filteredTeam, venues]);

  // Set default mobile pitch selection if empty
  useEffect(() => {
    if (filteredPitches.length > 0 && !mobileSelectedPitchId) {
      setMobileSelectedPitchId(filteredPitches[0].id.toString());
    }
  }, [filteredPitches, mobileSelectedPitchId]);

  // Generate 7 days starting from startDateStr
  const datesList = useMemo(() => {
    const start = new Date(startDateStr);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const isoStr = d.toISOString().split("T")[0];
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      const month = d.toLocaleDateString("en-US", { month: "short" });
      return { isoStr, label: `${weekday} ${dayNum} ${month}`, dateObj: d };
    });
  }, [startDateStr]);

  // Adjust week
  const shiftWeek = (weeks) => {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + weeks * 7);
    setStartDateStr(d.toISOString().split("T")[0]);
  };

  // Shift single day for mobile view
  const shiftMobileDay = (days) => {
    const d = new Date(mobileSelectedDateStr);
    d.setDate(d.getDate() + days);
    setMobileSelectedDateStr(d.toISOString().split("T")[0]);
  };

  // Compute allowed teams for the current user
  const allowedTeams = useMemo(() => {
    if (!currentUser) return teams;
    const hasAdminOrSec =
      currentUser.roles?.includes("ADMIN") ||
      currentUser.roles?.includes("FIXTURE_SECRETARY") ||
      currentUser.roles?.includes("USER_MANAGER");
    if (hasAdminOrSec) return teams;
    // Otherwise, only teams where user is manager
    return teams.filter((t) => t.managers?.includes(currentUser.id));
  }, [currentUser, teams]);

  // Check if a date falls within booking range
  const isDateInBooking = (dateStr, booking) => {
    return dateStr >= booking.start_date && dateStr <= booking.end_date;
  };

  // Build booking grid cell mapping: returns booking info if occupied or blocked
  const getCellStatus = (pitchId, dateStr, timeSlot) => {
    // 1. Check direct bookings on this pitch
    const directBooking = bookings.find(
      (b) =>
        b.pitch == pitchId &&
        isDateInBooking(dateStr, b) &&
        (b.time_slot === "ALL_DAY" ||
          timeSlot === "ALL_DAY" ||
          b.time_slot === timeSlot),
    );

    if (directBooking) {
      if (selectedStatus !== "all" && directBooking.status !== selectedStatus) {
        return null;
      }

      // Check if it's ground maintenance
      if (directBooking.booking_type === "GROUND_MAINTENANCE") {
        return {
          type: "BOOKED",
          booking: directBooking,
          label: directBooking.notes || "Ground Maintenance",
          status: directBooking.status,
          isMaintenance: true,
        };
      }

      // Check if it's an automatic system lock
      if (directBooking.notes?.startsWith("AUTO_LOCK:")) {
        const parts = directBooking.notes.split(":");
        const pitchName = parts[2] || "Pitch";
        return {
          type: "BLOCKED",
          label: `Blocked (${pitchName} active)`,
          reason: `Outfield overlap due to booking on ${pitchName}`,
        };
      }

      // Check if it's an automatic outfield lock from a main match
      if (directBooking.notes?.startsWith("AUTO_OUTFIELD_LOCK:")) {
        const parts = directBooking.notes.split(":");
        const pitchName = parts[2] || "Main Pitch";
        return {
          type: "BLOCKED",
          label: `Blocked (${pitchName} active)`,
          reason: `Outfield overlap due to booking on ${pitchName}`,
        };
      }

      const fixtureObj = fixtures.find((f) => f.id === directBooking.fixture);
      const teamObj = fixtureObj
        ? teams.find((t) => t.id === fixtureObj.team)
        : null;
      const label = teamObj
        ? `${teamObj.name} vs ${fixtureObj.opponent}`
        : directBooking.external_contact_name || "External Booking";

      return {
        type: "BOOKED",
        booking: directBooking,
        label,
        status: directBooking.status,
        isMaintenance: false,
        isOutfieldLock: false,
      };
    }

    // 2. Overlap Blocking Logic (Evaluated Dynamically)
    const blockingPitches = pitches.filter((p) =>
      p.blocks_pitches.includes(pitchId),
    );
    for (const bp of blockingPitches) {
      const activeBlockingBooking = bookings.find(
        (b) =>
          b.pitch === bp.id &&
          isDateInBooking(dateStr, b) &&
          b.status === "APPROVED" &&
          (b.time_slot === "ALL_DAY" ||
            timeSlot === "ALL_DAY" ||
            b.time_slot === timeSlot),
      );

      if (activeBlockingBooking) {
        if (
          activeBlockingBooking.booking_type === "GROUND_MAINTENANCE" &&
          bp.entity_type !== "OUTFIELD" &&
          bp.entity_type !== "YOUTH"
        ) {
          continue; // Skip this block
        }

        return {
          type: "BLOCKED",
          label: `Blocked (${bp.name} active)`,
          reason: `Outfield overlap due to booking on ${bp.name}`,
        };
      }
    }

    return null;
  };

  const isExternalUser = useMemo(() => {
    return currentUser?.roles?.includes("EXTERNAL");
  }, [currentUser]);

  const canEditBooking = (booking) => {
    if (!currentUser || isExternalUser) return false;
    if (
      currentUser.roles?.includes("ADMIN") ||
      currentUser.roles?.includes("FIXTURE_SECRETARY") ||
      currentUser.roles?.includes("GROUNDSTAFF")
    )
      return true;
    if (currentUser.roles?.includes("TEAM_MANAGER")) {
      if (booking.requested_by === currentUser.id) return true;
      if (booking.fixture) {
        const fix = fixtures.find((f) => f.id === booking.fixture);
        if (fix) {
          const team = teams.find((t) => t.id === fix.team);
          if (team && team.managers?.includes(currentUser.id)) return true;
        }
      }
    }
    return false;
  };

  const handleCellClick = (pitchId, dateStr, timeSlot, existingCell) => {
    // If you want external users to be able to view details without editing, remove this guard or handle separately:
    // if (isExternalUser) return; 

    // 1. Existing Booking / Blocked Slot clicked
    if (existingCell) {
      if (existingCell.type === "BLOCKED") {
        alert(existingCell.reason || "This slot is blocked due to an outfield overlap.");
        return;
      }

      if (existingCell.type === "BOOKED") {
        const b = existingCell.booking;

        // If user has edit permissions, open edit modal
        if (canEditBooking(b)) {
          const fix = b.fixture ? fixtures.find((f) => f.id === b.fixture) : null;
          setEditData(b);
          setEditForm({
            pitchId: b.pitch.toString(),
            timeSlot: b.time_slot,
            date: b.start_date,
            endDate: b.end_date,
            isMultiDay: b.start_date !== b.end_date,
            opponent: fix?.opponent || b.external_contact_name || "",
            requiresTeas: b.requires_teas,
            requiresDrinks: b.requires_drinks,
            notes: b.notes || "",
          });
          setShowDeleteConfirm(false);
          setIsEditModalOpen(true);
        } else {
          // Fallback info alert for bookings they can't edit
          alert(`Booking Details:\nStatus: ${b.status}\nNotes: ${b.notes || "None"}`);
        }
        return;
      }
    }

    // 2. Empty slot clicked -> open create modal (restricted if external)
    if (isExternalUser) {
      alert("External users cannot create bookings directly.");
      return;
    }

    setModalData({
      pitchId: pitchId.toString(),
      date: dateStr,
      timeSlot,
      teamId: selectedTeamId !== "all" ? selectedTeamId : "",
      opponent: "",
      requiresTeas: false,
      requiresDrinks: false,
      notes: "",
      isMultiDay: false,
      endDate: dateStr,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (
      !modalData.pitchId ||
      !modalData.date ||
      !modalData.teamId ||
      !modalData.opponent
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    const payload = {
      pitch: parseInt(modalData.pitchId),
      start_date: modalData.date,
      end_date: modalData.isMultiDay ? modalData.endDate : modalData.date,
      time_slot: modalData.timeSlot,
      requires_teas: modalData.requiresTeas,
      requires_drinks: modalData.requiresDrinks,
      notes: modalData.notes,
      fixture_team: parseInt(modalData.teamId),
      fixture_opponent: modalData.opponent,
    };

    try {
      await onBookingCreated(payload);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(`Failed to submit request:\n${err.message}`);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      await onBookingUpdated(editData.id, {
        pitch: parseInt(editForm.pitchId),
        time_slot: editForm.timeSlot,
        start_date: editForm.date,
        end_date: editForm.isMultiDay ? editForm.endDate : editForm.date,
        requires_teas: editForm.requiresTeas,
        requires_drinks: editForm.requiresDrinks,
        notes: editForm.notes,
      });
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(`Failed to save changes:\n${err.message}`);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteBooking = async () => {
    setEditSaving(true);
    try {
      await onBookingDeleted(editData.id);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(`Failed to cancel booking:\n${err.message}`);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header with Controls & Filters */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector (Desktop) */}
        <div className="hidden md:flex items-center space-x-3">
          <button
            onClick={() => shiftWeek(-1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition border border-slate-700 text-slate-300"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center space-x-2 text-lg font-semibold tracking-wide font-display text-slate-100">
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
            onClick={() => shiftWeek(1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition border border-slate-700 text-slate-300"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Mobile View Toggle & Notice */}
        <div className="flex md:hidden flex-col gap-2 w-full">
          <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setMobileLayoutMode("singleDay")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${mobileLayoutMode === "singleDay"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400"
                }`}
            >
              Single Day View
            </button>
            <button
              onClick={() => setMobileLayoutMode("singlePitch")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${mobileLayoutMode === "singlePitch"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400"
                }`}
            >
              Single Pitch View
            </button>
          </div>
        </div>

        {/* Filters & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Desktop View Mode Toggle Button Group */}
          <div className="hidden md:flex bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode("transposed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition ${viewMode === "transposed"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
                }`}
              title="Pitches across (columns), Days & Sessions down (rows)"
            >
              Pitches Across
            </button>
            <button
              onClick={() => setViewMode("standard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition ${viewMode === "standard"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
                }`}
              title="Days across (columns), Pitches down (rows)"
            >
              Days Across
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-slate-400 shrink-0" />
              <select
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(e.target.value)}
                className="bg-slate-800 text-slate-200 text-sm rounded-xl py-2 px-3 outline-none border border-slate-700 w-full focus:border-emerald-500"
              >
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-slate-800 text-slate-200 text-sm rounded-xl py-2 px-3 outline-none border border-slate-700 w-full focus:border-emerald-500"
            >
              <option value="all">Filter by Team</option>
              {teams
                .filter((t) => !t.is_external)
                .map((t) => {
                  const length = pitchLengths.find(
                    (l) => l.id === t.required_length,
                  );
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} (
                      {length ? `${length.length_yards}y` : "No length"})
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

      {/* Info Warning Bar */}
      {filteredTeam && (
        <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl flex items-center space-x-3 text-emerald-300 text-sm">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>
            Filtering pitches compatible with{" "}
            <strong>{filteredTeam.name}</strong> (Requires{" "}
            <strong>
              {
                pitchLengths.find((l) => l.id === filteredTeam.required_length)
                  ?.length_yards
              }{" "}
              Yards
            </strong>{" "}
            strip). Unsupported pitches are hidden.
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE RESPONSIVE VIEWS (Visible only on mobile screens)   */}
      {/* ========================================================= */}
      <div className="block md:hidden space-y-4">
        {mobileLayoutMode === "singleDay" ? (
          /* MOBILE VIEW A: Single Day Column with Pitch Rows */
          <div className="glass-panel p-4 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => shiftMobileDay(-1)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-sm font-bold text-slate-100 font-display">
                {new Date(mobileSelectedDateStr).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <button
                onClick={() => shiftMobileDay(1)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {filteredPitches.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No compatible pitches found.
                </div>
              ) : (
                filteredPitches.map((pitch) => {
                  const venueName =
                    venues.find((v) => v.id === pitch.venue)?.name || "";
                  return (
                    <div
                      key={pitch.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <div>
                          <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                            {venueName}
                          </span>
                          <h4 className="text-sm font-bold text-slate-100">
                            {pitch.name}
                          </h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {["MORNING", "AFTERNOON", "EVENING"].map((slot) => {
                          const cell = getCellStatus(
                            pitch.id,
                            mobileSelectedDateStr,
                            slot,
                          );
                          return (
                            <div key={slot} className="space-y-1">
                              <span className="text-[10px] text-slate-400 font-semibold block text-center uppercase">
                                {slot.slice(0, 3)}
                              </span>
                              <CellContent
                                cell={cell}
                                onClick={() =>
                                  handleCellClick(
                                    pitch.id,
                                    mobileSelectedDateStr,
                                    slot,
                                    cell,
                                  )
                                }
                                compact={true}
                                isExternal={isExternalUser}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* MOBILE VIEW B: Single Pitch Column with Day Rows */
          <div className="glass-panel p-4 rounded-2xl space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Select Pitch
              </label>
              <select
                value={mobileSelectedPitchId}
                onChange={(e) => setMobileSelectedPitchId(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl py-2 px-3 outline-none border border-slate-700"
              >
                {filteredPitches.map((p) => (
                  <option key={p.id} value={p.id}>
                    {venues.find((v) => v.id === p.venue)?.name} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Week Navigation for Single Pitch View */}
            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <button
                onClick={() => shiftWeek(-1)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center space-x-1 text-xs font-semibold"
              >
                <ChevronLeft size={16} />
                <span>Prev Week</span>
              </button>
              <div className="text-xs font-bold text-slate-100 font-display">
                Week of {new Date(startDateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </div>
              <button
                onClick={() => shiftWeek(1)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center space-x-1 text-xs font-semibold"
              >
                <span>Next Week</span>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {datesList.map((day) => (
                <div
                  key={day.isoStr}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2"
                >
                  <h4 className="text-xs font-bold text-emerald-400 border-b border-slate-800 pb-1 font-display">
                    {day.label}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {["MORNING", "AFTERNOON", "EVENING"].map((slot) => {
                      const cell = getCellStatus(
                        parseInt(mobileSelectedPitchId),
                        day.isoStr,
                        slot,
                      );
                      return (
                        <div key={slot} className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-semibold block text-center uppercase">
                            {slot.slice(0, 3)}
                          </span>
                          <CellContent
                            cell={cell}
                            onClick={() =>
                              handleCellClick(
                                parseInt(mobileSelectedPitchId),
                                day.isoStr,
                                slot,
                                cell,
                              )
                            }
                            compact={true}
                            isExternal={isExternalUser}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* EXISTING DESKTOP CALENDAR MATRIX (Hidden on mobile)       */}
      {/* ========================================================= */}
      <div className="hidden md:block glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          {viewMode === "transposed" ? (
            /* TRANSPOSED MODE: Pitches Across (Columns), Days & Sessions Down (Rows) */
            <table className="w-full table-fixed border-collapse text-left min-w-[900px]">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-850">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-56 font-display border-r border-slate-800 shrink-0">
                    Day & Session
                  </th>
                  {filteredPitches.map((pitch) => {
                    const venueName =
                      venues.find((v) => v.id === pitch.venue)?.name || "";
                    return (
                      <th
                        key={pitch.id}
                        className="p-4 text-center border-r border-slate-800 last:border-r-0 truncate"
                      >
                        <span className="text-xs text-emerald-400 block font-display tracking-wide truncate">
                          {venueName}
                        </span>
                        <span className="block text-sm font-semibold text-slate-100 truncate">
                          {pitch.name}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredPitches.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-12 text-center text-slate-400">
                      No compatible pitches found. Try clearing filters.
                    </td>
                  </tr>
                ) : (
                  datesList.map((day) => (
                    <React.Fragment key={day.isoStr}>
                      {/* Day Group Header Row */}
                      <tr className="bg-slate-900/90 border-t-4 border-b-2 border-emerald-500/40">
                        <td
                          colSpan={filteredPitches.length + 1}
                          className="px-4 py-2 text-emerald-400 font-bold font-display text-sm tracking-wide bg-slate-900/90"
                        >
                          {day.label}
                        </td>
                      </tr>
                      {/* Morning Slot Row */}
                      <tr className="border-b border-slate-800/30 hover:bg-slate-800/10">
                        <td className="px-3 py-1.5 border-r border-slate-800 font-medium bg-slate-950/40">
                          <span className="text-xs text-slate-300 font-semibold block">
                            Morning
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            09:00 - 13:00
                          </span>
                        </td>
                        {filteredPitches.map((pitch) => {
                          const cell = getCellStatus(
                            pitch.id,
                            day.isoStr,
                            "MORNING",
                          );
                          return (
                            <td
                              key={pitch.id}
                              className="p-1 border-r border-slate-800/40 last:border-r-0 align-top"
                            >
                              <CellContent
                                cell={cell}
                                onClick={() =>
                                  handleCellClick(
                                    pitch.id,
                                    day.isoStr,
                                    "MORNING",
                                    cell,
                                  )
                                }
                                compact={true}
                                isExternal={isExternalUser}
                              />
                            </td>
                          );
                        })}
                      </tr>
                      {/* Afternoon Slot Row */}
                      <tr className="border-b border-slate-800/30 hover:bg-slate-800/10">
                        <td className="px-3 py-1.5 border-r border-slate-800 font-medium bg-slate-950/40">
                          <span className="text-xs text-slate-300 font-semibold block">
                            Afternoon
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            13:30 - 18:00
                          </span>
                        </td>
                        {filteredPitches.map((pitch) => {
                          const cell = getCellStatus(
                            pitch.id,
                            day.isoStr,
                            "AFTERNOON",
                          );
                          return (
                            <td
                              key={pitch.id}
                              className="p-1 border-r border-slate-800/40 last:border-r-0 align-top"
                            >
                              <CellContent
                                cell={cell}
                                onClick={() =>
                                  handleCellClick(
                                    pitch.id,
                                    day.isoStr,
                                    "AFTERNOON",
                                    cell,
                                  )
                                }
                                compact={true}
                                isExternal={isExternalUser}
                              />
                            </td>
                          );
                        })}
                      </tr>
                      {/* Evening Slot Row */}
                      <tr className="border-b-2 border-slate-800 hover:bg-slate-800/10">
                        <td className="px-3 py-1.5 border-r border-slate-800 font-medium bg-slate-950/40">
                          <span className="text-xs text-slate-300 font-semibold block">
                            Evening
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            18:00 - 21:00
                          </span>
                        </td>
                        {filteredPitches.map((pitch) => {
                          const cell = getCellStatus(
                            pitch.id,
                            day.isoStr,
                            "EVENING",
                          );
                          return (
                            <td
                              key={pitch.id}
                              className="p-1 border-r border-slate-800/40 last:border-r-0 align-top"
                            >
                              <CellContent
                                cell={cell}
                                onClick={() =>
                                  handleCellClick(
                                    pitch.id,
                                    day.isoStr,
                                    "EVENING",
                                    cell,
                                  )
                                }
                                compact={true}
                                isExternal={isExternalUser}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* STANDARD MODE: Days Across (Columns), Pitches Down (Rows Grouped by Pitch) */
            <table className="w-full table-fixed border-collapse text-left min-w-[900px]">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-850">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-56 font-display border-r border-slate-800 shrink-0">
                    Session / Pitch
                  </th>
                  {datesList.map((day) => (
                    <th
                      key={day.isoStr}
                      className="p-4 text-center border-r border-slate-800 last:border-r-0 truncate"
                    >
                      <span className="block text-sm font-semibold text-slate-200 truncate">
                        {day.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPitches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={datesList.length + 1}
                      className="p-12 text-center text-slate-400"
                    >
                      No compatible pitches found. Try clearing filters.
                    </td>
                  </tr>
                ) : (
                  filteredPitches.map((pitch) => {
                    const venueName =
                      venues.find((v) => v.id === pitch.venue)?.name || "";
                    return (
                      <React.Fragment key={pitch.id}>
                        <tr className="bg-slate-900/90 border-t-4 border-b-2 border-emerald-500/40">
                          <td
                            colSpan={datesList.length + 1}
                            className="px-4 py-2 font-display bg-slate-900/90"
                          >
                            <span className="text-xs text-emerald-400 font-bold tracking-wide mr-2">
                              {venueName}
                            </span>
                            <span className="text-sm font-bold text-slate-100">
                              {pitch.name}
                            </span>
                          </td>
                        </tr>

                        {/* Morning Slot Row */}
                        <tr className="border-b border-slate-800/30 hover:bg-slate-800/10">
                          <td className="px-3 py-1.5 border-r border-slate-800 font-medium bg-slate-950/40">
                            <span className="text-xs text-slate-300 font-semibold block">
                              Morning
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              09:00 - 13:00
                            </span>
                          </td>
                          {datesList.map((day) => {
                            const cell = getCellStatus(
                              pitch.id,
                              day.isoStr,
                              "MORNING",
                            );
                            return (
                              <td
                                key={day.isoStr}
                                className="p-1 border-r border-slate-800/40 last:border-r-0 align-top"
                              >
                                <CellContent
                                  cell={cell}
                                  onClick={() =>
                                    handleCellClick(
                                      pitch.id,
                                      day.isoStr,
                                      "MORNING",
                                      cell,
                                    )
                                  }
                                  compact={true}
                                  isExternal={isExternalUser}
                                />
                              </td>
                            );
                          })}
                        </tr>

                        {/* Afternoon Slot Row */}
                        <tr className="border-b border-slate-800/30 hover:bg-slate-800/10">
                          <td className="px-3 py-1.5 border-r border-slate-800 font-medium bg-slate-950/40">
                            <span className="text-xs text-slate-300 font-semibold block">
                              Afternoon
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              13:30 - 18:00
                            </span>
                          </td>
                          {datesList.map((day) => {
                            const cell = getCellStatus(
                              pitch.id,
                              day.isoStr,
                              "AFTERNOON",
                            );
                            return (
                              <td
                                key={day.isoStr}
                                className="p-1 border-r border-slate-800/40 last:border-r-0 align-top"
                              >
                                <CellContent
                                  cell={cell}
                                  onClick={() =>
                                    handleCellClick(
                                      pitch.id,
                                      day.isoStr,
                                      "AFTERNOON",
                                      cell,
                                    )
                                  }
                                  compact={true}
                                  isExternal={isExternalUser}
                                />
                              </td>
                            );
                          })}
                        </tr>

                        {/* Evening Slot Row */}
                        <tr className="border-b-2 border-slate-800 hover:bg-slate-800/10">
                          <td className="px-3 py-1.5 border-r border-slate-800 font-medium bg-slate-950/40">
                            <span className="text-xs text-slate-300 font-semibold block">
                              Evening
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              18:00 - 21:00
                            </span>
                          </td>
                          {datesList.map((day) => {
                            const cell = getCellStatus(
                              pitch.id,
                              day.isoStr,
                              "EVENING",
                            );
                            return (
                              <td
                                key={day.isoStr}
                                className="p-1 border-r border-slate-800/40 last:border-r-0 align-top"
                              >
                                <CellContent
                                  cell={cell}
                                  onClick={() =>
                                    handleCellClick(
                                      pitch.id,
                                      day.isoStr,
                                      "EVENING",
                                      cell,
                                    )
                                  }
                                  compact={true}
                                  isExternal={isExternalUser}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Booking Modal & Edit Modals remain identical */}
      {/* ... [Modals stay same] ... */}
    </div>
  );
}

// Inner helper component for cell mapping
function CellContent({ cell, onClick, compact = false, isExternal = false }) {
  const heightClass = compact ? "h-16" : "h-24";

  if (!cell) {
    if (isExternal) {
      return (
        <div
          className={`w-full ${heightClass} border border-slate-900 rounded-xl bg-slate-950/40 flex items-center justify-center`}
        >
          <span className="text-[10px] text-emerald-500/70 font-semibold font-display">
            Available
          </span>
        </div>
      );
    }
    return (
      <button
        onClick={onClick}
        className={`w-full ${heightClass} flex items-center justify-center border border-dashed border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-950/25 group transition cursor-pointer overflow-hidden`}
      >
        <Plus
          size={14}
          className="text-slate-650 group-hover:text-emerald-400 group-hover:scale-110 transition duration-300"
        />
      </button>
    );
  }

  if (cell.type === "BLOCKED") {
    return (
      <div
        className={`w-full ${heightClass} bg-slate-900/60 border border-slate-800 rounded-xl ${compact ? "p-1.5" : "p-2.5"} flex flex-col justify-between overflow-hidden`}
        title={isExternal ? "Unavailable" : cell.reason}
      >
        <div className="flex items-start space-x-1 text-slate-500">
          <ShieldAlert size={12} className="shrink-0 text-amber-600 mt-0.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider font-display line-clamp-2">
            {isExternal ? "Unavailable" : cell.label}
          </span>
        </div>
        {!compact && !isExternal && (
          <span className="text-[10px] text-slate-500 leading-snug line-clamp-1">
            Outfield Overlap
          </span>
        )}
      </div>
    );
  }

  // BOOKED cell
  const isApproved = cell.status === "APPROVED";
  const isMaintenance = cell.isMaintenance;

  return (
    <div
      onClick={onClick}
      className={`w-full ${heightClass} cursor-pointer border rounded-xl ${compact ? "p-1.5" : "p-2.5"} flex flex-col justify-between overflow-hidden transition-all duration-300 ${isMaintenance
        ? "bg-amber-950/40 border-amber-800/80 hover:border-amber-500 shadow-sm shadow-amber-900/10"
        : isApproved
          ? "bg-emerald-950/30 border-emerald-900/80 hover:border-blue-500 shadow-sm shadow-emerald-900/10"
          : "bg-amber-950/20 border-amber-900/50 hover:border-blue-500"
        }`}
    >
      <div>
        <div className="flex items-center justify-between gap-1 mb-0.5">
          {isMaintenance ? (
            <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase font-display truncate bg-amber-900/60 text-amber-300 flex items-center gap-1">
              <Shovel size={10} />
              Ground Maintenance
            </span>
          ) : (
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase font-display truncate ${isApproved
                ? "bg-emerald-900/50 text-emerald-400"
                : "bg-amber-900/50 text-amber-400"
                }`}
            >
              {isApproved ? "Booked" : "Pending"}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-slate-300 line-clamp-2 leading-tight">
          {isExternal && !isMaintenance ? "Booked" : cell.label}
        </p>
      </div>

      {!compact && !isExternal && cell.booking.notes && !isMaintenance && (
        <span className="text-[10px] text-slate-450 line-clamp-1 italic">
          "{cell.booking.notes}"
        </span>
      )}
    </div>
  );
}