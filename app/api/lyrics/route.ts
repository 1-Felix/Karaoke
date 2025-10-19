import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { fetchLyrics, createMockLyrics } from '@/lib/lyrics';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const trackName = searchParams.get('track');
  const artistName = searchParams.get('artist');
  const duration = parseInt(searchParams.get('duration') || '0');

  if (!trackName || !artistName) {
    return NextResponse.json(
      { error: 'Missing track or artist name' },
      { status: 400 }
    );
  }

  // Try to fetch real lyrics from Genius
  const lyrics = await fetchLyrics(trackName, artistName, duration);

  // If no lyrics found, return mock lyrics for demo
  if (!lyrics) {
    return NextResponse.json({
      lyrics: createMockLyrics(duration, trackName),
      mock: true,
    });
  }

  return NextResponse.json({
    lyrics,
    mock: false,
  });
}
