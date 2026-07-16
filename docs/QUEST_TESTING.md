# Quest 3 Manual Acceptance Checklists

Desktop success is not Quest success. Record each physical criterion as **PASS**, **FAIL**, **UNCERTAIN**, or **NOT RUN** with notes and evidence.

## Milestone 0 evidence

Milestone 0 physical Quest 3 acceptance is complete for the tested environment. Immersive AR entry, passthrough, reference geometry, controlled standing-floor alignment, horizon horizontality, zenith/nadir verticality, world locking, exit/re-entry, recenter, comfort, and usability passed. See `PROJECT_STATE.md` for the durable evidence summary.

This result does not establish Milestone 1 north calibration.

## Milestone 1 status

**Physical north-calibration acceptance: PASS for the reported Quest 3 flow.** The deployed
Milestone 1 controls were visible; immersive AR/passthrough, controller start/capture separation,
controller-based north capture, coherent cardinal geometry, world/floor stability,
cancel/recalibrate/reset, and session lifecycle were reported as passing with no blocking defect.
This is a usability result for the tested flow, not a laboratory-grade angular-accuracy result.

Exact Quest OS/browser versions, numerical north error, left/right controller coverage,
DOM-overlay availability, aiming-ray observations, and targeted tracking-loss or invalid-pose
rejection were not supplied and remain unmeasured rather than inferred.

## Prerequisites

- Meta Quest 3 with charged left and right controllers where available.
- Safe standing/room-scale boundary and deliberately established physical floor.
- Standing origin marker and externally established true-north marker.
- Published HTTPS URL and exact tested commit.
- Quest OS and Quest Browser versions.
- Notes and privacy-safe screenshots/video where practical.

## Milestone 1 procedure

1. Open the exact deployed commit and confirm Milestone 0 passthrough/floor behavior remains intact.
2. Confirm available left/right tracked controllers are detected; record if only one is available.
3. Verify aiming rays are hidden while north calibration is inactive.
4. With DOM overlay available, use **Calibrate North** and confirm rays appear only for usable
   connected controllers.
5. Activate **Cancel**, **Recalibrate**, and **Reset** from the overlay as their states permit;
   confirm none of those actions also captures the pointing direction.
6. Repeat with DOM overlay unavailable or disabled. Press and release trigger once and confirm it
   begins/arms calibration without capture; confirm a later press is required to capture.
7. Cancel without overlay using squeeze. Also verify the documented long-trigger fallback where
   squeeze is unavailable or can be tested safely.
8. Point a controller nearly vertical and press trigger; confirm capture is rejected with readable
   guidance and geographic geometry remains unsaved.
9. Briefly move the active controller out of tracking, attempt capture, and confirm the stale/default
   orientation is rejected with visible recovery guidance. Restore tracking and retry.
10. Hold either controller approximately level toward the true-north marker and press trigger once.
11. Confirm N aligns with the marker, S is opposite, E/W are perpendicular, and the
    horizon/zenith/nadir geometry remains unchanged.
12. Confirm the aiming ray hides after capture and duplicate trigger input does not alter the saved result.
13. Move the head and confirm world locking remains stable.
14. Recalibrate using the other controller where available; confirm a failed tracking attempt
    preserves the prior result and a later valid capture replaces it.
15. Cancel a recalibration and confirm the prior calibration returns.
16. Reset without overlay using a deliberate long trigger or squeeze and confirm geographic
    geometry hides. Confirm a stray short trigger cannot reset a saved calibration.
17. Repeat the start/release/capture flow with both left and right controllers where available.
18. Calibrate again, exit AR, re-enter, and confirm deliberate recalibration is required.
19. Calibrate again, recenter once, and record the resulting alignment; do not assume the prior yaw remains valid.
20. Record overlay availability, comparison error against the physical north marker, controller
    handedness, comfort, readability, and any console/browser errors.

## Evidence record

| Criterion | Result | Notes/evidence |
|---|---|---|
| Milestone 0 behavior preserved | PASS | Floor alignment and world locking remained correct in the reported flow. |
| Available controllers detected | PASS | At least one controller completed calibration; handedness coverage was not reported. |
| Rays visible only during calibration | NOT RUN | Not separately reported. |
| DOM-overlay calibration and action isolation | NOT RUN | Overlay availability and interaction results were not separately reported. |
| Controller-only start and release-before-capture | PASS | Reported start/capture separation passed. |
| Controller-only cancel and reset | PASS | Cancel and reset were reported as passing. |
| Nearly vertical capture rejected | NOT RUN | |
| Tracking-loss/stale-pose capture rejected | NOT RUN | |
| Trigger captures horizontal target ray | PASS | A controller captured the trusted north-marker direction; no numeric posture or error was reported. |
| N aligns with physical true-north marker | PASS | Coherent geographic alignment was reported; no angular precision was measured. |
| S opposite and E/W perpendicular | PASS | Coherent N/S/E/W geometry was reported. |
| Geographic frame world-locked | PASS | World locking remained stable in the reported flow. |
| Duplicate capture suppressed | NOT RUN | |
| Recalibration replaces prior result | PASS | Recalibration was reported as passing; intermediate preservation details were not separately reported. |
| Cancel restores prior result | UNCERTAIN | Cancel passed, but preservation of a prior calibration was not separately described. |
| Reset returns to uncalibrated | PASS | Reset was reported as passing. |
| Left/right controller behavior | NOT RUN | |
| Exit/re-entry invalidation recorded | PASS | Session lifecycle was reported as usable; exact post-exit state details were not supplied. |
| Recenter behavior recorded | UNCERTAIN | Session lifecycle was reported usable, but recenter-specific observations were not supplied. |
| Comfort and readability | UNCERTAIN | No blocking defect was reported, but no separate comfort/readability observations were supplied. |
| Versions, URL, commit, and room setup | UNCERTAIN | Hosted deployment was confirmed; exact device/software/setup details were not supplied. |

Physical device evidence has been recorded for the reported Quest 3 acceptance flow. Additional
device/room coverage and unmeasured edge-case evidence remain future regression-validation work.
