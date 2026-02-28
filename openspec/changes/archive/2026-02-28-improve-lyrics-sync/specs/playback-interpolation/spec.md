## ADDED Requirements

### Requirement: Smooth playback time interpolation

The system SHALL track playback time using `requestAnimationFrame` and `performance.now()` to interpolate between Spotify API polls, producing a smooth, drift-free time value.

#### Scenario: Normal playback between polls

- **WHEN** the system receives a position of 10000ms from the API and 1.5 seconds elapse before the next poll
- **THEN** the displayed time SHALL be approximately 11500ms (not 11000ms or 12000ms from rounded setInterval ticks)

#### Scenario: Drift correction after poll

- **WHEN** the interpolated position is 12500ms but the API reports 12000ms (500ms drift)
- **THEN** the system SHALL smoothly blend toward 12000ms over approximately 500ms rather than snapping

#### Scenario: Large drift correction

- **WHEN** the interpolated position differs from the API-reported position by more than 2000ms
- **THEN** the system SHALL snap directly to the API-reported position

#### Scenario: Playback paused

- **WHEN** the API reports `is_playing: false`
- **THEN** the interpolation loop SHALL stop advancing time and hold at the last known position

### Requirement: Correct LRC fractional timestamp parsing

The system SHALL correctly parse both 2-digit centisecond and 3-digit millisecond fractional parts in LRC timestamps.

#### Scenario: Two-digit centiseconds

- **WHEN** parsing the LRC timestamp `[01:23.45]`
- **THEN** the start time SHALL be calculated as 83450ms (1×60000 + 23×1000 + 45×10)

#### Scenario: Three-digit milliseconds

- **WHEN** parsing the LRC timestamp `[01:23.456]`
- **THEN** the start time SHALL be calculated as 83456ms (1×60000 + 23×1000 + 456)

### Requirement: Reliable translation-to-lyric line merging

The system SHALL merge official translation lyrics with original lyrics using line-index mapping as the primary strategy, with ratio-based interpolation for mismatched counts.

#### Scenario: Equal line counts

- **WHEN** the original has 20 lines and the official translation has 20 lines
- **THEN** the system SHALL map line N of the original to line N of the translation

#### Scenario: Mismatched line counts

- **WHEN** the original has 20 lines and the translation has 15 lines
- **THEN** the system SHALL use ratio-based mapping (original line index × translation count / original count) to find the closest translation line

#### Scenario: Translation text matches original

- **WHEN** a matched translation line has identical text to the original line
- **THEN** the system SHALL NOT assign a translation to that line (it would be redundant)

### Requirement: Readable translation display

The system SHALL display translations with independent animation timing from the lyric line, keeping them readable during transitions.

#### Scenario: Active line with translation

- **WHEN** a lyrics line is the currently active line and has a translation
- **THEN** the translation SHALL be displayed at full opacity below the lyric text without blur

#### Scenario: Line becoming inactive

- **WHEN** a lyrics line transitions from active to inactive
- **THEN** the lyric text MAY blur and fade, but the translation SHALL fade more slowly (over a longer duration) and SHALL NOT apply any blur filter

#### Scenario: Translation scaling

- **WHEN** a lyrics line scales up/down as it becomes active/inactive
- **THEN** the translation text SHALL remain at a fixed, readable size and NOT scale with the parent lyric
