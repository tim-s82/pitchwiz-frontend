import { useState, useMemo } from "react";

export function useCalendarState({
  venues,
  pitches,
  teams,
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

  // Sorted venues memo (default venue first, then alphabetically)
  const sortedVenues = useMemo(() => {
    return [...venues].sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });
  }, [venues]);

  const defaultVenueId = useMemo(() => {
    if (venues.length === 0) return "all";
    const def = venues.find((v) => v.is_default);
    return def ? def.id.toString() : venues[0].id.toString();
  }, [venues]);

  const effectiveSelectedVenueId =
    selectedVenueId === "all" ? defaultVenueId : selectedVenueId;

  // Alphabetically sorted teams memo
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true })
    );
  }, [teams]);

  // Find compatible pitch lengths for the filtered team
  const filteredTeam = useMemo(() => {
    if (selectedTeamId === "all") return null;
    return teams.find((t) => t.id === parseInt(selectedTeamId, 10));
  }, [selectedTeamId, teams]);

  // Filter & Sort Pitches based on venue, team compatibility, and entity type hierarchy
  const filteredPitches = useMemo(() => {
    const filtered = pitches.filter((pitch) => {
      if (
        effectiveSelectedVenueId !== "all" &&
        pitch.venue !== parseInt(effectiveSelectedVenueId, 10)
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
  }, [pitches, effectiveSelectedVenueId, filteredTeam, venues]);

  const effectiveMobileSelectedPitchId =
    mobileSelectedPitchId ||
    (filteredPitches.length > 0 ? filteredPitches[0].id.toString() : "");

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

  return {
    selectedVenueId: effectiveSelectedVenueId,
    setSelectedVenueId,
    selectedTeamId,
    setSelectedTeamId,
    selectedStatus,
    setSelectedStatus,
    viewMode,
    setViewMode,
    mobileLayoutMode,
    setMobileLayoutMode,
    mobileSelectedDateStr,
    setMobileSelectedDateStr,
    mobileSelectedPitchId: effectiveMobileSelectedPitchId,
    setMobileSelectedPitchId,
    startDateStr,
    setStartDateStr,
    isModalOpen,
    setIsModalOpen,
    modalData,
    setModalData,
    isMaintenanceModalOpen,
    setIsMaintenanceModalOpen,
    maintenanceData,
    setMaintenanceData,
    isEditModalOpen,
    setIsEditModalOpen,
    editData,
    setEditData,
    editForm,
    setEditForm,
    editSaving,
    setEditSaving,
    showDeleteConfirm,
    setShowDeleteConfirm,
    sortedVenues,
    sortedTeams,
    filteredTeam,
    filteredPitches,
    datesList,
    shiftWeek,
    shiftMobileDay,
    allowedTeams,
    isDateInBooking,
    isExternalUser,
    isOnlyGroundstaff,
  };
}