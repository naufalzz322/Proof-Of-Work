/**
 * Hook for tracking time spent on a job
 * Uses localStorage to persist across page reloads
 */
import { useState, useEffect, useCallback, useRef } from "react";

interface JobTimerState {
  jobId: string;
  startTime: number;
  totalPausedTime: number;
  isRunning: boolean;
  lastPauseTime: number | null;
}

const STORAGE_KEY_PREFIX = "job_timer_";

export function useJobTimer(jobId: string, isActive: boolean = true) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    if (!isActive) return;

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${jobId}`);
      if (stored) {
        const state: JobTimerState = JSON.parse(stored);
        const now = Date.now();

        // Calculate elapsed time since last update
        let elapsed = Math.floor((now - state.startTime) / 1000) - (state.totalPausedTime / 1000);

        // If paused, don't add time since pause
        if (state.lastPauseTime) {
          const pausedDuration = now - state.lastPauseTime;
          elapsed = Math.floor((state.lastPauseTime - state.startTime) / 1000) - (state.totalPausedTime / 1000);
          setElapsedSeconds(Math.max(0, elapsed));
        } else {
          setElapsedSeconds(Math.max(0, elapsed));
          setIsRunning(true);
        }
      }
    } catch {
      // Start fresh if no stored state
    }
  }, [jobId, isActive]);

  // Start/resume timer
  const start = useCallback(() => {
    if (!isActive) return;

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${jobId}`);
      let state: JobTimerState;

      if (stored) {
        state = JSON.parse(stored);
        // Subtract paused time from resume
        if (state.lastPauseTime) {
          state.totalPausedTime += Date.now() - state.lastPauseTime;
          state.lastPauseTime = null;
        }
      } else {
        // New timer
        state = {
          jobId,
          startTime: Date.now(),
          totalPausedTime: 0,
          isRunning: true,
          lastPauseTime: null,
        };
      }

      state.isRunning = true;
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${jobId}`, JSON.stringify(state));
      setIsRunning(true);
    } catch {
      console.warn("Failed to start timer");
    }
  }, [jobId, isActive]);

  // Pause timer
  const pause = useCallback(() => {
    if (!isActive) return;

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${jobId}`);
      if (stored) {
        const state: JobTimerState = JSON.parse(stored);
        state.lastPauseTime = Date.now();
        state.isRunning = false;
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${jobId}`, JSON.stringify(state));
        setIsRunning(false);
      }
    } catch {
      console.warn("Failed to pause timer");
    }
  }, [jobId, isActive]);

  // Stop and clear timer
  const stop = useCallback(() => {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${jobId}`);
      setElapsedSeconds(0);
      setIsRunning(false);
    } catch {
      console.warn("Failed to stop timer");
    }
  }, [jobId]);

  // Update elapsed time every second when running
  useEffect(() => {
    if (!isActive) return;

    const updateElapsed = () => {
      try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${jobId}`);
        if (stored) {
          const state: JobTimerState = JSON.parse(stored);
          const now = Date.now();

          if (state.lastPauseTime) {
            // Paused
            setElapsedSeconds(
              Math.floor((state.lastPauseTime - state.startTime - state.totalPausedTime) / 1000)
            );
          } else {
            // Running
            setElapsedSeconds(
              Math.floor((now - state.startTime - state.totalPausedTime) / 1000)
            );
          }
        }
      } catch {
        // Ignore
      }
    };

    intervalRef.current = setInterval(updateElapsed, 1000);
    updateElapsed(); // Initial update

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jobId, isRunning, isActive]);

  // Format time as HH:MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    isRunning,
    start,
    pause,
    stop,
  };
}
