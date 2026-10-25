import { describe, it, expect } from "vitest";
import { useConflictDetection } from "../components/calendar/useConflictDetection";

describe("Training Bookings conflict detection and permissions", () => {
  const dummyTeams = [
    { id: 1, name: "1st XI", managers: [10] },
    { id: 2, name: "2nd XI", managers: [20] },
  ];

  const dummyPitches = [
    { id: 101, name: "Net 1", entity_type: "NET", blocks_pitches: [] },
  ];

  it("labels an approved training booking with specific teams", () => {
    const bookings = [
      {
        id: 42,
        pitch: 101,
        booking_type: "TRAINING",
        status: "APPROVED",
        start_date: "2026-06-01",
        end_date: "2026-06-01",
        time_slot: "EVENING",
        teams: [1, 2],
      },
    ];

    const { getCellStatus } = useConflictDetection({
      bookings,
      pitches: dummyPitches,
      fixtures: [],
      teams: dummyTeams,
      selectedStatus: "all",
      currentUser: { id: 10, roles: ["TEAM_MANAGER"] },
      isExternalUser: false,
    });

    const status = getCellStatus(101, "2026-06-01", "EVENING");
    expect(status).not.toBeNull();
    expect(status.type).toBe("BOOKED");
    expect(status.isTraining).toBe(true);
    expect(status.label).toBe("Training — 1st XI, 2nd XI");
  });

  it("labels a club-wide approved training booking when teams list is empty", () => {
    const bookings = [
      {
        id: 43,
        pitch: 101,
        booking_type: "TRAINING",
        status: "APPROVED",
        start_date: "2026-06-01",
        end_date: "2026-06-01",
        time_slot: "EVENING",
        teams: [],
      },
    ];

    const { getCellStatus } = useConflictDetection({
      bookings,
      pitches: dummyPitches,
      fixtures: [],
      teams: dummyTeams,
      selectedStatus: "all",
      currentUser: { id: 99, roles: ["ADMIN"] },
      isExternalUser: false,
    });

    const status = getCellStatus(101, "2026-06-01", "EVENING");
    expect(status).not.toBeNull();
    expect(status.type).toBe("BOOKED");
    expect(status.isTraining).toBe(true);
    expect(status.label).toBe("Training — Club-wide");
  });

  it("canEditBooking returns true for manager managing a team in the training session", () => {
    const { canEditBooking } = useConflictDetection({
      bookings: [],
      pitches: dummyPitches,
      fixtures: [],
      teams: dummyTeams,
      selectedStatus: "all",
      currentUser: { id: 10, roles: ["TEAM_MANAGER"] },
      isExternalUser: false,
    });

    const booking = {
      id: 50,
      booking_type: "TRAINING",
      teams: [1],
      requested_by: 999, // someone else requested, but user 10 manages team 1
    };

    expect(canEditBooking(booking)).toBe(true);
  });

  it("canEditBooking returns false for manager who does not manage any team in the training session", () => {
    const { canEditBooking } = useConflictDetection({
      bookings: [],
      pitches: dummyPitches,
      fixtures: [],
      teams: dummyTeams,
      selectedStatus: "all",
      currentUser: { id: 30, roles: ["TEAM_MANAGER"] },
      isExternalUser: false,
    });

    const booking = {
      id: 51,
      booking_type: "TRAINING",
      teams: [1, 2],
      requested_by: 999,
    };

    expect(canEditBooking(booking)).toBe(false);
  });
});
