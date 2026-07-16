# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Run the Milestone 1 physical north-calibration acceptance test

## Start condition

Begin only after confirming that the hosted Pages site contains the Milestone 1 **Physical North**
controls and desktop bearing simulation. Do not infer device behavior from source, unit tests,
desktop simulation, or hosted desktop inspection.

## Objective

On a physical Quest 3, verify that controller-only and optional DOM-overlay north calibration are
usable, reject invalid captures safely, preserve the floor-relative Milestone 0 scene, and remain
coherent across recalibration, reset, session exit/re-entry, and recenter.

## Required work

1. Establish a safe standing or room-scale boundary and deliberately confirm the physical floor.
2. Open the deployed Pages URL and confirm the Milestone 1 controls are present before entering AR.
3. Enter immersive AR and verify passthrough, floor geometry, and world locking still behave as in
   the accepted Milestone 0 result.
4. Test the controller-only start, release/arm, later capture, cancel, recalibrate, deliberate reset,
   left-controller, and right-controller paths without relying on DOM overlay.
5. If Quest Browser provides DOM overlay, test its calibrate, cancel, recalibrate, and reset controls
   and confirm each overlay action causes no duplicate XR capture. If unavailable, record that path
   as NOT APPLICABLE rather than FAIL.
6. Attempt capture with a missing/untracked or nearly vertical target ray where practical and verify
   that the previous accepted calibration is preserved and a later valid capture remains possible.
7. Verify the physical north marker, N/S/E/W geometry, displayed yaw, readability, scale, comfort,
   and controller/world feedback.
8. Exit and re-enter immersive AR, recenter once, and verify the documented need for deliberate
   recalibration without stale or corrupted geographic geometry.
9. Record each observation as PASS, FAIL, UNCERTAIN, NOT RUN, or NOT APPLICABLE, including Quest
   Browser/system versions and whether DOM overlay was available.

## Acceptance rules

- **PASS:** Physical capture aligns application north to the marked direction; controller-only
  lifecycle, invalid-input recovery, recalibration/reset, session lifecycle, floor reference,
  stability, readability, and comfort are usable with no duplicate capture or severe regression.
- **FAIL:** Any stale/default capture, same-action begin-and-capture, overlay collision, unusable
  controller-only path, lost prior calibration after rejected recapture, floor/stability regression,
  fatal session error, or severe comfort issue occurs.
- **UNCERTAIN:** The physical setup, marker, controller tracking, or observation cannot establish a
  reliable result. Do not promote uncertainty to PASS.

## Prohibited scope

- Do not begin Milestone 2, astronomy, celestial-pole/precession geometry, automatic north,
  compass access, magnetic correction, geolocation, persistence, anchors, or deployment changes.
- Do not modify application code while collecting acceptance evidence. Record any failure first.
