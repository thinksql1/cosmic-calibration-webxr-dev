# Changelog

## Unreleased

### Added

- Added the local Milestone 2C mean celestial-equator layer: a 96-sample homogeneous projective
  great circle from the immutable P03 snapshot's validated equator basis and science-owned local
  sampling plane. It is centred scientifically on the modeled WGS84 Earth core, perpendicular to
  the accepted mean axis, controlled by one visibility toggle, and uses the existing per-eye
  camera-relative/linear-depth/disposal contracts without changing the Earth-axis renderer.

- Added DEC-023 and bounded snapshot, circle-math, projective-frame, calibration, depth, and
  lifecycle regressions. The local suite passes 21 files / 299 tests with type-check, production
  build, dependency/diff, and development/preview checks. Independent validation, integration,
  publication, and physical Quest testing remain pending.
- Independently validated and normally integrated the celestial equator in merge `0926cbf`.
  Temporary probes reproduced plane, seam, antipode, observer, asymmetric-eye, translation,
  malformed-basis, and accepted-recalibration behavior; merged `master` passes 299 tests and the
  production/desktop gate. Publication and physical Quest acceptance remain pending. The existing
  axis-curvature and Earth-core distance-perception concerns remain separate and unresolved.

### Changed

- Replaced the local `1.8 m` observer-centered Earth-axis proxy on an unintegrated feature branch
  with a WGS84 geocentric world-scale model: the observer stays at the modeled surface origin, an
  actual modeled Earth-core point is placed in local ENU meters, and one P03 mean-axis centerline
  extends to exact antipodal projective NCP/SCP directions.
- Retained finite `10^13 m` proxies only as CPU-side convergence diagnostics with the accepted
  sub-`0.14 arcsecond` bound. NCP/SCP remain directions at infinity and explicitly are not
  Polaris; no raw large-world coordinate now reaches the GPU.
- Recorded the first independent geocentric gate: WGS84/P03 science, convergence, calibration,
  automation, development, and preview passed; raw large GPU coordinates, logarithmic XR depth,
  missing disposal, and rendering-test gaps blocked integration and publication.
- Hardened the local renderer with per-eye camera-relative Earth-core coordinates, homogeneous
  projective pole directions, bounded coefficient/quad geometry, ordinary linear `0.01–100 m`
  depth, and non-testing/non-writing celestial overlay materials.
- Added explicit idempotent ownership/disposal for axis geometries, shader materials, label
  textures, and render callbacks plus page-teardown cleanup and deterministic precision, stereo,
  depth, resource-reuse, and disposal regressions. The hardened local suite passes 18 files / 291
  tests while retaining the 270-test published baseline.
- Added DEC-022 and the geocentric precision/WebXR depth contracts. Independent re-gate,
  integration, publication, and Quest testing remain NOT RUN; the hosted site still contains the
  earlier proxy.
- Independently reproduced projective/stereo cache behavior, single-yaw calibration, lifecycle,
  and precision bounds; feature and merged-master validation pass 291 tests, and normal merge
  `706baab` integrates the hardened renderer while retaining its feature branch. Publication and
  physical Quest acceptance remain NOT RUN.
- Published `cdb5f4c` normally without force. GitHub Actions run #11 passed build/deploy and the
  hosted geocentric title, Earth-core/axis controls, readiness, visibility, reset, subpath assets,
  and console regression pass. Physical Quest acceptance remains NOT RUN.
- Recorded the completed physical Quest test as **CONDITIONAL PASS**: the user reported the
  published hardened geocentric Earth-core axis workable, with no blocking issue reported. Detailed
  A–K observations were not individually captured, no production-code change was required, and the
  implementation is accepted as the current Milestone 2B baseline.

### Added

- Milestone 2B observer-horizontal mean-axis snapshot contract: the validated P03 GCRS
  pole/matrix pair is proved against mean-date `+Z`, then mapped through the WGS84 geodetic
  Earth-fixed-to-ENU basis into exact antipodal NCP/SCP directions.
- One restrained observer-centered `1.8 m` symbolic Earth-axis group with NCP/SCP markers,
  optional labels, full/subdued below-horizon treatment, concise readiness/diagnostics, manual
  in-memory observer input, and explicit central-clock UTC fixtures.
- Deterministic axis, latitude/hemisphere, longitude-invariance, time-provenance, mapping,
  visibility, rebuild/reset, and persistent-scene-group regression coverage plus the Milestone 2B
  scientific/presentation and Quest-test documentation; the complete local suite is now 15 files
  / 270 tests, retaining all 239 integrated tests.
