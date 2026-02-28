"use client";

const STORAGE_KEY = "karaoke-offsets";

/**
 * Read the saved timing offset for a track.
 * Returns 0 if no offset is saved.
 */
export function getTrackOffset(trackId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const offsets: Record<string, number> = JSON.parse(raw);
    return offsets[trackId] ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Save a timing offset for a track.
 * Offset is in milliseconds (-500 to +500).
 */
export function setTrackOffset(trackId: string, offsetMs: number): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const offsets: Record<string, number> = raw ? JSON.parse(raw) : {};
    offsets[trackId] = offsetMs;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offsets));
  } catch {
    console.error("Failed to save track offset");
  }
}
