# Earth Core, Rotational Axis, and Celestial Poles

## Status

The geocentric scientific model and its hardened renderer are integrated and published on
`master`. The original independent gate accepted the WGS84, P03, projective-pole, convergence,
and calibration contracts but rejected raw `10^13 m` GPU coordinates, global logarithmic depth,
and missing disposal. The remediation replaced those paths and added deterministic
precision/depth/lifecycle coverage; the independent re-gate, integration, publication, and hosted
regression passed. The user physically tested the published experience and accepted it as
workable. Later bounded evidence clarifies that the axis is one clean line in either eye
independently but appears doubled with both eyes open. No duplicated line was observed within an
individual eye. That detailed axis/equator evidence remains **CONDITIONAL PASS** and the exact
binocular-fusion cause is not claimed as proven. The later Milestone 2D report adds a **PASS for
bounded physical usability** of the combined deployed spatial-reference experience; it does not
claim separate angular, world-locking, or eye-mode measurements. See
[Milestone 2D Physical Acceptance](MILESTONE_2D_PHYSICAL_ACCEPTANCE.md).

The current `fix/earth-axis-spindle` correction responds to newer physical feedback that the axle
read as bowed or hinged at the core. Investigation confirmed the analytic line, pole antipodes,
parent hierarchy, and one-yaw path were already correct. The visual seam came from two separately
styled/rasterized line objects and a core quad drawn over their joint. The local correction replaces
them with one authoritative descriptor and one projectively clipped constant-width strip. It is
automated- and desktop-validated but is not merged, published, deployed, or physically accepted.
See [Rigid Earth-Axis Spindle](EARTH_AXIS_SPINDLE.md).

## Scientific model — unchanged

The source remains the validated Tier 1 IAU P03 precession-only mean pole/equator of date. It
excludes nutation, celestial-intermediate-pole corrections, polar motion, Chandler wobble, and
observed pole offsets. NCP and SCP are celestial directions at infinity, not Polaris or literal
finite-distance bodies.

The scientific snapshot owns:

1. the validated P03 mean-axis direction transformed into observer-horizontal ENU; and
2. the WGS84 geocentric placement of the modeled Earth center relative to the observer's local
   tangent origin.

The observer remains at their modeled surface origin and is generally offset from the rotational
axis. One line through the modeled core is parallel to the validated north direction; south is
exact component negation. Geographic yaw remains outside science and is applied once by the
existing geographic parent.

## Geocentric placement

```text
observer WGS84 geodetic state
  -> observer Earth-fixed position
  -> Earth-center displacement
  -> local horizontal ENU meters
  -> application basis: east -> +X, up -> +Y, north -> -Z
  -> calibrated geographic parent applies yaw once
```

The modeled core is not the floor origin, observer, Earth sphere, or an invented nearby point.
For `WGS84_ELLIPSOID`, elevation is ellipsoid height. The current UI declares mean-sea-level
elevation; Tier 1 temporarily uses that numeric value as an ellipsoid-height approximation and
retains the existing datum warning.

## Scientific projective directions and diagnostic finite proxies

The Earth core, spindle, celestial-equatorial plane, and NCP/SCP directions now share one
presentation structure. The core is the finite center of the celestial-equator reference ring;
the spindle passes through it; the equator normal is the same positive axis direction; and SCP is
its exact component-negated projective direction. The observer remains at the surface-relative
origin and the local horizon remains observer-centered.

The scientific NCP/SCP values are exact antipodal directions at infinity. The presentation model
retains `10^13 m` finite points only to reproduce the accepted convergence diagnostic; they never
cross the hardened GPU boundary. Across the supported observer latitude and elevation domain,
the accepted upper bound remains below `0.14 arcseconds`.

The renderer uses no physical “distance to a celestial pole.” Marker diameter and label size are
screen-space presentation values.

## Hardened renderer

The render strategy identifier is:

```text
CAMERA_RELATIVE_BOUNDED_HOMOGENEOUS_SPINDLE_AND_PROJECTIVE_POLES
```

For each camera supplied by Three.js — including each XR eye — JavaScript:

1. applies the calibrated parent's world rotation once;
2. subtracts that eye camera's world position from the scientific Earth core in double precision;
3. rotates the relative core into that eye's view frame;
4. rotates the unit pole direction into the same view frame;
5. forms a bounded homogeneous core and one projective image-line equation; and
6. uploads only bounded line coefficients, the camera-relative core, and unit directions.

