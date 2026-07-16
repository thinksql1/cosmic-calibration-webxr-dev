# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Run the Milestone 1 physical north-calibration acceptance test

## Why this is next

Milestone 1 north-marker calibration passes automated validation and desktop simulation on `feature/milestone-1-north-calibration`. Physical Quest behavior—controller detection, optional DOM overlay, target-ray capture, marker alignment, and tracking-origin changes—cannot be established without a deployed HTTPS build and a Quest 3.

## Recommended execution

**Model:** GPT-5.6 Sol

**Reasoning effort:** High

**Mode:** Guided physical-device validation

**Thread:** Main control thread

## Objective

After separate authorization to publish the exact feature commit, execute the Milestone 1 checklist in `docs/QUEST_TESTING.md` against a deliberately established true-north marker and record PASS, FAIL, UNCERTAIN, or NOT RUN evidence without changing application code during the test.

## Required work

1. Obtain explicit authorization before merge, push, or deployment; record the deployed URL and exact commit.
2. Establish a safe standing/room-scale boundary, correct Quest floor, standing origin marker, and externally determined true-north marker.
3. Verify available tracked controllers, calibration-only ray visibility, and readable in-headset controls.
4. Verify nearly vertical target-ray rejection and successful level-controller trigger capture with either hand where available.
5. Compare N against the physical marker; verify S opposite, E/W perpendicular, room/floor geometry unchanged, and world locking stable.
6. Verify duplicate capture suppression, recalibration replacement, cancel restoration, and reset to uncalibrated.
7. Record exit/re-entry and recenter invalidation behavior; require deliberate recalibration.
8. Record Quest model, OS, Browser, room setup, controller handedness, approximate alignment error, comfort, and privacy-safe evidence.
9. Reconcile project state only from observed physical results.

## Acceptance rules

- **PASS:** All critical calibration, alignment, stability, lifecycle, and recovery criteria pass with physical evidence.
- **FAIL:** A repeatable implementation defect prevents trustworthy physical-north alignment or recovery.
- **UNCERTAIN:** Setup, marker accuracy, browser behavior, or evidence is insufficient to distinguish application behavior.

## Prohibited scope

- Do not infer physical PASS from automated or desktop simulation results.
- Do not implement fixes during acceptance testing; record findings and create one bounded remediation task if needed.
- Do not add astronomy, geolocation, compass, magnetic correction, persistence, spatial anchors, or other deferred features.

## Stop conditions

- Publication authorization, exact commit, safe physical setup, or trusted true-north marker is unavailable.
- The test would require destructive Git operations or scope expansion.

## Expected return format

```text
Objective:
Status: Complete | Partial | Blocked

Quest evidence:
- Controllers:
- Ray visibility:
- Invalid-direction rejection:
- North-marker alignment:
- Cardinal geometry:
- Recalibration/cancel/reset:
- Exit/re-entry/recenter:
- Stability/comfort:

Milestone 1 result: PASS | CONDITIONAL PASS | FAIL

Exact next task:
- <one bounded task>
```
