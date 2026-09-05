import React, { useState, useMemo, useEffect } from "react";
import { api } from "../services/api";
import GroundMaintenanceModal from "./GroundMaintenanceModal";
import {
  Calendar,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ShieldAlert,
  Pencil,
  Trash2,
  Shovel,
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
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split("T")[0];
  });

  // Modal State (create fixture booking)
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

  // Ground Maintenance Modal State
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState({
    pitchId: "",
    date: "",
    timeSlot: "ALL_DAY",
    notes: "",
    isMultiDay: false,
    endDate: "",
  });

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Alphabetically sorted venues memo
  const sortedVenues = useMemo(() => {
    return [...venues].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true })
    );
  }, [venues]);

  // Alphabetically sorted teams memo
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true })
    );
  }, [teams]);

  useEffect(() => {
    if (sortedVenues.length > 0 && selectedVenueId === "all") {
      const defaultVenue = sortedVenues.find((v) => v.is_default);
      setSelectedVenueId(defaultVenue ? defaultVenue.id.toString() : sortedVenues[0].id.toString());
    }
  }, [sortedVenues, selectedVenueId]);

  // Find compatible pitch lengths for the filtered team
  const filteredTeam = useMemo(() => {
    if (selectedTeamId === "all") return null;
    return teams.find((t) => t.id === parseInt(selectedTeamId, 10));
  }, [selectedTeamId, teams]);

  // Filter & Sort Pitches based on venue, team compatibility, and entity type hierarchy
  const filteredPitches = useMemo(() => {
    const filtered = pitches.filter((pitch) => {
      if (
        selectedVenueId !== "all" &&
        pitch.venue !== parseInt(selectedVenueId, 10)
      ) {
        return false;
      }
      if (filteredTeam && filteredTeam.required_length) {
        if (!pitch.supported_lengths.includes(filteredTeam.required_length)) {
          return false;
        }
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

  const shiftWeek = (weeks) => {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + weeks * 7);
    setStartDateStr(d.toISOString().split("T")[0]);
  };

  const shiftMobileDay = (days) => {
    const d = new Date(mobileSelectedDateStr);
    d.setDate(d.getDate() + days);
    setMobileSelectedDateStr(d.toISOString().split("T")[0]);
  };

  const allowedTeams = useMemo(() => {
    if (!currentUser) return sortedTeams;
    const hasAdminOrSec =
      currentUser.roles?.includes("ADMIN") ||
      currentUser.roles?.includes("FIXTURE_SECRETARY") ||
      currentUser.roles?.includes("USER_MANAGER");
    if (hasAdminOrSec) return sortedTeams;
    return sortedTeams.filter((t) => t.managers?.includes(currentUser.id));
  }, [currentUser, sortedTeams]);

  const isDateInBooking = (dateStr, booking) => {
    const start = booking.start_date || booking.date;
    const end = booking.end_date || start;
    return dateStr >= start && dateStr <= end;
  };

  const getCellStatus = (pitchId, dateStr, timeSlot) => {
    const matchingBookings = bookings.filter(
      (b) =>
        parseInt(b.pitch, 10) === parseInt(pitchId, 10) &&
        isDateInBooking(dateStr, b) &&
        (b.time_slot === "ALL_DAY" ||
          timeSlot === "ALL_DAY" ||
          b.time_slot === timeSlot)
    );

    const approvedBooking = matchingBookings.find(
      (b) => b.status === "APPROVED" || b.status === "GROUND_MAINTENANCE"
    );

    if (approvedBooking) {
      if (selectedStatus !== "all" && approvedBooking.status !== selectedStatus) {
        return null;
      }

      if (approvedBooking.booking_type === "GROUND_MAINTENANCE") {
        return {
          type: "BOOKED",
          booking: approvedBooking,
          label: approvedBooking.notes || "Ground Maintenance",
          status: approvedBooking.status,
          isMaintenance: true,
        };
      }

      if (approvedBooking.notes?.startsWith("AUTO_LOCK:")) {
        const parts = approvedBooking.notes.split(":");
        const pitchName = parts[2] || "Pitch";
        return {
          type: "BLOCKED",
          label: `Blocked (${pitchName} active)`,
          reason: `Outfield overlap due to booking on ${pitchName}`,
        };
      }

      const fixtureObj = fixtures.find((f) => f.id === approvedBooking.fixture);
      const teamObj = fixtureObj
        ? teams.find((t) => t.id === fixtureObj.team)
        : null;
      const label = teamObj
        ? `${teamObj.name} vs ${fixtureObj.opponent}`
        : approvedBooking.external_contact_name || "External Booking";

      return {
        type: "BOOKED",
        booking: approvedBooking,
        label,
        status: approvedBooking.status,
        isMaintenance: false,
      };
    }

    const pendingBookings = matchingBookings.filter(
      (b) => b.status === "PENDING"
    );

    if (pendingBookings.length > 0) {
      if (selectedStatus !== "all" && selectedStatus !== "PENDING") {
        return null;
      }

      const pendingItems = pendingBookings.map((b) => {
        const fixtureObj = b.fixture ? fixtures.find((f) => f.id === b.fixture) : null;
        const teamObj = fixtureObj ? teams.find((t) => t.id === fixtureObj.team) : null;
        const label = teamObj
          ? `${teamObj.name} vs ${fixtureObj.opponent}`
          : b.external_contact_name || "External Request";
        return { booking: b, label };
      });

      return {
        type: "PENDING_MULTI",
        pendingItems,
      };
    }

    const blockingPitches = pitches.filter((p) =>
      p.blocks_pitches?.includes(pitchId)
    );
    for (const bp of blockingPitches) {
      const activeBlockingBooking = bookings.find(
        (b) =>
          parseInt(b.pitch, 10) === parseInt(bp.id, 10) &&
          isDateInBooking(dateStr, b) &&
          b.status === "APPROVED" &&
          (b.time_slot === "ALL_DAY" ||
            timeSlot === "ALL_DAY" ||
            b.time_slot === timeSlot)
      );

      if (activeBlockingBooking) {
        if (
          activeBlockingBooking.booking_type === "GROUND_MAINTENANCE" &&
          bp.entity_type !== "OUTFIELD" &&
          bp.entity_type !== "YOUTH"
        ) {
          continue;
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

  const isOnlyGroundstaff = useMemo(() => {
    if (!currentUser || !currentUser.roles) return false;
    const hasGroundstaff = currentUser.roles.includes("GROUNDSTAFF");
    const hasAdminOrSecOrMgr =
      currentUser.roles.includes("ADMIN") ||
      currentUser.roles.includes("FIXTURE_SECRETARY") ||
      currentUser.roles.includes("USER_MANAGER");
    return hasGroundstaff && !hasAdminOrSecOrMgr;
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
    if (existingCell) {
      if (existingCell.type === "BLOCKED") {
        alert(
          existingCell.reason ||
          "This slot is blocked due to an outfield overlap."
        );
        return;
      }

      if (existingCell.type === "BOOKED") {
        const b = existingCell.booking;
        if (canEditBooking(b)) {
          const fix = b.fixture ? fixtures.find((f) => f.id === b.fixture) : null;
          setEditData(b);
          setEditForm({
            pitchId: b.pitch.toString(),
            timeSlot: b.time_slot,
            date: b.start_date || b.date,
            endDate: b.end_date || b.start_date || b.date,
            isMultiDay: (b.start_date || b.date) !== (b.end_date || b.start_date || b.date),
            opponent: fix?.opponent || b.external_contact_name || "",
            requiresTeas: b.requires_teas,
            requiresDrinks: b.requires_drinks,
            notes: b.notes || "",
          });
          setShowDeleteConfirm(false);
          setIsEditModalOpen(true);
        } else {
          alert(
            `Booking Details:\nStatus: ${b.status}\nNotes: ${b.notes || "None"}`
          );
        }
        return;
      }

      if (existingCell.type === "PENDING_MULTI") {
        if (isExternalUser) {
          alert("This slot has pending requests. External users cannot create bookings directly.");
          return;
        }
        if (isOnlyGroundstaff) {
          setMaintenanceData({
            pitchId: pitchId.toString(),
            date: dateStr,
            timeSlot,
            notes: "",
            isMultiDay: false,
            endDate: dateStr,
          });
          setIsMaintenanceModalOpen(true);
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
        return;
      }
    }

    if (isExternalUser) {
      alert("External users cannot create bookings directly.");
      return;
    }

    if (isOnlyGroundstaff) {
      setMaintenanceData({
        pitchId: pitchId.toString(),
        date: dateStr,
        timeSlot,
        notes: "",
        isMultiDay: false,
        endDate: dateStr,
      });
      setIsMaintenanceModalOpen(true);
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
      pitch: parseInt(modalData.pitchId, 10),
      start_date: modalData.date,
      end_date: modalData.isMultiDay ? modalData.endDate : modalData.date,
      time_slot: modalData.timeSlot,
      requires_teas: modalData.requiresTeas,
      requires_drinks: modalData.requiresDrinks,
      notes: modalData.notes,
      fixture_team: parseInt(modalData.teamId, 10),
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
        pitch: parseInt(editForm.pitchId || editData.pitch, 10),
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

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="hidden md:flex bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode("transposed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition ${viewMode === "transposed"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Pitches Across
            </button>
            <button
              onClick={() => setViewMode("standard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition ${viewMode === "standard"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
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

      {/* MOBILE RESPONSIVE VIEWS */}
      <div className="block md:hidden space-y-4">
        {mobileLayoutMode === "singleDay" ? (
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
                            slot
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
                                    cell
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

            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <button
                onClick={() => shiftWeek(-1)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center space-x-1 text-xs font-semibold"
              >
                <ChevronLeft size={16} />
                <span>Prev Week</span>
              </button>
              <div className="text-xs font-bold text-slate-100 font-display">
                Week of{" "}
                {new Date(startDateStr).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
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
                        parseInt(mobileSelectedPitchId, 10),
                        day.isoStr,
                        slot
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
                                parseInt(mobileSelectedPitchId, 10),
                                day.isoStr,
                                slot,
                                cell
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

      {/* DESKTOP CALENDAR MATRIX */}
      <div className="hidden md:block glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          {viewMode === "transposed" ? (
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
                      <tr className="bg-slate-900/90 border-t-4 border-b-2 border-emerald-500/40">
                        <td
                          colSpan={filteredPitches.length + 1}
                          className="px-4 py-2 text-emerald-400 font-bold font-display text-sm tracking-wide bg-slate-900/90"
                        >
                          {day.label}
                        </td>
                      </tr>
                      {["MORNING", "AFTERNOON", "EVENING"].map((slot) => (
                        <tr key={slot} className="border-b border-slate-800/30 hover:bg-slate-800/10">
                          <td className="px-3 py-1.5 border-r border-slate-800 font-medium bg-slate-950/40">
                            <span className="text-xs text-slate-300 font-semibold block capitalize">
                              {slot.toLowerCase()}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {slot === "MORNING" && "09:00 - 13:00"}
                              {slot === "AFTERNOON" && "13:30 - 18:00"}
                              {slot === "EVENING" && "18:00 - 21:00"}
                            </span>
                          </td>
                          {filteredPitches.map((pitch) => {
                            const cell = getCellStatus(
                              pitch.id,
                              day.isoStr,
                              slot
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
                                      slot,
                                      cell
                                    )
                                  }
                                  compact={true}
                                  isExternal={isExternalUser}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          ) : (
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

                        {["MORNING", "AFTERNOON", "EVENING"].map((slot) => (
                          <tr key={slot} className="border-b border-slate-800/30 hover:bg-slate-800/10">
                            <td className="px-3 py-1.5 border-r border-slate-800 font-medium bg-slate-950/40">
                              <span className="text-xs text-slate-300 font-semibold block capitalize">
                                {slot.toLowerCase()}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {slot === "MORNING" && "09:00 - 13:00"}
                                {slot === "AFTERNOON" && "13:30 - 18:00"}
                                {slot === "EVENING" && "18:00 - 21:00"}
                              </span>
                            </td>
                            {datesList.map((day) => {
                              const cell = getCellStatus(
                                pitch.id,
                                day.isoStr,
                                slot
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
                                        slot,
                                        cell
                                      )
                                    }
                                    compact={true}
                                    isExternal={isExternalUser}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold font-display text-slate-100">
                Request Pitch Booking
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Pitch
                  </label>
                  <select
                    value={modalData.pitchId}
                    onChange={(e) => {
                      const newPitchId = e.target.value;
                      let updatedTeamId = modalData.teamId;
                      if (newPitchId && modalData.teamId) {
                        const newPitch = pitches.find(
                          (p) => p.id === parseInt(newPitchId, 10)
                        );
                        const currentTeam = teams.find(
                          (t) => t.id === parseInt(modalData.teamId, 10)
                        );
                        if (
                          newPitch &&
                          currentTeam &&
                          currentTeam.required_length &&
                          !newPitch.supported_lengths.includes(
                            currentTeam.required_length
                          )
                        ) {
                          updatedTeamId = "";
                        }
                      }
                      setModalData({
                        ...modalData,
                        pitchId: newPitchId,
                        teamId: updatedTeamId,
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">Select Pitch</option>
                    {pitches.map((p) => (
                      <option key={p.id} value={p.id}>
                        {venues.find((v) => v.id === p.venue)?.name} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Time Slot
                  </label>
                  <select
                    value={modalData.timeSlot}
                    onChange={(e) =>
                      setModalData({ ...modalData, timeSlot: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                  >
                    <option value="MORNING">Morning Slot</option>
                    <option value="AFTERNOON">Afternoon Slot</option>
                    <option value="EVENING">Evening Slot</option>
                    <option value="ALL_DAY">All Day Slot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Team (Requesting)
                </label>
                <select
                  value={modalData.teamId}
                  onChange={(e) =>
                    setModalData({ ...modalData, teamId: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Team</option>
                  {allowedTeams
                    .filter((t) => {
                      const hasAdminOrSec =
                        currentUser?.roles?.includes("ADMIN") ||
                        currentUser?.roles?.includes("FIXTURE_SECRETARY");
                      if (!hasAdminOrSec && t.is_external) return false;

                      if (modalData.pitchId) {
                        const selectedPitch = pitches.find(
                          (p) => p.id === parseInt(modalData.pitchId, 10)
                        );
                        if (
                          selectedPitch &&
                          t.required_length &&
                          !selectedPitch.supported_lengths.includes(
                            t.required_length
                          )
                        ) {
                          return false;
                        }
                      }
                      return true;
                    })
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.is_external ? "(External)" : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Opponent
                </label>
                <input
                  type="text"
                  value={modalData.opponent}
                  onChange={(e) =>
                    setModalData({ ...modalData, opponent: e.target.value })
                  }
                  placeholder="e.g. Broadstone CC"
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isMultiDay"
                      checked={modalData.isMultiDay}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          isMultiDay: e.target.checked,
                          endDate: e.target.checked
                            ? modalData.endDate || modalData.date
                            : modalData.date,
                        })
                      }
                      className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                    />
                    <label
                      htmlFor="isMultiDay"
                      className="text-sm font-medium text-slate-200"
                    >
                      Multi-Day Booking
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      {modalData.isMultiDay ? "Start Date" : "Date"}
                    </label>
                    <input
                      type="date"
                      value={modalData.date}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          date: e.target.value,
                          endDate: modalData.isMultiDay
                            ? modalData.endDate
                            : e.target.value,
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  {modalData.isMultiDay && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={modalData.endDate}
                        onChange={(e) =>
                          setModalData({
                            ...modalData,
                            endDate: e.target.value,
                          })
                        }
                        min={modalData.date}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-6 bg-slate-800/20 p-3.5 rounded-xl border border-slate-800/60 justify-around">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalData.requiresTeas}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        requiresTeas: e.target.checked,
                      })
                    }
                    className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-200">Request Teas</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalData.requiresDrinks}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        requiresDrinks: e.target.checked,
                      })
                    }
                    className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-200">Request Drinks</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Notes for Secretary
                </label>
                <textarea
                  value={modalData.notes}
                  onChange={(e) =>
                    setModalData({ ...modalData, notes: e.target.value })
                  }
                  placeholder="Any special ground prep, cup rules, etc."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg transition"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GroundMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        initialData={maintenanceData}
        pitches={pitches}
        venues={venues}
        onSuccess={onBookingCreated}
      />

      {/* Edit / Cancel Booking Modal */}
      {isEditModalOpen && editData && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-800 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Pencil size={16} className="text-slate-950 font-bold" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display text-slate-100">
                    Edit Booking
                  </h2>
                  <p className="text-xs text-slate-400">
                    Modify or cancel this pitch booking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Time Slot
                </label>
                <select
                  value={editForm.timeSlot}
                  onChange={(e) =>
                    setEditForm({ ...editForm, timeSlot: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                >
                  <option value="MORNING">Morning Slot</option>
                  <option value="AFTERNOON">Afternoon Slot</option>
                  <option value="EVENING">Evening Slot</option>
                  <option value="ALL_DAY">All Day Slot</option>
                </select>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="editIsMultiDay"
                      checked={editForm.isMultiDay}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          isMultiDay: e.target.checked,
                          endDate: e.target.checked
                            ? editForm.endDate || editForm.date
                            : editForm.date,
                        })
                      }
                      className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500 w-4 h-4"
                    />
                    <label
                      htmlFor="editIsMultiDay"
                      className="text-sm font-medium text-slate-200 cursor-pointer"
                    >
                      Multi-Day Booking
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      {editForm.isMultiDay ? "Start Date" : "Date"}
                    </label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, date: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>
                  {editForm.isMultiDay && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={editForm.endDate}
                        min={editForm.date}
                        onChange={(e) =>
                          setEditForm({ ...editForm, endDate: e.target.value })
                        }
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-6 bg-slate-800/20 p-3.5 rounded-xl border border-slate-800/60 justify-around">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.requiresTeas}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        requiresTeas: e.target.checked,
                      })
                    }
                    className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-sm text-slate-200">Request Teas</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.requiresDrinks}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        requiresDrinks: e.target.checked,
                      })
                    }
                    className="rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-sm text-slate-200">Request Drinks</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              {showDeleteConfirm ? (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-red-400 font-semibold text-center">
                    Are you sure you want to cancel this booking? This cannot be
                    undone.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                      disabled={editSaving}
                    >
                      Keep Booking
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteBooking}
                      disabled={editSaving}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold shadow-lg transition flex items-center justify-center space-x-2"
                    >
                      <Trash2 size={16} />
                      <span>
                        {editSaving ? "Cancelling…" : "Yes, Cancel It"}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="py-3 px-4 rounded-xl border border-red-800 bg-red-950/30 hover:bg-red-950/60 text-red-400 font-semibold transition flex items-center space-x-2"
                  >
                    <Trash2 size={15} />
                    <span>Cancel Booking</span>
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg transition"
                  >
                    {editSaving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
        type="button"
        onClick={onClick}
        className={`w-full ${heightClass} flex items-center justify-center border border-dashed border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-950/25 group transition cursor-pointer overflow-hidden`}
      >
        <Plus
          size={14}
          className="text-slate-500 group-hover:text-emerald-400 group-hover:scale-110 transition duration-300 pointer-events-none"
        />
      </button>
    );
  }

  if (cell.type === "BLOCKED") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full ${heightClass} text-left bg-slate-900/60 border border-slate-800 rounded-xl ${compact ? "p-1.5" : "p-2.5"
          } flex flex-col justify-between overflow-hidden cursor-pointer hover:border-slate-700 transition`}
        title={isExternal ? "Unavailable" : cell.reason}
      >
        <div className="flex items-start space-x-1 text-slate-500 pointer-events-none">
          <ShieldAlert size={12} className="shrink-0 text-amber-600 mt-0.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider font-display line-clamp-2">
            {isExternal ? "Unavailable" : cell.label}
          </span>
        </div>
        {!compact && !isExternal && (
          <span className="text-[10px] text-slate-500 leading-snug line-clamp-1 pointer-events-none">
            Outfield Overlap
          </span>
        )}
      </button>
    );
  }

  if (cell.type === "PENDING_MULTI") {
    const count = cell.pendingItems.length;
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full ${heightClass} text-left cursor-pointer border rounded-xl ${compact ? "p-1.5" : "p-2"
          } flex flex-col justify-between overflow-hidden transition-all duration-300 bg-violet-950/25 border-violet-900/60 hover:border-violet-500/70 hover:bg-violet-950/40 group`}
      >
        <div className="pointer-events-none w-full space-y-0.5 overflow-hidden">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase font-display bg-violet-900/50 text-violet-300 flex items-center gap-1 truncate">
              {count} Pending
            </span>
            {!isExternal && (
              <span className="text-[9px] text-emerald-400/70 group-hover:text-emerald-400 font-semibold transition shrink-0">
                + Request
              </span>
            )}
          </div>
          {cell.pendingItems.slice(0, compact ? 1 : 2).map(({ booking, label }) => (
            <p key={booking.id} className="text-[10px] text-slate-400 truncate leading-tight">
              {isExternal ? "Pending" : label}
            </p>
          ))}
          {count > (compact ? 1 : 2) && (
            <p className="text-[10px] text-slate-500 leading-tight">
              +{count - (compact ? 1 : 2)} more…
            </p>
          )}
        </div>
      </button>
    );
  }

  const isApproved = cell.status === "APPROVED";
  const isMaintenance = cell.isMaintenance;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full ${heightClass} text-left cursor-pointer border rounded-xl ${compact ? "p-1.5" : "p-2.5"
        } flex flex-col justify-between overflow-hidden transition-all duration-300 ${isMaintenance
          ? "bg-amber-950/40 border-amber-800/80 hover:border-amber-500 shadow-sm"
          : isApproved
            ? "bg-emerald-950/30 border-emerald-900/80 hover:border-blue-500 shadow-sm"
            : "bg-amber-950/20 border-amber-900/50 hover:border-blue-500"
        }`}
    >
      <div className="pointer-events-none w-full">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          {isMaintenance ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase font-display truncate bg-amber-900/60 text-amber-300 flex items-center gap-1">
              <Shovel size={10} />
              Maintenance
            </span>
          ) : (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase font-display truncate ${isApproved
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

      {!compact && !isExternal && cell.booking?.notes && !isMaintenance && (
        <span className="text-[10px] text-slate-400 line-clamp-1 italic pointer-events-none">
          "{cell.booking.notes}"
        </span>
      )}
    </button>
  );
}