One fullscreen spindle mesh rasterizes a constant-width strip from the image-line equation through
the homogeneous finite core and ideal axis direction. Pole marker and label quads still project the
exact oriented `w = 0` directions. All object translations remain zero. No `10^13 m` vertex,
object position, or model-view translation exists.

There are no separate north/south line objects. One shared per-eye core and direction defines the
entire projected centerline; south remains exact negation for pole markers and bounded diagnostics.
The display is world-anchored because the calibrated world matrix and active eye matrix are
recomputed at draw time; the screen-space strip only rasterizes that world-derived centerline and
does not billboard, bend, or head-lock it.

## Earth-core presentation

The core remains a finite WGS84 point roughly one Earth radius from the observer. Its actual
camera-relative vector determines screen direction and per-eye behavior. A restrained fixed-pixel
marker makes the direction inspectable; it is an appearance proxy and does not replace or move the
scientific point. The spindle renders over its marker so the marker cannot become a visible joint.
Both remain depth-disabled because no room floor or passthrough depth surface is a scientifically
valid Earth occluder.

## WebXR depth contract

The depth contract identifier is:

```text
LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY
```

The shared camera is restored to the ordinary `0.01–100 m` range and the renderer does not enable
logarithmic depth. Existing room/geographic materials retain normal linear depth behavior. Every
celestial axis/core/pole/label material explicitly sets `depthTest = false` and
`depthWrite = false`; its shader places visible fragments near the far clip boundary without
modifying the compositor-visible depth attachment. The XR compositor therefore never receives
logarithmic values disguised as linear near/far depth.

This is one normal render pass with a non-writing celestial overlay, not a second XR layer. The
tradeoff is explicit: celestial aids appear through virtual room references and passthrough because
the application has no authoritative environmental or Earth-surface occlusion mesh.

## Ownership and lifecycle

`createEarthAxisGroup()` owns its one spindle mesh/material, marker/label quads, and two label
textures.

- `update()` reuses the existing objects and resources.
- visibility changes allocate nothing.
- `clear()` removes scientific readiness while keeping reusable GPU resources.
- `dispose()` removes the group, releases every unique owned geometry/material/texture exactly
  once, clears render callbacks, rejects later updates, and is idempotent.
- page teardown calls `dispose()`; XR exit/re-entry reuses the same handle and does not duplicate
  resources.

The handle owns no controller/session listeners and does not dispose shared scene resources.

## Diagnostics

The restrained diagnostics distinguish scientific values from rendering policy:

- scientific Earth-core ENU meters;
- normalized P03 NCP ENU direction;
- modeled core and observer-to-axis distances;
- diagnostic finite-proxy convergence bound;
- camera-relative/homogeneous strategy;
- approximate camera-relative core magnitude;
- linear/non-writing depth contract;
- calibration revision and P03 provider version; and
- one-spindle contract/topology, core-to-line distance, north/south dot product, transform-parent
  identity, one-yaw policy, projected-line visibility/degeneracy, and local/view direction vectors.

Per-eye transient values remain available on the scene group's diagnostic `userData` for defect
triage but are not continuously copied into the normal UI.

The local Milestone 2D branch adds reversible `both`, `left`, and `right` visibility modes to the
unchanged renderer. These presentation modes do not alter this document's scientific, projective,
camera-relative, depth, or calibration contracts.

## Validation and remaining risk

Deterministic coverage includes supported latitude/elevation sweeps, per-eye offsets, named and
oblique camera views, head translation and rotation, exact antipodes, strict local/world/projected
collinearity, core incidence, calibration/recalibration and rigid-parent transforms, bounded float
attributes/uniforms, camera-relative float32 error, homogeneous shader/source boundaries, material
depth behavior, toggles, reset/re-entry, resource reuse, clear/rebuild, and idempotent disposal.

Desktop development and production preview validate shader compilation, controls, orbit,
readiness/reset, and console health. The user has additionally reported the published Quest
experience workable with no blocking issue. That practical acceptance does not establish detailed
individual findings for stereo comfort, passthrough contrast, compositor behavior, or physical
world locking; those were not separately captured.

## Exclusions

This remediation adds no celestial equator, precession trajectory, nutation display, polar
motion, Chandler wobble, ecliptic, Sun, Moon, planets, stars, temporal markers, geolocation, Earth
sphere, relational circuits, media, audio, AI enhancement, or contemplative sequencing.
