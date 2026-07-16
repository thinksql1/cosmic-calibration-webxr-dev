# Scientific Snapshot Contract

## Inputs

A `ScientificSnapshotService` consumes one explicit immutable input set:

```text
validated observer + UTC clock snapshot + current geographic calibration
+ validated Tier 1 configuration + versioned provider registry
```

The snapshot key contains observer/time/calibration/configuration revisions and values, exact UTC instant, paused/mode state, P03/body/refraction choices, and both provider versions. This prevents an old observer, room yaw, model, correction profile, or instant from looking current.

## Ready output

The immutable ready result contains:

- validated observer, clock, geographic-calibration summary, configuration, and all revisions;
- canonical scientific horizontal contract `east,north,up`, and the separate application basis identifier `east -> +X`, `up -> +Y`, `north -> -Z`;
- a validated IAU P03 precession-only mean axis: north/south poles in GCRS, P03 matrix/equator frame metadata, correction profile, TT provenance, and date domain;
- a deterministic unit, orthogonal, right-handed equator-plane pair whose cross product is the same north mean-pole normal;
- exact provider versions, cache identity, creation sequence, and Tier 1 warnings.

North and south are exact negations. The equator basis prepares a future great-circle layer only; it does not contain vertices, a rendering radius, Three.js objects, labels, or a visual equator. Sun/Moon diagnostics remain outside this initial snapshot to avoid disguising validation calls as visible features or paying for unrequested body calculations.

## Failure output

The alternate result is `not-ready` with structured `OBSERVER_MISSING`, `CALIBRATION_MISSING`, `INVALID_INPUT`, `UNSUPPORTED_CONFIGURATION`, `MODEL_DOMAIN`, `PROVIDER_FAILURE`, `NON_FINITE_RESULT`, or `INVARIANT_FAILURE` issues. It has no partial axis result. Warnings remain separate from errors.

## Frame boundary

The P03 pole is expressed in GCRS while its bias-precession matrix declares a GCRS-to-P03 mean-equator-of-date transform. The application basis is only a named future display conversion; it is not performed here. The calibrated geographic yaw enters once, later, at the presentation parent. No snapshot calculation imports Three.js or relies on a visible scene matrix.
