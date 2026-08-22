'use client';

import { useEffect } from 'react';
import { unlockAudio } from '@/lib/playChime';

export default function AudioUnlock() {
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return null;
}
