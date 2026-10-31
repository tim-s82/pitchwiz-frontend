import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { LoginScreen } from "../components/AuthScreens";
import PublicBookingForm from "../components/PublicBookingForm";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("External Booking on Login Screen", () => {
  it("renders external booking link on LoginScreen and triggers callback on click", async () => {
    const handleExternalBooking = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <LoginScreen
          onLoginSuccess={() => {}}
          onRequestExternalBooking={handleExternalBooking}
        />
      );
    });

    expect(container.textContent).toContain("External Pitch Booking Request");

    const buttons = Array.from(container.querySelectorAll("button"));
    const externalLinkBtn = buttons.find((b) =>
      b.textContent.includes("External Pitch Booking Request")
    );
    expect(externalLinkBtn).toBeDefined();

    await act(async () => {
      externalLinkBtn.click();
    });

    expect(handleExternalBooking).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("does not render external booking link on LoginScreen if callback not provided", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<LoginScreen onLoginSuccess={() => {}} />);
    });

    expect(container.textContent).not.toContain("External Pitch Booking Request");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders PublicBookingForm with Back to Sign In button and handles onBack", async () => {
    const handleBack = vi.fn();
    const mockVenues = [{ id: 1, name: "Main Ground", is_default: true }];
    const mockPitches = [
      { id: 10, venue: 1, name: "Pitch 1", entity_type: "MAIN" },
    ];

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PublicBookingForm
          venues={mockVenues}
          pitches={mockPitches}
          onBookingCreated={async () => {}}
          onBack={handleBack}
        />
      );
    });

    expect(container.textContent).toContain("External Pitch Booking Request");
    expect(container.textContent).toContain("Back to Sign In");

    const buttons = Array.from(container.querySelectorAll("button"));
    const backBtn = buttons.find((b) => b.textContent.includes("Back to Sign In"));
    expect(backBtn).toBeDefined();

    await act(async () => {
      backBtn.click();
    });

    expect(handleBack).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});

