# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Implement physical north-marker calibration

## Why this is next

Milestone 0 is complete: automated, desktop, and tested Quest 3 immersive AR, passthrough, floor alignment, stability, session lifecycle, recenter, comfort, and usability checks passed. The next capability is a deliberate user-driven alignment of the room-relative reference frame to a pre-marked physical north direction.

## Recommended execution

**Model:** GPT-5.6 Sol

**Reasoning effort:** High

**Mode:** Plan, then bounded implementation

**Thread:** Main control thread

## Objective

Allow a standing Quest user to point a tracked controller toward a physical north marker and capture the horizontal yaw offset required to align the application’s room-relative coordinate system with geographic north. The existing room axes are not geographic directions before calibration.

## Required scope

1. Detect and display available XR controllers.
2. Render a restrained controller aiming ray only where useful during calibration.
3. Provide an explicit **Calibrate North** workflow that requires the user to stand at the chosen physical origin marker and point one controller toward the pre-marked north reference.
4. Project the captured controller direction onto the horizontal XZ plane and reject a too-small or nearly vertical projection with readable feedback.
5. Define and test an explicit coordinate convention without relying silently on a Three.js forward-axis assumption.
6. Calculate and store an in-memory yaw offset so captured physical north aligns with geographic north; south is opposite north, east and west are perpendicular, and Y remains local vertical.
7. Rotate a dedicated geographic-reference group rather than altering scientific source coordinates.
8. Render N, S, E, W, north–south and east–west lines, and retain the existing horizon ring and zenith/nadir line.
9. Provide recalibrate and reset controls plus explicit calibrated, uncalibrated, and error states.
10. Preserve desktop fallback through a simulation method that exercises calibration logic.
11. Add unit tests for horizontal projection, known-vector yaw sign/angle conventions, invalid-direction rejection, reset, and recalibration.
12. Document the physical setup procedure and the limit that a yaw value is not universally valid across boundary resets, recentering, rooms, or tracking-origin changes.

## Persistence boundary

- In-memory calibration is required.
- Browser local-storage persistence may be included only if it remains small and testable and never implies room-persistence validity.
- Defer persistence if it adds ambiguity or risk; always provide a visible recalibration path.

## Explicitly deferred

- Astronomy Engine, geolocation, automatic compass access, magnetic declination, and true-versus-magnetic-north correction.
- Sun or Moon calibration; spatial anchors, plane detection, hit testing, and hand tracking.
- Earth axis, celestial poles/equator, ecliptic, Sun, Moon, planets, time controls, orbital paths, contemplative sequencing, audio, and 360 video.

## Acceptance criteria

1. Existing Milestone 0 behavior remains intact.
2. The controller ray appears only where useful for calibration.
3. A horizontal controller direction can be captured.
4. Nearly vertical or invalid rays are rejected with readable feedback.
5. Geographic N/S/E/W geometry rotates coherently from the stored yaw.
6. Known-vector unit tests verify the accepted sign and angle convention.
7. Recalibration replaces the prior calibration; reset returns to an explicitly uncalibrated state.
8. Desktop simulation exercises calibration logic.
9. Type-check, tests, and build pass.
10. Quest testing remains a separate physical acceptance step.
11. No astronomical or automatic-heading features are added.

## Stop conditions

- The coordinate sign/rotation convention cannot be made explicit and covered by known-vector tests.
- A dependency, persistence mechanism, or scope expansion would be required to make calibration deterministic.
- The work requires astronomy, geolocation, automatic heading, or other deferred features.

## Expected return format

```text
Objective:
Status: Complete | Partial | Blocked

Calibration convention:
- Captured direction:
- Horizontal projection:
- Yaw rule:
- Geographic-reference rotation:

Validation:
- PASS:
- FAIL:
- NOT RUN:

Exact next task:
- <one bounded task>
```
