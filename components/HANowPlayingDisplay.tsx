"use client";

import { useEffect, useState } from "react";
import KaraokeLyrics from "./KaraokeLyrics";
import { useWakeLock } from "../hooks/useWakeLock";

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  duration_ms: number;
}

interface LyricsLine {
  text: string;
  startTime: number;
}

interface HAPlayer {
  entity_id: string;
  friendly_name: string;
  state: string;
  media_title?: string;
  media_artist?: string;
  is_playing: boolean;
}

export default function HANowPlayingDisplay() {
  const [players, setPlayers] = useState<HAPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayerSelect, setShowPlayerSelect] = useState(true);

  useWakeLock(isPlaying);

  // Fetch available players on mount
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch("/api/ha-players");
        const data = await response.json();
        if (data.players) {
          setPlayers(data.players);
          // Auto-select first playing player
          const playingPlayer = data.players.find((p: HAPlayer) => p.is_playing);
          if (playingPlayer) {
            setSelectedPlayer(playingPlayer.entity_id);
            setShowPlayerSelect(false);
          }
        }
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 10000); // Refresh player list every 10s
    return () => clearInterval(interval);
  }, []);

  // Fetch now playing for selected player
  useEffect(() => {
    if (!selectedPlayer) return;

    const fetchNowPlaying = async () => {
      try {
        const response = await fetch(`/api/now-playing-ha?player=${encodeURIComponent(selectedPlayer)}`);
        const data = await response.json();

        if (data.playing && data.track) {
          if (!track || track.id !== data.track.id) {
            setTrack(data.track);
            fetchLyrics(data.track);
          }
          setProgress(data.progress);
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
        }
      } catch (error) {
        console.error("Error fetching now playing:", error);
      }
    };

    const fetchLyrics = async (currentTrack: Track) => {
      try {
        const response = await fetch(
          `/api/lyrics?track=${encodeURIComponent(currentTrack.name)}&artist=${encodeURIComponent(
            currentTrack.artists[0].name
          )}&duration=${currentTrack.duration_ms}`
        );
        const data = await response.json();
        const fetchedLyrics = data.lyrics || [];

        // Fetch translations for non-English/German lyrics
        if (fetchedLyrics.length > 0) {
          try {
            const translateResponse = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lyrics: fetchedLyrics }),
            });
            const translateData = await translateResponse.json();
            setLyrics(translateData.lyrics || fetchedLyrics);
          } catch (translateError) {
            console.error("Error translating lyrics:", translateError);
            setLyrics(fetchedLyrics);
          }
        } else {
          setLyrics(fetchedLyrics);
        }
      } catch (error) {
        console.error("Error fetching lyrics:", error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 3000);
    return () => clearInterval(interval);
  }, [selectedPlayer, track]);

  // Progress ticker
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Player selection UI
  if (showPlayerSelect || !selectedPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white p-4">
        <div className="max-w-md w-full">
          <h2 className="text-3xl font-light text-center mb-8">Select Speaker</h2>
          <div className="space-y-3">
            {players.length === 0 ? (
              <p className="text-gray-400 text-center">Loading speakers...</p>
            ) : (
              players.map((player) => (
                <button
                  key={player.entity_id}
                  onClick={() => {
                    setSelectedPlayer(player.entity_id);
                    setShowPlayerSelect(false);
                  }}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    player.is_playing
                      ? "bg-green-600/30 border border-green-500 hover:bg-green-600/50"
                      : "bg-white/10 hover:bg-white/20 border border-transparent"
                  }`}
                >
                  <div className="font-medium">{player.friendly_name}</div>
                  {player.is_playing && player.media_title && (
                    <div className="text-sm text-green-300 mt-1">
                      ▶ {player.media_artist} - {player.media_title}
                    </div>
                  )}
                  {!player.is_playing && (
                    <div className="text-sm text-gray-400 mt-1">
                      {player.state}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Waiting for music
  if (!track || !isPlaying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-3xl font-light">Waiting for music...</h2>
          <p className="text-gray-400 mt-4">
            Listening to: {players.find(p => p.entity_id === selectedPlayer)?.friendly_name}
          </p>
          <button
            onClick={() => setShowPlayerSelect(true)}
            className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            Change Speaker
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPlayerSelect(true)}
        className="absolute top-4 right-4 z-50 px-3 py-1 bg-black/50 hover:bg-black/70 rounded-lg text-white text-sm transition-all"
      >
        📺 {players.find(p => p.entity_id === selectedPlayer)?.friendly_name}
      </button>
      <KaraokeLyrics
        lyrics={lyrics}
        currentTime={progress}
        trackName={track.name}
        artistName={track.artists.map((a) => a.name).join(", ")}
      />
    </div>
  );
}
