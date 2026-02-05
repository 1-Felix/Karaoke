import { NextResponse } from 'next/server';
import { getCurrentlyPlayingHA, isHAConfigured } from '@/lib/homeassistant';

export async function GET(request: Request) {
  if (!isHAConfigured()) {
    return NextResponse.json({ 
      error: 'Home Assistant not configured' 
    }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const playerEntityId = searchParams.get('player') || undefined;

  try {
    const nowPlaying = await getCurrentlyPlayingHA(playerEntityId);

    if (!nowPlaying) {
      return NextResponse.json({ playing: false });
    }

    return NextResponse.json({
      playing: true,
      track: nowPlaying.item,
      progress: nowPlaying.progress_ms,
      source_player: nowPlaying.source_player,
    });
  } catch (error) {
    console.error('Error fetching HA now playing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currently playing from Home Assistant' },
      { status: 500 }
    );
  }
}
