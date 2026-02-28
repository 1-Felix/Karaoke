"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UsePlaybackTimeOptions {
  /** Server-reported position in milliseconds */
  serverPosition: number;
  /** Whether playback is currently active */
  isPlaying: boolean;
  /** Threshold in ms above which we snap instead of blend (default: 2000) */
  snapThreshold?: number;
  /** Duration in ms over which to blend toward server position (default: 500) */
  blendDuration?: number;
}

/**
 * Smooth playback time interpolation using requestAnimationFrame + performance.now().
 *
 * Between Spotify API polls, interpolates time at display refresh rate.
 * When a new server position arrives, smoothly blends toward it unless
 * drift exceeds the snap threshold.
 */
export function usePlaybackTime({
  serverPosition,
  isPlaying,
  snapThreshold = 2000,
  blendDuration = 500,
}: UsePlaybackTimeOptions): number {
  const [displayTime, setDisplayTime] = useState(serverPosition);

  // Mutable refs for the animation loop
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const currentTimeRef = useRef(serverPosition);
  const targetTimeRef = useRef(serverPosition);
  const isBlendingRef = useRef(false);
  const blendStartRef = useRef(0);
  const blendFromRef = useRef(0);
  const blendToRef = useRef(0);

  // Handle new server position: decide whether to snap or blend
  useEffect(() => {
    const drift = Math.abs(currentTimeRef.current - serverPosition);

    if (drift > snapThreshold) {
      // Large drift → snap immediately
      currentTimeRef.current = serverPosition;
      targetTimeRef.current = serverPosition;
      isBlendingRef.current = false;
      setDisplayTime(serverPosition);
    } else if (drift > 50) {
      // Small drift → blend smoothly toward server position
      isBlendingRef.current = true;
      blendStartRef.current = performance.now();
      blendFromRef.current = currentTimeRef.current;
      blendToRef.current = serverPosition;
      targetTimeRef.current = serverPosition;
    }
    // Drift < 50ms → ignore, interpolation is close enough
  }, [serverPosition, snapThreshold]);

  // The main animation loop
  const tick = useCallback(
    (now: number) => {
      if (lastFrameTimeRef.current !== null) {
        const deltaMs = now - lastFrameTimeRef.current;

        if (isBlendingRef.current) {
          // Blending toward server position
          const elapsed = now - blendStartRef.current;
          const t = Math.min(elapsed / blendDuration, 1);
          // Ease-out cubic for smooth correction feel
          const eased = 1 - Math.pow(1 - t, 3);
          currentTimeRef.current =
            blendFromRef.current + (blendToRef.current - blendFromRef.current) * eased;

          if (t >= 1) {
            isBlendingRef.current = false;
            currentTimeRef.current = blendToRef.current;
          }

          // Still advance by delta on top of the blend target
          if (t >= 1) {
            currentTimeRef.current += deltaMs;
          }
        } else {
          // Normal interpolation: advance by elapsed time
          currentTimeRef.current += deltaMs;
        }

        setDisplayTime(Math.floor(currentTimeRef.current));
      }

      lastFrameTimeRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    },
    [blendDuration],
  );

  // Start/stop the animation loop based on playback state
  useEffect(() => {
    if (isPlaying) {
      lastFrameTimeRef.current = null; // Reset so first frame doesn't have a huge delta
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastFrameTimeRef.current = null;
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, tick]);

  return displayTime;
}
