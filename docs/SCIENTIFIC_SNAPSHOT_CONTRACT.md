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
- a deterministic unit, orthogonal, right-handed equator-plane pair whose cross product is the same north mean-pole normal; the basis owns a separately frozen normalized copy and never aliases its caller's pole object;
- exact provider names/versions (the P03 registry, model provenance, and cache key all use `Cosmic Calibration P03 mean-pole provider@1.0.0`), cache identity, creation sequence, and Tier 1 warnings.

North and south are exact negations. The equator basis prepares a future great-circle layer only; it does not contain vertices, a rendering radius, Three.js objects, labels, or a visual equator. Sun/Moon diagnostics remain outside this initial snapshot to avoid disguising validation calls as visible features or paying for unrequested body calculations.

## Failure output

The alternate result is `not-ready` with structured `OBSERVER_MISSING`, `CALIBRATION_MISSING`, `INVALID_INPUT`, `UNSUPPORTED_CONFIGURATION`, `MODEL_DOMAIN`, `PROVIDER_FAILURE`, `NON_FINITE_RESULT`, or `INVARIANT_FAILURE` issues. Complete observer, clock, configuration/profile/refraction, and provider-registry validation occurs before a provider call. Clock validation covers version, mode, paused-state consistency, finite signed rate, safe non-negative revision, canonical UTC/source/milliseconds, and required fields. Invalid pre-build state invokes no provider and creates no cache entry or partial axis result.

The height-datum warning is conditional rather than a generic P03 warning. A ready snapshot currently prepares the validated Astronomy Engine observer-relative body profile even though it performs no body calculation, so a validated mean-sea-level observer receives the warning with frozen datum/provenance metadata. Missing, malformed, or WGS84-ellipsoid observers do not; the latter remains valid P03 observer state but is not consumable by the current body adapter without a reviewed conversion. The warning is non-fatal and states only that differing MSL/ellipsoid conventions may contribute to small topocentric differences.

## Frame boundary

The P03 pole is expressed in GCRS while its bias-precession matrix declares a GCRS-to-P03 mean-equator-of-date transform. The application basis is only a named future display conversion; it is not performed here. The calibrated geographic yaw enters once, later, at the presentation parent. No snapshot calculation imports Three.js or relies on a visible scene matrix. Provider output and state inputs are cloned into recursively frozen snapshot values, so a caller cannot mutate cache content through nested provenance, warnings, or vectors.
