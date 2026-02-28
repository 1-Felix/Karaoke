## Context

The Spotify Karaoke app displays synchronized lyrics over a gradient background. Playback position comes from polling the Spotify API (or Home Assistant fallback) every 3 seconds, with a local `setInterval` incrementing progress by 1000ms between polls. The lyrics source is LRCLIB, which provides LRC-formatted timestamps. Translations come from either official LRCLIB English versions or MyMemory auto-translation.

Current issues:

1. **Clock drift** — `setInterval` is unreliable; the local counter drifts between polls then snaps to the real position
2. **LRC parsing bug** — 3-digit fractional timestamps are treated as centiseconds, producing ~4.5s offsets
3. **Translation merge mismatches** — timestamp-only matching within a 2s window produces wrong line pairings
4. **Translation readability** — translations share the parent line's fade/blur animation, becoming unreadable when inactive

## Goals / Non-Goals

**Goals:**

- Eliminate perceptible timing drift between displayed lyrics and actual song playback
- Correctly parse all valid LRC timestamp formats
- Reliably pair translation lines with their correct source lyrics
- Keep translations readable during line transitions

**Non-Goals:**

- Adopting the Spotify Web Playback SDK (too large a scope change)
- Word-level or syllable-level karaoke highlighting
- Supporting real-time streaming lyrics from Spotify's own lyrics API
- Reducing the 3s poll interval (interpolation makes this unnecessary)

## Decisions

### 1. `requestAnimationFrame` + `performance.now()` interpolation over faster polling

**Decision**: Use a `requestAnimationFrame` loop that tracks elapsed time via `performance.now()` deltas rather than reducing the poll interval.

**Alternatives considered**:

- Polling every 1s — still has network latency, doubles API calls, still needs local interpolation anyway
- WebSocket/SSE from server — Spotify doesn't offer push-based position updates

**Rationale**: `requestAnimationFrame` fires at display refresh rate (~60fps), giving smooth sub-frame timing. `performance.now()` is monotonic and high-resolution, immune to the jitter that plagues `setInterval`. On each API poll, we smoothly correct toward the server-reported position rather than snapping.

### 2. Smart correction blending over hard snap

**Decision**: When a new server position arrives, exponentially blend toward it over ~500ms rather than immediately setting it.

**Rationale**: Hard snaps cause visible lyric jumps. Blending makes corrections imperceptible unless drift exceeds ~2s (in which case we snap to avoid showing wrong lyrics for too long).

### 3. Fractional digit length check in LRC parser

**Decision**: Check `match[3].length` to determine if it's centiseconds (2 digits) or milliseconds (3 digits), then convert accordingly.

**Rationale**: Simple, backwards-compatible, handles both common formats.

### 4. Line-index-first translation merging

**Decision**: Use line-index mapping as the primary strategy (1st line ↔ 1st translation) with ratio-based interpolation for mismatched counts and timestamp matching as a validation/fallback heuristic.

**Alternatives considered**:

- Pure timestamp matching (current approach) — fails when English version has different timing
- Longest-common-subsequence — over-engineered for lyrics

**Rationale**: Official English translations on LRCLIB are almost always line-for-line translations of the original. The order matches far more reliably than the timestamps.

### 5. Independent translation opacity animation

**Decision**: Give translations their own `AnimatePresence` / `motion` wrapper with slower fade-out timing and no blur filter.

**Rationale**: Translations are supplementary text — they should persist slightly longer so readers have time to absorb them, and should never be blurred (small text + blur = unreadable).

## Risks / Trade-offs

- **`requestAnimationFrame` battery usage** → Minimal; modern browsers already run rAF for the Framer Motion spring animations. No additional cost.
- **Smooth correction might feel "slippery"** → Mitigated by the 2s snap threshold; if drift is small the correction is imperceptible.
- **Line-index mapping assumes 1:1 correspondence** → Falls back to ratio mapping for different line counts and timestamp matching for edge cases. Worst case is the same quality as current approach.
- **Translation animation separation adds DOM complexity** → Only one additional `motion.span` per line; negligible impact.
