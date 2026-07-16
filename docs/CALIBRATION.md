# Physical North-Marker Calibration

## Scope and assumption

Milestone 1 aligns a room-relative display frame to a physical marker that the tester has already established as **true north**. The application does not measure true north, read a compass, use geolocation, or correct magnetic declination.

## Physical setup

1. Use a safe standing or room-scale Quest boundary with charged controllers.
2. Deliberately establish the Quest floor with a controller placed at the physical floor.
3. Choose and mark a standing origin point.
4. Establish a visible physical marker in the true-north direction from that origin using an external trusted method.
5. Keep the area between the origin and marker clear.

## Calibration procedure

1. Stand upright on the origin marker and open the deployed HTTPS application.
2. Enter immersive AR.
3. Select **Calibrate North**.
4. Use either connected tracked controller. Point its target ray toward the north marker while holding the controller approximately level.
5. Press the same controller’s trigger/select action once.
6. Confirm that N points to the marker, S is opposite, E/W are perpendicular, and the floor and zenith/nadir references remain unchanged.
7. Note the displayed yaw only as a diagnostic.

The aiming ray is a visualization of the controller target ray, not a precision survey instrument.

## Invalid direction handling

The controller forward direction is projected onto the XZ plane. Horizontal magnitude below `0.25` is rejected, corresponding to a unit target ray within roughly `14.5°` of vertical. Non-finite or unavailable poses are also rejected. Hold the controller steadier and more level, then press trigger again; no partial calibration is saved.

## Recalibration, cancellation, and reset

- **Recalibrate North** begins a new capture. A successful capture replaces the prior yaw.
- **Cancel Calibration** restores the prior result during recalibration or returns to uncalibrated if no prior result exists.
- **Reset North** removes the current in-memory result and hides geographic geometry.

Recalibrate after session exit/re-entry, recenter, browser reload, boundary reset, tracking-origin change, or room change.

## Desktop simulation

The desktop slider and `0°`, `90°`, `180°`, and `270°` presets exercise the same pure calibration path. A custom slider value is applied with **Simulate North**. The resulting state is explicitly marked simulated and is not physical evidence.

## Troubleshooting

- **No controller available:** wake or reconnect either tracked controller; hand input is not used.
- **Direction not usable:** hold the controller approximately level and aim again.
- **N points the wrong way:** reset, verify the physical marker really represents true north, return to the origin, and recalibrate.
- **Alignment changed after recenter or boundary work:** reset and recalibrate; stored yaw validity is not claimed across tracking-origin changes.
- **Controls are not visible in immersive AR:** DOM overlay is optional and browser-dependent; record the browser behavior during physical acceptance rather than inferring support.

## True north versus magnetic north

This milestone assumes the physical marker already represents true north. It does not determine magnetic north, apply declination, or convert between magnetic and geographic headings.

## Persistence limitation

Calibration is in memory only. It does not survive reload and is not claimed valid across sessions, rooms, boundaries, recentering, or tracking-origin changes. Persistent room calibration is deferred until those validity boundaries can be represented honestly.
