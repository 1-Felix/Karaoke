import { getLyrics } from 'genius-lyrics-api';

export interface LyricsLine {
  text: string;
  startTime: number; // in milliseconds
}

const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN || '';

export async function fetchLyrics(
  trackName: string,
  artistName: string,
  duration: number
): Promise<LyricsLine[] | null> {
  console.log('Fetching lyrics for:', { trackName, artistName, duration });

  if (!GENIUS_ACCESS_TOKEN) {
    console.warn('⚠️ GENIUS_ACCESS_TOKEN not configured - using mock lyrics');
    return null;
  }

  console.log('✓ GENIUS_ACCESS_TOKEN is configured');

  // Try multiple search strategies
  const searchStrategies = [
    // Strategy 1: Exact search with optimizeQuery
    {
      apiKey: GENIUS_ACCESS_TOKEN,
      title: trackName,
      artist: artistName,
      optimizeQuery: true,
    },
    // Strategy 2: Without optimizeQuery
    {
      apiKey: GENIUS_ACCESS_TOKEN,
      title: trackName,
      artist: artistName,
      optimizeQuery: false,
    },
    // Strategy 3: Just the first artist (for songs with multiple artists)
    {
      apiKey: GENIUS_ACCESS_TOKEN,
      title: trackName,
      artist: artistName.split(',')[0].split('&')[0].trim(),
      optimizeQuery: true,
    },
  ];

  for (let i = 0; i < searchStrategies.length; i++) {
    const options = searchStrategies[i];
    try {
      console.log(`Attempt ${i + 1}: Searching Genius with:`, {
        title: options.title,
        artist: options.artist,
        optimizeQuery: options.optimizeQuery,
      });

      const lyrics = await getLyrics(options);

      if (lyrics) {
        console.log(`✓ Lyrics found on attempt ${i + 1}! Length: ${lyrics.length} characters`);
        return createTimedLyrics(lyrics, duration);
      }

      console.log(`Attempt ${i + 1} returned no results, trying next strategy...`);
    } catch (error) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      if (axiosError.response?.status === 403) {
        console.error(`❌ 403 FORBIDDEN: Your Genius API token is invalid or unauthorized`);
        console.error(`Token starts with: ${GENIUS_ACCESS_TOKEN.substring(0, 20)}...`);
        console.error(`Please verify your GENIUS_ACCESS_TOKEN in .env.local`);
        // Don't retry on 403 - it won't work
        return null;
      }
      console.error(`❌ Error on attempt ${i + 1}:`, error);
      if (i === searchStrategies.length - 1) {
        console.error('All search strategies failed');
      }
    }
  }

  console.log(`❌ No lyrics found after ${searchStrategies.length} attempts for: "${trackName}" by ${artistName}`);
  return null;
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
