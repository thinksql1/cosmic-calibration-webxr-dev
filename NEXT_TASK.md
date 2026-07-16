# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Implement the coherent Earth axis and celestial poles

## Recommended execution

- **Codex model:** GPT-5.6 Terra
- **Reasoning effort:** High
- **Why:** this is a bounded visible scientific layer that must preserve proven frame, model, and Quest safety contracts; use a separate GPT-5.6 Sol Max integration gate before promotion.
- **Branch:** `feature/milestone-2b-earth-axis-poles`
- **Starting point:** independently review and integrate the retained Milestone 2A0/2A feature history without rewriting it; do not push without separate authorization.

## Objective

Consume the validated immutable scientific snapshot to render only one coherent, minimal Earth-axis line and its antipodal north/south celestial-pole endpoints under the existing calibrated geographic presentation parent.

## Authorized scope

- Add a presentation-only axis/pole layer driven by `ScientificSnapshotService` output.
- Use the exact P03 precession-only mean axis, declared GCRS/P03 provenance, and existing ENU/application mapping.
- Preserve local-floor/room diagnostics, desktop fallback, calibration invalidation, and in-memory state rules.
- Add deterministic scientific/presentation boundary tests and a bounded desktop validation plan.

## Explicit exclusions

- No celestial-equator geometry, precession path, Sun, Moon, planets, ecliptic, temporal clocks, media integration, geolocation, time/location controls, persistence, controller behavior changes, or contemplative sequencing.
- No model promotion to true/CIP pole, nutation, polar motion, EOP, or a new dependency.
- No merge, push, deployment, or physical Quest test without separate authorization.

## Acceptance criteria

1. North and south endpoints derive only from one snapshot axis and remain exact antipodes.
2. The axis is presentation-only and is parented once beneath the calibrated geographic group; it never rotates XR tracking, camera, local-floor, controller, or room diagnostics.
3. Missing/stale observer or calibration produces no misleading scientific geometry.
4. Frame/model/provenance and Tier 1 limitations remain visible to tests and documentation.
5. Existing and new tests, type-check, build, diff, and dependency checks pass.
6. No excluded layer or user-facing time/location control is added.

## Validation

Run `npm ci`, `npm run typecheck`, `npm run test`, `npm run build`, `git diff --check`, and `npm ls --depth=0`. Perform desktop and physical Quest checks only after a visible layer is implemented and separately authorized; do not infer physical correctness from source inspection.

## Stop conditions

Stop for review if a source frame cannot be mapped without a hidden calibration rotation, a visible layer would require unsupported precision or a dependency, an axis/pole condition cannot be made explicit, or scope expands into equator/precession/body/time systems.
