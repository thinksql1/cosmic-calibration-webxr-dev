# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Re-run the independent Milestone 0 integration gate.

## Why this is next

The first independent gate found an owned-session cleanup defect, incomplete lifecycle coverage, and an insufficient Pages permission boundary. The feature branch now contains a focused remediation that must be independently reviewed and reproduced before any local merge decision or Quest work.

## Recommended execution

**Model:** GPT-5.6 Sol

**Reasoning effort:** Max

**Mode:** Independent validation

**Thread:** Main control thread

## Objective

Independently inspect the remediation commit against `420b7f9`, reproduce the local type-check, test, build, and desktop evidence, review the WebXR lifecycle races and Pages workflow permissions, and decide whether the Milestone 0 feature may be integrated locally. Do not implement fixes during the gate.

## Required work

1. Confirm the feature branch, baseline ancestry, clean working tree, and absence of a remote.
2. Inspect the complete remediation diff, especially session ownership, end-event handling, cleanup, retries, lifecycle tests, documentation, and the Pages workflow job permissions.
3. Reproduce `npm ci`, type-check, tests, build, diff validation, and desktop development/production-preview inspection.
4. Confirm no dependency, deferred feature, remote, deployment, or Quest-testing change was introduced.
5. Classify the gate as PASS, CONDITIONAL PASS, or FAIL. Only a passing gate may authorize the separate local integration procedure.

## Prohibited scope

- No implementation changes, merge, rebase, squash, push, remote configuration, Pages enablement, deployment, or Quest testing.
- No north calibration, controller raycasting, geolocation, Astronomy Engine, celestial geometry, persistence, or time controls.
- Do not infer passthrough, floor registration, stability, drift, re-entry, or recenter behavior from desktop evidence.

## Acceptance criteria

1. The acquired session is owned and subscribed before renderer binding.
2. Binding failure performs and awaits cleanup before retry is enabled.
3. End-during-binding cannot report a false active state.
4. Focused tests cover pending, active, cleanup, retry, and end-race behavior.
5. The Pages configuration uses explicit minimum Pages/OIDC permissions in the authorized deploy job.
6. Documentation accurately distinguishes local, hosted, and physical-device evidence.
7. Quest validation remains **NOT RUN**.

## Stop conditions

- A material lifecycle, workflow, dependency, documentation, or scope defect remains.
- A required check fails or cannot be reproduced.
- Integration would require an unauthorized external action.

## Expected return format

```text
Objective:
Result: PASS | CONDITIONAL PASS | FAIL

Findings:
- <ordered findings>

Validation:
- PASS:
- FAIL:
- NOT RUN:

Integration:
- Performed: YES | NO

Exact next task:
- <one bounded task>
```
