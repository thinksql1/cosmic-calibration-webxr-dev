# Real-Sky Equatorial Orientation

Development deployment: feature `2e257db`, normal merge `ccf37fd`, successful Actions/Pages run
`29969698393`. The hosted study remains query-gated; its coordinate behavior has now passed the
reported physical Quest foundation gate.

## Status

**Development-only query-gated study; automated and reported physical Quest foundation validation
passed.** Quest review found complete grid geometry, credible pole convergence, no obvious
east/west mirror or north/south inversion, natural planet placement, sound world locking/stereo,
and no blocking callback or incomplete-frame failure. The ordinary development URL retains the
canonical non-sidereal grid. The bridge is accepted for catalog-coordinate consumers; it does not
itself define constellation connectivity or a label policy.

## Provider audit

The installed dependency is exactly Astronomy Engine `2.1.19`. Its local TypeScript definitions
and implementation expose `Rotation_EQJ_EQD`, `Rotation_EQD_HOR`, `Rotation_EQJ_HOR`,
`RotateVector`, `SiderealTime`, `VectorFromSphere`, `SphereFromVector`, `VectorFromHorizon`,
`HorizonFromVector`, `Equator`, and `Horizon`. Raw provider imports remain confined to
`astronomyEngineAdapter.ts`.

`Rotation_EQJ_HOR(time, observer)` incorporates the selected UTC instant, precession/nutation,
Earth rotation, observer longitude, and observer latitude. Its rigid rotation does not depend on
observer elevation and does not apply atmospheric refraction. Astronomy Engine HOR is a
right-handed Cartesian frame:

```text
x = north
y = west
z = zenith/up
```

The application remap is explicit and proper:

```text
HOR (north, west, up)
  -> ENU (east = -west, north = north, up = up)
  -> application (x = east, y = up, z = -north)

matrix rows =
  [ 0, -1,  0 ]
  [ 0,  0,  1 ]
  [-1,  0,  0 ]
determinant = +1
```

## Authoritative catalog bridge

`catalogEquatorialJ2000ToHorizontalEnu` owns the catalog path:

```text
catalog RA (sidereal hours), declination (degrees), J2000 mean equator/equinox
  -> normalized EQJ Cartesian direction
  -> Astronomy Engine Rotation_EQJ_HOR at central-clock UTC and validated observer
  -> verified HORIZONTAL_ENU direction
  -> application basis
  -> geographic-reference-frame physical-north yaw exactly once
  -> native left/right XR projection
```

RA wraps modulo 24 hours. Declination outside `[-90,+90]`, non-finite input, a missing provider
operation, or a non-rigid/non-finite matrix returns a structured local `not-ready` result. The
bridge is immutable and owns no timer, camera, or scene object.

## Why the grid uses EQD phase

The existing grid is the validated mean-equator-of-date structural plane and its pole markers are
the current Earth rotation axis in local ENU. A raw J2000 `+Z` direction is not exactly the
mean-of-date pole; at the implementation audit epoch the separation was about `0.149 degrees`.
Treating those as identical would hide a real frame mismatch.

The study therefore keeps two explicit, compatible contracts:

- future catalog J2000 points use the full `EQJ -> HOR` bridge;
- the existing grid's longitude phase uses `EQD -> HOR`, so its NCP/SCP convergence stays exactly
  on the already validated mean-date pole markers while RA zero follows apparent sidereal time.

This makes the study grid a true-equator/equinox-of-date reference, not a claim that its lines are
literal J2000 catalog-coordinate lines. Constellation vertices will use the catalog EQJ bridge;
they must not infer their placement from the grid sampling phase.

## Refraction and body cross-check

The grid and future constellation geometry are geometric and non-refracted. Refraction varies
with altitude and cannot be represented by one rigid matrix without bending great circles. An
optional refracted display would require a separate non-rigid per-object policy.

The current body layer uses topocentric apparent `EQD_TRUE` values from `Equator(..., true, true)`
and, by default, airless `Horizon`. Tests transform the same EQD RA/declination through
`Rotation_EQD_HOR` and compare local ENU directions for Sun, Moon, Mercury, Jupiter, and Uranus.
The Moon's topocentric parallax is already present before this comparison. No body positions are
changed. Refracted and airless results must never be compared silently.

## Bounded homogeneous grid transform

Grid topology and uploaded direction buffers remain unchanged. Existing encoded vertices are:

```text
encodedPosition = earthCore / displayRadius + canonicalDirection
w = 1 / displayRadius
```

For real-sky mode the vertex shader keeps the encoded center fixed and applies one shared proper
rotation only to the direction term:

```text
oriented = encodedCore + directionRotation * (encodedPosition - encodedCore)
```

Canonical mode bypasses this calculation and retains the exact prior shader position. The matrix
is calculated when the central clock or observer changes, outside render callbacks. No vertex is
rebuilt for sidereal motion, no camera is consulted, and no per-eye state changes the shared
orientation. Native model-view/projection matrices provide independent stereo projection.

## Study modes and deterministic time

- `?skyFrameStudy=canonical` — validated non-sidereal baseline.
- `?skyFrameStudy=real-sky` — one grid using the EQD real-sky phase.
- `?diag=1&skyFrameStudy=overlay` — canonical blue grid plus one intentional warm real-sky copy.
- `&skyTime=<UTC ISO instant>` — freezes the existing central clock at a deterministic instant.

The normal URL has no study effect. Diagnostics report matrices, determinant,
orthonormality/inverse errors, GAST, basis directions, pole error, horizon intersections, body
cross-check errors, update count, geometry-rebuild state, and build SHA. Exact-name isolation
supports grids, overlay, poles, horizon/compass, Sun/Moon, planets, RA meridians, and basis axes.

## Responsibility and prohibited double rotations

Astronomy Engine answers where a direction belongs in the local geographic sky. It owns UTC,
sidereal rotation, longitude, latitude, and EQJ/EQD conversion. The geographic parent answers how
that local sky aligns to the physical room and owns accepted calibration yaw. Longitude,
sidereal phase, azimuth conversion, and calibration yaw are each applied once. Headset yaw is
never astronomical time.

## Quest acceptance record

Physical review reported a complete stable grid, credible pole convergence, no obvious axis
mirroring or inversion, natural planet placement, coherent stereo/world locking, and no blocking
callback/incomplete-frame failure. That evidence accepts this bridge as the coordinate foundation
for the query-gated first constellation-line study. It does not validate every numerical
diagnostic, promote the real-sky grid to the ordinary default, or approve constellation labels.
See [First Constellation Line Layer](FIRST_CONSTELLATION_LINE_LAYER.md).
