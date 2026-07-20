# Geocentric Rendering Precision

## Scope

This document budgets the rendering boundary for the WGS84 Earth core and P03 projective pole
directions. It does not revise the scientific provider, geodetic conversion, correction profile,
or Tier 1 claim.

## Coordinate boundary

Scientific and diagnostic values remain immutable JavaScript numbers:

- Earth-core displacement: WGS84 local ENU/application meters, approximately `6.35–6.48 * 10^6 m`
  over the supported elevation domain;
- pole directions: normalized unit vectors;
- accepted finite convergence diagnostic: `10^13 m` from the core; and
- calibrated geographic yaw: presentation-parent only.

The `10^13 m` diagnostic coordinates never enter a Three.js attribute, object translation,
matrix, uniform, or shader. GPU geometry contains only unit quad corners. The spindle receives a
display-extent-scaled homogeneous core plus one normalized projective image-line equation; all
uploaded line components are bounded.

## Camera-relative and projective transform

For every active camera/eye:

```text
scientific application-basis core
  -> calibrated parent world transform
  -> subtract eye world position in JavaScript double precision
  -> inverse eye rotation
  -> camera-relative core-view meters (homogeneous w = 1)

scientific application-basis pole direction
  -> calibrated parent world rotation
  -> inverse eye rotation
  -> unit view direction (homogeneous w = 0)
```

The current GPU component budget is `7,000,000`. Normal desktop/XR camera motion is tiny relative
to that bound. Inputs beyond it are rejected rather than silently rendered.

## Numerical budget

### CPU

JavaScript uses IEEE-754 binary64. At `10^13`, one relative double-precision step is on the order
of millimeters. That scale is diagnostics-only. WGS84 core subtraction and rotation occur at
roughly Earth-radius scale with substantially finer absolute representation.

### Float32 upload

The supported core components remain below `7 * 10^6 m`. IEEE float32 spacing in that range is at
most about `0.5 m`; the deterministic full-domain sweep requires Euclidean quantization error
below `1 m`. A conservative transverse `1 m` core error at `6.35 * 10^6 m` corresponds to roughly
`0.033 arcseconds`.

Pole directions are uploaded near unit magnitude. The full-domain sweep requires their float32
angular separation from the CPU direction below `0.03 arcseconds`. North and south share one
uploaded north direction; south is exact component negation.

The hardened path materially improves on raw `10^13 m` Float32 attributes, where coordinate steps
are hundreds of kilometers and model-view subtraction cannot retain ordinary camera motion.

### Projective convergence

The retained diagnostic finite proxy has an independently accepted maximum observer/core
convergence below `0.14 arcseconds` over latitude `[-90, 90]` and elevation
`[-12,000, 100,000] m`. The homogeneous GPU pole has `w = 0`, so it does not add finite-distance
convergence.

## Stereo and head motion

Three.js calls the render callback with the camera for the current eye. The left and right eye
positions are therefore subtracted independently; no mono frame is copied across eyes. A
representative `64 mm` eye separation produces two distinct core-relative vectors while the
projective pole direction has translation-invariant zero parallax. Head rotation changes the view
coordinates but not the calibrated world direction.

Earth-core stereo parallax at one Earth radius is far below a display pixel and may be smaller
than the float32 angular budget. The CPU frame remains physically coherent, and the renderer does
not amplify that imperceptible signal into false nearby parallax.

## Axis continuity

One spindle descriptor owns the core, normalized north direction, and exact negative south
direction. For each eye, the renderer takes the homogeneous cross product of the bounded finite
core image and the shared ideal direction image to obtain one normalized screen-line equation.
One constant-width strip rasterizes that line; there are no independent north/south line objects,
orientations, materials, or coincident centerlines. Pole markers still consume the same view
direction and its exact negation.

## Supported domain and stop behavior

- observer latitude: `[-90, 90] degrees`;
- observer elevation: `[-12,000, 100,000] m` under the existing observer contract;
- ordinary room-scale desktop/XR camera positions; and
- the existing P03 date domain.

Non-finite vectors, non-unit projective directions, incompatible render contracts, and
camera-relative components above the explicit budget are rejected.

## Remaining uncertainty

Automated and desktop evidence cannot establish Quest GPU/compositor behavior, physical world
locking, passthrough readability, or comfort. The independent renderer gate and later physical
Quest acceptance must keep those results explicitly pending until observed.

## Unified equator boundary

The equator now preserves its finite Earth-core center while retaining bounded GPU values. For
display radius `R = 12,756,274 m`, the shader receives `coreView / R + directionView` and
homogeneous `w = 1 / R`. This is exactly equivalent to the finite point
`coreView + R * directionView`. Across the supported WGS84 observer/elevation domain the spatial
component budget is below `2`; raw Earth-scale ring coordinates are CPU-only. The equator and
spindle use the identical shared core and axis-normal objects beneath the same calibrated parent.
