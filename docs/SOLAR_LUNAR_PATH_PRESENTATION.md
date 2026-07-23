# Solar and Lunar Daily-Path Presentation

## Distinct scientific layers

The Sun and Moon daily paths are apparent topocentric directions during one selected local civil
day. They are not annual or monthly orbits. The compact Moon phase dial is a separate symbolic
synodic-cycle instrument. The query-gated Lunar Phase Transit Path is a third layer: an
observer-relative apparent EQJ track from previous New Moon to next New Moon, transformed by one
current real-sky orientation. See `LUNAR_PHASE_TRANSIT_PATH.md`.

Both daily paths use:

- the central `SimulationClock`;
- the validated WGS84 observer, including MSL elevation;
- the selected IANA civil time zone and its DST-aware local-midnight boundaries;
- Astronomy Engine `2.1.19`;
- the active body correction profile;
- apparent topocentric `EQD_TRUE` positions mapped to `HORIZONTAL_ENU`;
- the calibrated geographic parent exactly once.

Below-horizon directions are retained and displayed with reduced opacity. This is a presentation
policy; provider positions are not changed.

## Sun-path repair

The failed `constellation-sun-path-comparison` isolation submitted
`apparent-sun-civil-day-projective-path` before its scientific model existed. Its
`onBeforeRender` threw `Solar daily-path renderer is not scientifically ready.`, aborting the
left-eye traversal before the right eye and leaving the application loading.

Readiness now belongs to the update path. `ready`, `not-ready`, and invalid states are explicit.
Not-ready or invalid state sets the Sun group invisible, disables local draw uniforms, records a
bounded reason, and leaves the renderer traversal intact. Isolation cannot override scientific
readiness. The render callback only verifies finite matrices, selects a validated draw-enable
uniform, and records eye completion; it never calculates astronomy, rebuilds geometry, mutates
vertices, or throws.

The provider's ten-minute samples are unchanged. The presentation model preserves every calculated
sample and adds spherical minor-arc subdivisions at no more than one degree. This replaces coarse
Cartesian chords. One ordered unit-direction buffer is uploaded outside rendering and remains
identical for both eyes. Native model-view/projection supplies stereo. These changes address the
two demonstrated wobble risks—coarse chords and per-eye shared-buffer mutation—without smoothing
away scientific samples. Physical Quest comparison still decides whether any residual shimmer is
material.

## Moon daily path

`MoonDailyPathService` reuses the Sun civil-day resolver but samples the Moon no farther than five
civil minutes apart. The provider path is apparent topocentric and preserves lunar parallax.
Timestamps are strictly increasing, exact interval endpoints are included, duplicate directions
are suppressed only in presentation geometry, and rendered adjacent spacing is at most one
degree. The path is one open projective line with immutable unit directions and a cool,
non-writing translucent material.

The Moon path rebuilds only when its civil-day cache identity changes. Head movement and
left/right eye rendering never rebuild it. The Moon marker remains independently controlled.

## Query and controls

The ordinary URL adds no Moon study geometry. Supported study modes are `off`, `daily-path`,
`phase-dial`, `phase-transit`, `current-appearance`, and `combined` via `moonStudy`. Direct bounded controls use
`showMoonPath`, `showMoonPhaseDial`, `showMoonPhaseNotches`, `showMoonPhaseLabels`,
`showMoonPhaseImages`, `showCurrentMoonAppearance`, and `showCurrentPhaseIndicator`.
Invalid values suppress locally.

## Physical acceptance

Use a fresh private Quest Browser session. Before calibration, open the safe Sun/Orion comparison
and confirm both eyes complete with no window or incomplete-frame error. After calibration, compare
the Sun and Moon paths while still and during slow head motion. Accept only ordered, smooth,
world-locked lines whose geometry is identical between eyes.
