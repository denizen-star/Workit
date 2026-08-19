'use client';

import { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

interface RestTimerProps {
  defaultSeconds?: number;
  onComplete?: () => void;
}

export default function RestTimer({ defaultSeconds = 90, onComplete }: RestTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(defaultSeconds);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (onComplete) onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, seconds, onComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setSeconds(initialTime);
    setIsRunning(false);
  };

  const adjustTime = (amount: number) => {
    const newTime = Math.max(0, seconds + amount);
    setSeconds(newTime);
    setInitialTime(newTime);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const progress = ((initialTime - seconds) / initialTime) * 100;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          <h3 className="font-semibold">Rest Timer</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => adjustTime(-15)}
            className="px-2 py-1 bg-white/20 rounded hover:bg-white/30 text-sm"
          >
            -15s
          </button>
          <button
            onClick={() => adjustTime(15)}
            className="px-2 py-1 bg-white/20 rounded hover:bg-white/30 text-sm"
          >
            +15s
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="text-6xl font-bold text-center mb-2">
          {formatTime(seconds)}
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={toggleTimer}
          className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start
            </>
          )}
        </button>
        <button
          onClick={resetTimer}
          className="flex items-center gap-2 px-6 py-3 bg-white/20 rounded-lg font-semibold hover:bg-white/30 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>

      {seconds === 0 && (
        <div className="mt-4 text-center animate-pulse">
          <p className="text-lg font-semibold">Rest Complete!</p>
        </div>
      )}
    </div>
  );
}
