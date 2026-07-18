# Mean Celestial Equator

## Status

Milestone 2C's independent scientific/rendering gate and normal integration pass. Merge `0926cbf`
retains `feature/milestone-2c-celestial-equator`; publication and physical Quest validation remain
pending. Existing physical impressions that the axis appeared curved and that the Earth-core
distance was not perceptually obvious remain separate Milestone 2B concerns, not resolved 2C claims.

## Scientific definition

The layer is the **IAU P03 precession-only mean celestial equator of date**: the great-circle locus perpendicular to the validated mean rotational-axis normal used by NCP/SCP. It consumes the immutable snapshot's validated GCRS P03 basis, provider provenance, observer-horizontal mean-axis normal, frozen right-handed local ENU sampling basis, and WGS84 Earth-core displacement.

A full unlabelled circle has no preferred phase: rotating U/V within their shared plane changes sampling order but not the locus. Science validates the GCRS P03 basis and creates an explicitly unlabelled deterministic local parameterization; presentation does not recompute P03, sidereal time, or a celestial frame. Conceptually the projective locus is `EarthCore + R × (cos(theta) × U + sin(theta) × V)` as `R` tends to infinity. EarthCore is the modeled WGS84 center, not the observer, and `R` is neither a rendered nor physical celestial distance.

## Rendering contract

The renderer uses 96 directions over `[0, 2π)` and a `LineLoop`, closing from the final sample to sample zero without a duplicated seam vertex. Every sample is a bounded unit direction transformed for the active eye. The shader projects `vec4(directionView, 0.0)`: homogeneous `w = 0` is the projective limit of the Earth-core-centred construction and never uploads astronomical distances.

The finite Earth core remains camera-relative binary64 CPU data. Equator directions are translation-invariant, rotate once with the calibrated geographic parent, and rotate once into the active eye view. The core and axis retain the circle's geocentric center and normal; no nearby observer-centred hoop is created.

## Perspective, depth, and lifecycle

- At latitude `0°`, the equator contains local zenith and nadir. At either geographic pole it is the local geometric horizon plane. At mid-latitudes it is tilted relative to the horizon.
- The layer retains `LINEAR_XR_DEPTH_WITH_NON_WRITING_CELESTIAL_OVERLAY`: no logarithmic depth, `depthTest = false`, `depthWrite = false`, render order 21, and no second XR layer. The overlay does not claim real-world occlusion.
- The sole 2C control is **Celestial equator**, default off. It changes presentation only.
- The group owns one geometry and shader material. `clear()` preserves reusable resources; idempotent `dispose()` releases only resources owned by this group.

## Limits and pending validation

Deterministic tests cover plane invariants, closure, antipodes, observer relationships, Float32 directions, calibration, depth, and disposal. Independent probes and both feature/merged validation pass the 299-test suite, production build, development/production-preview controls, readiness, visibility, reset, recalibration, shader compilation, teardown, and console checks. Publication and physical Quest testing of readability, world locking, below-horizon interpretation, stereo, apparent curvature, depth impression, and comfort remain pending.

## Exclusions

No true/nutated equator, precession, ecliptic, Sun, Moon, planets, stars, temporal clocks, geolocation, media, game integration, AI enhancement, relational circuits, or contemplative sequencing is included.
