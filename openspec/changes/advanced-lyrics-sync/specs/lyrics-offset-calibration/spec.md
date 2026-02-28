## ADDED Requirements

### Requirement: User-adjustable timing offset

The system SHALL provide a user-adjustable timing offset in the range of -500ms to +500ms that shifts the effective playback time used for lyric line selection. A positive offset makes lyrics appear earlier (ahead of the music); a negative offset makes lyrics appear later.

#### Scenario: Applying positive offset

- **WHEN** the user sets an offset of +200ms and the actual playback time is 10000ms
- **THEN** the system SHALL use an effective time of 10200ms for lyric line matching, causing lyrics to appear 200ms earlier relative to the music

#### Scenario: Applying negative offset

- **WHEN** the user sets an offset of -300ms and the actual playback time is 10000ms
- **THEN** the system SHALL use an effective time of 9700ms for lyric line matching, causing lyrics to appear 300ms later relative to the music

#### Scenario: Zero offset (default)

- **WHEN** no offset has been set for the current track
- **THEN** the effective time SHALL equal the interpolated playback time (offset of 0ms)

### Requirement: Per-track offset persistence

The system SHALL persist the timing offset per Spotify track ID in localStorage so that the offset is restored when the same track is played again.

#### Scenario: Offset saved on change

- **WHEN** the user adjusts the offset slider for a track with ID "abc123"
- **THEN** the system SHALL store the offset value in localStorage under key `karaoke-offsets` as a JSON object mapping track IDs to offset values

#### Scenario: Offset restored on track load

- **WHEN** a track with ID "abc123" starts playing and an offset was previously saved for that track
- **THEN** the system SHALL apply the saved offset value immediately

#### Scenario: No saved offset

- **WHEN** a track starts playing and no offset has been saved for its ID
- **THEN** the system SHALL default to an offset of 0ms

### Requirement: Offset slider UI

The system SHALL display an offset adjustment control as a floating overlay on the lyrics view, toggled by a timing icon button. The control SHALL follow the same show/hide pattern as the existing fullscreen button.

#### Scenario: Slider visibility toggle

- **WHEN** the user taps the timing icon button
- **THEN** the offset slider SHALL appear with the current offset value displayed in milliseconds

#### Scenario: Slider hidden by default

- **WHEN** the lyrics view loads
- **THEN** the offset slider SHALL NOT be visible until the user taps the timing icon

#### Scenario: Slider value display

- **WHEN** the offset slider is visible
- **THEN** the current offset value SHALL be displayed as a label (e.g., "+200ms" or "-100ms")
