export function useConflictDetection({
  bookings,
  pitches,
  fixtures,
  teams,
  pitchLengths,
}) {
  // Detect OTHER competing PENDING bookings for the same slot as this booking
  const detectCompetingPending = (booking) => {
    const overlaps = [];
    const currentPitch = pitches.find((p) => p.id === booking.pitch);

    // All pitches in the "conflict zone" for this booking: the booking's own pitch
    // plus any pitches it blocks (outfield) and pitches that block it.
    const relatedPitchIds = new Set([booking.pitch]);
    if (currentPitch?.blocks_pitches) {
      currentPitch.blocks_pitches.forEach((id) => relatedPitchIds.add(id));
    }
    pitches
      .filter((p) => p.blocks_pitches?.includes(booking.pitch))
      .forEach((p) => relatedPitchIds.add(p.id));

    bookings.forEach((b) => {
      if (
        b.id === booking.id ||
        b.status !== "PENDING" ||
        !relatedPitchIds.has(b.pitch)
      )
        return;

      // Date range intersection
      if (
        booking.start_date > b.end_date ||
        booking.end_date < b.start_date
      )
        return;

      // Time slot overlap
      if (
        b.time_slot !== "ALL_DAY" &&
        booking.time_slot !== "ALL_DAY" &&
        b.time_slot !== booking.time_slot
      )
        return;

      overlaps.push(b);
    });

    return overlaps;
  };

  // Conflict Detection Logic for a pending booking
  const detectConflicts = (booking) => {
    const conflicts = [];

    // 1. Direct overlap with APPROVED bookings
    const directOverlap = bookings.find(
      (b) =>
        b.id !== booking.id &&
        b.pitch === booking.pitch &&
        b.status === "APPROVED" &&
        // Check date range intersection
        booking.start_date <= b.end_date &&
        booking.end_date >= b.start_date &&
        (b.time_slot === "ALL_DAY" ||
          booking.time_slot === "ALL_DAY" ||
          b.time_slot === booking.time_slot)
    );
    if (directOverlap) {
      const matchDetails = directOverlap.fixture
        ? fixtures.find((f) => f.id === directOverlap.fixture)
        : null;
      conflicts.push(
        `Direct Overlap: Already booked for ${
          matchDetails
            ? matchDetails.opponent
            : directOverlap.external_contact_name || "Another fixture"
        }`
      );
    }

    // 2. Outfield Overlap Logic (Blocks pitches)
    // Case A: This booking's pitch blocks another pitch, and the other pitch has a booking
    const currentPitch = pitches.find((p) => p.id === booking.pitch);
    if (
      currentPitch &&
      currentPitch.blocks_pitches &&
      currentPitch.blocks_pitches.length > 0
    ) {
      currentPitch.blocks_pitches.forEach((blockedId) => {
        const activeBlockedBooking = bookings.find(
          (b) =>
            b.id !== booking.id &&
            b.pitch === blockedId &&
            b.status === "APPROVED" &&
            booking.start_date <= b.end_date &&
            booking.end_date >= b.start_date &&
            (b.time_slot === "ALL_DAY" ||
              booking.time_slot === "ALL_DAY" ||
              b.time_slot === booking.time_slot)
        );
        if (activeBlockedBooking) {
          const pName = pitches.find((p) => p.id === blockedId)?.name || "";
          conflicts.push(
            `Outfield Overlap: Booking this blocks ${pName}, which has an approved match.`
          );
        }
      });
    }

    // Case B: Another pitch blocks this pitch, and the blocking pitch has an approved booking
    const blockingPitches = pitches.filter(
      (p) => p.blocks_pitches && p.blocks_pitches.includes(booking.pitch)
    );
    for (const bp of blockingPitches) {
      const activeBlockingBooking = bookings.find(
        (b) =>
          b.id !== booking.id &&
          b.pitch === bp.id &&
          b.status === "APPROVED" &&
          booking.start_date <= b.end_date &&
          booking.end_date >= b.start_date &&
          (b.time_slot === "ALL_DAY" ||
            booking.time_slot === "ALL_DAY" ||
            b.time_slot === booking.time_slot)
      );
      if (activeBlockingBooking) {
        conflicts.push(
          `Outfield Overlap: ${bp.name} is booked, which blocks this outfield pitch.`
        );
      }
    }

    // 3. Competing PENDING requests for the same slot
    const competingPending = detectCompetingPending(booking);
    if (competingPending.length > 0) {
      conflicts.push(
        `${competingPending.length} competing pending request${
          competingPending.length > 1 ? "s" : ""
        } for this slot — approving will auto-reject them.`
      );
    }

    // 4. Length support
    if (booking.fixture) {
      const fix = fixtures.find((f) => f.id === booking.fixture);
      const team = fix ? teams.find((t) => t.id === fix.team) : null;
      if (team && team.required_length && currentPitch) {
        if (!currentPitch.supported_lengths.includes(team.required_length)) {
          const reqLen =
            pitchLengths.find((l) => l.id === team.required_length)
              ?.length_yards || "";
          conflicts.push(
            `Pitch Specifics: ${currentPitch.name} does not support the required length for ${team.name} (${reqLen} Yards).`
          );
        }
      }
    }

    return conflicts;
  };

  return {
    detectCompetingPending,
    detectConflicts,
  };
}