- Milestone 2A remediation coverage for same-yaw accepted recalibration, owned simulation instants, strict configuration/clock restoration and direct snapshot validation, nested vector immutability, provider/version/time-source/calibration cache identity, semantic clock equality, true LRU recency, and conditional observer-height datum warnings; the suite now has 12 files / 239 tests.
- Non-visual Milestone 2A revisioned observer, explicit-tick UTC clock, read-only geographic-calibration adapter, validated Tier 1 configuration, provider registry, immutable P03 axis/equator-basis snapshot, structured readiness, and bounded exact-key LRU cache.
- Deterministic state, serialization, clock, calibration, snapshot, basis, cache, and orchestration tests; expanded by both remediation passes to 12 files / 239 tests.
- Scientific state, snapshot-contract, and cache-policy documentation plus DEC-018, preserving the presentation-only calibrated-yaw boundary.
- Deterministic Vitest coverage for pending requests, renderer binding, active sessions, cleanup, retry, cleanup failure, and end-during-binding lifecycle transitions.
- Pure horizontal projection, signed-yaw, bearing, and cardinal-direction calibration math with an explicit `-Z` application-north convention.
- In-memory north-calibration state, left/right tracked-controller target-ray capture, calibration-only aiming rays, recoverable invalid-direction handling, and duplicate-capture suppression.
- A dedicated geographic-reference group with restrained N/S/E/W labels and cardinal axes plus shared desktop bearing simulation.
- Physical setup and troubleshooting guidance in `docs/CALIBRATION.md`, architecture details, and a separate Milestone 1 Quest checklist.
- Deterministic coverage for controller-only calibration, explicit release gating, exact event-frame
  target-ray poses, tracking failure, overlay input isolation, and late-session cleanup.
- Milestone 2 documentation for the celestial reference-frame hierarchy, Astronomy Engine
  evaluation, observer/time and temporal-layer contracts, scientific validation strategy,
  conservative implementation sequence, and official astronomy source register.
- Exact `astronomy-engine@2.1.19` runtime dependency behind an application-owned, non-visual
  adapter with immutable UTC instants, validated WGS84 observers, explicit vertical datum,
  tagged true-of-date/horizontal frames, named correction profiles, provenance, and typed errors.
- Canonical azimuth/altitude-to-ENU math plus a separate no-Three.js
  `(east, north, up) -> (east, up, -north)` application-basis mapper.
- An application-owned IAU P03 precession-only bias-precession provider with explicit TT input,
  GCRS-to-mean-date matrix direction, exact antipodal poles, and a future equator normal/basis.
- 69 deterministic scientific tests and offline NASA/JPL Horizons DE441 and IAU SOFA/P03 fixtures,
  bringing the full suite to 8 files / 135 tests.
- Implemented astronomy-adapter and mean-pole validation contracts with exact source, fixture,
  tolerance, correction, domain, and precision boundaries.

### Changed

- Published integrated Milestone 2B `master` normally at `5b657e4`; GitHub Pages workflow run #9
  passed install, type-check, 270 tests, build, artifact upload, and deployment. Physical Quest
  acceptance remains NOT RUN.
- Passed the independent Milestone 2B scientific/visual gate and integrated the retained
  `feature/milestone-2b-earth-axis-poles` branch normally into local `master` with merge commit
  `09a6e67`. Presentation consumes the immutable scientific snapshot, maps ENU once under the
  existing geographic-yaw parent, and clears when observer, clock, model, or calibration readiness
  is absent. Merged-master validation passes 270 tests, type-check, production build, diff, and
  dependency checks. Publication and physical Quest acceptance remain NOT RUN.
- Published integrated Milestone 2A `master` normally at `ca0a9d7`; GitHub Pages run #7 passed
  install, type-check, 239 tests, build, artifact upload, and deployment. Hosted Milestone 1
  simulation/reset, repository-subpath assets, and browser diagnostics regressed cleanly, with no
  visible celestial geometry introduced.
- Passed the final independent Milestone 2A scientific gate and integrated the retained 2A0 and
  2A branches normally into local `master` with merge commits `1757781` and `6fcaa33`. Merged
  validation passes 239 tests, type-check, production build, diff, and dependency checks; no
  visible celestial geometry was introduced. Publication was not performed in that integration
  checkpoint and is recorded separately above.
