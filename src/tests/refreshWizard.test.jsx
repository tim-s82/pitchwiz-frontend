import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PlayCricketSyncManager from "../components/PlayCricketSyncManager";
import FixtureImportManager from "../components/FixtureImportManager";
import { api } from "../services/api";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("PlayCricketSyncManager & FixtureImportManager Refresh Wizard", () => {
    let container = null;
    let root = null;

    const dummyTeams = [
        { id: 1, name: "1st XI" },
        { id: 2, name: "2nd XI" },
    ];
    const dummyVenues = [
        { id: 1, name: "Home Ground", is_default: true },
        { id: 2, name: "Dumpton School", is_default: false },
    ];
    const dummyPitches = [
        { id: 101, name: "Main Pitch", venue: 1, entity_type: "MAIN" },
        { id: 102, name: "Pitch 2", venue: 2, entity_type: "MAIN" },
    ];

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        if (root) {
            act(() => root.unmount());
        }
        if (container) {
            container.remove();
        }
        vi.restoreAllMocks();
    });

    it("renders Step 1 for PlayCricketSyncManager and initiates fetch", async () => {
        vi.spyOn(api, "previewPlayCricketFixtures").mockResolvedValue({
            success: true,
            detected_teams: [
                { team_id: 1, team_name: "1st XI", incoming_count: 5, existing_count: 5, ambiguous: false },
            ],
            rows: [
                {
                    id: "row_1",
                    action: "RESCHEDULED",
                    teamId: 1,
                    opponent: "Poole CC",
                    date: "2026-06-14",
                    oldDate: "2026-06-07",
                    time: "14:00",
                    timeSlot: "AFTERNOON",
                    pitchId: 101,
                    pitchPreserved: true,
                    selected: true,
                },
                {
                    id: "row_2",
                    action: "REMOVED",
                    teamId: 1,
                    opponent: "Swanage CC",
                    date: "2026-07-12",
                    pitchId: 101,
                    selected: false,
                },
            ],
        });

        await act(async () => {
            root.render(
                <PlayCricketSyncManager
                    teams={dummyTeams}
                    venues={dummyVenues}
                    pitches={dummyPitches}
                />
            );
        });

        expect(container.textContent).toContain("Select Season Year");
        const fetchBtn = container.querySelector("button");

        await act(async () => {
            fetchBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        // Advances to Step 2
        expect(container.textContent).toContain("Select Teams to Import or Refresh");
        expect(container.textContent).toContain("1st XI");
        expect(container.textContent).toContain("5 in Play-Cricket");

        // Click proceed to Step 3
        const proceedBtn = Array.from(container.querySelectorAll("button")).find((b) =>
            b.textContent.includes("Proceed to Review")
        );
        expect(proceedBtn).toBeDefined();

        await act(async () => {
            proceedBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        // In Step 3: Review table shows Rescheduled diff and Deletion warning
        expect(container.textContent).toContain("Review & Confirm Fixtures");
        expect(container.textContent).toContain("Rescheduled");
        expect(container.textContent).toContain("Delete");
        expect(container.textContent).toContain("Will be deleted");
        expect(container.textContent).toContain("Pitch Preserved");

        // Removal row checkbox must be unchecked by default
        const checkboxes = container.querySelectorAll("tbody input[type='checkbox']");
        expect(checkboxes.length).toBe(2);
        expect(checkboxes[0].checked).toBe(true);  // Rescheduled is checked
        expect(checkboxes[1].checked).toBe(false); // Removed is unchecked by default
    });

    it("allows accepting an alternative venue suggestion in Step 3", async () => {
        vi.spyOn(api, "previewPlayCricketFixtures").mockResolvedValue({
            success: true,
            detected_teams: [
                { team_id: 1, team_name: "1st XI", incoming_count: 1, existing_count: 0, ambiguous: false },
            ],
            rows: [
                {
                    id: "row_1",
                    action: "NEW",
                    teamId: 1,
                    opponent: "Dorchester CC",
                    date: "2026-06-14",
                    time: "14:00",
                    timeSlot: "AFTERNOON",
                    pitchId: null,
                    venueClash: true,
                    suggestedPitchId: 102,
                    suggestedPitchName: "Dumpton School - Pitch 2",
                    clashReason: "Venue full",
                    selected: false,
                },
            ],
        });

        await act(async () => {
            root.render(
                <PlayCricketSyncManager
                    teams={dummyTeams}
                    venues={dummyVenues}
                    pitches={dummyPitches}
                />
            );
        });

        // Trigger fetch
        const fetchBtn = container.querySelector("button");
        await act(async () => {
            fetchBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        // Proceed to review
        const proceedBtn = Array.from(container.querySelectorAll("button")).find((b) =>
            b.textContent.includes("Proceed to Review")
        );
        await act(async () => {
            proceedBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        expect(container.textContent).toContain("Target venue full");
        expect(container.textContent).toContain("Dumpton School - Pitch 2");

        const acceptBtn = Array.from(container.querySelectorAll("button")).find((b) =>
            b.textContent.includes("Accept")
        );
        expect(acceptBtn).toBeDefined();

        await act(async () => {
            acceptBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        // Row should now have pitch 102 selected and be ready
        const checkbox = container.querySelector("tbody input[type='checkbox']");
        expect(checkbox.checked).toBe(true);
        expect(container.textContent).toContain("Ready");
    });

    it("renders initial upload screen for FixtureImportManager", async () => {
        await act(async () => {
            root.render(
                <FixtureImportManager
                    teams={dummyTeams}
                    venues={dummyVenues}
                    pitches={dummyPitches}
                />
            );
        });

        expect(container.textContent).toContain("Fixture Spreadsheet Import & Refresh");
        expect(container.textContent).toContain("Click to upload .xlsx or .csv spreadsheet");
    });
});
