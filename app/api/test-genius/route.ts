import { NextResponse } from 'next/server';
import { getLyrics } from 'genius-lyrics-api';

export async function GET() {
  const token = process.env.GENIUS_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({
      success: false,
      error: 'GENIUS_ACCESS_TOKEN not configured in environment variables',
    });
  }

  try {
    // Try to fetch lyrics for a well-known song to test the token
    const result = await getLyrics({
      apiKey: token,
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      optimizeQuery: true,
    });

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Genius API token is valid!',
        tokenPreview: `${token.substring(0, 10)}...${token.substring(token.length - 4)}`,
        testSongFound: true,
        lyricsLength: result.length,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Token seems valid but test song not found',
      tokenPreview: `${token.substring(0, 10)}...${token.substring(token.length - 4)}`,
    });
  } catch (error) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };

    return NextResponse.json({
      success: false,
      error: 'Failed to connect to Genius API',
      statusCode: axiosError.response?.status,
      message: axiosError.message,
      tokenPreview: `${token.substring(0, 10)}...${token.substring(token.length - 4)}`,
      hint:
        axiosError.response?.status === 403
          ? 'Your token appears to be invalid. Please verify you copied the "Client Access Token" from https://genius.com/api-clients'
          : 'Unknown error - check server logs for details',
    });
  }
}
