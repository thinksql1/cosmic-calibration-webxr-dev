# Local Astronomical Horizon

## Scientific definition and Tier 1 vertical

The local horizon reference is the observer-origin plane of altitude zero in canonical local ENU.
Its basis is east/north and its normal is local up. It contains exact north, east, south, and west
directions and is perpendicular to the zenith/nadir line.

The current Tier 1 state uses WGS84 geodetic up as the available mathematical vertical. A strict
gravity-defined astronomical vertical can differ through deflection of the vertical, which is not
modeled. The layer is therefore identified in diagnostics as
`LOCAL_ASTRONOMICAL_HORIZON_TIER_1` with
`WGS84_GEODETIC_UP_TIER_1_APPROXIMATION`. It is not a terrain/natural horizon, curvature dip
horizon, or refracted apparent horizon.

## Center and hierarchy

The local horizon is correctly observer-centered at the calibrated local tangent origin. It is not
centered on Earth core and does not use P03 or the celestial-equator basis. Conversely, the Earth
axis and celestial equator remain geocentric/projective. The different centers are intentional
because the layers represent different scientific structures.

ENU maps once into the application basis:

```text
east  -> +X
up    -> +Y
north -> -Z
```

The circle is a child of `geographic-reference-frame`, beside the cardinals and celestial layers.
Its vertices contain no calibration yaw; the parent applies accepted north yaw exactly once. The
existing 1.5 m `floor-horizon-ring` remains a room/floor diagnostic and is not this scientific
local-horizon layer.

## Geometry

The bounded reference uses 96 deterministic samples:

```text
H(theta) = 24 m * (cos(theta) * East + sin(theta) * North)
```

Sample 0 is east; samples 24, 48, and 72 are north, west, and south. `LineLoop` closes the final
segment without duplicating the seam vertex. The 24 m radius is a room-scale directional aid, not
Earth radius or distance to the visible/natural horizon. Supported configuration is deliberately
bounded to 10–100 m.

## Rendering and depth

The horizon uses ordinary finite local Float32 positions, never astronomical-scale coordinates.
It remains in the normal linear WebXR renderer, with `depthTest = false`, `depthWrite = false`, and
fixed render order 12. This makes the tangent reference inspectable through diagnostic geometry
without claiming passthrough or terrain occlusion accuracy. It is world-oriented under the
calibrated parent and never uses headset-forward orientation.

## Controls and eye presentation

The layer defaults hidden. Its bounded controls are:

- show/hide local horizon; and
- `both`, `left`, or `right` XR-eye presentation.

Eye selection follows [Binocular Presentation Modes](BINOCULAR_PRESENTATION_MODES.md) and does not
change the circle, calibration, or cardinal relationships.

## Lifecycle and diagnostics

One handle owns one geometry and material. Updates, recalibration, visibility, and eye-mode changes
reuse them. `clear()` removes readiness without disposal; `dispose()` releases owned resources,
detaches the group, and is idempotent.

Diagnostics retain terminology, vertical model, 24 m presentation radius, 96 samples, depth
contract, accepted-calibration revision, eye mode, active XR-view identities, and suppressed eyes.

## Pending validation and exclusions

Automated and desktop evidence cannot establish headset fusion, readability, world locking,
comfort, or whether the horizon improves the user's interpretation of the geocentric layers. The
user has accepted the deployed spatial-reference experience as compelling and workable, but did
not separately report those checklist-level horizon observations; they remain regression evidence,
not inferred PASS results. See [Milestone 2D Physical Acceptance](MILESTONE_2D_PHYSICAL_ACCEPTANCE.md).

No precession trajectory, ecliptic, Sun, Moon, planet, temporal clock, geolocation, media, game,
AI, or contemplative system is included.
