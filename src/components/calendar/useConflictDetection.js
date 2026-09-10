export function useConflictDetection({
  bookings,
  pitches,
  fixtures,
  teams,
  selectedStatus,
  currentUser,
  isExternalUser,
}) {
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

  return {
    getCellStatus,
    canEditBooking,
  };
}
