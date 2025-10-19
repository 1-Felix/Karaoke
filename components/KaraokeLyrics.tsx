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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    const index = lyrics.findIndex((line, i) => {
      const nextLine = lyrics[i + 1];
      return (
        currentTime >= line.startTime &&
        (!nextLine || currentTime < nextLine.startTime)
      );
    });

    if (index !== -1 && index !== currentLineIndex) {
      setCurrentLineIndex(index);
    }
  }, [currentTime, lyrics, currentLineIndex]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showButton) {
      timeout = setTimeout(() => {
        setShowButton(false);
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [showButton]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleMouseMove = () => {
    setShowButton(true);
  };

  const visibleLines = 5;
  const startIndex = Math.max(0, currentLineIndex - 1);
  const displayLines = lyrics.slice(startIndex, startIndex + visibleLines);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white p-8 relative"
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className={`
          fixed top-4 right-4 z-50
          bg-black bg-opacity-50 hover:bg-opacity-70
          text-white rounded-full p-3
          transition-all duration-300 ease-in-out
          backdrop-blur-sm
          ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
        `}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>

      <div className="mb-12 text-center transition-all duration-500">
        <h1 className="text-5xl font-bold mb-2 animate-pulse">{trackName}</h1>
        <p className="text-2xl text-gray-300">{artistName}</p>
      </div>

      <div className="space-y-6 w-full max-w-4xl">
        {displayLines.map((line, index) => {
          const globalIndex = startIndex + index;
          const isActive = globalIndex === currentLineIndex;
          const isPast = globalIndex < currentLineIndex;
          const isFuture = globalIndex > currentLineIndex;

          return (
            <div
              key={globalIndex}
              className={`
                text-center
                transition-all duration-700 ease-out
                ${isActive ? 'text-7xl font-bold text-yellow-300 opacity-100 translate-y-0 scale-105' : ''}
                ${isPast ? 'text-3xl text-gray-600 opacity-30 -translate-y-2 scale-95' : ''}
                ${isFuture ? 'text-4xl text-gray-400 opacity-60 translate-y-2 scale-100' : ''}
              `}
              style={{
                transitionProperty: 'all',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-sm text-gray-500 transition-opacity duration-300">
        {Math.floor(currentTime / 1000)}s / {Math.floor(lyrics[lyrics.length - 1]?.startTime / 1000)}s
      </div>
    </div>
  );
}
