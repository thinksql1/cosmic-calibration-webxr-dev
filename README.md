# Cosmic Calibration WebXR

Cosmic Calibration is a mixed-reality cosmic-navigation project. Milestone 0 established a physically validated Quest 3 passthrough and floor-relative reference frame. Milestone 1 adds an explicit, user-driven calibration from the room-relative frame to a pre-marked true-north direction. Milestone 2A provides the validated non-visual astronomy foundation. The integrated Milestone 2B replacement models the WGS84 Earth core at world scale and one coherent P03 mean axis with antipodal projective NCP/SCP directions.

Scientific geometry and contemplative interpretation remain separate layers. The published
Milestone 2C mean celestial equator has a conditional physical pass: it is good/workable and each
eye receives one clean line, while binocular viewing produces doubled axis/equator lines. Local
Milestone 2D publishes reversible per-layer eye presentation and a calibrated local-horizon
reference; it adds no automatic heading, geolocation, precession, ecliptic, body, clock, or
contemplative system.

## Milestone 2 architecture status

Milestone 2 architecture is complete and its bounded 2A0 validation spike passes. The exact
`astronomy-engine@2.1.19` dependency is isolated behind typed application contracts; NASA/JPL
Horizons fixtures validate the Sun/Moon adapter, and IAU SOFA/P03 fixtures validate the
precession-only mean pole. After two bounded remediation rounds, the final independent Milestone
2A gate found no blocking or material defect. The retained 2A0 and 2A branches are integrated
normally into `master`, which passes 239 tests and the production build. GitHub Pages workflow run
#7 deployed commit `ca0a9d7`, and the unchanged hosted Milestone 1 interface, simulation/reset,
subpath assets, and browser diagnostics regressed cleanly. Milestone 2B passed its independent,
automated, and desktop gates and is integrated normally into `master`. GitHub Pages workflow run
#9 deployed commit `5b657e4`; hosted observer/time/axis controls, golden cases, reset, subpath
assets, and console health pass for the previously published proxy. The first independent gate of
the local geocentric replacement accepted its WGS84/P03 science but blocked raw large-coordinate
GPU rendering, logarithmic XR depth, and missing disposal. Those renderer defects are remediated
locally with per-eye camera-relative/homogeneous geometry, linear compositor-safe depth, and
explicit resource ownership. The independent renderer gate and normal local integration pass with
291 tests. GitHub Actions run #11 and the hosted geocentric controls/readiness/reset/subpath-assets
regression pass. The user has physically tested the published hardened geocentric experience and
accepted it as workable with no blocking issue reported. This is conditional physical acceptance:
detailed A–K observations were not individually captured. Milestone 2C adds an integrated and
published mean celestial-equator implementation based on the same immutable P03 snapshot and
geocentric Earth-core axis; its independent gate and GitHub Actions run #14 pass with 299 tests.
Quest evidence conditionally accepts the equator while identifying binocular-only doubling. The
published Milestone 2D feature provides independent `both`/`left`/`right` eye modes and a
default-hidden 24 m local tangent-plane horizon. GitHub Actions run #16 and hosted desktop
regression pass with 340 tests; physical acceptance remains pending.

- [Celestial reference architecture](docs/CELESTIAL_REFERENCE_ARCHITECTURE.md)
- [Astronomy Engine evaluation](docs/ASTRONOMY_ENGINE_EVALUATION.md)
- [Celestial validation strategy](docs/CELESTIAL_VALIDATION_STRATEGY.md)
- [Temporal-layer architecture](docs/TEMPORAL_LAYER_ARCHITECTURE.md)
- [Milestone 2 sequence](docs/MILESTONE_2_SEQUENCE.md)
- [Official astronomy source register](docs/OFFICIAL_ASTRONOMY_SOURCES.md)
- [Astronomy adapter contract](docs/ASTRONOMY_ADAPTER_CONTRACT.md)
- [Mean pole model validation](docs/MEAN_POLE_MODEL_VALIDATION.md)
- [Earth axis and celestial poles](docs/EARTH_AXIS_AND_CELESTIAL_POLES.md)
- [Geocentric rendering precision](docs/GEOCENTRIC_RENDERING_PRECISION.md)
- [WebXR depth contract](docs/WEBXR_DEPTH_CONTRACT.md)
- [Binocular presentation modes](docs/BINOCULAR_PRESENTATION_MODES.md)
- [Local astronomical horizon](docs/LOCAL_ASTRONOMICAL_HORIZON.md)

## Current scope

The shared desktop/XR scene contains:

- the Milestone 0 floor origin, room-relative X/Y/Z axes, horizon ring, and zenith/nadir line;
- a dedicated geographic-reference group containing N/S/E/W labels and horizontal cardinal axes;
- explicit in-memory calibration, recalibration, cancellation, and reset states;
- left- or right-controller target-ray capture during immersive AR;
- a desktop bearing simulation using the same projection, yaw, and state logic as XR capture;
- non-visual immutable observer/time contracts, tagged scientific frames and correction profiles,
  canonical ENU conversion, frozen provider provenance, and a bounded P03 mean-pole provider;
- manual in-memory observer input, explicit UTC fixtures, a WGS84-modeled Earth-core point, and
  one camera-relative/homogeneous geocentric P03 mean-axis group with antipodal projective NCP/SCP
  directions and no raw large-world GPU positions;
- an optional homogeneous mean celestial equator plus independent eye modes for axis/equator/local
  horizon; and
