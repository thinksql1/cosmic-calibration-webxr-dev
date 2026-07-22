# Observer-offset geocentric presentation contract

## Status

Accepted architecture contract for future development-only presentation studies. This document
adds no visible objects, changes no existing celestial geometry, and does not select a permanent
Quest visualization. Current implementation authority is `PROJECT_STATE.md`, the geocentric
presentation modules, and the focused tests.

## Purpose

`ObserverOffsetGeocentricPresentation` is the one reusable mapping for future aids that explain
why a Quest observer can be near Earth's surface while the Earth core remains the center of the
finite celestial coordinate sphere. It deliberately separates scientific meters, bounded GPU
anchors, and per-eye camera projection. It is not a second scene origin, a camera-relative sky
dome, or a replacement for the validated grid/equator renderer.

```text
Celestial-grid sphere
    center = Earth core
    reference radius = 2 × WGS84 semi-major radius

Reference Earth sphere
    center = Earth core
    reference radius = 1 × WGS84 semi-major radius

Actual observer origin
    WGS84 ellipsoidal surface origin in local ENU
    distinct from Earth core; approximately one reference Earth radius away
```

## Sources of truth

| Value | Authoritative source | Contract use |
| --- | --- | --- |
| Earth core and observer origin | `GeocentricCelestialStructurePresentation` | Same object identities already used by the core, equator, grid, and pole assembly. |
| Reference Earth radius | `WGS84_SEMI_MAJOR_AXIS_METERS` | The existing scale source. No duplicate radius literal is introduced. |
| Celestial-grid radius | `GeocentricCelestialStructurePresentation.celestialEquatorDisplayRadiusMeters` | Must remain exactly two WGS84 semi-major radii. |
| Local east/north/up | Canonical ENU mapped by `mapEnuToApplicationBasis` | Same established east `+X`, up `+Y`, north `-Z` scene convention. |
| Geographic yaw | `geographic-reference-frame` parent | Applied once after the immutable contract; never baked into anchors. |
| Equatorial basis and celestial poles | Existing geocentric structure / coordinate-grid contract | Unchanged and not redefined here. |

## Scientific and presentation coordinates

Scientific positions are double-precision meters in the uncalibrated application basis. The
observer is the local ENU origin and the Earth core is a finite WGS84-derived position roughly one
Earth radius away. Celestial directions remain unitless and are not given fabricated finite
astronomical distances.

Presentation anchors are not local meters. For a finite scientific point `P` and the existing
celestial-grid radius `R`, the contract encodes:

```text
P  →  (P / R, 1 / R)
```

Homogeneous division reconstructs `P`; multiplying all four homogeneous components by the same
nonzero scalar reconstructs the same point. This is the validated finite-core convention already
used by the celestial grid and equator. A true celestial direction alone is encoded as
`(d.x, d.y, d.z, 0)`; finite Earth-core, observer, surface, and tangent anchors never use `w = 0`.

The chosen approach is therefore **ratio-preserving bounded homogeneous representation**, not a
new arbitrary compressed local scene scale. The reference Earth/grid ratio remains `1 : 2`.

## WGS84 surface distinction

The scientific observer sits on the WGS84 ellipsoid, not on a literal sphere. Away from the
equator or poles, the ellipsoid's geodetic up is not exactly the center-to-observer radial
direction, and the observer-to-core distance is not exactly the WGS84 semi-major radius. The
contract retains both facts:

- `scientificObserver` is the actual WGS84-derived local origin;
- `observerRadialDirection` is the normalized core-to-observer direction;
- `localEast`, `localNorth`, and `localUp` retain the local WGS84 geodetic ENU tangent basis;
- `referenceEarthSphereSurfacePoint` is explicitly a one-semi-major-radius explanatory sphere
  point, not a claim that the scientific ellipsoid is spherical;
- `ellipsoidToReferenceSphereOffsetMeters` records the signed scale difference.

Future study geometry must choose and label an ellipsoidal/local-surface cue versus the sparse
reference sphere; it may not conceal this distinction by moving the observer or core.

## API and invariants

`createObserverOffsetGeocentricPresentation(structure)` returns an immutable validated contract
or a structured `not-ready` failure. It exposes finite-anchor encoders for the existing core,
actual observer, a reference-sphere surface point, offsets from the core, and local tangent-plane
points. It exposes projective direction encoders only for genuine directions.

The tested invariants are:

1. The contract Earth core is the shared geocentric Earth-core object.
2. Grid radius is the existing two-semi-major-radius value; reference sphere radius is half of it.
3. The actual observer remains distinct from the core and inside the finite celestial sphere.
4. The reference-sphere surface point is exactly one reference radius from the core.
5. East, north, and up are finite, orthonormal, and right-handed; tangent points are perpendicular
   to local geodetic up.
6. Finite anchors have finite nonzero `w`; directions at infinity alone use `w = 0`.
7. Equivalent homogeneous scalings reconstruct the same scientific point.
8. Contract-created anchors stay within the same component budget (`2`) validated by the existing
   finite grid/equator renderer.
9. The contract is static and immutable. Per-eye code may transform a copy for that eye but may
   not mutate the contract, shared anchors, or geometry.

## GPU and XR boundary

Future renderers must upload only finite bounded homogeneous attributes/uniforms. They must use
native Three.js model-view and projection matrices for each eye, retain non-writing overlay depth
where they join celestial references, and suppress only their own optional aid on invalid state.
They must not throw from `onBeforeRender`, use a camera position as shared geometry, upload raw
million-meter sphere vertices, rebuild shared geometry per eye, or introduce manual XR framebuffer
handling. The current contract itself creates no render callbacks and no scene objects.

## Coordinate chain

```text
WGS84 scientific Earth core / observer origin
    → application-basis scientific point or unit ENU direction
    → finite homogeneous anchor scaled by celestial-grid radius, or true w=0 direction
    → existing geographic-reference-frame yaw (once)
    → per-eye model-view and projection matrices
    → optional study primitive in that eye
```

This preserves the existing center, equatorial basis, pole convergence, and calibration hierarchy.
It does not claim sidereal alignment and does not alter the parked Earth-axis spindle issue.

## Intended consumers and prohibited shortcuts

The later query-gated observer-to-core radius, surface marker, wireframe reference Earth,
tangent-plane patch, and combined study must use this contract exclusively. Future constellations
must continue to use the existing equatorial-coordinate basis and this same geocentric center/
presentation-radius contract; they must not introduce another coordinate convention.

Prohibited: moving the core or grid to the observer, creating a prototype-only center or scale,
ordinary raw million-meter sphere vertices, camera-dependent shared geometry, per-eye mutations,
or changing the validated grid/equator for an explanatory aid.
