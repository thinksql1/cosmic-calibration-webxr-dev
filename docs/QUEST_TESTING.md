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

## Milestone 2B status

**Geocentric Earth-core/axis physical acceptance: CONDITIONAL PASS.** The user physically tested
the published hardened DEC-021/DEC-022 replacement and reported it workable, with no blocking
issue reported. Detailed A–K/checklist observations, Quest OS/browser details, and individual
depth, visibility, stereo, world-locking, lifecycle, and comfort findings were not captured; none
are inferred. This checklist remains the procedure for future regression evidence. Desktop
evidence still cannot substitute for headset observations.

## Milestone 2B procedure

1. Establish a safe standing boundary, reset the physical floor, mark the local origin, and use
   the same trusted true-north marker as Milestone 1.
2. Close stale Quest Browser tabs, open the published HTTPS URL in a fresh tab, and record the
   hosted commit, Quest model/OS/Browser, room, observer values, selected UTC, and marker method.
3. Confirm the manual observer fields, explicit UTC controls, axis/marker/label switches, P03
   mean-pole disclosure, and Tier 1 exclusions are visible. Stop if the old hosted build appears.
4. Enter AR and verify passthrough, floor ring, room diagnostics, and controller-only north
   calibration still work before judging celestial placement.
5. Enter the tested latitude/longitude/elevation, select a fixed UTC fixture, and complete a fresh
   physical north capture. Confirm no axis appears before observer and calibration readiness.
6. Verify the Earth-core marker represents a remote modeled geocentric point rather than the
   floor/user, and one continuous world-scale line passes through it toward NCP/SCP. Confirm the
   observer is not falsely placed on the axis and the pole markers do not look independently
   positioned or labeled as Polaris.
7. In a northern-latitude test, verify NCP is above the northern horizon, SCP is below the
   southern horizon, and NCP altitude is broadly consistent with the entered latitude. Do not
   claim laboratory angular accuracy from visual estimation.
8. If a southern validation observer is practical, enter the fixed southern preset and verify SCP
   becomes the above-horizon pole. Otherwise record this device case as **NOT RUN** and retain the
   automated evidence separately.
9. Toggle labels, markers, the below-horizon segment, full-axis mode, and subdued mode. Confirm no
   endpoint direction changes and the room floor is not presented as an opaque Earth surface.
10. Move the head slowly, turn approximately 90 degrees, lean, change head height, and return.
    Record world locking, jitter, drift, sliding, clipping, and whether labels remain readable.
11. Recalibrate toward the same north marker and verify the layer rebuilds coherently. Reset north
    and verify celestial readiness clears while Milestone 0 room geometry remains.
12. Calibrate again, exit/re-enter AR, and recenter once. Record actual invalidation/recovery;
    calibration remains session-scoped and must not be assumed valid after tracking-origin change.
13. Record scale, brightness, contrast, below-floor ambiguity, clutter, flashing, unexpected
    camera motion, discomfort, and whether the axis communicates one calm NCP/SCP relationship.

Use only **PASS**, **FAIL**, **UNCERTAIN**, **NOT RUN**, or **NOT APPLICABLE**. This procedure does
not authorize celestial-equator, precession, body, temporal-clock, media, or contemplative work.

## Milestone 2C physical evidence and Milestone 2D follow-up

**Celestial-equator physical acceptance: CONDITIONAL PASS.** The user reports the published
celestial equator is good and workable. The axis and equator each appear as one clean line when
viewed through either eye independently; both appear doubled only with both eyes open. No
individual-eye duplicate was reported. This is classified as a binocular-fusion/stereo-
presentation concern with no conclusively proven cause. No other checklist result is inferred.

After independent integration and publication of Milestone 2D, perform this bounded follow-up:

1. Confirm axis, equator, and local horizon default to **Both eyes** and retain prior placement.
2. Test each layer in **Left eye only** and **Right eye only** while safely alternating which eye
   is closed. Confirm one clean line reaches the selected physical eye and none reaches the other.
3. Assign axis right/equator left, then reverse them. Record fusion, rivalry, usefulness, strain,
   and whether either combination reduces perceived doubling; do not assume improvement.
4. Enable the local horizon in both eyes. Confirm it aligns with existing N/E/S/W, remains
   horizontal and world-oriented, and is visibly distinct from the 1.5 m room-floor ring.
5. Inspect horizon versus celestial-equator tilt at the entered latitude and axis perpendicularity.
   Record whether the local reference makes the geocentric relationships easier to interpret.
6. Repeat horizon left/right modes, head rotation, careful lateral motion, crouch/stand, bright and
   dark passthrough, reset, same-direction recalibration, deliberately changed recalibration,
   exit/re-entry, and reload.
7. Record stereo comfort, binocular rivalry, line doubling, clipping, drift, duplicate resources,
   horizon scale/readability, and whether the existing axis-curvature/core-distance impressions
   change. Stop immediately for discomfort.

Physical Milestone 2D acceptance remains **NOT RUN** until this published headset procedure is
performed.
