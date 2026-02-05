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

type PlaybackSource = 'spotify' | 'homeassistant' | null;

export default function NowPlayingDisplay() {
  const [track, setTrack] = useState<Track | null>(null);
  const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [source, setSource] = useState<PlaybackSource>(null);
  const [haConfigured, setHaConfigured] = useState(false);
  const [haPlayer, setHaPlayer] = useState<string | null>(null);

  useWakeLock(isPlaying);

  // Check if HA is configured on mount
  useEffect(() => {
    fetch("/api/ha-players")
      .then(res => res.json())
      .then(data => setHaConfigured(data.configured === true))
      .catch(() => setHaConfigured(false));
  }, []);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        // Try Spotify first
        const spotifyResponse = await fetch("/api/now-playing");
        const spotifyData = await spotifyResponse.json();

        if (spotifyData.playing && spotifyData.track) {
          // Spotify is playing
          if (source !== 'spotify' || !track || track.id !== spotifyData.track.id) {
            setTrack(spotifyData.track);
            setSource('spotify');
            fetchLyrics(spotifyData.track);
          }
          setProgress(spotifyData.progress);
          setIsPlaying(true);
          return;
        }

        // Spotify not playing, try Home Assistant if configured
        if (haConfigured) {
          const haResponse = await fetch("/api/now-playing-ha");
          const haData = await haResponse.json();

          if (haData.playing && haData.track) {
            // HA is playing
            if (source !== 'homeassistant' || !track || track.id !== haData.track.id) {
              setTrack(haData.track);
              setSource('homeassistant');
              setHaPlayer(haData.source_player);
              fetchLyrics(haData.track);
            }
            setProgress(haData.progress);
            setIsPlaying(true);
            return;
          }
        }

        // Nothing playing
        setIsPlaying(false);
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
  }, [track, source, haConfigured]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!track || !isPlaying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-3xl font-light">Waiting for music...</h2>
          <p className="text-gray-400 mt-4">
            Play a song on Spotify{haConfigured ? " or through Home Assistant" : ""} to see lyrics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Source indicator */}
      <div className="absolute top-4 right-4 z-50 px-3 py-1 bg-black/50 rounded-lg text-white text-sm flex items-center gap-2">
        {source === 'spotify' ? (
          <>
            <span className="text-green-400">●</span> Spotify
          </>
        ) : (
          <>
            <span className="text-blue-400">●</span> Home Assistant
          </>
        )}
      </div>
      <KaraokeLyrics
        lyrics={lyrics}
        currentTime={progress}
        trackName={track.name}
        artistName={track.artists.map((a) => a.name).join(", ")}
      />
    </div>
  );
}
