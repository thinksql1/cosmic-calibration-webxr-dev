# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Repeat Quest floor-alignment validation with standing calibration

## Why this is next

Initial physical Quest testing passed immersive AR entry, passthrough, spatial stability, and exit/re-entry/recenter. The reference geometry appeared at approximately chair/seated height instead of the physical floor. The test was performed seated, and a seated or chair-height Quest environment calibration is a plausible but unconfirmed cause. No application defect is established until a controlled standing-floor retest is complete.

## Recommended execution

**Model:** GPT-5.6 Sol

**Reasoning effort:** High

**Mode:** Guided physical-device validation

**Thread:** Main control thread

## Objective

Repeat only the floor-height portion of the Quest acceptance test at `https://thinksql1.github.io/cosmic-calibration-webxr/` after deliberately establishing a standing or room-scale Quest floor calibration. Record observed evidence only; do not modify application code, deploy, or begin Milestone 1.

## Required work

1. Configure a safe standing or room-scale Quest boundary.
2. Establish the Quest floor height using a controller placed at the physical floor.
3. Stand upright when entering the session.
4. Reload the deployed site and enter AR.
5. Observe whether the origin marker and horizon ring appear near the physical floor.
6. Confirm whether the horizon ring is horizontal.
7. Confirm whether the zenith/nadir line is vertical.
8. Confirm that world locking remains stable while moving the head slowly.
9. Exit, re-enter, and recenter once.
10. Record PASS, FAIL, or UNCERTAIN and the approximate height error.

## Acceptance rules

- **PASS:** The origin and ring are reasonably near the physical floor, the ring is horizontal, the scene is stable, and the result is usable.
- **FAIL:** After the Quest floor was deliberately reset, the ring remains clearly at chair height or another incorrect elevation.
- **UNCERTAIN:** The floor setup or observed elevation cannot be confidently established.
- Do not infer PASS from source code.

## Prohibited scope

- Do not modify application code, dependencies, repository configuration, remote, Pages workflow, or deployment.
- Do not begin north calibration, controller raycasting, geolocation, Astronomy Engine, celestial geometry, persistence, or time controls.
- Do not claim a code defect or application fix before the controlled retest establishes evidence.

## Stop conditions

- A safe standing/room-scale boundary or confident physical-floor calibration cannot be established.
- The published HTTPS site or Quest AR session is unavailable.
- The retest would require code changes or expand beyond floor-alignment evidence.

## Expected return format

```text
Objective:
Status: Complete | Partial | Blocked

Standing calibration evidence:
- Floor setup:
- Origin/ring height error:
- Ring horizontality:
- Zenith/nadir verticality:
- World locking:
- Exit/re-entry/recenter:

Result: PASS | FAIL | UNCERTAIN

Exact next task:
- <one bounded task>
```
