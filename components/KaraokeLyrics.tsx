"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LyricsLine {
  text: string;
  startTime: number;
  translation?: string;
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

  // Ref for the container to calculate center
  const containerRef = useRef<HTMLDivElement>(null);
  // Refs for each line to calculate their positions
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Vertical offset to center the active line
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const index = lyrics.findIndex((line, i) => {
      const nextLine = lyrics[i + 1];
      return currentTime >= line.startTime && (!nextLine || currentTime < nextLine.startTime);
    });

    if (index !== -1 && index !== currentLineIndex) {
      setCurrentLineIndex(index);
    }
  }, [currentTime, lyrics, currentLineIndex]);

  // Calculate the offset to center the active line
  useEffect(() => {
    const container = containerRef.current;
    const activeLine = lineRefs.current[currentLineIndex];

    if (container && activeLine) {
      const containerHeight = container.clientHeight;
      const activeLineHeight = activeLine.clientHeight;
      const activeLineOffset = activeLine.offsetTop;

      // Calculate the Y translation needed to center the active line
      // We want: activeLineOffset + translateY = containerHeight / 2 - activeLineHeight / 2
      // So: translateY = (containerHeight / 2 - activeLineHeight / 2) - activeLineOffset
      const newOffset = containerHeight / 2 - activeLineHeight / 2 - activeLineOffset;
      setOffsetY(newOffset);
    }
  }, [currentLineIndex, lyrics]); // Recalculate when index changes

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
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
      console.error("Fullscreen error:", error);
    }
  };

  const handleMouseMove = () => {
    setShowButton(true);
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white p-8 relative overflow-hidden"
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
          ${
            showButton
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }
        `}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        )}
      </button>

      <div className="mb-8 text-center transition-all duration-500 z-10">
        <h1 className="text-4xl font-bold mb-2">{trackName}</h1>
        <p className="text-xl text-gray-300">{artistName}</p>
      </div>

      {/* Lyrics Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl h-[60vh] overflow-hidden mask-image-gradient"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        }}
      >
        <motion.div
          animate={{ y: offsetY }}
          transition={{ type: "spring", stiffness: 100, damping: 20, mass: 0.5 }}
          className="absolute top-0 left-0 w-full px-8"
        >
          {lyrics.map((line, index) => {
            const isActive = index === currentLineIndex;

            return (
              <motion.div
                key={index}
                ref={(el) => {
                  lineRefs.current[index] = el;
                }}
                className={`
                  py-6 text-center transition-colors duration-300
                  ${isActive ? "text-white font-bold" : "text-gray-500 font-medium"}
                `}
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0.3,
                  scale: isActive ? 1.1 : 0.95,
                  filter: isActive ? "blur(0px)" : "blur(1px)",
                }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-2xl sm:text-3xl md:text-4xl leading-relaxed block">
                  {line.text}
                </span>
                {line.translation && (
                  <span className="text-sm sm:text-base text-gray-400 mt-1 block opacity-70 font-normal">
                    {line.translation}
                  </span>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <div className="mt-8 text-sm text-gray-500 transition-opacity duration-300 z-10">
        {Math.floor(currentTime / 1000)}s /{" "}
        {Math.floor(lyrics[lyrics.length - 1]?.startTime / 1000)}s
      </div>
    </div>
  );
}
