export interface LyricsLine {
  text: string;
  startTime: number; // in milliseconds
  translation?: string; // English translation for non-EN/DE lyrics
}

interface LRCLIBResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string;
}

interface LRCLIBSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  syncedLyrics: string | null;
  plainLyrics: string | null;
}

export async function fetchLyrics(
  trackName: string,
  artistName: string,
  duration: number,
): Promise<LyricsLine[] | null> {
  console.log("Fetching lyrics for:", { trackName, artistName, duration });

  try {
    // Build query parameters
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
    });

    // Add duration if available (helps LRCLIB find the correct version)
    if (duration > 0) {
      // Convert milliseconds to seconds
      params.append("duration", Math.floor(duration / 1000).toString());
    }

    const url = `https://lrclib.net/api/get?${params.toString()}`;
    console.log("Fetching from LRCLIB:", url);

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        console.log("❌ No lyrics found in LRCLIB for:", { trackName, artistName });
        return null;
      }
      console.error(`❌ LRCLIB API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: LRCLIBResponse = await response.json();

    if (data.instrumental) {
      console.log("⚠️ Track is marked as instrumental");
      return null;
    }

    // Prefer synced lyrics if available, otherwise use plain lyrics
    if (data.syncedLyrics) {
      console.log("✓ Found synced lyrics from LRCLIB!");
      return parseSyncedLyrics(data.syncedLyrics);
    } else if (data.plainLyrics) {
      console.log("✓ Found plain lyrics from LRCLIB, creating timed lyrics");
      return createTimedLyrics(data.plainLyrics, duration);
    }

    console.log("❌ No lyrics data in response");
    return null;
  } catch (error) {
    console.error("❌ Error fetching lyrics from LRCLIB:", error);
    return null;
  }
}

// Parse synced lyrics in LRC format: [mm:ss.xx]lyrics
export function parseSyncedLyrics(syncedLyrics: string): LyricsLine[] {
  const lines = syncedLyrics.split("\n").filter((line) => line.trim());
  const lyricsLines: LyricsLine[] = [];

  for (const line of lines) {
    // Match LRC format: [mm:ss.xx] or [mm:ss.xxx]
    const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const fractional = match[3];
      const text = match[4].trim();

      // Convert fractional part to milliseconds based on digit count:
      // 2 digits = centiseconds (e.g., .45 = 450ms), 3 digits = milliseconds (e.g., .456 = 456ms)
      const fractionalMs =
        fractional.length === 2 ? parseInt(fractional) * 10 : parseInt(fractional);

      const startTime = (minutes * 60 + seconds) * 1000 + fractionalMs;

      if (text) {
        lyricsLines.push({ text, startTime });
      }
    }
  }

  console.log(`Parsed ${lyricsLines.length} synced lyrics lines`);
  return lyricsLines;
}

// Helper to split plain text lyrics into timed lines
export function createTimedLyrics(lyrics: string, duration: number): LyricsLine[] {
  const lines = lyrics.split("\n").filter((line) => line.trim());
  const timePerLine = duration / lines.length;

  return lines.map((text, index) => ({
    text,
    startTime: Math.floor(index * timePerLine),
  }));
}

/**
 * Search LRCLIB for an official English translation of a song.
 * Looks for tracks with "English ver.", "English Version", etc.
 */
export async function fetchOfficialTranslation(
  trackName: string,
  artistName: string,
): Promise<LyricsLine[] | null> {
  console.log("Searching for official English translation:", { trackName, artistName });

  try {
    // Search for English versions
    const searchQueries = [
      `${trackName} English`,
      `${trackName} (English ver.)`,
      `${trackName} (English Version)`,
    ];

    for (const query of searchQueries) {
      const params = new URLSearchParams({
        q: `${query} ${artistName}`,
      });

      const url = `https://lrclib.net/api/search?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) continue;

      const results: LRCLIBSearchResult[] = await response.json();

      // Find a matching English version
      const englishVersion = results.find((result) => {
        const name = result.trackName.toLowerCase();
        const artist = result.artistName.toLowerCase();
        return (
          artist.includes(artistName.toLowerCase()) &&
          (name.includes("english ver") ||
            name.includes("english version") ||
            name.includes("(en)") ||
            name.includes("[english]"))
        );
      });

      if (englishVersion?.syncedLyrics) {
        console.log("✓ Found official English translation:", englishVersion.trackName);
        return parseSyncedLyrics(englishVersion.syncedLyrics);
      }
    }

    console.log("❌ No official English translation found");
    return null;
  } catch (error) {
    console.error("❌ Error searching for English translation:", error);
    return null;
  }
}

/**
 * Merge original lyrics with English translation lyrics.
 * Uses line-index mapping as primary strategy (most translations are line-for-line),
 * with ratio-based interpolation for mismatched line counts.
 * Timestamp matching is used as a validation heuristic to skip bad pairings.
 */
export function mergeWithTranslations(
  originalLyrics: LyricsLine[],
  translationLyrics: LyricsLine[],
): LyricsLine[] {
  if (!translationLyrics.length) return originalLyrics;

  const origLen = originalLyrics.length;
  const transLen = translationLyrics.length;

  return originalLyrics.map((line, index) => {
    // Primary: line-index mapping
    // If counts match, map 1:1. Otherwise, use ratio-based interpolation.
    let transIndex: number;
    if (origLen === transLen) {
      transIndex = index;
    } else if (origLen === 1) {
      // Single-line edge case: always map to first translation
      transIndex = 0;
    } else {
      // Ratio mapping: proportionally find the closest translation line
      transIndex = Math.round((index * (transLen - 1)) / (origLen - 1));
      transIndex = Math.min(transIndex, transLen - 1);
    }

    const transLine = translationLyrics[transIndex];

    // Validation: skip if timestamp diff is too large (likely wrong pairing)
    const timestampDiff = Math.abs(transLine.startTime - line.startTime);
    if (timestampDiff > 5000) {
      return line;
    }

    // Skip if translation text matches original (redundant)
    if (transLine.text.toLowerCase() === line.text.toLowerCase()) {
      return line;
    }

    // Skip empty translations
    if (!transLine.text.trim()) {
      return line;
    }

    return {
      ...line,
      translation: transLine.text,
    };
  });
}

// Create placeholder lyrics when none are found
export function createMockLyrics(duration: number, trackName?: string): LyricsLine[] {
  const mockLines = trackName
    ? ["♪ ♪ ♪", "", "No lyrics available", "for this song", "", "♪ ♪ ♪"]
    : ["♪ Waiting for music...", "", "Play a song", "and lyrics will appear here", "", "♪ ♪ ♪"];

  const timePerLine = duration / mockLines.length;

  return mockLines.map((text, index) => ({
    text,
    startTime: Math.floor(index * timePerLine),
  }));
}
