"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface LyricsLine {
  text: string;
  startTime: number;
  translation?: string;
}

type TranslationSource = "official" | "auto" | "none" | null;

interface KaraokeLyricsProps {
  lyrics: LyricsLine[];
  currentTime: number;
  trackName: string;
  trackNameTranslation?: string;
  artistName: string;
  translationSource?: TranslationSource;
  userOffset?: number;
  onOffsetChange?: (offset: number) => void;
}

export default function KaraokeLyrics({
  lyrics,
  currentTime,
  trackName,
  trackNameTranslation,
  artistName,
  translationSource,
  userOffset = 0,
  onOffsetChange,
}: KaraokeLyricsProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [showOffset, setShowOffset] = useState(false);

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
        <h1 className="text-4xl font-bold mb-1">{trackName}</h1>
        {trackNameTranslation && (
          <p className="text-lg text-gray-400 mb-2 opacity-70">{trackNameTranslation}</p>
        )}
        <p className="text-xl text-gray-300">{artistName}</p>
        {translationSource && translationSource !== "none" && (
          <span
            className={`
            inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium
            ${
              translationSource === "official"
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
            }
          `}
          >
            {translationSource === "official" ? "🌐 Official Translation" : "🤖 Auto Translation"}
          </span>
        )}
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
            const isNext = index === currentLineIndex + 1;

            // Anticipatory crossfade (200ms before line boundary)
            const nextLine = lyrics[currentLineIndex + 1];
            let crossfadeProgress = 0;
            if (nextLine) {
              const timeToNextLine = nextLine.startTime - currentTime;
              if (timeToNextLine > 0 && timeToNextLine < 200) {
                crossfadeProgress = 1 - timeToNextLine / 200;
              }
            }

            // Compute opacity based on crossfade zone
            let lineOpacity = isActive ? 1 : 0.3;
            if (isActive && crossfadeProgress > 0) {
              // Outgoing line: fade from 1.0 toward 0.7
              lineOpacity = 1 - crossfadeProgress * 0.3;
            } else if (isNext && crossfadeProgress > 0) {
              // Incoming line: fade from 0.3 toward 0.8
              lineOpacity = 0.3 + crossfadeProgress * 0.5;
            }

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
                  opacity: lineOpacity,
                  scale: isActive ? 1.1 : 0.95,
                  filter: isActive ? "blur(0px)" : "blur(1px)",
                }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-2xl sm:text-3xl md:text-4xl leading-relaxed block">
                  {line.text}
                </span>
                {line.translation && (
                  <motion.span
                    className="text-sm sm:text-base text-gray-400 mt-1 block font-normal"
                    initial={false}
                    animate={{
                      opacity: isActive ? 0.85 : 0.5,
                    }}
                    transition={{
                      duration: isActive ? 0.3 : 0.6,
                      delay: isActive ? 0 : 0.3,
                    }}
                    style={{
                      filter: "none",
                      transform: "scale(1)",
                    }}
                  >
                    {line.translation}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Offset slider toggle button */}
      <button
        onClick={() => setShowOffset(!showOffset)}
        className={`
          fixed bottom-4 right-4 z-50
          bg-black bg-opacity-50 hover:bg-opacity-70
          text-white rounded-full p-3
          transition-all duration-300 ease-in-out
          backdrop-blur-sm
          ${
            showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }
        `}
        aria-label="Adjust timing offset"
      >
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {/* Active offset indicator dot */}
        {userOffset !== 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-black" />
        )}
      </button>

      {/* Offset slider panel */}
      {showOffset && (
        <div className="fixed bottom-16 right-4 z-50 bg-black/70 backdrop-blur-md rounded-xl p-4 w-72 border border-white/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Timing Offset</span>
            <span
              className={`text-sm font-mono ${userOffset !== 0 ? "text-purple-300" : "text-white"}`}
            >
              {userOffset > 0 ? "+" : ""}
              {userOffset}ms
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            {userOffset > 0
              ? "Lyrics appear earlier (ahead of music)"
              : userOffset < 0
                ? "Lyrics appear later (behind music)"
                : "Drag to adjust lyrics timing"}
          </p>
          <input
            type="range"
            min={-500}
            max={500}
            step={10}
            value={userOffset}
            onChange={(e) => onOffsetChange?.(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>−500ms</span>
            <button
              onClick={() => onOffsetChange?.(0)}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Reset
            </button>
            <span>+500ms</span>
          </div>
          {userOffset !== 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400 font-mono">
              <div className="flex justify-between">
                <span>Raw time:</span>
                <span>{((currentTime - userOffset) / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex justify-between text-purple-300">
                <span>Adjusted:</span>
                <span>{(currentTime / 1000).toFixed(1)}s</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-sm text-gray-500 transition-opacity duration-300 z-10">
        {Math.floor(currentTime / 1000)}s /{" "}
        {Math.floor(lyrics[lyrics.length - 1]?.startTime / 1000)}s
      </div>
    </div>
  );
}
