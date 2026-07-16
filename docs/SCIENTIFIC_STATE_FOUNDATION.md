# Scientific State Foundation

## Status

Milestone 2A implementation on `feature/milestone-2a-scientific-foundation`. This is a non-visual, in-memory foundation. It does not create celestial geometry, UI, timers, network requests, persistence, or XR/controller behavior.

## Explicit state

- `ObserverStateStore` owns a validated WGS84 geodetic observer, east-positive longitude, elevation datum/source/uncertainty, ready status, and a monotonic revision. It has no geolocation capability.
- `SimulationClock` owns one immutable UTC instant, `frozen` or explicit-tick `realtime` mode, paused state, signed finite rate, and a **value-based** revision. Setting an identical frozen selection, rate, or mode is a no-op; an explicit tick changes revision only when it changes the instant. No consumer reads a browser clock; an integrator must supply elapsed milliseconds to `tick`.
- `GeographicCalibrationStateAdapter` exposes only a serializable read-only view of the existing Milestone 1 calibration: ready yaw, accepted-capture revision, optional origin identity, and `user-calibrated-true-north` provenance. Every accepted physical calibration capture receives a new monotonic identity even when yaw and origin are equal; reset/recalibration/reference-space invalidation changes the scientific revision. Failed or cancelled attempts preserve the prior accepted identity. It neither owns nor restores a controller/XR session.
- `ScientificConfigurationStore` accepts only the validated Tier 1 IAU P03 configuration. Airless and normal-refraction body profiles are distinct; unsupported Tier 2/3 claims are not exposed as working options. Enabled providers are validated, duplicate-free, canonically ordered cloned arrays.

Each public state/configuration/snapshot/cache value is recursively isolated and immutable: nested arrays, warnings, basis vectors, provenance, and metadata are cloned before freezing. Changes use semantic value equality except for accepted physical calibration events, whose event identity intentionally invalidates scientific state even for equal yaw.

## Serialization and readiness

Observer state, selected clock state, and configuration serialize with version `1`; restore uses the same runtime validators as construction and rejects malformed payloads, unsupported modes/profiles/models/providers, duplicate providers, invalid rates, and unknown schema versions. Raw provider instances, Three.js/XR/controller objects, caches, and geographic calibration are not persistent truth. A restored calibration cannot be trusted after reload, session exit, recenter, boundary reset, room change, or tracking-origin change.

Snapshots are not ready if an observer or current calibration is missing, a configuration is unsupported, an instant is invalid, a provider identity/version is incompatible, a provider fails, the P03 date domain is exceeded, or a finite/antipodal/basis invariant fails. Fatal structured errors are distinct from Tier 1 warnings: UTC approximately UT1, no live EOP, mean-axis nutation exclusion, no polar motion, the Astronomy Engine mean-sea-level versus reference ellipsoid-height distinction used by some external references, and no claim beyond Tier 1.

## Ownership and presentation boundary

`ScientificSnapshotService.capture` receives explicit state and a typed provider registry. It is the future non-visual state-to-snapshot entry point; it does not query the DOM, browser time, calibration controller, or renderer. Astronomy Engine remains contained by the 2A0 adapter. Scientific vectors remain in their named frames. The scientific layer records calibration yaw but does not rotate a celestial vector by it: presentation alone later applies it through the existing calibrated geographic parent.
