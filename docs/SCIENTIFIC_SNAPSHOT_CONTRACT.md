# Scientific Snapshot Contract

## Inputs

A `ScientificSnapshotService` consumes one explicit immutable input set:

```text
validated observer + UTC clock snapshot + current geographic calibration
+ validated Tier 1 configuration + versioned provider registry
```

The snapshot key contains observer/time/calibration/configuration revisions and values, exact UTC instant, instant source, clock version/mode/rate/paused state, explicit accepted-calibration revision, yaw/origin/readiness, canonical enabled-provider set, P03/body/refraction choices, and each registered provider name/version. An accepted calibration event changes its identity even when it produces equal yaw. Provenance that can differ in a returned snapshot therefore cannot share a key.

## Ready output

The immutable ready result contains:

- validated observer, clock, geographic-calibration summary, configuration, and all revisions;
- canonical scientific horizontal contract `east,north,up`, and the separate application basis identifier `east -> +X`, `up -> +Y`, `north -> -Z`;
- a validated IAU P03 precession-only mean axis: north/south poles in GCRS, P03 matrix/equator frame metadata, correction profile, TT provenance, and date domain;
- one axis-specific observer-horizontal result that proves the GCRS pole/matrix pair becomes the
  P03 mean-date `+Z` axis and maps that Earth-fixed mean axis through the WGS84 geodetic basis to
  exact antipodal `HORIZONTAL_ENU` pole directions;
- one WGS84 geocentric placement result containing the modeled Earth center in local ENU meters,
  the surface observer at local origin, observer-to-core and observer-to-axis distances, exact
  antipodal pole directions, and the declared mean-sea-level/ellipsoid-height Tier 1 treatment;
- a deterministic unit, orthogonal, right-handed equator-plane pair whose cross product is the same north mean-pole normal; the basis owns a separately frozen normalized copy and never aliases its caller's pole object;
- a validated immutable `observerHorizontalEquator` plane: its normal is the existing
  observer-horizontal mean axis, while its deterministic right-handed ENU sampling pair carries
  the `LOCAL_CANONICAL_UNLABELED` phase. The source GCRS P03 basis/model/provider provenance is
  retained and validated; the local phase parameterizes only the unlabeled full great-circle
  locus, not individual celestial coordinates;
- exact provider names/versions (the P03 registry, model provenance, and cache key all use `Cosmic Calibration P03 mean-pole provider@1.0.0`), cache identity, creation sequence, and Tier 1 warnings.

North and south are exact negations. Neither equator form contains vertices, a rendering radius,
Three.js objects, or labels; Milestone 2C presentation consumes the immutable plane to render an
unlabeled projective great-circle locus. Sun/Moon diagnostics remain outside this snapshot to
avoid disguising validation calls as visible features or paying for unrequested body calculations.

## Failure output

The alternate result is `not-ready` with structured `OBSERVER_MISSING`, `CALIBRATION_MISSING`, `INVALID_INPUT`, `UNSUPPORTED_CONFIGURATION`, `MODEL_DOMAIN`, `PROVIDER_FAILURE`, `NON_FINITE_RESULT`, or `INVARIANT_FAILURE` issues. Complete observer, clock, configuration/profile/refraction, and provider-registry validation occurs before a provider call. Clock validation covers version, mode, paused-state consistency, finite signed rate, safe non-negative revision, canonical UTC/source/milliseconds, and required fields. Invalid pre-build state invokes no provider and creates no cache entry or partial axis result.

The height-datum warning is conditional rather than a generic P03 warning. A ready snapshot currently prepares the validated Astronomy Engine observer-relative body profile even though it performs no body calculation, so a validated mean-sea-level observer receives the warning with frozen datum/provenance metadata. Missing, malformed, or WGS84-ellipsoid observers do not; the latter remains valid P03 observer state but is not consumable by the current body adapter without a reviewed conversion. The warning is non-fatal and states only that differing MSL/ellipsoid conventions may contribute to small topocentric differences.

## Frame boundary

The P03 pole is expressed in GCRS while its bias-precession matrix declares a GCRS-to-P03
mean-equator-of-date transform. Milestone 2B extends the immutable snapshot with the explicit
axis-only pipeline
`GCRS -> P03 mean-date +Z -> WGS84 Earth-fixed mean axis -> HORIZONTAL_ENU`. Earth rotation
cannot change that axis because it is a rotation about the same `+Z`; this invariant is not a
general celestial-to-horizontal shortcut for equator samples, stars, or bodies. The application
basis conversion remains outside science and the calibrated geographic yaw enters once at the
presentation parent. No snapshot calculation imports Three.js or relies on a visible scene
matrix. Provider output and state inputs are cloned into recursively frozen snapshot values, so a
caller cannot mutate cache content through nested provenance, warnings, or vectors.

For the complete unlabeled equator only, the local plane normal is sufficient: any in-plane
rotation changes sampling phase but not the great-circle locus. This must not be used to assign
right ascension, equinox, star, or body directions in local ENU; those require their own reviewed
celestial-to-horizontal transform.

The additional placement contract is
`WGS84 surface observer -> Earth-fixed observer position -> modeled Earth-center displacement ->
HORIZONTAL_ENU meters`. Presentation maps that position with the same `(east, up, -north)` basis
and does not recompute geodesy.
