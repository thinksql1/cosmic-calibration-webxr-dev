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

The interaction coordinator distinguishes uncalibrated idle, calibrated idle,
`awaiting-release`, ready-to-capture, capture processing, calibrated success, recoverable error,
cancellation, and reset. From either idle state, a controller `selectstart` begins calibration and
the completed first action only arms capture. Capture cannot occur until its `selectend`, and a
second controller cannot bypass that global release gate. A later completed primary action
captures once. While calibrating, squeeze cancels; a deliberate 1.2-second primary hold is the
no-squeeze fallback. From calibrated idle, short primary/squeeze begins recalibration and a
deliberate long primary/squeeze resets. The state transitions, not a debounce timeout, enforce
start/capture separation and duplicate suppression.

During calibration, each usable controller shows a restrained 1.8 m aiming ray. Without DOM
overlay, a controller-attached canvas sprite provides instructions, with a world-space fallback
when controller tracking cannot render that sprite. Capture synchronously calls
`event.frame.getPose(event.inputSource.targetRaySpace, activeReferenceSpace)` during the native
XR `select` event. It requires the exact connected input source, a current pose, a visible Three.js
target-ray group, and finite pose data. The pose quaternion rotates local `-Z`; no retained
Three.js world transform is accepted as proof of current tracking. A transform can remain stale
or default after pose loss, while an identity quaternion returned by a valid current XR pose is
legitimate.

Missing, disconnected, invisible, non-finite, or nearly vertical input leaves calibration in a
recoverable error state and does not replace the rollback calibration. A successful capture is
the only operation that replaces the previous calibration.

Native input listeners are attached only after Three.js renderer binding succeeds, because
Three.js first updates its controller target-ray state from that XR event. Session end removes
native input and overlay listeners. Binding and overlay setup are no-ops after manager
deactivation, preventing late renderer-binding continuation from reattaching listeners.

DOM overlay is optional in the XR session request. When present, every interactive overlay
control cancels `beforexrselect`; the DOM action remains available while the browser suppresses
the paired XR select sequence. Controller events outside the overlay remain functional.
`local-floor` remains the sole required feature.

## Geographic-reference rendering

`src/scene/createGeographicReference.ts` creates thin N/S and E/W lines just above the floor to avoid z-fighting plus lightweight canvas-texture sprites. North is warm and visually distinct; the remaining labels are subdued. The group is hidden while uncalibrated or calibrating and becomes visible immediately after a valid capture.

The existing horizon ring and zenith/nadir line stay in the room/floor group and remain unchanged.

## Desktop simulation and UI

`src/main.ts` maps calibration state to the panel, buttons, geographic group, and controller rays. Desktop simulation converts a clockwise bearing—`0°` north, `90°` east, `180°` south, `270°` west—to a horizontal vector and calls the same state/math functions used by physical capture. It contains no separate yaw logic.

The panel exposes uncalibrated, awaiting-release, ready, calibrated, and readable recoverable
error states; yaw is labelled as a diagnostic. Recalibration replaces the previous result only
after valid capture, cancel restores it, and reset removes it.

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
