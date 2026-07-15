# Quest 3 Manual Acceptance Checklist

**Current status:** NOT RUN. Desktop success is not Quest success. Transparent rendering does not prove passthrough, and requesting `local-floor` does not prove accurate floor registration.

## Prerequisites

- Meta Quest 3 with charged controllers and a safe, stationary test area.
- Recorded Quest OS and Quest Browser versions.
- An authorized deployment of the exact tested commit at a public HTTPS URL.
- A second device or observer for notes and, where possible, screenshots/video.

Do not use a local desktop result as a substitute for this checklist.

## Test procedure

Record each numbered criterion as **PASS**, **FAIL**, or **NOT RUN**, with notes and evidence.

1. Open the deployed HTTPS URL in Quest Browser and record the exact URL and commit.
2. Confirm the page loads without a browser security warning.
3. Confirm the compatibility panel reaches “Immersive AR is available.” Record any other state exactly.
4. Press **Enter AR** once and confirm the UI reports a session request in progress.
5. Handle browser/OS permission prompts and record each prompt and response.
6. Verify the physical environment remains visible. This is the passthrough check.
7. Locate the small origin marker, X/Y/Z axes, horizon ring, and zenith/nadir line.
8. Assess whether the horizon ring lies on the physical floor rather than following the headset.
9. Assess whether the zenith/nadir line is vertical relative to gravity.
10. Move the head laterally around the scene and check that geometry remains world-fixed.
11. Move the head vertically and check floor registration and scale.
12. Observe for jitter, drift, unexpected rotation, or motion during at least 60 seconds.
13. Exit the immersive session and confirm the session-ended state and desktop page return.
14. Re-enter AR and repeat the floor, vertical, and stability checks.
15. Use the Quest recenter command, then record how origin, floor ring, and vertical line change.
16. Record Quest model, Quest OS version, Quest Browser version, date/time, room conditions, and tested commit.
17. Capture screenshots or video where possible, ensuring no private room details are exposed unintentionally.

## Evidence record

| Criterion | Result | Notes/evidence |
|---|---|---|
| HTTPS page loads | NOT RUN | |
| Immersive AR reported available | NOT RUN | |
| Explicit session request and permissions | NOT RUN | |
| Passthrough visible | NOT RUN | |
| Origin and ring located | NOT RUN | |
| Ring registered to floor | NOT RUN | |
| Vertical line gravity-aligned | NOT RUN | |
| Lateral/vertical world stability | NOT RUN | |
| 60-second drift observation | NOT RUN | |
| Session exit and re-entry | NOT RUN | |
| Recenter behavior recorded | NOT RUN | |
| Versions and tested commit recorded | NOT RUN | |

Physical device evidence is required before any Quest criterion or the overall Milestone 0 success condition can pass.
