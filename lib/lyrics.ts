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
  if (!GENIUS_ACCESS_TOKEN) {
    console.warn('GENIUS_ACCESS_TOKEN not configured');
    return null;
  }

  try {
    // Search for the song on Genius
    const options = {
      apiKey: GENIUS_ACCESS_TOKEN,
      title: trackName,
      artist: artistName,
      optimizeQuery: true,
    };

    const lyrics = await getLyrics(options);

    if (!lyrics) {
      console.log(`No lyrics found for: ${trackName} by ${artistName}`);
      return null;
    }

    // Convert plain text lyrics to timed lyrics
    return createTimedLyrics(lyrics, duration);
  } catch (error) {
    console.error('Error fetching lyrics from Genius:', error);
    return null;
  }
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
export function createMockLyrics(duration: number): LyricsLine[] {
  const mockLines = [
    "♪ Waiting for lyrics...",
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
