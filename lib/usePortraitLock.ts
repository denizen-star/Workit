'use client';

import { useEffect } from 'react';

/** Best-effort portrait lock while a live workout is open. iPhone often ignores this. */
export function usePortraitLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof screen === 'undefined') return;
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (type: string) => Promise<void>;
      unlock?: () => void;
    };
    if (typeof orientation?.lock !== 'function') return;

    void orientation.lock('portrait').catch(() => undefined);

    return () => {
      try {
        orientation.unlock?.();
      } catch {
        // Unlock is not always allowed after a failed lock.
      }
    };
  }, [active]);
}
