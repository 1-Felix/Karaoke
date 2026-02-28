"use client";

import { useEffect, useState } from "react";
import KaraokeLyrics from "./KaraokeLyrics";
import { useWakeLock } from "../hooks/useWakeLock";
import { usePlaybackTime } from "../hooks/usePlaybackTime";

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

type PlaybackSource = "spotify" | "homeassistant" | null;
type TranslationSource = "official" | "auto" | "none" | null;

export default function NowPlayingDisplay() {
  const [track, setTrack] = useState<Track | null>(null);
  const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
  const [titleTranslation, setTitleTranslation] = useState<string | undefined>(undefined);
  const [translationSource, setTranslationSource] = useState<TranslationSource>(null);
  const [serverProgress, setServerProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [source, setSource] = useState<PlaybackSource>(null);

  useWakeLock(isPlaying);

  // Smooth playback time interpolation between API polls
  const displayTime = usePlaybackTime({
    serverPosition: serverProgress,
    isPlaying,
  });

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        // Try Spotify first
        const spotifyResponse = await fetch("/api/now-playing");
        const spotifyData = await spotifyResponse.json();

        if (spotifyData.playing && spotifyData.track) {
          // Spotify is playing
          if (source !== "spotify" || !track || track.id !== spotifyData.track.id) {
            setTrack(spotifyData.track);
            setSource("spotify");
            fetchLyrics(spotifyData.track);
          }
          setServerProgress(spotifyData.progress);
          setIsPlaying(true);
          return;
        }

        // Spotify not playing, try Home Assistant as fallback
        try {
          const haResponse = await fetch("/api/now-playing-ha");
          const haData = await haResponse.json();

          if (haData.playing && haData.track) {
            // HA is playing
            if (source !== "homeassistant" || !track || track.id !== haData.track.id) {
              setTrack(haData.track);
              setSource("homeassistant");
              fetchLyrics(haData.track);
            }
            setServerProgress(haData.progress);
            setIsPlaying(true);
            return;
          }
        } catch {
          // HA not configured or error, ignore
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
            currentTrack.artists[0].name,
          )}&duration=${currentTrack.duration_ms}`,
        );
        const data = await response.json();
        const fetchedLyrics = data.lyrics || [];

        // Fetch translations for non-English/German lyrics and title
        // First tries official LRCLIB translations, then falls back to auto-translate
        try {
          const translateResponse = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lyrics: fetchedLyrics,
              title: currentTrack.name,
              artist: currentTrack.artists[0].name,
            }),
          });
          const translateData = await translateResponse.json();
          setLyrics(translateData.lyrics || fetchedLyrics);
          setTitleTranslation(translateData.titleTranslation);
          setTranslationSource(translateData.translationSource || "none");
        } catch (translateError) {
          console.error("Error translating:", translateError);
          setLyrics(fetchedLyrics);
          setTitleTranslation(undefined);
          setTranslationSource(null);
        }
      } catch (error) {
        console.error("Error fetching lyrics:", error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 3000);

    return () => clearInterval(interval);
  }, [track, source]);

  // The usePlaybackTime hook handles smooth interpolation via requestAnimationFrame
  // No need for the old setInterval-based progress counter

  if (!track || !isPlaying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-3xl font-light">Waiting for music...</h2>
          <p className="text-gray-400 mt-4">Play a song to see lyrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Source indicator */}
      <div className="absolute top-4 left-4 z-50 px-3 py-1 bg-black/50 rounded-lg text-white text-sm flex items-center gap-2">
        {source === "spotify" ? (
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
        currentTime={displayTime}
        trackName={track.name}
        trackNameTranslation={titleTranslation}
        artistName={track.artists.map((a) => a.name).join(", ")}
        translationSource={translationSource}
      />
    </div>
  );
}
