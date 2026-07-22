# Actual Solar-System Body Layer

## Scope and catalog

This default-hidden layer renders ten actual apparent topocentric directions: the Sun, Moon,
Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto. Sun and Moon remain separate
object categories. Mercury through Neptune are major planets; Pluto is explicitly a dwarf planet.
Earth is intentionally not an external observer-sky marker.

The catalog is supplied by Astronomy Engine `2.1.19`. The adapter uses its `Equator` result with
topocentric/apparent options and converts it through `Horizon` into `HORIZONTAL_ENU`. The retained
`EQD_TRUE` equatorial coordinates and `HORIZONTAL_ENU` unit direction preserve the provider's
apparent topocentric contract: light-time, topocentric parallax, aberration, and provider-managed
precession/nutation are included. The default profile is airless; normal atmospheric refraction is
an explicit whole-catalog configuration. Validated WGS84 latitude, east-positive longitude, MSL
elevation, and the central simulation-clock instant are passed to every provider query.

## Presentation contract

ENU maps once to the application basis: east -> `+X`, up -> `+Y`, north -> `-Z`. The calibrated
geographic parent then owns yaw exactly once. Markers and labels are true projective directions
(`w = 0`), so their centers preserve apparent direction without raw astronomical-distance vertices.
Native Three.js model-view/projection matrices resolve each XR eye; the renderer has no per-eye
geometry mutation, camera parenting, or throwing render callback. Invalid marker or label input
suppresses only that object and records a bounded diagnostic.

Marker size and color are symbolic visibility aids, not physical disk or angular-diameter claims.
Existing Sun/Moon and inner-planet styling is retained. Uranus is restrained light cyan, Neptune
deeper blue, and Pluto subdued lavender-gray. All marker and label materials are non-writing,
non-testing celestial overlays with bounded unit-direction GPU attributes.

## Controls and labels

- **Solar-system bodies** controls marker-layer availability.
- Individual controls select each planet and Pluto; Sun and Moon remain independently categorized.
- **Planet Labels** controls only planet/Pluto labels and defaults OFF.

An enabled body with Planet Labels ON shows one label; turning labels OFF leaves markers visible.
Turning off an individual body hides its marker and label. Build `51b6fff` proved the markers on
Quest but exposed a zero-area projective-plane label defect. The repaired labels reuse the exact
marker direction at a disclosed finite `24 m` presentation anchor plus a deterministic tangent
offset and render as native XR sprites. They are not a new coordinate convention or astronomical
distance claim. Quest testing confirmed rendering and attachment but found the original size table
too small for comfortable reading. Old Large is new Small; Medium is the default and larger
canonical XL/XXL experiments are available for physical readability comparison. A full
collision/decluttering engine is deliberately deferred; inter-body overlap is an accepted
readability-test limitation. See [XR Planet Label Rendering](XR_PLANET_LABEL_RENDERING.md).

Diagnostics expose provider/catalog/frame/profile, observer/time inputs, ENU and application
directions, label state, active and suppressed draw objects, and the visible build identifier.
Diagnostic isolation includes all planet markers, labels, outer planets, each new outer body with
its label, planets plus grid, planets without Sun/Moon, and Sun/Moon comparison. Explicit feature
controls remain authoritative during isolation.

## Exclusions and follow-up

This layer does not add planet disks, rings, phases, pointing, ecliptic, trails, stars,
constellations, sidereal-basis changes, or a second clock. Future constellations must use the same
validated apparent/equatorial direction pathway rather than inventing another basis. The parked
Earth-axis spindle is unrelated and unchanged.

Quest validation passed Uranus, Neptune, and Pluto markers and the repaired finite Sprite labels'
basic rendering/attachment behavior. Physical comparison is now pending for Small, Medium, Large,
XL, and XXL readability, label-to-marker anchoring, and stereo stability. Record only observed
results; do not infer exact angular accuracy or body identification from a short session.
