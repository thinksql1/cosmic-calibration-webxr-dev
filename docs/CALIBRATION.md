# Physical North-Marker Calibration

## Scope and assumption

Milestone 1 aligns a room-relative display frame to a physical marker that the tester has already established as **true north**. The application does not measure true north, read a compass, use geolocation, or correct magnetic declination.

## Physical setup

1. Use a safe standing or room-scale Quest boundary with charged controllers.
2. Deliberately establish the Quest floor with a controller placed at the physical floor.
3. Choose and mark a standing origin point.
4. Establish a visible physical marker in the true-north direction from that origin using an external trusted method.
5. Keep the area between the origin and marker clear.

## Calibration procedure with DOM overlay

1. Stand upright on the origin marker and open the deployed HTTPS application.
2. Enter immersive AR.
3. Select **Calibrate North**.
4. Use either connected tracked controller. Point its target ray toward the north marker while holding the controller approximately level.
5. Press the same controller’s trigger/select action once.
6. Confirm that N points to the marker, S is opposite, E/W are perpendicular, and the floor and zenith/nadir references remain unchanged.
7. Note the displayed yaw only as a diagnostic.

Overlay buttons cancel `beforexrselect`, so selecting Calibrate, Cancel, Recalibrate, or Reset
does not also capture the controller direction. Controller select away from the overlay remains
available.

## Calibration procedure without DOM overlay

1. Stand upright on the origin marker and enter immersive AR.
2. Press and release either tracked controller trigger. This first completed action begins
   calibration and arms it; it cannot also capture.
3. Read the controller-attached or world-space instruction, then point either controller target
   ray approximately level toward the north marker.
4. Press and release trigger again. This later action captures once.
5. Squeeze while calibrating to cancel. If squeeze is unavailable, hold the trigger for at least
   1.2 seconds to cancel instead of capturing.
6. After success, short-press trigger or short-squeeze to recalibrate. Hold trigger or squeeze
   for at least 1.2 seconds to reset deliberately.

The initial press and its release form an explicit arming transition. Another controller cannot
capture until that transition is complete, and repeated `select` delivery from one physical
press is ignored. The aiming ray is a visualization of the controller target ray, not a precision
survey instrument.

## Invalid direction handling

The controller forward direction is resolved from the exact XR input event frame and active
reference space, then projected onto the XZ plane. Horizontal magnitude below `0.25` is rejected,
corresponding to a unit target ray within roughly `14.5°` of vertical. Missing current pose,
disconnected or invisible controller, and non-finite pose data are also rejected. A retained or
default Three.js transform is never enough to save a heading. Move the controller into view,
hold it steadier and more level, then press trigger again; the error remains recoverable and no
partial calibration is saved.

## Recalibration, cancellation, and reset

- **Recalibrate North**, short trigger, or short squeeze begins a new capture. Only a successful
  valid capture replaces the prior yaw.
- **Cancel Calibration** restores the prior result during recalibration or returns to uncalibrated if no prior result exists.
- **Reset North** or a deliberate 1.2-second trigger/squeeze hold removes the current in-memory
  result and hides geographic geometry.

Recalibrate after session exit/re-entry, recenter, browser reload, boundary reset, tracking-origin change, or room change.

## Desktop simulation

The desktop slider and `0°`, `90°`, `180°`, and `270°` presets exercise the same pure calibration path. A custom slider value is applied with **Simulate North**. The resulting state is explicitly marked simulated and is not physical evidence.

## Troubleshooting

- **No controller available:** wake or reconnect either tracked controller; hand input is not used.
- **Controller tracking unavailable:** move the controller into view and retry; the current
  capture is rejected and a previous accepted calibration is retained.
- **Direction not usable:** hold the controller approximately level and aim again.
- **N points the wrong way:** reset, verify the physical marker really represents true north, return to the origin, and recalibrate.
- **Alignment changed after recenter or boundary work:** reset and recalibrate; stored yaw validity is not claimed across tracking-origin changes.
- **Controls are not visible in immersive AR:** DOM overlay is optional and browser-dependent;
  use the controller-only flow and record the browser behavior during physical acceptance.

## True north versus magnetic north

This milestone assumes the physical marker already represents true north. It does not determine magnetic north, apply declination, or convert between magnetic and geographic headings.

## Persistence limitation

Calibration is in memory only. It does not survive reload and is not claimed valid across sessions, rooms, boundaries, recentering, or tracking-origin changes. Persistent room calibration is deferred until those validity boundaries can be represented honestly.