- a default-hidden 96-sample, 24 m calibrated local tangent-plane horizon distinct from the
  1.5 m room-floor diagnostic ring.

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

## Scientific foundation status

Milestone 2A provides an explicit observer/UTC-clock/calibration/configuration snapshot pipeline with a validated P03 mean axis and equator basis. Its runtime boundary owns immutable instants/vectors, rejects malformed clocks before providers, and keys cache provenance explicitly. Independent acceptance, integration, publication, and hosted regression pass. The current local Milestone 2B replacement consumes that snapshot without direct provider calls, maps the mean axis into horizontal ENU, computes the modeled WGS84 Earth center relative to the surface observer, and maps both into the calibrated geographic parent once. NCP/SCP remain directions at infinity; the `10^13 m` finite points are diagnostics only. The GPU consumes per-eye camera-relative core values and homogeneous unit directions under a linear non-writing depth contract. The manual observer/time controls remain in-memory diagnostics, not geolocation or a general time system. See [Scientific State Foundation](docs/SCIENTIFIC_STATE_FOUNDATION.md), [Scientific Snapshot Contract](docs/SCIENTIFIC_SNAPSHOT_CONTRACT.md), [Scientific Cache Policy](docs/SCIENTIFIC_CACHE_POLICY.md), [Earth Axis and Celestial Poles](docs/EARTH_AXIS_AND_CELESTIAL_POLES.md), [Geocentric Rendering Precision](docs/GEOCENTRIC_RENDERING_PRECISION.md), and [WebXR Depth Contract](docs/WEBXR_DEPTH_CONTRACT.md).

## Physical north-marker workflow

Milestone 1 assumes the physical marker already represents true north. DOM overlay is an
optional enhancement; calibration remains operable with standard tracked-controller events
when the overlay is absent.

1. Establish a safe standing/room-scale Quest boundary and correct physical floor.
2. Stand at the chosen physical origin marker and enter AR.
3. Use **Calibrate North** in the optional overlay, or press and release either controller
   trigger once. This first controller action begins calibration but cannot capture.
4. Point either tracked controller at the true-north marker while holding its target ray
   approximately level.
5. Press and release that controller’s trigger again to capture.
6. Squeeze while calibrating to cancel. Holding the trigger for at least 1.2 seconds is the
   no-squeeze cancel fallback.
7. From a saved calibration, press/release trigger or short-squeeze to recalibrate; long-hold
   trigger or squeeze for at least 1.2 seconds to reset.
8. Verify the N/S/E/W group, diagnostic yaw, and physical marker alignment.

Target rays are visible only during active calibration for usable tracked controllers. When
DOM overlay is unavailable, controller-attached instructions and a world-space fallback convey
the active state. Capture uses the exact `XRInputSourceEvent` frame and active reference space;
a missing, invisible, disconnected, stale/default-only, non-finite, or nearly vertical pose is
rejected without replacing a prior accepted calibration. A ray with horizontal magnitude below
`0.25` is rejected because it is within roughly `14.5°` of vertical and cannot provide a stable
horizontal bearing.

## Session and persistence limits

Immersive AR still requires `local-floor`; DOM overlay is requested only as an optional feature
for calibration controls. Interactive overlay controls cancel `beforexrselect` so a DOM action
cannot also become an XR capture. Those listeners and the native controller-event listeners are
removed on session cleanup. Acquired-session ownership, renderer binding, cleanup, and
duplicate-start protection remain unchanged.

Calibration is in memory only. Reloading, session exit, boundary reset, room change, or tracking-origin change requires deliberate recalibration. Recenter behavior must be checked physically; a displayed yaw is a room-relative diagnostic, not magnetic heading or scientific data.

## Static hosting

Vite uses `base: './'`, keeping emitted assets relative for GitHub Pages project subpaths. The
current hosted Milestone 1 site is:

`https://thinksql1.github.io/cosmic-calibration-webxr/`

GitHub Pages workflow run #16 deployed integrated Milestone 2D commit `46cf613`. Hosted desktop
verification confirmed the observer/time/axis/equator/local-horizon controls, all three eye-mode
selectors, desktop fallback, simulation/reset behavior, repository-subpath assets, and clean
browser diagnostics.

## Validation boundary

Pure math, state transitions, controller integration, existing XR lifecycle, type-check, build, and
desktop simulation are locally testable. The reported Quest 3 Milestone 1 acceptance flow passed
for controller-based calibration and usable lifecycle behavior. That evidence does not establish
laboratory-grade angular accuracy, broad device coverage, or unreported edge-case outcomes.
The geocentric replacement's local automated/development checks cover WGS84 core placement, one
centerline, exact projective antipodes, ENU mapping, controls, readiness, and console health.
Independent review, integration, production-preview closeout, publication, and hosted regression
have passed for the hardened geocentric renderer. The user has conditionally accepted the physical
Quest experience as workable; detailed individual physical observations were not captured. The
hosted build is the geocentric replacement, not the earlier observer-centered proxy.

## Explicitly deferred

Local-storage persistence, automatic geolocation, automatic compass access, headset magnetometer access, magnetic declination, true-versus-magnetic-north correction, automatic north detection, raw provider-result caching, spatial anchors, plane detection, hit testing, hand tracking, celestial-equator/precession/body geometry, temporal clocks, animated/general time controls, audio, 360 video, backend services, accounts, and analytics are absent.
