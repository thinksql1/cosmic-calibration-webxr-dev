# First Constellation Line Layer

## Status

**Status: deployed development-only query-gated study; automated and desktop validation complete; physical Quest validation pending.**

Feature `3d6af53` was normally merged as `92ccdb0` and deployed by successful development
Actions/Pages run `29974413436`. The deployment is test evidence, not physical Quest acceptance.

The layer adds conventional stick figures for Orion, Ursa Major, Cassiopeia, Cygnus, Taurus,
Leo, and Scorpius. It does not add constellation labels, IAU boundaries, a star field, or all 88
constellations. The ordinary development URL remains unchanged unless
`constellationStudy=first-set` is present.

The real-sky equatorial orientation bridge was physically accepted on Quest as this layer's
coordinate foundation: the grid remained complete, pole convergence was credible, no mirror or
inversion was apparent, planets were naturally situated, stereo/world locking were sound, and no
blocking callback or incomplete-frame error occurred. That acceptance does not by itself accept
this new line layer.

## Data and license

Star coordinates are a versioned 43-star subset of the NASA HEASARC Bright Star Catalog,
preliminary fifth revised edition (`BSC5P`). The selected `ra`, `dec`, and `vmag` fields are public
United States government data. HEASARC defines these coordinates at equinox J2000.0.

- Catalog description: <https://heasarc.gsfc.nasa.gov/W3Browse/star-catalog/bsc5p.html>
- Federal dataset record: <https://catalog.data.gov/dataset/bright-star-catalog>
- Government-work copyright policy: <https://www.usa.gov/government-copyright>
- Catalog reference: Hoffleit and Warren (1991), *Bright Star Catalogue, 5th Revised Edition*
  (preliminary BSC5P)

The IAU standardizes constellation names, abbreviations, and boundaries, not one universal set of
stick-figure connections. Segment connectivity in this first set is therefore an original small
project selection of endpoint pairs in the familiar modern Western line-figure tradition. It is
stored as `PROJECT_AUTHORED_CONVENTIONAL_WESTERN_FIRST_SET_V1`; it is not copied from an external
connectivity blob and is not described as an IAU figure.

Every star record includes BSC/HR identifier, display name, constellation identifier, RA hours,
declination degrees, `EQJ_J2000`, `J2000.0`, visual magnitude, and row provenance. Proper motion is
intentionally omitted. For this recognizable first visual layer, fixed J2000 positions are
adequate; the app makes no current-epoch sub-arcsecond or astrometric-star-position claim.

## Included figures

| ID | Name | Stars | Segments | Figure tradition |
|---|---|---:|---:|---|
| `ORI` | Orion | 7 | 8 | project-authored conventional Western first set v1 |
| `UMA` | Ursa Major (Big Dipper emphasis) | 7 | 7 | same |
| `CAS` | Cassiopeia | 5 | 4 | same |
| `CYG` | Cygnus | 5 | 4 | same |
| `TAU` | Taurus | 5 | 4 | same |
| `LEO` | Leo | 7 | 7 | same |
| `SCO` | Scorpius | 7 | 6 | same |

Totals: 43 catalog stars and 40 open segment objects.

## Coordinate ownership

Catalog data never stores azimuth, altitude, calibrated room coordinates, or mutable world
positions. The path is:

```text
BSC5P RA hours / declination degrees, EQJ J2000
  -> normalized canonical EQJ direction
  -> immutable sampled minor-great-circle segment in EQJ
  -> accepted Astronomy Engine EQJ-to-HOR orientation
  -> verified HOR-to-application (east, up, -north) mapping
  -> geographic-reference-frame calibration yaw exactly once
  -> native left/right XR model-view and projection
```

The layer consumes `RealSkyEquatorialOrientation.eqjToApplicationRows`. It does not calculate
sidereal time, longitude, latitude, precession, nutation, or calibration yaw independently. A
diagnostic `constellationFrame=canonical` mode can expose unrotated EQJ geometry for inspection;
normal first-set rendering always uses the accepted real-sky bridge.

## Great-circle sampling

Each endpoint pair is converted to unit vectors `a` and `b`. The geometry uses stable spherical
linear interpolation along the unique minor arc. The interval count is deterministic:

```text
intervals = ceil(angularSeparation / 1.5 degrees)
```

with at least one and at most 120 intervals. Nearly identical endpoints fail locally. Nearly
antipodal endpoints are rejected because they do not define one numerically stable minor arc.
Every segment is open, has exact catalog endpoints, preserves one plane through the sphere center,
and is sampled once. Head motion, time, observer changes, and eye order never resample it.

## XR rendering contract

The renderer follows the validated celestial-grid homogeneous contract rather than the existing
Sun-path implementation. Canonical unit directions are uploaded as bounded Float32 components.
At update time, one shared shader matrix rotates EQJ directions and one shared homogeneous core
anchor places them on the existing finite celestial presentation sphere:

```text
encoded = earthCore / gridRadius + eqjToApplication * canonicalDirection
w = 1 / gridRadius
```

Native Three.js model-view/projection matrices then project the same immutable buffers for each
eye. Lines are not camera-parented, not screen-space, and not regenerated per eye or per clock
tick. Materials are transparent, non-writing, depth-test disabled, restrained lavender, and
ordered just above the celestial grid. Invalid camera or matrix state suppresses only the affected
draw, and its callback is exception-contained.

The Sun path was reported as visually wobbly during Quest testing. It remains unchanged and is a
separate deferred issue. The constellation layer deliberately uses immutable great-circle samples
and the grid shader ownership model; `isolate=constellation-sun-path-comparison` exists only to
compare the two paths without modifying either.

## Controls and query contract

- Normal URL: no controls and no visible constellation geometry.
- `?constellationStudy=first-set`: shows controls; master defaults OFF; all seven individual
  selections default enabled.
- `&showConstellations=1`: explicitly enables the master.
- `&constellations=ORI,CYG`: selects a subset.
- `&constellationEndpoints=1`: shows diagnostic endpoint points.
- `&constellationFrame=canonical`: diagnostic unrotated EQJ geometry.

The master OFF state submits zero constellation lines. Individual toggles affect only their own
figure. Repeated toggles reuse objects, buffers, and materials and do not change clock, observer,
calibration, planet labels, or celestial geometry.

## Diagnostics and isolation

Diagnostics report dataset source/license/version/frame/epoch, proper-motion policy, counts,
vertex count, angular step, enabled IDs, active/submitted/suppressed objects, orientation updates,
geometry build count, per-eye mutation state, and build SHA. The isolated Orion belt segment also
reports endpoints, angular separation, expected samples, maximum adjacent spacing, and minor-arc
status.

Exact isolation modes cover every included constellation, all figures, Orion plus grid, all plus
real-sky grid, horizon/compass, planets, endpoints, one sampled segment, canonical EQJ, transformed
real sky, and the read-only Sun-path comparison.

## Physical acceptance gate

Use a fresh private Quest Browser session, confirm the cache-busted build SHA, retain Swartz Creek
defaults and Medium planet labels, calibrate north once, then inspect each figure alone and the
full set. Confirm recognizability, smoothness, fixed shapes across time, world locking, independent
eye coherence, stable endpoints, separation from the grid, and absence of callback/incomplete-frame
errors. If any segment ripples, snakes, deforms, mirrors, or separates between eyes, do not expand
the catalog. Constellation labels remain separately deferred.