- Recorded the second independent Milestone 2A gate failure and completed its bounded local remediation: clocks now own canonical immutable instants, direct malformed clock state cannot invoke providers, configuration revisions are runtime-validated, cache identity includes time source/rate and explicit accepted-capture identity, equator normals are owned, and the datum warning is conditional with frozen provenance metadata. Independent re-gating remains required; no visible celestial behavior, merge, push, or deployment occurred.
- The first Milestone 2A remediation established accepted-event invalidation, value-based clock revisions, nested snapshot isolation, strict supported-profile restoration, unified P03 provider identity at `1.0.0`, and true-LRU evidence; its subsequent independent gate exposed the remaining bounded runtime contracts above.
- Hardened the WebXR session controller so an acquired session is owned and subscribed before renderer binding.
- Added binding-failure cleanup through `session.end()`, blocked retry during unresolved work, and prevented an end-during-binding race from reporting false active state.
- Added restrained phase-labelled browser-console diagnostics for unexpected binding and cleanup failures.
- Moved `actions/configure-pages@v5` into the Pages-authorized deploy job; `pages: write` and `id-token: write` remain limited to that job.
- Reconciled lifecycle, workflow, validation, and next-task records after the independent integration gate found defects in the initial Milestone 0 implementation.
- Integrated the complete Milestone 0 feature branch into local `master` with merge commit `df8b26a`; the feature branch was retained and history was not rewritten.
- After local integration, `NEXT_TASK.md` contained one authorization-gated task to publish the Milestone 0 test site to GitHub Pages.
- Published the exact `b1bf282` `master` build from the public `thinksql1/cosmic-calibration-webxr` repository through GitHub Pages using the existing GitHub Actions workflow.
- `NEXT_TASK.md` now contains one physical Quest 3 acceptance task for the published build.
- Recorded initial physical Quest evidence without changing application code: immersive AR entry, passthrough, spatial stability, and exit/re-entry/recenter passed; standing-floor alignment requires a controlled retest because initial seated testing placed geometry near chair height.
- Replaced the broad Quest acceptance task with one bounded standing-calibration floor-alignment retest; seated or chair-height Quest calibration is recorded only as an unconfirmed environmental hypothesis.
- Completed Milestone 0 after the controlled standing-floor Quest 3 retest passed; no north calibration, astronomy, controller ray, geographic heading, or persistence behavior was added.
- Replaced the floor retest with one bounded Milestone 1 physical north-marker calibration task.
- Requested DOM overlay only as an optional XR feature while retaining `local-floor` as required.
- Calibration remains in memory and resets across immersive-session exit; persistence, automatic heading, magnetic correction, and astronomy remain deferred.
- Recorded the failed initial Milestone 1 gate: optional DOM overlay was the only practical XR
  calibration path, missing current poses could fall through to stale/default transforms, and
  overlay actions could collide with XR selection.
- Added a controller-only begin/release/capture state machine with squeeze and deliberate-hold
  cancel/recalibrate/reset actions plus restrained controller/world spatial feedback.
- Required capture from the exact native XR input-event frame and reference space; missing,
  disconnected, invisible, non-finite, and stale/default-only pose cases remain recoverable and
  preserve any prior accepted calibration.
- Added per-control `beforexrselect` cancellation while DOM overlay is active and cleanup guards
  that prevent native or overlay listeners from being reattached after manager deactivation.
- Replaced the physical-device task with one independent Milestone 1 re-gate; no merge, push,
  deployment, or physical Quest validation occurred during remediation.
- Integrated the remediated Milestone 1 feature branch into local `master` with normal merge commit
  `8a20899`; the feature branch was retained and history was not rewritten.
- Replaced the independent re-gate task with one bounded physical Quest north-calibration
  acceptance task that starts only after hosted Milestone 1 controls are confirmed.
- Pushed integrated `master` normally at `ddcf676`; GitHub Pages workflow run #5 deployed the
  Milestone 1 build without force-push, history rewrite, branch deletion, or custom-domain changes.
- Completed Milestone 1 from reported physical Quest 3 acceptance evidence and replaced the
  physical-test task with one Milestone 2 celestial reference-frame architecture task.
- Began Milestone 2 planning only. No celestial, astronomy-library, temporal, source, dependency,
  workflow, deployment, or configuration implementation was performed.
- Defined Astronomy Engine adoption behind validation wrappers; selected canonical ENU as the
  scientific horizontal boundary and P03 precession-only mean pole/equator of date as the initial
  structural target, gated by a dedicated provider proof.
- Defined one UTC simulation clock, explicit IANA civil-time schedules, sampled scientific
  precession trajectories, independently optional temporal layers, and strict separation between
  scientific coordinates and contemplative presentation.
