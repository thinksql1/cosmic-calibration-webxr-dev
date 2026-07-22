# Observer-offset geocentric presentation study

## Status

Development-only, query-gated Quest comparison study. No production visualization has been selected.
The baseline remains unchanged unless `geoStudy` selects a mode.

## Purpose

The celestial grid is mathematically centered on the modeled Earth core, but the Quest observer is
near the WGS84 surface rather than at that center. Perspective therefore need not make the core
appear at the screen midpoint of surrounding grid arcs. These optional aids communicate that
observer/core distinction without moving either scientific point or changing the celestial grid.

All modes consume only `ObserverOffsetGeocentricPresentation`:

```text
finite point P → (P / R, 1 / R)
R = celestial-grid radius = 12,756,274 m
reference Earth radius = R / 2
```

The actual observer remains the WGS84 ellipsoidal local origin. The displayed reference-sphere
surface point is explicitly a semi-major-radius explanatory point; its small recorded offset from
the actual ellipsoidal origin is not hidden.

## Modes

| Query mode | Visible study objects | Cue | Limitation |
| --- | --- | --- | --- |
| `baseline` | None | Control comparison | Adds no study geometry. |
| `core-radius` | Open triangular observer-to-core ribbon | Shows the local geocentric radius | Not the Earth rotational spindle. |
| `surface-point` | Small reference-surface marker | Separates observer surface from core | Marker is an explanatory reference-sphere point. |
| `wireframe-earth` | Sparse terrestrial circles/meridians | Shows a small Earth reference sphere inside the celestial sphere | No opaque globe, texture, or Earth rotation. |
| `tangent-plane` | Finite transparent patch and optional local axes | Shows the local-horizon tangent relation | Uses WGS84 geodetic up, which is not identical to a geocentric radial everywhere. |
| `combined` | All four aids | Complete embodied explanation | May be visually noisier than the smallest useful cue set. |

All objects are grouped under `observer-offset-geocentric-study`, are static across eyes, and use
native Three.js model-view/projection matrices. Finite anchors are bounded before GPU upload;
there are no raw million-meter vertices, camera-derived shared geometry, or study render callbacks.

## Controls and diagnostics

Use `?geoStudy=<mode>`. The normal development URL is the baseline. With `?diag=1`, the study
selector and controls are exposed for radius, surface marker, Earth wireframe, tangent patch,
local axes, labels (reserved and off by default), and opacity.

`?diag=1` reports the build SHA, selected mode, enabled objects, finite anchors, observer/core
vector and distance, Earth/grid radii and ratio, local ENU basis, tangent normal, bounded GPU
maximum, and zero-by-construction center/reference-radius errors. Exact-object `isolate` values
include `geo-study-core-radius`, `geo-study-surface`, `geo-study-earth`, `geo-study-tangent`,
`geo-study-earth-core`, `geo-study-earth-observer`, `geo-study-earth-radius`,
`geo-study-grid-earth`, `geo-study-core-grid-observer`, and `geo-study-combined`.

## Quest comparison procedure

1. Open a fresh private Quest Browser session and the exact cache-busted development URL.
2. Confirm the visible build SHA before entering passthrough WebXR.
3. Calibrate north once, then compare baseline, radius, surface point, wireframe Earth, tangent
   plane, and combined modes in each eye separately.
4. Move slowly, look near both poles, and note whether the core reads as the celestial-sphere
   center while the observer remains clearly offset.
5. Compare calmness, visual noise, stereo comfort, tangent-horizon clarity, and any perceived
   scale contradiction. Do not infer physical acceptance from desktop evidence.

The parked spindle issue is intentionally unchanged. Future constellations must use the existing
equatorial basis and shared geocentric presentation contract rather than adding another center or
coordinate convention.
