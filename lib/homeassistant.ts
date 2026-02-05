const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;
// Offset in ms to sync lyrics with actual audio (negative = lyrics earlier, positive = lyrics later)
// Default -3500ms to compensate for Music Assistant -> speaker latency
const HA_SYNC_OFFSET_MS = parseInt(process.env.HA_SYNC_OFFSET_MS || '-3500', 10);

export interface HAMediaPlayerState {
  entity_id: string;
  state: 'playing' | 'paused' | 'idle' | 'off' | 'unavailable';
  attributes: {
    friendly_name?: string;
    media_title?: string;
    media_artist?: string;
    media_album_name?: string;
    media_duration?: number; // seconds
    media_position?: number; // seconds
    media_position_updated_at?: string;
    entity_picture?: string;
    source?: string;
  };
}

export interface HACurrentlyPlaying {
  item: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
    };
    duration_ms: number;
  };
  progress_ms: number;
  is_playing: boolean;
  source_player: string;
}

export async function getHAMediaPlayers(): Promise<HAMediaPlayerState[]> {
  if (!HA_URL || !HA_TOKEN) {
    throw new Error('Home Assistant configuration missing');
  }

  const response = await fetch(`${HA_URL}/api/states`, {
    headers: {
      Authorization: `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HA API error: ${response.status}`);
  }

  const states = await response.json();
  
  // Filter to media_player entities that are playing or have media info
  return states.filter((s: HAMediaPlayerState) => {
    if (!s.entity_id.startsWith('media_player.')) return false;
    // Include if it has media info or is in a playable state
    return s.attributes.media_title || 
           ['playing', 'paused'].includes(s.state);
  });
}

export async function getHAPlayerState(entityId: string): Promise<HAMediaPlayerState | null> {
  if (!HA_URL || !HA_TOKEN) {
    throw new Error('Home Assistant configuration missing');
  }

  const response = await fetch(`${HA_URL}/api/states/${entityId}`, {
    headers: {
      Authorization: `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`HA API error: ${response.status}`);
  }

  return response.json();
}

export async function getCurrentlyPlayingHA(
  playerEntityId?: string
): Promise<HACurrentlyPlaying | null> {
  if (!HA_URL || !HA_TOKEN) {
    throw new Error('Home Assistant configuration missing');
  }

  let player: HAMediaPlayerState | null = null;

  if (playerEntityId) {
    // Use specific player
    player = await getHAPlayerState(playerEntityId);
  } else {
    // Auto-detect: find first playing player with media info
    const players = await getHAMediaPlayers();
    player = players.find(p => 
      p.state === 'playing' && 
      p.attributes.media_title
    ) || null;
  }

  if (!player || !player.attributes.media_title) {
    return null;
  }

  const attrs = player.attributes;
  
  // Calculate current playback position
  let progress_ms = 0;
  if (attrs.media_position !== undefined) {
    progress_ms = attrs.media_position * 1000;
    
    // If playing, add elapsed time since last position update
    if (player.state === 'playing' && attrs.media_position_updated_at) {
      const updatedAt = new Date(attrs.media_position_updated_at).getTime();
      const elapsed = Date.now() - updatedAt;
      progress_ms += elapsed;
    }
    
    // Apply sync offset to compensate for MA -> speaker latency
    progress_ms = Math.max(0, progress_ms + HA_SYNC_OFFSET_MS);
  }

  const mediaTitle = attrs.media_title!; // We've already checked this exists above
  
  return {
    item: {
      id: `ha-${player.entity_id}-${mediaTitle}`,
      name: mediaTitle,
      artists: [{ name: attrs.media_artist || 'Unknown Artist' }],
      album: {
        name: attrs.media_album_name || '',
        images: attrs.entity_picture ? [{ url: attrs.entity_picture }] : [],
      },
      duration_ms: (attrs.media_duration || 0) * 1000,
    },
    progress_ms,
    is_playing: player.state === 'playing',
    source_player: player.entity_id,
  };
}

// Get configured player entities from environment
export function getConfiguredPlayers(): string[] {
  const playersEnv = process.env.HA_MEDIA_PLAYERS;
  if (!playersEnv) return [];
  return playersEnv.split(',').map(p => p.trim()).filter(Boolean);
}

export function isHAConfigured(): boolean {
  return Boolean(HA_URL && HA_TOKEN);
}