- Replaced the architecture-planning task with one bounded non-visual astronomy-adapter and
  mean-pole validation spike. No dependency was installed and no Milestone 2 source work began.
- Completed the bounded Milestone 2A0 spike on its feature branch without visible geometry,
  application-entry integration, merge, push, deployment, or physical Quest celestial testing.
- Selected one next task: implement the production-quality non-visual observer, simulation
  snapshot, provider facade, and cache/invalidation foundation before any visible axis or pole.
- Completed the bounded Milestone 2A foundation locally without visible geometry, UI changes,
  dependency changes, merge, push, deployment, or Quest celestial testing; selected the coherent
  Earth-axis and celestial-pole layer as the only next task.

### Validated

- Hosted Milestone 2B verification passes for visible observer/time/axis controls, ready NCP/SCP
  geometry, equator/mid-north/mid-south diagnostics, labels and below-horizon controls,
  reset/not-ready clearing, repository-subpath assets, and a clean browser console. This is
  desktop hosted evidence, not physical Quest world-locking or directional-accuracy evidence.
- Independent Milestone 2B probes pass for equator, both hemispheres, high latitude, longitude
  cancellation, explicit time provenance, exact antipodes, same-yaw calibration identity,
  out-of-domain readiness rejection, ENU/application signs, and single geographic-yaw application.
- Milestone 2B local development and production-preview checks pass for equator, mid-northern,
  mid-southern, and high-northern visual cases; explicit observer/time controls; label and
  below-horizon controls; recalibration/reset; orbit, zoom, resize, relative production assets,
  and clean application console output. Physical Quest validation remains NOT RUN.
- GitHub Pages run #7 passed on exact commit `ca0a9d7`. The hosted Milestone 1 page loaded from the
  project subpath, `90 degrees` produced geographic yaw `-90.0 degrees`, reset restored the
  uncalibrated state, and Chrome reported no warnings or errors. This was a non-visual regression
  deployment, not a Quest celestial test.
- The independent Milestone 0 re-gate found no blocking or material implementation, lifecycle, workflow, test, documentation, dependency, or deferred-scope findings.
- On the feature branch, `npm ci`, type-check, 15/15 unit tests, production build, `git diff --check`, and `npm ls --depth=0` passed.
- On integrated `master`, the same `npm ci`, type-check, 15/15 unit tests, production build, diff, and dependency-tree checks passed again.
- Desktop development and production-preview scenes passed Chromium inspection for reference geometry, OrbitControls, resize, readable fallback status, and console health; production preview passed again after integration.
- Production asset references remain relative and suitable for an unknown Pages project subpath.
- GitHub Pages workflow run #2 passed its build (15/15 tests) and deployment jobs; the hosted production page loaded at `https://thinksql1.github.io/cosmic-calibration-webxr/` with subpath-safe assets, a rendered desktop canvas, readable fallback status, and no browser-console warnings or errors.
- Physical Quest testing: immersive AR entry PASS; passthrough PASS; world locking/stability PASS; exit, re-entry, and recenter PASS.
- Controlled standing-floor Quest 3 retest: reference geometry visible; origin and horizon ring aligned with the physical floor; ring horizontal; zenith/nadir vertical; world locking, exit, re-entry, recenter, comfort, and usability all PASS.
- Milestone 1 local validation: clean `npm ci`, type-check, 3 test files / 43 tests, production build, dependency inspection, and `git diff --check` passed.
- Development and production-preview desktop simulation passed for known bearings, recalibration, reset, geographic-label rendering, relative asset paths, and console health.
- Milestone 1 remediation clean install, type-check, 3 test files / 66 tests, production build,
  dependency inspection, and `git diff --check` passed locally, including
  cross-controller release gating, canceled-action behavior, exact pose arguments, valid current
  identity pose, stale/missing pose rejection, stale-press invalidation, feedback fallback, overlay
  isolation, and late-bind cleanup.
- Development and production-preview inspection passed in the Codex in-app Chromium browser:
  Milestone 0 geometry, known-bearing simulation, recalibration/reset, OrbitControls, resize,
  relative production assets, readable fallback status, and console health remained intact.
- The independent Milestone 1 re-gate found no blocking or material controller-only, current-pose,
  overlay-collision, coordinate, test, documentation, dependency, or deferred-scope finding.
- Merged `master` passed a clean install, type-check, 3 test files / 66 tests, production build,
  dependency inspection, `git diff --check`, and development/production-preview desktop checks.
