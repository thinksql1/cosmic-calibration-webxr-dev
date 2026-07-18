# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Implement the celestial equator from the validated P03 pole and equator basis

## Recommended execution

- **Codex model:** GPT-5.6 Terra
- **Reasoning effort:** High
- **Branch:** `feature/milestone-2c-celestial-equator`
- **Why:** this is an accepted, bounded presentation feature that must preserve the validated
  geocentric axis and frame boundaries while adding independently testable geometry.

## Scope

- Consume the existing immutable scientific snapshot and its validated P03 mean-pole/equator
  basis; do not recompute P03 or scientific frame transforms in presentation code.
- Render only the mean celestial-equator great circle, coherent with the existing geocentric
  Earth-core axis and its current calibrated geographic parent.
- Add bounded equator visibility and below-horizon presentation controls while keeping the visual
  layer calm and low-noise.
- Add deterministic orthogonality, closure, antipodal-sample, horizon-relationship, readiness,
  calibration-invalidation, and presentation-boundary tests.
- Require desktop validation and prepare—without performing—the subsequent physical Quest check.

## Invariants

- Every equator sample remains perpendicular to the exact same P03 mean axis used by NCP/SCP.
- The circle is closed; opposing samples are exact negatives within the declared numeric tolerance.
- Geographic calibration yaw is applied once by the existing presentation hierarchy.
- The geocentric Earth-core/pole renderer remains unchanged; scientific snapshots stay immutable.

## Explicit exclusions

Do not implement precession trajectories, ecliptic, Sun, Moon, planets, temporal clocks, media,
game integration, AI enhancement, relational circuits, or contemplative sequencing. Do not add
dependencies, change geolocation/time controls, or change the Earth-core/pole renderer.

## Validation and stop conditions

Run type-check, the full test suite, production build, dependency/diff checks, and bounded desktop
development/preview verification. Stop for a frame ambiguity, double-yaw risk, snapshot-boundary
gap, scientific/presentation coupling, needed dependency, or a requirement to modify the accepted
Earth-core/pole renderer.
