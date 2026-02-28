## Context

The Spotify Karaoke app displays synchronized lyrics fetched from LRCLIB, with playback position sourced from polling the Spotify API (or Home Assistant fallback) every 3 seconds. A recent change (`improve-lyrics-sync`) added `requestAnimationFrame`-based interpolation, LRC parsing fixes, and translation display improvements. The interpolated time is now smooth and drift-corrected, but line transitions are still binary (snap at timestamp boundary) and there's no mechanism to compensate for systematically offset LRC data.

Current architecture:

- `usePlaybackTime` hook → produces smooth `displayTime` from `serverPosition` + rAF interpolation
- `KaraokeLyrics` → receives `currentTime`, does binary `findIndex` to pick `currentLineIndex`, applies spring-animated scroll + opacity/scale/blur per line
- `NowPlayingDisplay` → polls every 3s, feeds `serverProgress` into `usePlaybackTime`, passes `displayTime` to `KaraokeLyrics`

## Goals / Non-Goals

**Goals:**

- Create a visual sweep effect across the active line that simulates word-level karaoke progression
- Smooth line transitions with anticipatory crossfade rather than hard snaps
- Let users correct systematic LRC timing offsets per track
- Improve timing accuracy near line boundaries via adaptive polling

**Non-Goals:**

- Actual word-level or syllable-level timing data (would require a different data source like Spotify's internal lyrics API)
- Audio analysis / beat detection (too complex, unreliable without direct audio access)
- Automatic offset detection via heuristics (user slider is simpler and more reliable)
- Changing the playback source or adding the Spotify Web Playback SDK

## Decisions

### 1. CSS `background-clip: text` gradient for sub-line sweep over canvas or per-character spans

**Decision**: Use a CSS linear-gradient on `background-image` with `background-clip: text` and `color: transparent` to create the sweep effect. The gradient position is driven by a `background-position` or `background-size` animation tied to line progress.

**Alternatives considered**:

- Per-character `<span>` wrapping — adds massive DOM overhead, complex to calculate character widths, breaks with variable-width fonts
- Canvas rendering — loses all existing Framer Motion animations, requires reimplementing text layout
- CSS `mask-image` — less browser support than `background-clip: text`

**Rationale**: `background-clip: text` is well-supported (all modern browsers), GPU-accelerated, and integrates cleanly with the existing `motion.div` structure. The gradient position updates via inline style on each frame, no DOM mutations.

```
Line progress calculation:
  lineProgress = (currentTime - lineStart) / (nextLineStart - lineStart)
  clamp to [0, 1]

CSS gradient:
  background: linear-gradient(to right, white <progress>%, rgba(255,255,255,0.3) <progress>%)
  background-clip: text
  -webkit-background-clip: text
  color: transparent
```

### 2. Crossfade zone with overlapping opacity over binary switch

**Decision**: Define a 200ms crossfade zone before each line boundary. Within this zone, the outgoing line's opacity fades from 1→0.7 and the incoming line fades from 0.3→0.8. At the boundary crossing, the standard active/inactive animation takes over.

**Alternatives considered**:

- Longer crossfade (500ms) — risks showing two lines as equally prominent, confusing which to read
- No crossfade, just softer spring — still feels snappy at the boundary

**Rationale**: 200ms is short enough that only attentive viewers notice the pre-highlight, but long enough to eliminate the "jump" perception. The incoming line doesn't reach full brightness until after the boundary, so the reading order is never ambiguous.

Implementation: Compute `timeToNextLine = nextLine.startTime - currentTime`. When `0 < timeToNextLine < 200`, compute `crossfadeProgress = 1 - (timeToNextLine / 200)` and use it to interpolate opacity for both lines.

### 3. localStorage per-track offset over global offset

**Decision**: Store the user's timing offset as a JSON map in `localStorage` keyed by Spotify track ID. Apply the offset by shifting `currentTime` before the line-finding logic, not by modifying the parsed lyrics timestamps.

**Alternatives considered**:

- Global offset for all tracks — different LRC sources have different biases, one offset doesn't fit all
- Modifying parsed `startTime` values — mutates the lyrics data, complicates caching
- Cookie storage — size-limited, sent to server unnecessarily

**Rationale**: Per-track is the only approach that's actually useful — LRC offset varies by track. Applying as a time shift rather than modifying timestamps keeps the lyrics data clean and the offset trivially reversible. The UI is a simple ± slider overlaid on the lyrics display.

```
Storage format:
  localStorage key: "karaoke-offsets"
  value: JSON { [trackId: string]: number (ms) }

Application point:
  adjustedTime = displayTime + userOffset
  // Feed adjustedTime into KaraokeLyrics instead of displayTime
```

### 4. Line-proximity-triggered faster polling over continuous fast polling

**Decision**: When the interpolated time is within 1500ms of the next line's `startTime`, temporarily reduce the poll interval from 3000ms to 1500ms. Reset to 3000ms once the line transition occurs or drift is corrected.

**Alternatives considered**:

- Always poll at 1500ms — doubles API call volume for marginal benefit during line middles
- Poll at 500ms near boundaries — too aggressive, unnecessary with rAF interpolation

**Rationale**: The interpolation is good enough for mid-line accuracy. The only moment drift matters visually is at line transitions. Doubling poll rate for that ~1.5s window is a minimal API cost increase (at most 1 extra call per line) with maximum impact on boundary precision.

Implementation: `NowPlayingDisplay` receives `nextLineStartTime` from `KaraokeLyrics` (or computes it from lyrics + displayTime). When `nextLineStartTime - displayTime < 1500`, switch `setInterval` to 1500ms.

### 5. Offset slider as floating control over settings page

**Decision**: Show the offset slider as a subtle floating control at the bottom of the lyrics view, toggled by a small timing icon button. Hidden by default, appears on tap/hover (same pattern as the fullscreen button).

**Rationale**: Users need to adjust offset while watching lyrics to get immediate feedback. A settings page would require navigation away from the lyrics view. The floating control stays out of the way when not needed.

## Risks / Trade-offs

- **`background-clip: text` on mobile Safari** → Requires `-webkit-background-clip: text` prefix. Tested and supported since iOS 14. Negligible risk.
- **Crossfade + sweep happening simultaneously** → Could feel visually busy. Mitigated by making the crossfade subtle (opacity only, no position/scale changes) and the sweep clean (two-tone gradient, no animation easing on the gradient itself).
- **localStorage growing with many tracks** → Each entry is ~30 bytes. Even 10,000 tracks = ~300KB, well within localStorage limits. Could add LRU eviction if needed later.
- **Adaptive polling increasing API calls** → At most 1 additional call per line transition (~30-50 per song). Spotify's rate limits are generous for player state queries. No risk of throttling.
- **Offset slider discoverability** → Users may not know it exists. Mitigated by showing a brief tooltip on first visit ("Tap ⏱ to adjust timing") stored as a `localStorage` flag.
