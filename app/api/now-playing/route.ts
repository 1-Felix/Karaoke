import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getCurrentlyPlaying } from '@/lib/spotify';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const nowPlaying = await getCurrentlyPlaying(session.accessToken);

    if (!nowPlaying || !nowPlaying.item) {
      return NextResponse.json({ playing: false });
    }

    return NextResponse.json({
      playing: nowPlaying.is_playing,  // Use actual play state, not just track presence
      track: nowPlaying.item,
      progress: nowPlaying.progress_ms,
    });
  } catch (error) {
    console.error('Error fetching now playing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currently playing track' },
      { status: 500 }
    );
  }
}
