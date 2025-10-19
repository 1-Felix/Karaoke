const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  progress_ms: number;
  is_playing: boolean;
}

export interface CurrentlyPlaying {
  item: SpotifyTrack | null;
  progress_ms: number;
  is_playing: boolean;
}

export async function getCurrentlyPlaying(
  accessToken: string
): Promise<CurrentlyPlaying | null> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me/player/currently-playing`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch currently playing track');
  }

  const data = await response.json();

  if (!data.item) {
    return null;
  }

  return {
    item: {
      id: data.item.id,
      name: data.item.name,
      artists: data.item.artists,
      album: data.item.album,
      duration_ms: data.item.duration_ms,
      progress_ms: data.progress_ms,
      is_playing: data.is_playing,
    },
    progress_ms: data.progress_ms,
    is_playing: data.is_playing,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  return {
    accessToken: data.access_token,
    accessTokenExpires: Date.now() + data.expires_in * 1000,
    refreshToken: data.refresh_token ?? refreshToken,
  };
}
