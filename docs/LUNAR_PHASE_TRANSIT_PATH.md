# Lunar Phase Transit Path

## Scientific meaning

The Lunar Phase Transit Path is an apparent observer-relative celestial track across one active
lunation. It is not the Moon Daily Path and is not a literal scaled lunar orbit.

| Layer | Interval | Scientific frame | Earth rotation in the path |
| --- | --- | --- | --- |
| Moon Daily Path | one selected local civil day | apparent topocentric `EQD_TRUE` to local horizontal | yes |
| Lunar Phase Transit Path | previous New Moon through next New Moon | apparent topocentric J2000/EQJ | no historical/future horizontal transforms |
| Compact Moon Phase Dial | symbolic eight-position cycle | finite tangent-plane presentation | not applicable |

Astronomy Engine `2.1.19` brackets the active cycle with `SearchMoonPhase(0, ...)`.
`SearchMoonPhase` accepts every target longitude in `[0°, 360°)`, so all event times are
provider-owned: `0°`, `45°`, `90°`, `135°`, `180°`, `225°`, `270°`, and `315°`.
The sole UI term is **Last Quarter**.

Each path sample uses:

```text
Equator(Moon, sample time, configured observer, ofdate=false, aberration=true)
→ apparent topocentric EQJ direction
→ immutable canonical lunation track
→ one current EQJ-to-HORIZONTAL_ENU/application rotation
→ calibrated geographic parent
→ native left/right XR projection
```

This preserves light time, aberration, and the configured observer's lunar parallax while avoiding
the misleading multi-loop that would result from connecting sample-time local horizons.

## Active lunation and sampling

The active window includes both endpoint samples from the previous New Moon through the next New
Moon. Provider cadence is 60 minutes, with exact phase-event instants inserted. Minor-great-circle
subdivision limits rendered adjacent angular spacing to `1°`; provider samples are capped at `800`
and rendered samples at `1600`.

The EQJ endpoint directions generally do not coincide. During one synodic month the Sun-Moon system
advances against the inertial sky and the lunar orbital plane is inclined, so the measured
previous-New/next-New direction residual is reported rather than hidden with an artificial closing
segment. The track nevertheless spans the complete phase cycle.

The static path rebuilds only when the active lunation, observer contract, or provider/configuration
identity changes. Central-time updates move the current transit marker continuously along the
sampled path. Head and eye movement never rebuilds it.

## Visible and Earth-hidden portions

All canonical vertices remain present. Two shaders share the same immutable direction buffer:
one displays directions above the current geometric horizon and one displays below-horizon
directions at reduced opacity. `Show Earth-Hidden Lunar Path` controls only the latter. No Earth
mesh, terrain, camera frustum, or physical depth occlusion deletes the hidden portion.

## Semantic lunar palette

The default query-gated Moonlit Water palette gives the visible transit a blue-violet identity,
the Earth-hidden continuation deep indigo, phase notches silver, and the current marker restrained
aqua. It changes material color/opacity only; the shared canonical buffer, event positions, and
Earth-hidden policy remain exactly the same. `lunarPalette=legacy-purple` provides the prior
accepted comparison. See `SEMANTIC_CELESTIAL_COLOR_SYSTEM.md`.

## Events and current progress

Each canonical event has:

- its exact provider UTC;
- its apparent topocentric EQJ Moon direction at that UTC;
- a short spherical notch perpendicular to the local path tangent;
- an optional procedural phase image;
- an optional independently anchored phase label.

The path itself uses the validated Earth-core-centered celestial presentation radius. Each finite
24 m billboard anchor is placed on the observer's view ray through its corresponding presented
path point, then offset in a stable tangent direction. This preserves visible notch association
without claiming the billboard's finite distance is astronomical.

The current transit marker uses the central simulation time and spherical interpolation between
neighboring samples. It never snaps to the closest canonical phase. Diagnostics report actual
current Moon direction, nearest/interpolated path direction, angular residual, previous and next
phase, interval progress, and time to the next event. The scientific Moon marker remains unchanged.

## Billboard and label repair

The prior compact-dial images and labels inherited the dial tangent group's rotation, and every
phase label was forced into a fixed `4:1` texture/scale. Those contracts could present as tilted
or distorted and compressed long names.

Ring and notch geometry remains on its accepted rotated tangent anchor. Every Moon image and phase
label now has a separate identity-scale anchor directly below the calibrated geographic root.
Sprites remain native Three.js billboards, camera/eye unparented, square for Moon images, and
immutable across eye traversal. Labels and images never share a mutable transform.

Phase-label textures use system fonts, `256 px` height, measured text width plus padding rounded to
`64 px`, and a `2048 px` maximum. Sprite width derives from exact texture aspect ratio. Canonical
world-height presets are:

| Preset | Height |
| --- | ---: |
| Small | `0.45 m` |
| Medium | `0.90 m` |
| Large | `1.80 m` |
| XL | `3.60 m` |

Medium is default. The restrained dark backing, pale outlined text, `depthTest=false`,
`depthWrite=false`, disabled frustum culling, and stable render order follow the accepted XR Sprite
contract. Overlap remains a physical-test limitation.

The compact dial and transit presentation share the eight cached `128×128` procedural phase
textures but own separate Sprite/material/anchor objects. New Moon's silver framing border remains
a presentation frame, not illuminated lunar surface.

## Query and controls

`moonStudy=phase-transit` defaults path, Earth-hidden portion, event notches, and current transit
ON; transit images and labels default OFF. The ordinary URL remains unchanged. Direct controls:

```text
showMoonDailyPath
showLunarPhaseTransitPath
showEarthHiddenLunarPath
showLunarPhaseNotches
showLunarTransitImages
showLunarTransitLabels
showCurrentLunarTransit
moonPhaseLabelSize
```

Legacy `showMoonPath` remains accepted. The compact dial retains its existing independent controls.

## Known limits and acceptance

- The path is observer-relative topocentric EQJ, not a literal orbital-distance model.
- Above/below-horizon styling uses the current real-sky rotation.
- The inertial endpoint residual is scientifically expected; no decorative closure is added.
- Billboard readability, overlap, stereo aspect, and full-cycle perceptual clarity require Quest.
- Physical testing must confirm both daily/transit distinction and that labels never alter image
  shape.
