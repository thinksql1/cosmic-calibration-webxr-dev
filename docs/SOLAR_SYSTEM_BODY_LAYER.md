# Actual Solar-System Body Layer

## Scope

This bounded layer renders seven actual apparent topocentric directions: Sun, Moon, Mercury,
Venus, Mars, Jupiter, and Saturn. It is the intentionally promoted next visible layer after the
accepted spatial-reference baseline; the planned long-term precession prerequisite review remains
in the roadmap and is not performed or replaced here.

## Scientific contract

The application-owned Astronomy Engine adapter produces one immutable typed result per body from:

- the validated WGS84 observer state (east-positive longitude and mean-sea-level elevation);
- the central immutable simulation-clock instant;
- the selected Tier 1 body correction profile;
- Astronomy Engine `2.1.19` provenance.

Each result retains apparent topocentric `EQD_TRUE` equatorial coordinates, `HORIZONTAL_ENU`
azimuth/altitude/unit direction, a horizon state, declination relation to the celestial equator,
units, correction profile, provider/version, observer, instant, and validity/warnings. The default
profile is `AE_APPARENT_TOPOCENTRIC_AIRLESS`: light-time, topocentric parallax, aberration,
provider-managed precession/nutation are included; atmospheric refraction is disabled. A later
configuration may explicitly select normal refraction for every body together, never selectively.

Below-horizon bodies remain valid output directions. They are not clamped to the horizon, hidden
as if absent, or projected to the celestial equator. Declination remains metadata for future
pedagogy; no equator-projection or connecting-line mode is in this layer.

## Presentation contract

The presentation model maps the immutable ENU direction once into the established application
basis: east -> `+X`, up -> `+Y`, north -> `-Z`. It does not calculate an ephemeris, consume
ambient time, or apply geographic yaw. The calibrated geographic parent supplies accepted north
yaw exactly once, together with the Earth axis, celestial equator, and local horizon.

Markers are homogeneous projective directions (`w = 0`) rendered at infinity. There is no finite
celestial presentation radius and no literal distance claim: marker centers preserve apparent
direction while diameter and color are restrained visibility aids. The Sun is warm but intentionally
not solar-bright; the Moon is pale neutral; planets share a quiet differentiated family. None is a
nearby miniature physical solar system, a label, a pointer, a star field, or an astrological symbol.

The GPU receives only bounded unit-direction attributes. Marker materials use the accepted linear
XR-depth non-writing/non-testing celestial overlay policy (`depthTest = false`,
`depthWrite = false`); no logarithmic depth or raw astronomical-distance coordinate enters the
renderer. The group is world-locked below the calibrated geographic parent, not camera/controller
parented, and owns/disposes only its Points geometry and shader material.

## State and cache

`SolarSystemBodyStateService` is deliberately separate from the structural P03 snapshot. Before a
provider call or cache lookup, it requires the active registry's immutable
`ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_V1` descriptor to equal the descriptor retained by the
snapshot and enabled Tier 1 configuration. The descriptor contains provider name/version, adapter
version, supported body-set identifier, supported correction profiles, and the EQD_TRUE to
HORIZONTAL_ENU frame contract. A mismatch is a fatal structured scientific error, never a warning
or a cache hit. Its immutable expected/actual diagnostic snapshots preserve every descriptor
dimension and a deterministic `mismatchedFields` list, so a frame-, profile-, body-, or
capability-only difference cannot appear identical in error context.

Its bounded frozen/paused cache key includes that active descriptor, the validated observer and
observer revision, complete explicit simulation clock/instant/source/revision state, configuration
correction profile and revision, the fixed body list/body-set identifier, and frame policy. Active
unpaused time bypasses cache. Both equatorial and horizontal results must independently match the
requested body, observer, instant, provider identity, correction profile, frame, units, and finite
unit-direction contract before a recursively frozen body state is returned. Calibration is
presentation-only for body directions, so yaw is not baked into this scientific cache; the
containing immutable scientific snapshot still gates readiness.

## Controls and current exclusions

One default-hidden **Solar-system bodies** control reveals or hides the complete seven-marker
layer. There are no per-body controls, labels, pointing aids, search, persistent storage, network
lookup, a second clock, Moon phase/limb/diameter rendering, planet disks/rings/paths, ecliptic,
celestial-equator projection, combined actual-plus-projected display, declination connectors,
Sun/Moon/planet temporal paths, stars, or precession geometry.

## Verification and Quest follow-up

Automated tests cover supported identifiers, deterministic frozen observer/time computation,
provider/frame/correction provenance, below-horizon retention, ENU/application signs,
direction-only rendering, bounded GPU attributes, depth policy, group ownership, and disposal.
Provider identity and complete equatorial/horizontal provenance are adversarially validated before a
body state can become ready. The adapter's independent JPL fixture depth remains strongest for the
established Sun/Moon cases; independent major-planet fixture expansion is a non-blocking future
scientific-validation improvement.
Final independent validation, normal integration, GitHub Actions/Pages publication, and hosted
desktop regression pass with 383 tests. Hosted verification confirms readiness, the default-hidden
global control, seven-body diagnostic, repeated visibility toggling, subpath assets, clean console,
and coexistence with the axis/equator/horizon. Physical Quest acceptance remains pending and must
check general Sun/Moon direction, planet separation, below-horizon continuity, brightness,
world-locking, calibration, session lifecycle, and absence of duplicate markers.
