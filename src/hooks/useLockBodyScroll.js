import { useEffect } from "react";

/**
 * Custom hook to lock body scrolling when a modal or overlay is active.
 * Restores original body overflow style on cleanup.
 * Handles nested or multiple active locks safely using a ref counter.
 */
let lockCount = 0;

export function useLockBodyScroll(isLocked = true) {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      document.body.style.overflow = "hidden";
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = "";
      }
    };
  }, [isLocked]);
}

export default useLockBodyScroll;

