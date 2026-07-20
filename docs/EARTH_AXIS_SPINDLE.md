# Rigid Earth-Axis Spindle

## Design intent

The Earth rotational axis must read like the rigid axle of a traditional spinning top viewed
through a transparent body:

```text
South celestial pole direction ----- Earth core ----- North celestial pole direction
```

The Earth core is the center of the axle, never a hinge or curve control. The spindle is a calm,
constant-width structural reference. NCP and SCP remain scientifically meaningful oriented sky
directions at infinity; they are not nearby physical endpoints.

## Confirmed root cause

The P03/WGS84 geometry was already mathematically collinear. Science created SCP by exact negation,
the per-eye renderer transformed only north and derived south by exact negation, and one calibrated
geographic parent applied yaw once.

The visible axle was nevertheless assembled from two independent one-pixel `THREE.Line` objects.
They had separate materials, callbacks, clipping, colors, and strongly different default opacities
(`0.88` north and `0.22` south). An 18-pixel core quad rendered over their joint. That confirmed
material/raster seam could make an exact analytic line read as two pieces hinged at the core. No
scientific orientation, observer, provider, time, Sun path, or celestial-body defect was found.

## One-line geometry contract

The shared `GeocentricCelestialStructurePresentation` is the scene-facing source for the Earth
core, spindle, celestial poles, and equatorial plane. `EarthAxisSpindlePresentation` is its axle
view:

- one finite WGS84 Earth-core point;
- one normalized P03 rotational-axis direction in application basis;
- one exact component-negated antipodal direction;
- one bounded diagnostic display extent;
- one coordinate-frame identity;
- observer, calibration, and accepted-calibration revisions;
- P03 provider/model/time provenance; and
- explicit validated state.

The invariant is:

```text
north = normalize(axisDirection)
south = -north
northFinite = earthCore + north * displayExtent
southFinite = earthCore - north * displayExtent
```

Presentation no longer maps separately stored north and south directions. Pole endpoint metadata,
pole markers, the bounded spindle representation, and the scene frame all consume this descriptor.

The same shared structure makes `celestialEquatorCenter` the identical Earth-core object and
`equatorialPlaneNormal` the identical positive-axis object. Its two orthonormal plane bases are
perpendicular to the axis. The spindle therefore intersects the celestial-equatorial plane once,
at the core.

## Earth core and celestial poles

The modeled core is a finite WGS84 geocentric point in observer-horizontal ENU, mapped once to
application basis. It lies on the spindle by construction. The shortest core-to-line distance is
zero; core-to-north and core-to-south vectors are antiparallel; their cross product is zero; and
their normalized dot product is `-1` within the strict numerical test tolerance.

NCP and SCP retain oriented antipodal celestial meaning. In real projective space `[d:0]` and
`[-d:0]` identify the same ideal point, so constructing two separately styled core-to-infinity
primitives is unnecessary and visually fragile. The renderer instead projects the one line defined
by `[core:1]` and `[axisDirection:0]`. The NCP/SCP markers still use the shared positive direction
and its exact negative.

## Rendering and transparent-Earth treatment

The renderer owns one fullscreen mesh and one material named
`mean-earth-axis-rigid-spindle`. Per eye, JavaScript:

1. applies the geographic parent's rigid world transform once;
2. subtracts the eye position from the finite core in binary64;
3. rotates the core and one axis direction into view space;
4. forms a bounded homogeneous core using the declared display extent;
5. derives one normalized image-line equation from the core and ideal direction; and
6. clips a constant-width, antialiased strip to the current viewport.

Independently normalized homogeneous core/direction image vectors also classify the two oriented
sides without uploading an unbounded NDC core. This keeps below-horizon visibility and opacity
controls correct when the geocentric core is far outside the viewport.

The strip is a restrained pale steel-blue and draws over the core marker, so the scientific anchor
cannot visually cover the axle. Above/below-horizon emphasis changes opacity on that same strip; it
does not create, offset, or rotate a second line. The default subdued section remains readable.

The spindle material alone uses `depthTest = false` and `depthWrite = false`. It remains visible
through the explanatory Earth/core treatment without disabling depth globally, adding an Earth
occluder, or writing non-linear compositor depth. No coincident duplicate centerline is rendered.

