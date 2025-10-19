'use client';

import { useEffect, useState } from 'react';

interface LyricsLine {
  text: string;
  startTime: number;
}

interface KaraokeLyricsProps {
  lyrics: LyricsLine[];
  currentTime: number;
  trackName: string;
  artistName: string;
}

export default function KaraokeLyrics({
  lyrics,
  currentTime,
  trackName,
  artistName,
}: KaraokeLyricsProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  useEffect(() => {
    const index = lyrics.findIndex((line, i) => {
      const nextLine = lyrics[i + 1];
      return (
        currentTime >= line.startTime &&
        (!nextLine || currentTime < nextLine.startTime)
      );
    });

    if (index !== -1) {
      setCurrentLineIndex(index);
    }
  }, [currentTime, lyrics]);

  const visibleLines = 3;
  const startIndex = Math.max(0, currentLineIndex - 1);
  const displayLines = lyrics.slice(startIndex, startIndex + visibleLines);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white p-8">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold mb-2 animate-pulse">{trackName}</h1>
        <p className="text-2xl text-gray-300">{artistName}</p>
      </div>

      <div className="space-y-8 w-full max-w-4xl">
        {displayLines.map((line, index) => {
          const globalIndex = startIndex + index;
          const isActive = globalIndex === currentLineIndex;
          const isPast = globalIndex < currentLineIndex;

          return (
            <div
              key={globalIndex}
              className={`
                text-center transition-all duration-300 ease-in-out
                ${isActive ? 'text-6xl font-bold scale-110 text-yellow-300' : ''}
                ${!isActive && !isPast ? 'text-4xl text-gray-500' : ''}
                ${isPast ? 'text-3xl text-gray-600 opacity-50' : ''}
              `}
            >
              {line.text}
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-sm text-gray-500">
        {Math.floor(currentTime / 1000)}s / {Math.floor(lyrics[lyrics.length - 1]?.startTime / 1000)}s
      </div>
    </div>
  );
}
