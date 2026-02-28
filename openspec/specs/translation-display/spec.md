## ADDED Requirements

### Requirement: Independent translation animation

The translation text below each lyric line SHALL have its own animation parameters, independent of the lyric line's scale, blur, and opacity animations.

#### Scenario: Fade-out timing

- **WHEN** a lyrics line transitions from active to inactive
- **THEN** the translation opacity SHALL transition over 600ms (compared to the lyric's 300ms)

#### Scenario: No blur on translations

- **WHEN** a lyrics line becomes inactive and receives a blur filter
- **THEN** the translation text SHALL NOT receive any blur filter

#### Scenario: No scale on translations

- **WHEN** a lyrics line scales from 1.1 (active) to 0.95 (inactive)
- **THEN** the translation text SHALL remain at scale 1.0

### Requirement: Translation visibility persistence

The translation for a line SHALL remain visible and readable for a brief period after the line becomes inactive, giving readers additional time to absorb the translation.

#### Scenario: Translation lingers after line change

- **WHEN** the active line changes from line N to line N+1
- **THEN** line N's translation SHALL remain at partial opacity (≥0.5) for at least 300ms after the line change before fading to its resting opacity
