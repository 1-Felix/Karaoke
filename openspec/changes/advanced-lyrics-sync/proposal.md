## Why

After the initial lyrics sync improvements (rAF interpolation, LRC parsing fixes), lyrics still feel "snappy" rather than flowing — lines jump at exact timestamp boundaries, there's no visual sense of progression within a line, and community-sourced LRC timestamps frequently have a consistent offset that makes everything feel slightly early or late. These are the last-mile polish problems that separate a functional karaoke display from one that feels musically alive.

## What Changes

- **Sub-line progress sweep**: Simulate word-level karaoke by sweeping a color/opacity gradient across the active line proportional to how far through the line's time window the playback has progressed — no word-level data needed
- **Anticipatory pre-highlight**: Start fading the next line in ~200ms before its timestamp arrives, and begin fading the current line out, creating a smooth crossfade rather than a hard switch
- **User offset calibration**: Add a ±500ms manual timing offset slider (persisted per track in localStorage) so users can correct systematic LRC timing errors
- **Adaptive poll frequency**: Increase poll frequency from 3s to 1.5s when approaching a line transition boundary, so drift correction happens when visual accuracy matters most

## Capabilities

### New Capabilities

- `sub-line-progress`: Sweeping text highlight effect within the active lyric line, calculated from line-level timestamps by interpolating progress as a fraction of the line duration
- `lyrics-offset-calibration`: User-adjustable timing offset (±500ms) applied to all LRC timestamps, persisted per Spotify track ID in localStorage
- `adaptive-polling`: Dynamic adjustment of the Spotify API poll interval based on proximity to the next lyric line boundary

### Modified Capabilities

- `playback-interpolation`: Adding anticipatory pre-highlight blending — the interpolated time is used to compute a crossfade zone (~200ms) before each line boundary where both outgoing and incoming lines animate simultaneously

## Impact

- **`components/KaraokeLyrics.tsx`**: New sub-line gradient sweep on active line text, crossfade animation for line transitions, offset slider UI
- **`hooks/usePlaybackTime.ts`**: Accept and apply user offset; expose line-proximity signal for adaptive polling
- **`components/NowPlayingDisplay.tsx`**: Integrate adaptive poll interval; pass offset from localStorage
- **`lib/lyrics.ts`**: Utility to apply offset to parsed lyrics timestamps
- **No new dependencies** — uses CSS gradients, localStorage, and existing animation primitives
- **No breaking changes** — all improvements are additive
