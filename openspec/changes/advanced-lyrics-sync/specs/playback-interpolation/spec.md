## MODIFIED Requirements

### Requirement: Smooth playback time interpolation

The system SHALL track playback time using `requestAnimationFrame` and `performance.now()` to interpolate between Spotify API polls, producing a smooth, drift-free time value. Additionally, the system SHALL compute an anticipatory crossfade zone before each line boundary.

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

#### Scenario: Anticipatory crossfade zone

- **WHEN** the interpolated time is within 200ms before the next line's startTime
- **THEN** the system SHALL compute a `crossfadeProgress` value from 0.0 (200ms before boundary) to 1.0 (at boundary) and expose it for use by the lyrics display

#### Scenario: Crossfade on outgoing line

- **WHEN** the crossfade zone is active (0 < crossfadeProgress ≤ 1.0)
- **THEN** the current active line's opacity SHALL decrease from 1.0 toward 0.7 proportionally to crossfadeProgress

#### Scenario: Crossfade on incoming line

- **WHEN** the crossfade zone is active (0 < crossfadeProgress ≤ 1.0)
- **THEN** the next line's opacity SHALL increase from 0.3 toward 0.8 proportionally to crossfadeProgress

#### Scenario: No crossfade when far from boundary

- **WHEN** the interpolated time is more than 200ms before the next line's startTime
- **THEN** no crossfade SHALL be applied and the standard active/inactive styling SHALL be used