- GitHub Pages run #5 passed checkout, Node setup, clean install, type-check, 66/66 tests, build,
  artifact upload, Pages configuration, and deployment on exact commit `ddcf676`.
- The hosted site exposes the Milestone 1 Physical North controls and desktop simulation; `90°`
  produced `-90.0°`, reset restored uncalibrated state, project-subpath assets loaded, and the
  browser console remained free of warnings and errors.
- Reported physical Quest 3 Milestone 1 acceptance passed on the deployed site: hosted controls,
  immersive AR/passthrough, controller start/capture separation, north capture, coherent N/S/E/W
  geometry, world locking/floor alignment, cancel, recalibration, reset, and session lifecycle
  were usable with no blocking physical defect observed.
- Milestone 2 research used official Astronomy Engine, IAU SOFA, IAU, IERS, USNO/NOVAS, JPL,
  NGA, IANA, and W3C sources; confirmed capabilities, model boundaries, time-scale limitations,
  license implications, and reference-validation roles are recorded with URLs and versions where
  available.
- Documentation-only scope validation confirmed no source, test, package, lockfile, workflow, or
  deployment-configuration change in the Milestone 2 architecture checkpoint.
- Milestone 2A0 verified the official package name/version/license/exports and bounded the
  dependency delta to exact `astronomy-engine@2.1.19` with no declared runtime package dependency.
- Three airless apparent topocentric Sun/Moon cases pass a predeclared `0.02 degrees` NASA/JPL
  Horizons tolerance; the maximum measured coordinate difference is `0.008280 degrees`, maximum
  directional separation is `0.001276 degrees`, and the ellipsoid/MSL height-datum mismatch is
  explicit rather than treated as a conversion.
- The direct P03 provider reproduces all nine published IAU SOFA `pmat06` components and four
  frozen mean-pole vectors within `1e-12`; exact antipodes, equator perpendicularity, continuity,
  determinism, mean/true discrimination, and bounded-domain rejection pass.
- Milestone 2A0 type-check, 135/135 tests, and production build pass. The visible production chunk
  remains 574.29 kB because the non-visual modules are not imported by the application entry point.
- A no-write Vite/Oxc library check bundled the adapter/provider into one import-free ESM chunk
  (75,901 bytes minified / 25,178 bytes gzip) without adding the absent `esbuild` package.

### Known limitations

- The earlier chair-height observation was environmental and resolved by resetting the Quest floor for standing use; this evidence is limited to the tested Quest 3 environment.
- The Three.js production chunk triggers Vite's 500 kB size advisory.
- Milestone 0 does not establish future north calibration, geographic heading, controller ray, persistence, astronomy, or celestial-geometry behavior.
- Milestone 1 physical acceptance is limited to the reported Quest 3 flow. No laboratory-grade
  angular-error measurement, Quest OS/browser version, controller-by-controller coverage,
  DOM-overlay availability, or targeted pose-loss observation was supplied.
- The physical marker remains the trusted reference. Automatic heading, compass, geolocation,
  magnetic correction, persistence, and visible astronomy remain absent.
- Milestone 2A0 validation is Tier 1 and operation-specific. It does not establish a complete
  astronomy-provider accuracy claim, physical XR pointing accuracy, or visible celestial behavior.
- The P03 provider is restricted to J2000.0 plus or minus one Julian century and is not the
  long-term precession-path model. Nutation, CIP, EOP, polar motion, Chandler wobble, and observed
  offsets remain excluded.
- The existing Three.js production chunk still triggers Vite’s 500 kB size advisory.

## 2026-07-15 — Initial project activation

### Added

- Project charter and state initialized from the reviewed orientation evidence.
- Initial project decisions accepted.
- Repository baseline established.
- Milestone 0 Vite, TypeScript, Three.js, and WebXR technical spike.
- Shared desktop/XR reference scene with floor origin, room-relative axes, horizon ring, and zenith/nadir line.
- Explicit immersive-AR capability and session-state handling requiring `local-floor`.
- GitHub Pages workflow configuration and Milestone 0 architecture/Quest testing documentation.

### Validated

- Node.js, npm, and Git availability verified during activation.
- Initial type-check, 7/7 unit tests, and production build passed.
- Desktop development and production-preview scenes passed manual inspection in two Chromium surfaces with no console errors.

### Known limitations

- Quest WebXR, passthrough, `local-floor`, stability, and recenter validation remain **NOT RUN**.
- No remote or deployment exists; the Pages workflow has not run.
