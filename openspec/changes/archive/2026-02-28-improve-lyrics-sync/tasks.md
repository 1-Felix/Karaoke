## 1. Fix LRC Timestamp Parsing

- [x] 1.1 Update `parseSyncedLyrics` in `lib/lyrics.ts` to detect fractional digit length (2 vs 3 digits) and convert correctly to milliseconds

## 2. Playback Time Interpolation

- [x] 2.1 Create a `usePlaybackTime` custom hook in `hooks/usePlaybackTime.ts` that uses `requestAnimationFrame` + `performance.now()` for smooth time tracking
- [x] 2.2 Implement smooth drift correction: exponential blend toward server position over ~500ms, with hard snap for >2s drift
- [x] 2.3 Integrate `usePlaybackTime` into `NowPlayingDisplay.tsx`, replacing the current `setInterval`-based progress tracking

## 3. Translation Merge Improvements

- [x] 3.1 Rewrite `mergeWithTranslations` in `lib/lyrics.ts` to use line-index mapping as primary strategy
- [x] 3.2 Add ratio-based interpolation fallback for mismatched line counts (e.g., 20 original lines → 15 translation lines)
- [x] 3.3 Keep timestamp matching as a validation heuristic — skip translation assignment if timestamp diff exceeds a threshold

## 4. Translation Display Animation

- [x] 4.1 Separate translation `<span>` into its own `motion.span` with independent opacity animation (600ms fade vs 300ms for lyrics)
- [x] 4.2 Remove blur filter and scale transform from translation text — keep it at fixed readable size
- [x] 4.3 Add translation persistence: keep translation at ≥0.5 opacity for 300ms after line becomes inactive before fading

## 5. Verification

- [x] 5.1 Test LRC parsing with both 2-digit and 3-digit fractional timestamps
- [x] 5.2 Test playback interpolation by running the app and observing smooth lyrics scrolling
- [x] 5.3 Test translation merge with songs that have official English translations on LRCLIB
- [x] 5.4 Visually verify translation animations fade independently and remain readable during transitions
