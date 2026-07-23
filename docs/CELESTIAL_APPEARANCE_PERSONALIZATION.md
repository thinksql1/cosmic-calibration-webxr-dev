# Celestial appearance personalization

## Status

Development-only and awaiting physical Quest validation. This layer changes only resolved
visibility and material presentation; it never changes astronomy, geometry, sampling, transforms,
calibration, scene scale, or XR projection.

## Clean defaults

Fresh sessions start with Axis, pole markers, pole labels, and Earth Core OFF. The central
`DEFAULT_CELESTIAL_VISIBILITY` contract owns those defaults; valid queries and diagnostics resolve
above it. Existing controls remain available, and Earth Core still authoritatively suppresses both
finite and scientific visuals when OFF.

## Curated preferences and persistence

The versioned key `cosmic-calibration:appearance:v1` stores only stable identifiers for
constellation base/highlight, mode, strength, and lunar family. Resolution is diagnostic
isolation, valid query, persisted preference, then default. Invalid JSON, obsolete schema, unknown
identifiers, and storage failures safely fall back. Reset affects appearance only.

## Palette policy

Defaults are Unified Celestial Lavender `#D9B7FF`, Observation Orange `#C99255`, Subtle strength,
and Lunar Purple. Lunar Purple restores the accepted `#B9D6E8` daily, `#CDB8FF` transit-visible,
and `#9383BA` Earth-hidden values. Optional families are brighter Moonlit Water, Silver Moon,
Deep Ocean, Arctic Moon, and Mystic Rose. Context is a deterministic neutralized derivative of the
selected base; it is not a second user color.

## Lifecycle and physical gate

Constellation material cache is lazy and bounded to 24 historical line materials; inactive
entries are disposed on a later control update. Lunar roles retain their existing shared
materials. No preference operation rebuilds geometry or changes an object transform. Validate
clean defaults, all swatches, persistence/reload/query precedence/resets, both eyes, and no
callback or incomplete-frame errors before approving another checkpoint.
