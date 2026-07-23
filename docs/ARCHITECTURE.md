# Cosmic Calibration WebXR Architecture

## Frames and boundaries

The application uses one shared Three.js scene for desktop and immersive AR while keeping the
room, calibrated display, and scientific coordinates distinct:

1. **Room/floor frame:** the established Milestone 0 origin, room-relative axes, floor ring, and zenith/nadir line.
2. **Geographic display frame:** `geographic-reference-frame`, which contains calibrated N/S/E/W references and applies accepted north yaw exactly once.
3. **Scientific state and presentation frames:** immutable observer/WGS84, UTC simulation-clock, Astronomy Engine, P03, and provenance state remain independent of scene transforms. Presentation maps tagged ENU results into the application basis below the geographic parent.

Within the geographic frame, the local horizon remains observer-centered. The Earth core, axis,
projective poles, celestial equator, and development-only celestial coordinate grid form the distinct Earth-centered geocentric assembly.
Apparent Sun, Moon, and planet directions plus the civil-day Sun path are observer-relative
references. North calibration rotates only the geographic display group around local Y; it never
rotates the XR camera, renderer, room/floor frame, controller target-ray objects, or scientific
source data.

The ordinary coordinate grid reuses the assembly's P03 axis and deterministic equatorial basis;
its longitude zero remains explicitly non-sidereal. A query-gated study now provides the missing
provider-native orientation bridge: catalog J2000 RA/declination uses `EQJ -> HOR`, while the
existing mean-date grid uses `EQD -> HOR` phase so validated pole convergence remains exact. Both
map HOR `(north, west, up)` to application `(east, up, -north)`, remain geometric/non-refracted,
and inherit north calibration only from the geographic parent. See
`docs/REAL_SKY_EQUATORIAL_ORIENTATION.md` and `docs/CELESTIAL_COORDINATE_GRID.md`.

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

## Geographic and celestial rendering

`src/scene/createGeographicReference.ts` creates thin N/S and E/W lines just above the floor to avoid z-fighting plus lightweight canvas-texture sprites. North is warm and visually distinct; the remaining labels are subdued. The group is hidden while uncalibrated or calibrating and becomes visible immediately after a valid capture.

The existing floor ring and zenith/nadir line stay in the room/floor group and remain unchanged.
The published scene also contains a WGS84 Earth core, geocentric P03 axis/poles, celestial equator,
observer-centered local horizon, actual apparent body markers, and an optional apparent Sun path
with civil-hour notches. Celestial overlays use bounded projective or camera-relative rendering,
layer-local linear non-writing depth behavior, explicit eye presentation modes where applicable,
and owned clear/dispose lifecycle contracts.

The physically accepted real-sky bridge uses Astronomy Engine `2.1.19` to map catalog EQJ J2000
directions into geometric local horizontal ENU at the shared UTC/observer state. Calibration yaw
remains exclusively on the geographic parent. The query-gated first constellation layer consumes
that same matrix for a 43-star NASA BSC5P subset and 40 immutable minor-great-circle segments.
Canonical EQJ unit buffers, one bounded homogeneous Earth-core anchor, and one shared orientation
uniform are projected independently by native XR eye cameras. No constellation layer owns a clock,
observer, sidereal formula, camera transform, label, or mutable per-eye geometry.

## Desktop simulation and UI

`src/main.ts` maps calibration state to the panel, buttons, geographic group, and controller rays. Desktop simulation converts a clockwise bearing—`0°` north, `90°` east, `180°` south, `270°` west—to a horizontal vector and calls the same state/math functions used by physical capture. It contains no separate yaw logic.

The panel exposes uncalibrated, awaiting-release, ready, calibrated, and readable recoverable
error states; yaw is labelled as a diagnostic. Recalibration replaces the previous result only
after valid capture, cancel restores it, and reset removes it.

## Session and persistence lifecycle

The established owned-session controller still requests `immersive-ar` with required `local-floor`, owns the acquired session before renderer binding, and prevents overlapping request/bind/active/cleanup operations. Optional DOM overlay supports in-headset controls where the browser provides it.

Calibration is deliberately in memory only. Session exit, reload, room change, boundary reset, or tracking-origin change requires recalibration. The application does not claim a yaw remains valid across recentering; physical acceptance must verify and document recenter behavior.

## Module boundaries

- `src/main.ts`: renderer, DOM UI, calibration, scientific-state refresh, layer controls, and integration wiring.
- `src/scene/`: room/floor geometry; calibrated geographic group; Earth-centered axis/core/poles/equator assembly; observer-centered local horizon; body and Sun-path groups; eye filtering; owned rendering resources and disposal.
- `src/presentation/`: immutable scientific-state-to-renderer models, application-basis mapping, geocentric structure presentation, and eye presentation modes.
- `src/science/state/`, `src/science/snapshot/`, and `src/science/frames/`: explicit WGS84 observer state, UTC simulation clock, revisioned immutable snapshots, P03/WGS84 frame transforms, scientific provenance, structured warnings, and errors.
- `src/science/astronomy/` and `src/science/providers/`: validated Astronomy Engine adapter, P03 mean-pole provider, correction/frame contracts, and provider identity.
- `src/science/bodies/`: actual apparent Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn,
  Uranus, Neptune, and Pluto state service. Sun/Moon remain separate categories; Pluto is a dwarf
  planet. Planet/Pluto labels reuse each marker's projective apparent direction and remain
  independently controlled.
- `src/science/constellations/`: versioned public-domain BSC5P first-set catalog records,
  project-authored conventional connectivity, validation, and bounded minor-great-circle sampling.
- `src/science/temporal/` and `src/temporal/`: IANA civil-day/DST resolution, Sun daily-path service, civil-hour metadata, and central-clock live refresh scheduling.
- `src/calibration/math.ts` and `src/calibration/state.ts`: pure projection/signed-yaw logic and calibration records.
- `src/xr/state.ts` and `src/xr/controllerCalibration.ts`: capability detection, owned immersive-session lifecycle, target-ray visualization, and native select capture.
- `tests/` and `.github/workflows/deploy-pages.yml`: deterministic contracts, regression coverage, build validation, Pages artifact, and deployment workflow.

## Deferred architecture

Persistence, automatic geolocation, automatic heading, magnetic correction, broad user-programmable
time controls, rendered civil-hour text labels, spatial anchors, hit testing, hand tracking, a full
starfield, constellation labels or catalog expansion, precession trajectories, ecliptic/annual
paths, additional planetary paths, exact lunar bright-limb roll, and experiential layers remain
deferred. The published
astronomy, celestial-rendering, civil-time/DST, provenance, warning/error, and live-refresh systems
are not deferred. The first seven-figure constellation line study is local development work
pending physical Quest validation, not part of the protected published baseline.

## Solar/lunar presentation ownership

Daily Sun and Moon astronomy is calculated outside rendering. Their scene groups own immutable
ordered application-direction buffers and native per-eye shader projection. A missing model is an
ordinary local suppression state, never an invariant exception. The Moon phase dial is separate
finite presentation geometry under one world tangent-frame group; it owns no clock, observer, or
ephemeris. See [Solar/Lunar Path Presentation](SOLAR_LUNAR_PATH_PRESENTATION.md),
[Moon Phase Dial](MOON_PHASE_DIAL.md), and
[Current Moon Appearance](CURRENT_MOON_APPEARANCE.md).
