"use client";

import { useEffect } from "react";

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let lock: WakeLockSentinel | null = null;
    let released = false;

    const request = async () => {
      if (released || document.visibilityState !== "visible") return;
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // Some browsers only allow this in installed PWAs or after a gesture.
      }
    };

    request();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        request();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibility);
      lock?.release().catch(() => undefined);
    };
  }, [active]);
}
