import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import Footer from "../components/Footer";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const server = setupServer(
  http.get("*/api/version", () => {
    return HttpResponse.json({
      service: "pitchwiz-backend",
      version: "1.2.3",
      build_date: "2026-10-17",
      commit: "abcdef1",
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => server.close());

describe("Footer Component", () => {
  it("renders copyright and build version information for both frontend and backend", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<Footer />);
    });

    // Verify copyright and UI version rendered immediately
    expect(container.textContent).toContain("PitchWiz");
    expect(container.textContent).toContain("UI:");

    // Wait for the async API call to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(container.textContent).toContain("API:");
    expect(container.textContent).toContain("v1.2.3");
    expect(container.textContent).toContain("2026-10-17");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