## Coordinate frame and yaw policy

The spindle and celestial-equator groups are children of one identity-only
`geocentric-celestial-structure-frame`, itself below `geographic-reference-frame`. Calibration yaw
exists only on the geographic parent and is applied once to the whole assembly. The local horizon
is a separate observer-centered sibling. The spindle is not camera-parented, head-locked,
billboard-oriented, or recomputed from apparent celestial-body directions. Camera motion changes
only its per-eye projection.

An exact east/west view can place the infinite line on the boundary of the active perspective
chart; the renderer suppresses that legitimate projection-at-infinity degeneracy instead of
inventing a curve. Nearby oblique views recover the same straight line.

## Bounds and lifecycle

- The CPU-only diagnostic display extent remains `10^13 m` and preserves the accepted convergence
  bound below `0.14 arcseconds`; it is not a physical pole distance.
- The GPU receives a camera-relative core within the existing `7,000,000 m` component budget,
  unit directions, a display-extent-scaled homogeneous core, and normalized image-line values.
- No raw `10^13 m` coordinate enters an attribute, object transform, uniform, or shader.
- One persistent spindle geometry/material is reused by model updates, observer changes,
  recalibration, visibility toggles, reset, and XR exit/re-entry.
- `clear()` hides readiness without allocation or disposal.
- `dispose()` releases every owned geometry, material, and label texture once and is idempotent.

Developer diagnostics remain in axis-group `userData` rather than the normal interface. They
include line contract/topology, coordinate-frame and parent identity, one-yaw policy, local/view
directions, north/south dot product, core-to-line distance, projected visibility/degeneracy, and
bounded uploaded-component magnitude.

## Mathematical and desktop validation

Permanent tests cover:

- strict local and camera-view core/endpoint collinearity;
- exact antipodes, dot product, cross product, and core-to-line distance;
- projected incidence of south, core, and north for north, south, east, west, above, below, and
  Michigan-like oblique camera cases;
- true-north yaw, recalibration matrices, translated/rotated rigid parents, reset, and re-entry;
- marker/spindle agreement from one descriptor;
- one spindle object/material, repeated toggles, resource reuse, and idempotent disposal; and
- bounded GPU inputs plus linear non-testing/non-writing depth.

Vite development and production preview both loaded in Chrome without blocking console output.
Desktop orbit and `0 degrees -> 90 degrees` recalibration retained one constant-width straight
strip; reset cleared scientific readiness; re-entry restored one spindle; three off/on cycles did
not duplicate it; and the horizon, equator, body, Sun-path, and hour-notch controls remained
operable. After the independent gate's offscreen-core finding was corrected, the rebuilt
production shader loaded with a clean console and disabling the below-horizon continuation removed
only that oriented half while preserving the straight northern half. Desktop evidence is not
physical Quest acceptance.

## Focused Quest checklist

Physical acceptance remains **NOT RUN** for this correction.

1. Open the deployed app in Quest passthrough.
2. Calibrate true north.
3. Face north and inspect the axis.
4. Face south and inspect the opposite continuation.
5. Turn east and west to see the line obliquely.
6. Confirm the north pole, core, and south pole appear collinear.
7. Confirm the core does not look like a hinge.
8. Confirm the line resembles the axle of a spinning top.
9. Confirm the lower/southern section remains visible through the transparent Earth model.
10. Move the head laterally and vertically.
11. Confirm parallax does not reveal a bow.
12. Toggle the axis off and on.
13. Recalibrate.
14. Exit and re-enter.
15. Confirm the same core/equator/spindle relationship returns.
16. Confirm no duplicates or stale geometry remain.
17. Confirm the horizon, poles, equator, bodies, Sun path, and hour notches remain correct.

Record each result as `PASS`, `FAIL`, `UNCERTAIN`, or `NOT RUN`; do not infer physical acceptance
from automated or desktop evidence.

## Deferred styling options

A future physical review may tune one-strip width, pale steel color, or the below-Earth opacity
curve. Such tuning must preserve the one-line descriptor, constant centerline, shared material,
core incidence, layer-local depth policy, and subdued priority relative to the Sun path and bodies.
No glow hinge, arrowhead, separate north/south color, wobble, curvature, or duplicate line is
permitted.
