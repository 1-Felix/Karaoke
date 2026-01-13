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

export default function NowPlayingDisplay() {
  const [track, setTrack] = useState<Track | null>(null);
  const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useWakeLock(isPlaying);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch("/api/now-playing");
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
  }, [track]);

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
          <p className="text-gray-400 mt-4">Play a song on Spotify to see lyrics</p>
        </div>
      </div>
    );
  }

  return (
    <KaraokeLyrics
      lyrics={lyrics}
      currentTime={progress}
      trackName={track.name}
      artistName={track.artists.map((a) => a.name).join(", ")}
    />
  );
}
