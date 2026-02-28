## 1. Sub-line Progress Sweep

- [x] 1.1 Compute `lineProgress` in `KaraokeLyrics.tsx` — calculate `(currentTime - lineStart) / (nextLineStart - lineStart)` clamped to [0, 1], using 5000ms as default duration for the last line
- [x] 1.2 Apply CSS gradient sweep to active line text using `background-image: linear-gradient(...)`, `background-clip: text`, `-webkit-background-clip: text`, and `color: transparent` driven by `lineProgress`
- [x] 1.3 Ensure inactive lines do not receive the gradient sweep and retain standard opacity/blur styling

## 2. Anticipatory Crossfade

- [x] 2.1 Compute `timeToNextLine` and `crossfadeProgress` (0→1 over the 200ms before each line boundary) in `KaraokeLyrics.tsx`
- [x] 2.2 Apply crossfade to outgoing line: opacity decreases from 1.0 toward 0.7 proportionally to `crossfadeProgress`
- [x] 2.3 Apply crossfade to incoming line: opacity increases from 0.3 toward 0.8 proportionally to `crossfadeProgress`
- [x] 2.4 Ensure crossfade does not apply when more than 200ms from the next line boundary

## 3. User Offset Calibration

- [x] 3.1 Create offset storage utilities — read/write per-track offset from `localStorage` key `karaoke-offsets` (JSON map of trackId → offset in ms)
- [x] 3.2 Add offset slider UI to `KaraokeLyrics.tsx` — floating overlay toggled by timing icon button, range -500 to +500ms, displays current value (e.g., "+200ms")
- [x] 3.3 Apply offset in `NowPlayingDisplay.tsx` — compute `adjustedTime = displayTime + userOffset` and pass to `KaraokeLyrics`
- [x] 3.4 Load saved offset on track change, default to 0ms when no saved offset exists
- [x] 3.5 Save offset to localStorage on slider change

## 4. Adaptive Poll Frequency

- [x] 4.1 Pass `nextLineStartTime` from lyrics data into `NowPlayingDisplay.tsx` (compute from lyrics array + current displayTime)
- [x] 4.2 Implement dynamic interval in `NowPlayingDisplay.tsx` — use 1500ms when `nextLineStartTime - displayTime < 1500`, otherwise 3000ms
- [x] 4.3 Handle edge case: keep 3000ms when active line is the last line (no next boundary)

## 5. Verification

- [ ] 5.1 Test sub-line sweep visually — confirm gradient advances smoothly from left to right across active line text
- [ ] 5.2 Test crossfade — confirm next line starts fading in ~200ms before its timestamp, no reading order confusion
- [ ] 5.3 Test offset slider — adjust offset, verify lyrics shift earlier/later, verify persistence across page reload for same track
- [ ] 5.4 Test adaptive polling — observe network tab to confirm poll interval drops near line transitions
- [x] 5.5 Run `npm run build` to verify no TypeScript or build errors
