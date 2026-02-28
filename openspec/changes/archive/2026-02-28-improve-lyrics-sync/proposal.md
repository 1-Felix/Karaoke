## Why

Lyrics synchronization drifts from the actual song playback due to coarse polling (3s intervals), inaccurate local clock ticking (+1000ms via `setInterval`), and LRC timestamp parsing bugs. Additionally, translations are misaligned with their source lyrics — official translations match by a loose 2-second timestamp window that produces wrong pairings, and auto-translated lines share the same fade animation as the lyric text, making them unreadable when inactive.

## What Changes

- **Client-side time interpolation**: Replace the fixed +1000ms `setInterval` tick with a `requestAnimationFrame` loop using `performance.now()` deltas, smoothly correcting toward the server-reported position on each poll
- **Fix LRC fractional timestamp parsing**: Handle both 2-digit centisecond (`[01:23.45]`) and 3-digit millisecond (`[01:23.456]`) LRC formats correctly
- **Improve official translation merging**: Use line-index-based matching as primary strategy with timestamp-based matching as fallback, handling mismatched line counts via ratio mapping
- **Separate translation display animation**: Give translations independent opacity/fade timing so they remain readable slightly longer than the lyric line, especially during transitions

## Capabilities

### New Capabilities

- `playback-interpolation`: Smooth client-side playback time tracking that interpolates between Spotify API polls and corrects drift without jarring jumps
- `translation-display`: Independent animation and timing behavior for translation subtitles beneath lyrics lines

### Modified Capabilities

_None — no existing specs to modify._

## Impact

- **`components/NowPlayingDisplay.tsx`**: Replace progress tracking with interpolation-based approach
- **`components/KaraokeLyrics.tsx`**: Update animation for translation lines, accept new timing props
- **`lib/lyrics.ts`**: Fix `parseSyncedLyrics` fractional handling, rewrite `mergeWithTranslations` algorithm
- **No new dependencies** — uses native browser APIs (`requestAnimationFrame`, `performance.now()`)
- **No breaking changes** — all improvements are internal
