# Cosmic Calibration WebXR

Cosmic Calibration is a mixed-reality cosmic-navigation project. Milestone 0 established a physically validated Quest 3 passthrough and floor-relative reference frame. Milestone 1 adds an explicit, user-driven calibration from the room-relative frame to a pre-marked true-north direction.

Scientific geometry and contemplative interpretation remain separate layers. This milestone adds no astronomy, automatic heading, compass, geolocation, or magnetic-declination behavior.

## Current scope

The shared desktop/XR scene contains:

- the Milestone 0 floor origin, room-relative X/Y/Z axes, horizon ring, and zenith/nadir line;
- a dedicated geographic-reference group containing N/S/E/W labels and horizontal cardinal axes;
- explicit in-memory calibration, recalibration, cancellation, and reset states;
- left- or right-controller target-ray capture during immersive AR;
- a desktop bearing simulation using the same projection, yaw, and state logic as XR capture.

The room X and Z axes have no geographic meaning before calibration. Geographic geometry is hidden until a valid physical or simulated calibration is captured.

## Local commands

```powershell
npm ci
npm run dev -- --host 127.0.0.1
npm run typecheck
npm run test
npm run build
npm run preview -- --host 127.0.0.1
```

The desktop fallback retains OrbitControls. Use the bearing slider or the `0°`, `90°`, `180°`, and `270°` presets, then select **Simulate North** when using a custom slider value. Simulation is labelled and does not claim a physical heading.

## Coordinate convention

- `+Y` is local up; `Y = 0` is the local-floor plane.
- The XZ plane is local horizontal.
- Unrotated application north is `(0, 0, -1)`.
- Unrotated east is `(+1, 0, 0)`; south and west are the opposites of north and east.
- Positive Three.js Y rotation turns application north toward `-X`; a captured `+X` direction therefore produces `-90°` yaw.
- Only `geographic-reference-frame` receives the calibration yaw. The XR camera, renderer, floor frame, room axes, controllers, and future scientific source coordinates are never rotated by calibration.

See [Architecture](docs/ARCHITECTURE.md) and [Calibration](docs/CALIBRATION.md) for the signed-angle rule and physical procedure.

## Physical north-marker workflow

Milestone 1 assumes the physical marker already represents true north.

1. Establish a safe standing/room-scale Quest boundary and correct physical floor.
2. Stand at the chosen physical origin marker and enter AR.
3. Select **Calibrate North**.
4. Point either tracked controller at the true-north marker while holding the target ray approximately level.
5. Press that controller’s trigger/select action once.
6. Verify the N/S/E/W group, diagnostic yaw, and physical marker alignment.
7. Use **Recalibrate North** to replace the result or **Reset North** to return to an explicitly uncalibrated state.

Target rays are visible only during active calibration for usable tracked controllers. A ray with horizontal magnitude below `0.25` is rejected because it is within roughly `14.5°` of vertical and cannot provide a stable horizontal bearing.

## Session and persistence limits

Immersive AR still requires `local-floor`; DOM overlay is requested only as an optional feature for calibration controls. Acquired-session ownership, renderer binding, cleanup, and duplicate-start protection remain unchanged.

Calibration is in memory only. Reloading, session exit, boundary reset, room change, or tracking-origin change requires deliberate recalibration. Recenter behavior must be checked physically; a displayed yaw is a room-relative diagnostic, not magnetic heading or scientific data.

## Static hosting

Vite uses `base: './'`, keeping emitted assets relative for GitHub Pages project subpaths. The current hosted Milestone 0 site is:

`https://thinksql1.github.io/cosmic-calibration-webxr/`

This implementation task does not push or deploy Milestone 1.

## Validation boundary

Pure math, state transitions, controller integration, existing XR lifecycle, type-check, build, and desktop simulation are locally testable. Physical Quest north-marker calibration is a separate acceptance step and remains **NOT RUN** until the feature branch is published under explicit authorization.

## Explicitly deferred

Local-storage persistence, Astronomy Engine, geolocation, automatic compass access, headset magnetometer access, magnetic declination, true-versus-magnetic-north correction, automatic north detection, spatial anchors, plane detection, hit testing, hand tracking, celestial geometry, time controls, audio, 360 video, backend services, accounts, and analytics are absent.
