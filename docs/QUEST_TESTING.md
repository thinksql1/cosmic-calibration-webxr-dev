# Quest 3 Manual Acceptance Checklists

Desktop success is not Quest success. Record each physical criterion as **PASS**, **FAIL**, **UNCERTAIN**, or **NOT RUN** with notes and evidence.

## Milestone 0 evidence

Milestone 0 physical Quest 3 acceptance is complete for the tested environment. Immersive AR entry, passthrough, reference geometry, controlled standing-floor alignment, horizon horizontality, zenith/nadir verticality, world locking, exit/re-entry, recenter, comfort, and usability passed. See `PROJECT_STATE.md` for the durable evidence summary.

This result does not establish Milestone 1 north calibration.

## Milestone 1 status

**Physical north-calibration acceptance: NOT RUN.** The implementation must be locally validated and published under separate authorization before this checklist is executed.

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
4. Begin **Calibrate North** and confirm rays appear only for usable connected controllers.
5. Point a controller nearly vertical and press trigger; confirm capture is rejected with readable level-controller guidance and geographic geometry remains unsaved.
6. Hold either controller approximately level toward the true-north marker and press trigger once.
7. Confirm N aligns with the marker, S is opposite, E/W are perpendicular, and the horizon/zenith/nadir geometry remains unchanged.
8. Confirm the aiming ray hides after capture and duplicate trigger input does not alter the saved result.
9. Move the head and confirm world locking remains stable.
10. Recalibrate using the other controller where available; confirm the new result replaces the old one.
11. Cancel a recalibration and confirm the prior calibration returns.
12. Reset and confirm the state is explicitly uncalibrated and geographic geometry hides.
13. Calibrate again, exit AR, re-enter, and confirm deliberate recalibration is required.
14. Calibrate again, recenter once, and record the resulting alignment; do not assume the prior yaw remains valid.
15. Record comparison error against the physical north marker, controller handedness used, comfort, readability, and any console/browser errors.

## Evidence record

| Criterion | Result | Notes/evidence |
|---|---|---|
| Milestone 0 behavior preserved | NOT RUN | |
| Available controllers detected | NOT RUN | |
| Rays visible only during calibration | NOT RUN | |
| Nearly vertical capture rejected | NOT RUN | |
| Trigger captures horizontal target ray | NOT RUN | |
| N aligns with physical true-north marker | NOT RUN | |
| S opposite and E/W perpendicular | NOT RUN | |
| Geographic frame world-locked | NOT RUN | |
| Duplicate capture suppressed | NOT RUN | |
| Recalibration replaces prior result | NOT RUN | |
| Cancel restores prior result | NOT RUN | |
| Reset returns to uncalibrated | NOT RUN | |
| Exit/re-entry invalidation recorded | NOT RUN | |
| Recenter behavior recorded | NOT RUN | |
| Comfort and readability | NOT RUN | |
| Versions, URL, commit, and room setup | NOT RUN | |

Physical device evidence is required before Milestone 1 can pass overall.
