# Cosmic Calibration WebXR

Cosmic Calibration is a mixed-reality cosmic-navigation project. Milestone 0 established a physically validated Quest 3 passthrough and floor-relative reference frame. Milestone 1 adds an explicit, user-driven calibration from the room-relative frame to a pre-marked true-north direction. Milestone 2A provides the validated non-visual astronomy foundation. The integrated Milestone 2B replacement models the WGS84 Earth core at world scale and one coherent P03 mean axis with antipodal projective NCP/SCP directions.

Scientific geometry and contemplative interpretation remain separate layers. The published
Milestone 2C mean celestial equator has a conditional physical pass: it is good/workable and each
eye receives one clean line, while binocular viewing produces doubled axis/equator lines. Published
Milestone 2D provides reversible per-layer eye presentation and a calibrated local-horizon
reference. Published Milestone 2E adds a default-hidden actual-direction
layer for Sun, Moon, Mercury, Venus, Mars, Jupiter, and Saturn using the same explicit observer,
UTC clock, correction, provenance, calibrated-parent, and linear-depth contracts. It adds no
automatic heading, geolocation, precession, ecliptic, projection mode, phase, labels, paths, or
contemplative system. Published Milestone 2F adds an optional observer-relative apparent Sun path for
the selected explicit IANA civil day, exact valid civil-hour notches on that path, and bounded live
updates through the same central simulation clock. The path is not the celestial equator or an
annual ecliptic; labels and other body paths remain deferred.

The local `fix/earth-axis-spindle` branch corrects the user-observed bowed/hinged axis presentation
and unifies the finite Earth core, spindle, projective poles, and celestial-equatorial plane under
one Earth-centered presentation contract. The equator is a bounded two-Earth-radius reference
ring centered on the core and perpendicular to the same axis; bounded homogeneous rendering
preserves that finite center without raw Earth-scale GPU vertices. The surface observer and local
horizon remain offset and observer-centered. P03, WGS84, calibration, bodies, Sun path, and time
science are unchanged; independent integration and physical Quest acceptance remain pending.

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
regression pass with 340 tests. The user has physically tested the deployed spatial-reference
experience and accepted it as a compelling workable baseline; detailed mode-by-mode and
quantitative Quest observations remain unmeasured.
The published Milestone 2E body layer passed final independent provider/provenance/cache review,
383 automated tests, normal integration, GitHub Actions/Pages deployment, and hosted desktop
regression. Physical Quest acceptance of the body markers remains pending.
The user subsequently reported positive bounded Quest use of the body markers, plausibly
identifying Sun, Mercury, and Venus; absent labels limited other identification and the user noted
that the celestial equator is not the Sun's path. Milestone 2F passes final independent review,
416 automated tests, type-check, production build, normal integration, GitHub Actions/Pages
deployment, and hosted desktop regression. Physical Quest acceptance remains pending.

- [Celestial reference architecture](docs/CELESTIAL_REFERENCE_ARCHITECTURE.md)
- [Astronomy Engine evaluation](docs/ASTRONOMY_ENGINE_EVALUATION.md)
- [Celestial validation strategy](docs/CELESTIAL_VALIDATION_STRATEGY.md)
- [Temporal-layer architecture](docs/TEMPORAL_LAYER_ARCHITECTURE.md)
- [Milestone 2 sequence](docs/MILESTONE_2_SEQUENCE.md)
- [Long-term product roadmap](docs/LONG_TERM_PRODUCT_ROADMAP.md) - future capability families and
  guardrails; not an implementation schedule or an authorization to start a later feature
