# Cosmic Calibration WebXR Architecture

## Frames and boundaries

The application uses one shared Three.js scene for desktop and immersive AR while keeping three concepts distinct:

1. **Room/floor frame:** the established Milestone 0 origin, room-relative axes, horizon ring, and zenith/nadir line.
2. **Geographic display frame:** a dedicated `geographic-reference-frame` group containing N/S/E/W labels and cardinal axes.
3. **Future scientific source frame:** not implemented; future source coordinates must remain separate from display rotations.

North calibration rotates only the geographic display group around local Y. It never rotates the XR camera, renderer, room/floor frame, controller target-ray objects, or future scientific source data.

## Coordinate convention

- `+Y`: local up / zenith
- `-Y`: local down / nadir
- `Y = 0`: local-floor plane
- XZ: local horizontal plane
- application north before calibration: `(0, 0, -1)`
- application east before calibration: `(+1, 0, 0)`

Three.js positive Y rotation maps `-Z` toward `-X`. Therefore a physical-north target ray captured along room `+X` produces `-π/2` yaw. The geographic group’s unrotated N marker at `-Z` then maps to the captured `+X` direction. S is the exact opposite; E and W are the yaw-rotated `+X` and `-X` vectors.

## Pure calibration math

`src/calibration/math.ts` has no renderer dependency.

1. It validates finite vector components.
2. It copies X and Z into a horizontal projection without mutating caller data.
3. It rejects horizontal magnitude below `0.25`. Controller target rays are unit vectors, so this rejects directions within about `14.5°` of vertical.
4. It normalizes the accepted horizontal direction.
5. It computes signed yaw with `atan2(crossY, dot)` from application north to captured north.
6. It normalizes yaw to `[-π, π)`.

Known-vector tests establish the sign convention: `-Z → 0°`, `+X → -90°`, `+Z → -180°`, `-X → +90°`, and northeast `(+X,-Z) → -45°`.

## Calibration state

`src/calibration/state.ts` owns the renderer-independent lifecycle:

- `uncalibrated`
- `calibrating`
- `calibrated`
- `invalid-direction`
- `controller-unavailable`
- `capture-failed`

Error states remain recoverable calibration attempts. Cancel restores the prior calibration when recalibrating, otherwise it returns to uncalibrated. Reset always returns to uncalibrated. A successful record contains yaw, normalized direction, optional controller identity/handedness, timestamp, and simulated/physical provenance; identity and timestamp are diagnostic metadata, not scientific data.

## Controller target-ray capture

`src/xr/controllerCalibration.ts` prepares Three.js target-ray spaces for indices 0 and 1 before session binding so connection events are observable. It accepts either left or right `tracked-pointer` input and deliberately excludes hand input.

During calibration only, each usable connected controller shows a restrained 1.8 m target-ray line. A 300 ms arming delay prevents the UI action that begins calibration from also becoming the capture action. A later `select` event resolves controller target-ray forward as local `-Z` transformed by its world quaternion, then calls the shared calibration state/math path. Successful capture immediately leaves calibration mode, suppressing duplicate select capture. Session end removes listeners, controller objects, and rays and clears transient calibration.

DOM overlay is optional in the XR session request. `local-floor` remains the sole required feature.

## Geographic-reference rendering

`src/scene/createGeographicReference.ts` creates thin N/S and E/W lines just above the floor to avoid z-fighting plus lightweight canvas-texture sprites. North is warm and visually distinct; the remaining labels are subdued. The group is hidden while uncalibrated or calibrating and becomes visible immediately after a valid capture.

The existing horizon ring and zenith/nadir line stay in the room/floor group and remain unchanged.

## Desktop simulation and UI

`src/main.ts` maps calibration state to the panel, buttons, geographic group, and controller rays. Desktop simulation converts a clockwise bearing—`0°` north, `90°` east, `180°` south, `270°` west—to a horizontal vector and calls the same state/math functions used by physical capture. It contains no separate yaw logic.

The panel exposes uncalibrated, calibrating, calibrated, and readable error states; yaw is labelled as a diagnostic. Recalibration replaces the previous result, cancel restores it, and reset removes it.

## Session and persistence lifecycle

The established owned-session controller still requests `immersive-ar` with required `local-floor`, owns the acquired session before renderer binding, and prevents overlapping request/bind/active/cleanup operations. Optional DOM overlay supports in-headset controls where the browser provides it.

Calibration is deliberately in memory only. Session exit, reload, room change, boundary reset, or tracking-origin change requires recalibration. The application does not claim a yaw remains valid across recentering; physical acceptance must verify and document recenter behavior.

## Module boundaries

- `src/main.ts`: renderer, DOM UI, simulation, and integration wiring.
- `src/scene/createReferenceScene.ts`: unchanged room/floor reference geometry.
- `src/scene/createGeographicReference.ts`: geographic-only cardinal display group.
- `src/calibration/math.ts`: pure projection, signed yaw, bearing, and cardinal math.
- `src/calibration/state.ts`: calibration state transitions and records.
- `src/xr/state.ts`: capability and owned immersive-session lifecycle.
- `src/xr/controllerCalibration.ts`: Three.js target-ray connection, visualization, and select capture.

## Deferred architecture

Persistence, geolocation, automatic heading, magnetic correction, astronomy calculations, celestial rendering, time controls, spatial anchors, hit testing, hand tracking, and experiential layers remain absent.
