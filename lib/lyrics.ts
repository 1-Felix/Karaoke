export interface LyricsLine {
  text: string;
  startTime: number; // in milliseconds
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

export async function fetchLyrics(
  trackName: string,
  artistName: string,
  duration: number
): Promise<LyricsLine[] | null> {
  console.log('Fetching lyrics for:', { trackName, artistName, duration });

  try {
    // Build query parameters
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
    });

    // Add duration if available (helps LRCLIB find the correct version)
    if (duration > 0) {
      // Convert milliseconds to seconds
      params.append('duration', Math.floor(duration / 1000).toString());
    }

    const url = `https://lrclib.net/api/get?${params.toString()}`;
    console.log('Fetching from LRCLIB:', url);

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('❌ No lyrics found in LRCLIB for:', { trackName, artistName });
        return null;
      }
      console.error(`❌ LRCLIB API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: LRCLIBResponse = await response.json();

    if (data.instrumental) {
      console.log('⚠️ Track is marked as instrumental');
      return null;
    }

    // Prefer synced lyrics if available, otherwise use plain lyrics
    if (data.syncedLyrics) {
      console.log('✓ Found synced lyrics from LRCLIB!');
      return parseSyncedLyrics(data.syncedLyrics);
    } else if (data.plainLyrics) {
      console.log('✓ Found plain lyrics from LRCLIB, creating timed lyrics');
      return createTimedLyrics(data.plainLyrics, duration);
    }

    console.log('❌ No lyrics data in response');
    return null;
  } catch (error) {
    console.error('❌ Error fetching lyrics from LRCLIB:', error);
    return null;
  }
}

// Parse synced lyrics in LRC format: [mm:ss.xx]lyrics
function parseSyncedLyrics(syncedLyrics: string): LyricsLine[] {
  const lines = syncedLyrics.split('\n').filter(line => line.trim());
  const lyricsLines: LyricsLine[] = [];

  for (const line of lines) {
    // Match LRC format: [mm:ss.xx] or [mm:ss.xxx]
    const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const centiseconds = parseInt(match[3]);
      const text = match[4].trim();

      // Convert to milliseconds
      const startTime = (minutes * 60 + seconds) * 1000 + centiseconds * 10;

      if (text) {
        lyricsLines.push({ text, startTime });
      }
    }
  }

  console.log(`Parsed ${lyricsLines.length} synced lyrics lines`);
  return lyricsLines;
}

// Helper to split plain text lyrics into timed lines
export function createTimedLyrics(
  lyrics: string,
  duration: number
): LyricsLine[] {
  const lines = lyrics.split('\n').filter(line => line.trim());
  const timePerLine = duration / lines.length;

  return lines.map((text, index) => ({
    text,
    startTime: Math.floor(index * timePerLine),
  }));
}

// For demo purposes, create mock lyrics based on track duration
export function createMockLyrics(duration: number, trackName?: string): LyricsLine[] {
  const mockLines = trackName
    ? [
        `♪ Now Playing: ${trackName}`,
        "",
        "Lyrics not found on Genius",
        "",
        "Try a different song",
        "or check your Genius API token",
      ]
    : [
        "♪ Waiting for lyrics...",
        "",
        "Play a song on Spotify",
        "and lyrics will appear here",
        "in karaoke style",
      ];

  const timePerLine = duration / mockLines.length;

  return mockLines.map((text, index) => ({
    text,
    startTime: Math.floor(index * timePerLine),
  }));
}