- [Official astronomy source register](docs/OFFICIAL_ASTRONOMY_SOURCES.md)
- [Astronomy adapter contract](docs/ASTRONOMY_ADAPTER_CONTRACT.md)
- [Mean pole model validation](docs/MEAN_POLE_MODEL_VALIDATION.md)
- [Earth axis and celestial poles](docs/EARTH_AXIS_AND_CELESTIAL_POLES.md)
- [Geocentric rendering precision](docs/GEOCENTRIC_RENDERING_PRECISION.md)
- [WebXR depth contract](docs/WEBXR_DEPTH_CONTRACT.md)
- [Rigid Earth-axis spindle](docs/EARTH_AXIS_SPINDLE.md)
- [Binocular presentation modes](docs/BINOCULAR_PRESENTATION_MODES.md)
- [Local astronomical horizon](docs/LOCAL_ASTRONOMICAL_HORIZON.md)
- [Milestone 2D physical acceptance](docs/MILESTONE_2D_PHYSICAL_ACCEPTANCE.md)
- [Actual solar-system body layer](docs/SOLAR_SYSTEM_BODY_LAYER.md)
- [24-hour apparent Sun path](docs/SOLAR_24_HOUR_CLOCK.md)

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
  one authoritative camera-relative geocentric P03 spindle descriptor rendered as a single
  projectively clipped constant-width strip with exact antipodal projective NCP/SCP markers and no
  raw large-world GPU positions;
- an optional bounded homogeneous mean celestial-equator reference ring centered on the same
  Earth core and perpendicular to the same rotational spindle, plus independent eye modes for
  axis/equator/local horizon; and
- a default-hidden 96-sample, 24 m calibrated local tangent-plane horizon distinct from the
  1.5 m room-floor diagnostic ring; and
- a default-hidden seven-marker actual apparent topocentric Sun/Moon/Mercury/Venus/Mars/Jupiter/
  Saturn direction layer. Marker centers are projective directions, not literal body distances or
  diameters; Moon phase, labels, and projections are deferred; and
- an optional projective Sun-only daily apparent path with valid IANA local-civil-hour notches,
  below-horizon continuity, and central-clock real-time refresh. It is distinct from the P03
  celestial equator and does not represent a physical solar orbit or annual ecliptic.

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
current hosted application is:

`https://thinksql1.github.io/cosmic-calibration-webxr/`

GitHub Pages workflow run `29707073636` deployed integrated Milestone 2F merge `31be4cc`. Hosted
desktop verification confirmed the existing horizon/axis/poles/equator/body layers, Sun-path and
civil-hour-notch controls, repeated toggling, zone override, repository-relative assets, a bounded
live-clock advance, and clean browser diagnostics.

## Validation boundary

Pure math, state transitions, controller integration, existing XR lifecycle, type-check, build, and
desktop simulation are locally testable. The reported Quest 3 Milestone 1 acceptance flow passed
for controller-based calibration and usable lifecycle behavior. That evidence does not establish
laboratory-grade angular accuracy, broad device coverage, or unreported edge-case outcomes.
The geocentric replacement's local automated/development checks cover WGS84 core placement, one
centerline, exact projective antipodes, ENU mapping, controls, readiness, and console health. The
local spindle correction additionally covers strict core/endpoint incidence, projected
collinearity across representative cameras, calibration/recalibration and rigid-parent invariance,
one-object toggle/reset/re-entry lifecycle, and bounded single-strip rendering.
Independent review, integration, production-preview closeout, publication, and hosted regression
have passed for the hardened geocentric renderer. The user has conditionally accepted the physical
Quest experience as workable; detailed individual physical observations were not captured. The
hosted build is the geocentric replacement, not the earlier observer-centered proxy.

## Explicitly deferred

Local-storage persistence, automatic geolocation, automatic compass access, headset magnetometer access, magnetic declination, true-versus-magnetic-north correction, automatic north detection, raw provider-result caching, spatial anchors, plane detection, hit testing, hand tracking, precession/ecliptic geometry, additional body projections/paths, broad time controls, audio, 360 video, backend services, accounts, and analytics are absent. The [long-term product roadmap](docs/LONG_TERM_PRODUCT_ROADMAP.md) records possible future families without changing this current scope.
