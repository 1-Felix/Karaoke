import { NextResponse } from 'next/server';
import { getHAMediaPlayers, isHAConfigured, getConfiguredPlayers } from '@/lib/homeassistant';

export async function GET() {
  if (!isHAConfigured()) {
    return NextResponse.json({ 
      configured: false, 
      error: 'Home Assistant not configured' 
    }, { status: 400 });
  }

  try {
    const allPlayers = await getHAMediaPlayers();
    const configuredIds = getConfiguredPlayers();
    
    // If specific players are configured, filter to those
    // Otherwise, return all players with media capabilities
    const players = configuredIds.length > 0
      ? allPlayers.filter(p => configuredIds.includes(p.entity_id))
      : allPlayers;

    return NextResponse.json({
      configured: true,
      players: players.map(p => ({
        entity_id: p.entity_id,
        friendly_name: p.attributes.friendly_name || p.entity_id,
        state: p.state,
        media_title: p.attributes.media_title,
        media_artist: p.attributes.media_artist,
        is_playing: p.state === 'playing' && Boolean(p.attributes.media_title),
      })),
    });
  } catch (error) {
    console.error('Error fetching HA players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Home Assistant players' },
      { status: 500 }
    );
  }
}
