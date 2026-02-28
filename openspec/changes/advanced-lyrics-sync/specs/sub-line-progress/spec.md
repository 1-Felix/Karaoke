## ADDED Requirements

### Requirement: Sub-line progress sweep

The system SHALL display a visual sweep effect across the active lyric line that indicates how far through the line's time window playback has progressed. The sweep SHALL be calculated by interpolating the current playback time as a fraction of the line's total duration (from its startTime to the next line's startTime).

#### Scenario: Line progress at midpoint

- **WHEN** the current playback time is exactly halfway between the active line's startTime and the next line's startTime
- **THEN** the sweep effect SHALL highlight approximately 50% of the text from left to right, with the highlighted portion at full white and the remaining portion at reduced opacity (≤0.3)

#### Scenario: Line progress at start

- **WHEN** a line first becomes active (currentTime equals or just exceeds the line's startTime)
- **THEN** the sweep SHALL start at 0% (all text at reduced opacity) and begin advancing from left to right

#### Scenario: Line progress at end

- **WHEN** playback time approaches the next line's startTime (progress ≥ 95%)
- **THEN** the sweep SHALL show the full line highlighted at full white

#### Scenario: Last line in lyrics

- **WHEN** the active line is the last line in the lyrics array (no next line exists)
- **THEN** the system SHALL estimate line duration as 5000ms for the sweep calculation

### Requirement: Sweep rendering via CSS gradient

The sweep effect SHALL be rendered using `background-clip: text` with a linear gradient, keeping the existing DOM structure intact. The system SHALL NOT add per-character span elements or use canvas rendering.

#### Scenario: Gradient application

- **WHEN** a line is active and has a progress value
- **THEN** the line text SHALL use `background-image: linear-gradient(...)`, `background-clip: text`, `-webkit-background-clip: text`, and `color: transparent` to render the sweep

#### Scenario: Inactive lines

- **WHEN** a line is not active
- **THEN** the line SHALL NOT apply the gradient sweep and SHALL use the standard opacity/blur styling
