import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import SecretaryDashboard from "../components/SecretaryDashboard";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("SecretaryDashboard pending request cards alignment & actions", () => {
  const dummyVenues = [
    { id: 1, name: "Main Ground", is_default: true },
    { id: 2, name: "Nursery Ground", is_default: false },
  ];

  const dummyPitches = [
    { id: 101, venue: 1, name: "Pitch 1", entity_type: "MAIN", blocks_pitches: [] },
    { id: 102, venue: 1, name: "Pitch 2", entity_type: "MAIN", blocks_pitches: [] },
    { id: 103, venue: 2, name: "Nursery Pitch", entity_type: "MAIN", blocks_pitches: [] },
  ];

  const dummyTeams = [
    { id: 1, name: "1st XI", managers: [10] },
    { id: 2, name: "2nd XI", managers: [20] },
  ];

  const dummyFixtures = [
    { id: 10, team: 1, opponent: "Dorchester CC", start_date: "2026-06-01", end_date: "2026-06-01" },
  ];

  const dummyBookings = [
    {
      id: 501,
      pitch: 101,
      fixture: 10,
      booking_type: "FIXTURE",
      status: "PENDING",
      start_date: "2026-06-01",
      end_date: "2026-06-01",
      time_slot: "AFTERNOON",
      requires_teas: true,
      requires_drinks: true,
      notes: "Please have the boundary rope ready",
    },
    {
      id: 502,
      pitch: 102,
      fixture: null,
      booking_type: "EXTERNAL",
      external_contact_name: "Dorset Youth Cricket",
      status: "PENDING",
      start_date: "2026-06-05",
      end_date: "2026-06-07",
      time_slot: "ALL_DAY",
      requires_teas: false,
      requires_drinks: false,
    },
  ];

  it("renders desktop column headers and individual aligned request cards", async () => {
    const handleStatusUpdate = vi.fn();
    const handleBookingUpdated = vi.fn();
    const handleBookingDeleted = vi.fn();

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <SecretaryDashboard
          venues={dummyVenues}
          pitches={dummyPitches}
          teams={dummyTeams}
          fixtures={dummyFixtures}
          bookings={dummyBookings}
          pitchLengths={[]}
          onBookingStatusUpdate={handleStatusUpdate}
          onBookingUpdated={handleBookingUpdated}
          onBookingDeleted={handleBookingDeleted}
        />
      );
    });

    // Check desktop column headers
    expect(container.textContent).toContain("Fixture / Request");
    expect(container.textContent).toContain("Pitch");
    expect(container.textContent).toContain("Date");
    expect(container.textContent).toContain("Time Slot");
    expect(container.textContent).toContain("Actions");

    // Check card 1 fields
    expect(container.textContent).toContain("1st XI vs Dorchester CC");
    expect(container.textContent).toContain("Pitch 1");
    expect(container.textContent).toContain("Main Ground");
    expect(container.textContent).toContain("2026-06-01");
    expect(container.textContent).toContain("afternoon");
    expect(container.textContent).toContain("Teas");
    expect(container.textContent).toContain("Drinks");
    expect(container.textContent).toContain('Notes: “Please have the boundary rope ready”');

    // Check card 2 fields
    expect(container.textContent).toContain("Dorset Youth Cricket (Dorset/Public)");
    expect(container.textContent).toContain("Pitch 2");
    expect(container.textContent).toContain("2026-06-05");
    expect(container.textContent).toContain("to 2026-06-07");
    expect(container.textContent).toContain("all day");

    // Verify approve and deny buttons exist
    const buttons = Array.from(container.querySelectorAll("button"));
    const approveButtons = buttons.filter((b) => b.textContent.includes("Approve"));
    const denyButtons = buttons.filter((b) => b.textContent.includes("Deny"));
    expect(approveButtons.length).toBe(2);
    expect(denyButtons.length).toBe(2);

    // Click Approve on booking 501
    await act(async () => {
      approveButtons[0].click();
    });
    expect(handleStatusUpdate).toHaveBeenCalledWith(501, "APPROVED");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("handles alternative pitch proposal application", async () => {
    const handleStatusUpdate = vi.fn();
    const handleBookingUpdated = vi.fn().mockResolvedValue({});
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <SecretaryDashboard
          venues={dummyVenues}
          pitches={dummyPitches}
          teams={dummyTeams}
          fixtures={dummyFixtures}
          bookings={dummyBookings}
          pitchLengths={[]}
          onBookingStatusUpdate={handleStatusUpdate}
          onBookingUpdated={handleBookingUpdated}
          onBookingDeleted={vi.fn()}
        />
      );
    });

    const selects = Array.from(container.querySelectorAll("select"));
    expect(selects.length).toBe(2);

    // Select alternative pitch 103 for the first booking
    await act(async () => {
      const select = selects[0];
      select.value = "103";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const applyButtons = Array.from(container.querySelectorAll("button")).filter(
      (b) => b.textContent.includes("Apply")
    );
    expect(applyButtons.length).toBe(2);

    await act(async () => {
      applyButtons[0].click();
    });

    expect(handleBookingUpdated).toHaveBeenCalledWith(501, { pitch: 103 });
    alertSpy.mockRestore();

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
