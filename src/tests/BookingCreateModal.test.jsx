import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import BookingCreateModal from "../components/calendar/BookingCreateModal";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("BookingCreateModal component", () => {
  let container;
  let root;

  const mockPitches = [
    { id: 1, name: "Pitch 1", venue: 1, entity_type: "MAIN", supported_lengths: [22] },
    { id: 2, name: "Net 1", venue: 1, entity_type: "NET", supported_lengths: [22] },
  ];

  const mockVenues = [{ id: 1, name: "Main Ground" }];

  const mockTeams = [
    { id: 10, name: "1st XI", required_length: 22, is_external: false },
    { id: 20, name: "2nd XI", required_length: 22, is_external: false },
    { id: 30, name: "Under 13s", required_length: 19, is_external: false },
  ];

  beforeEach(() => {
    document.body.style.overflow = "";
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it("locks body scrolling when opened and releases when closed", async () => {
    const defaultModalData = {
      pitchId: "1",
      teamId: "10",
      bookingType: "FIXTURE",
      date: "2026-06-01",
      endDate: "2026-06-01",
      isMultiDay: false,
      timeSlot: "AFTERNOON",
      opponent: "Wimborne CC",
      requiresTeas: false,
      requiresDrinks: false,
      notes: "",
      trainingTeamIds: [],
    };

    await act(async () => {
      root.render(
        <BookingCreateModal
          isOpen={true}
          onClose={vi.fn()}
          modalData={defaultModalData}
          setModalData={vi.fn()}
          pitches={mockPitches}
          venues={mockVenues}
          teams={mockTeams}
          allowedTeams={mockTeams}
          currentUser={{ id: 1, roles: ["ADMIN"] }}
          onSubmit={vi.fn()}
        />
      );
    });

    expect(document.body.style.overflow).toBe("hidden");

    await act(async () => {
      root.render(
        <BookingCreateModal
          isOpen={false}
          onClose={vi.fn()}
          modalData={defaultModalData}
          setModalData={vi.fn()}
          pitches={mockPitches}
          venues={mockVenues}
          teams={mockTeams}
          allowedTeams={mockTeams}
          currentUser={{ id: 1, roles: ["ADMIN"] }}
          onSubmit={vi.fn()}
        />
      );
    });

    expect(document.body.style.overflow).toBe("");

    act(() => {
      root.unmount();
      container.remove();
    });
  });

  it("renders training session mode with compact selectable team pills and club-wide button", async () => {
    const setModalData = vi.fn();
    const modalData = {
      pitchId: "2",
      teamId: "",
      bookingType: "TRAINING",
      date: "2026-06-01",
      endDate: "2026-06-01",
      isMultiDay: false,
      timeSlot: "EVENING",
      opponent: "",
      requiresTeas: false,
      requiresDrinks: false,
      notes: "",
      trainingTeamIds: [10],
    };

    await act(async () => {
      root.render(
        <BookingCreateModal
          isOpen={true}
          onClose={vi.fn()}
          modalData={modalData}
          setModalData={setModalData}
          pitches={mockPitches}
          venues={mockVenues}
          teams={mockTeams}
          allowedTeams={mockTeams}
          currentUser={{ id: 1, roles: ["ADMIN"] }}
          onSubmit={vi.fn()}
        />
      );
    });

    expect(container.textContent).toContain("Request Training Session");
    expect(container.textContent).toContain("Club-wide");
    expect(container.textContent).toContain("1st XI");
    expect(container.textContent).toContain("2nd XI");

    // Click on 2nd XI button to toggle team selection
    const team2Button = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent.includes("2nd XI")
    );
    expect(team2Button).toBeTruthy();

    await act(async () => {
      team2Button.click();
    });

    expect(setModalData).toHaveBeenCalledWith(
      expect.objectContaining({
        trainingTeamIds: [10, 20],
      })
    );

    act(() => {
      root.unmount();
      container.remove();
    });
  });
});

