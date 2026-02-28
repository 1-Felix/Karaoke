## ADDED Requirements

### Requirement: Adaptive poll interval near line boundaries

The system SHALL reduce the Spotify API poll interval from 3000ms to 1500ms when the interpolated playback time is within 1500ms of the next lyric line's startTime. The interval SHALL return to 3000ms after the line transition occurs.

#### Scenario: Approaching a line boundary

- **WHEN** the interpolated playback time is 1200ms before the next line's startTime
- **THEN** the poll interval SHALL be 1500ms

#### Scenario: Mid-line playback

- **WHEN** the interpolated playback time is 4000ms before the next line's startTime
- **THEN** the poll interval SHALL remain at 3000ms

#### Scenario: After line transition

- **WHEN** a line transition has just occurred and the next line boundary is more than 1500ms away
- **THEN** the poll interval SHALL return to 3000ms

#### Scenario: Last line in lyrics

- **WHEN** the active line is the last line and there is no next line boundary
- **THEN** the poll interval SHALL remain at 3000ms
