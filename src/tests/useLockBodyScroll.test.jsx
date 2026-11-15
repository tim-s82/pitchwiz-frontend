import { describe, it, expect, beforeEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function DummyModal({ isOpen }) {
  useLockBodyScroll(isOpen);
  return isOpen ? <div>Modal Open</div> : null;
}

describe("useLockBodyScroll hook", () => {
  let container;
  let root;

  beforeEach(() => {
    document.body.style.overflow = "";
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it("locks body overflow to hidden when modal is open and restores when closed", async () => {
    expect(document.body.style.overflow).toBe("");

    await act(async () => {
      root.render(<DummyModal isOpen={true} />);
    });
    expect(document.body.style.overflow).toBe("hidden");

    await act(async () => {
      root.render(<DummyModal isOpen={false} />);
    });
    expect(document.body.style.overflow).toBe("");

    act(() => {
      root.unmount();
      container.remove();
    });
  });

  it("restores overflow on unmount", async () => {
    await act(async () => {
      root.render(<DummyModal isOpen={true} />);
    });
    expect(document.body.style.overflow).toBe("hidden");

    act(() => {
      root.unmount();
      container.remove();
    });
    expect(document.body.style.overflow).toBe("");
  });
});

