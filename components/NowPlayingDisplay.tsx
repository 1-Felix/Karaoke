"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import KaraokeLyrics from "./KaraokeLyrics";
import { useWakeLock } from "../hooks/useWakeLock";
import { usePlaybackTime } from "../hooks/usePlaybackTime";
import { getTrackOffset, setTrackOffset } from "../lib/offsetStorage";

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
  const [userOffset, setUserOffset] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useWakeLock(isPlaying);

  // Smooth playback time interpolation between API polls
  const displayTime = usePlaybackTime({
    serverPosition: serverProgress,
    isPlaying,
  });

  // Apply user offset for adjusted time
  const adjustedTime = displayTime + userOffset;

  // Compute next line start time for adaptive polling
  const nextLineStartTime = useMemo(() => {
    if (!lyrics.length) return null;
    const currentIndex = lyrics.findIndex((line, i) => {
      const nextLine = lyrics[i + 1];
      return adjustedTime >= line.startTime && (!nextLine || adjustedTime < nextLine.startTime);
    });
    const nextLine = lyrics[currentIndex + 1];
    return nextLine ? nextLine.startTime : null;
  }, [lyrics, adjustedTime]);

  // Derive a stable target interval that only changes when switching 1500↔3000
  const targetInterval = useMemo(() => {
    if (!nextLineStartTime) return 3000;
    const timeToNext = nextLineStartTime - adjustedTime;
    return timeToNext < 1500 && timeToNext > 0 ? 1500 : 3000;
  }, [nextLineStartTime, adjustedTime]);

  // Load saved offset when track changes
  useEffect(() => {
    if (track) {
      setUserOffset(getTrackOffset(track.id));
    }
  }, [track?.id]);

  // Handle offset change — save to localStorage
  const handleOffsetChange = useCallback(
    (offset: number) => {
      setUserOffset(offset);
      if (track) {
        setTrackOffset(track.id, offset);
      }
    },
    [track],
  );

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
    intervalRef.current = setInterval(fetchNowPlaying, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [track, source]);

  // Adaptive poll frequency — only recreate interval when targetInterval changes (1500↔3000)
  useEffect(() => {
    if (!isPlaying) return;

    // Clear existing and set new interval with the target frequency
    if (intervalRef.current) clearInterval(intervalRef.current);

    const fetchNowPlaying = async () => {
      try {
        const spotifyResponse = await fetch("/api/now-playing");
        const spotifyData = await spotifyResponse.json();
        if (spotifyData.playing && spotifyData.track) {
          setServerProgress(spotifyData.progress);
          setIsPlaying(true);
          return;
        }
        try {
          const haResponse = await fetch("/api/now-playing-ha");
          const haData = await haResponse.json();
          if (haData.playing && haData.track) {
            setServerProgress(haData.progress);
            setIsPlaying(true);
            return;
          }
        } catch {
          /* HA not configured */
        }
        setIsPlaying(false);
      } catch (error) {
        console.error("Error fetching now playing:", error);
      }
    };

    intervalRef.current = setInterval(fetchNowPlaying, targetInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, targetInterval]);

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
        currentTime={adjustedTime}
        trackName={track.name}
        trackNameTranslation={titleTranslation}
        artistName={track.artists.map((a) => a.name).join(", ")}
        translationSource={translationSource}
        userOffset={userOffset}
        onOffsetChange={handleOffsetChange}
      />
    </div>
  );
}
