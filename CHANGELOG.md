# Changelog

## Unreleased

### Added

- Added development-only clean celestial defaults and curated appearance personalization:
  Axis/poles/pole labels/Earth Core OFF on fresh load; persisted versioned constellation base and
  selected-group swatches; Lunar Purple default plus five coordinated lunar families; reset
  controls; query precedence; and bounded material-only lifecycle protection.
- Merged feature `eb97879` as `b813f81` and deployed it through successful development-only
  Actions/Pages run `30033294200`; hosted bundle verification exposed the exact merge SHA.

- Created immutable development checkpoint `quest-approved-expanded-constellations-v1` at
  Quest-approved build `d54a830ab04fb920838e78a350c0a7e540740997`, pushed only to `dev`.
- Added the query-gated semantic celestial color system: Moonlit Water/Legacy Purple lunar
  palettes, Unified/Highlight Selected Group/Experimental Group Palette constellation modes,
  bounded strength controls, material reuse, luminance diagnostics, and no geometry mutation.
- Merged feature `66722d8` as `55fb0c5` and deployed it through successful development-only
  Actions/Pages run `30027473325`; hosted control verification confirmed the visible `55fb0c5` build,
  Highlight/Winter initialization, and Moonlit Water initialization. Physical Quest validation
  remains pending.

- Created immutable development tag `quest-approved-lunar-transit-v1` at accepted build
  `0d3f7219774bac51c0b3f5061205a307e67546d3`, pushed only to the development remote, and recorded
  recovery/verification instructions. No stable release or stable tag was created.
- Added `COSMIC_CONSTELLATION_CATALOG_V2_EXPANDED_29`: 29 query-gated conventional figures using
  de-duplicated public-domain NASA HEASARC BSC5P J2000 records, project-authored connectivity,
  declarative seasonal/learning groups, and the accepted immutable great-circle renderer. Libra is
  included for the Zodiac group; constellation labels remain deferred.
- Merged feature `349a3c7` as `704d5e2` and deployed it through successful development-only
  Actions/Pages run `30020584006`; the hosted bundle exposes `704d5e2` and the V2 catalog study.

- Added the query-gated Lunar Phase Transit Path: one apparent-topocentric EQJ track from previous
  New Moon through next New Moon, authoritative arbitrary-angle phase events, 60-minute sampling,
  bounded one-degree minor-arc subdivision, visible and Earth-hidden portions, eight event notches,
  and a continuous current transit marker. It remains distinct from the Moon Daily Path and compact
  symbolic phase dial.
- Repaired compact-dial and transit phase billboard transforms with independent identity-scale
  anchors. Procedural Moon faces remain square and cached; labels no longer share or mutate image
  transforms. Phase labels now use measured dynamic-width `256 px` textures and dedicated
  Small/Medium/Large/XL presets with Medium default.
- Focused and full automated validation passes `571/571` tests across `71` files. Desktop
  fixed-lunation verification confirms eight chronological provider events, bounded complete-path
  sampling, exact notch alignment, continuous sub-degree current-path alignment, full hidden-path
  retention, dynamic label aspect, and clean square Sprite anchors. Quest acceptance remains
  pending.
- Normally merged feature `6cca323` into development as `77e99e9` and deployed it through
  successful Actions/Pages run `30011414309`. The deployment-record follow-up also makes the
  previous/next-notch diagnostic submit only the two scientifically adjacent events.

- Recorded physical Quest acceptance of all seven first-set constellation figures: recognizable,
  smooth, world-locked, and stereo-stable. The failed Sun/Orion URL is an independent Sun-path
  exception-containment defect, not a constellation failure.
- Repaired ordinary Sun-path not-ready handling so it suppresses locally and never throws from
  `onBeforeRender`. Rendering now uses one immutable ordered direction buffer, native per-eye
  projection, and bounded one-degree spherical subdivision without changing provider samples.
- Added a query-gated apparent-topocentric Moon civil-day path, symbolic eight-phase dial,
  optional phase notches/labels/procedural images, continuous current-phase indicator, and
  current Moon appearance. Procedural disks are cached, distinguish waxing/waning, retain a dark
  New Moon interior, and use a visible framing border. The normal URL remains unchanged.
- Normally merged feature `09eb70d` into development as `4fa087c` and deployed it through
  successful Actions/Pages run `30003777513`. Clean merged validation passed `564/564` tests
  across `67` files, type-check, production build, zero-vulnerability audit, dependency-tree and
  diff checks, plus desktop and hosted query/control verification. Physical Quest acceptance
  remains pending.

- Recorded physical Quest acceptance of the query-gated real-sky orientation bridge as the
  constellation-coordinate foundation: complete grid geometry, credible pole convergence, no
  obvious mirror/inversion, natural planet placement, sound stereo/world locking, and no blocking
  callback or incomplete-frame failure. The canonical grid remains available.
- Added the query-gated seven-figure first constellation line study: Orion, Ursa Major,
  Cassiopeia, Cygnus, Taurus, Leo, and Scorpius. A versioned 43-star public-domain NASA HEASARC
  BSC5P J2000 subset and project-authored conventional 40-segment connectivity feed immutable
  minor-great-circle arcs at no more than `1.5 degrees` per sample interval. The layer consumes
  the accepted EQJ bridge, reuses the grid-style bounded homogeneous XR contract, defaults OFF,
  adds independent controls/diagnostic isolation, and adds no labels or new astronomy dependency.
- Normally merged feature `3d6af53` into development as `92ccdb0` and deployed it through
  successful Actions/Pages run `29974413436`. Clean merged validation passed `552/552` tests
  across `61` files, type-check, production build, zero-vulnerability dependency audit, dependency
  tree and diff checks, plus desktop query/control verification. This remains development-only
  hosted evidence; physical Quest validation is pending.
- Recorded the reported non-blocking Sun-path visual wobble as a separate deferred issue. This
  feature does not change the Sun path; a read-only comparison isolation helps ensure the new
  constellation arcs do not reproduce it.

- Added a query-gated real-sky equatorial orientation study using installed Astronomy Engine
  `2.1.19`: catalog J2000 RA/declination follows `EQJ -> HOR`, while the existing mean-date grid
  takes provider-native `EQD -> HOR` sidereal phase to preserve exact pole-marker convergence.
  The explicit right-handed HOR-to-application remap, geometric/non-refracted policy, bounded
  shader rotation about the encoded Earth core, canonical/real-sky/overlay modes, deterministic
  `skyTime` URLs, body cross-checks, diagnostics, and isolation modes add no constellation data and
  leave the ordinary canonical scene unchanged pending Quest validation.
- Normally merged the bridge as `ccf37fd` into development and deployed it through successful
  Actions/Pages run `29969698393`. Clean merged validation passed `531/531` tests across `56`
  files, type-check, build, dependency audit/tree, diff checks, and desktop fixed-time verification.
  This is development-only hosted evidence; physical Quest validation remains pending.
- Recorded the completed planet-label Quest result: native Three.js Sprites render immediately,
  remain marker-attached and world-locked in both eyes, and toggle correctly. Medium
  (`2.24 × 0.56 m`) at `24 m` is the physically preferred and already-default planet-label preset;
  no constellation-label scale or overlap policy is inferred.

- Recorded physical Quest confirmation that the repaired native Sprite planet labels render and
  remain attached to their markers. The prior largest size was still too small to read comfortably,
  so the scale table now promotes old Large to new Small and supplies Medium/Large/XL/XXL at
  `2×/4×/8×/16×` that base. Medium is the new default; XL and XXL are explicit readability
  experiments, and overlap handling plus constellation-label approval remain deferred.
- Deployed the scale revision `cd37479` to development through successful Actions/Pages run
  `29962714264`. The hosted development response is HTTP 200 and exposes the exact build SHA;
  the later physical Quest comparison selected Medium.

- Diagnosed the Quest-invisible Planet Labels in development build `51b6fff` as zero-area
  projective plane geometry: the label vertex shader ignored every plane vertex. Added a
  query-gated Uranus XR proof and replaced all planet/Pluto labels with finite `24 m`,
  tangent-offset, world-anchored native sprites using validated nonblank canvas textures. Added
  configured/submitted/render-observed diagnostics, per-eye projected centers, isolation modes,
  local failure containment, and lifecycle coverage. Marker science and all validated celestial
  geometry remain unchanged; physical Quest acceptance is pending.
- Normally merged the label repair as `c18e28a` into development master and deployed it through
  successful Actions/Pages run `29960227474`. Clean merged validation passed `508/508` tests across
  `54` files, and the hosted bundle exposes the merge build identifier and repaired-label proof.
  This is development-only deployment evidence; physical Quest validation remains pending.

- Extended the development-only apparent topocentric body catalog through Uranus and Neptune and
  added Pluto as a clearly classified dwarf planet. Each uses the existing Astronomy Engine,
  observer/time, ENU-to-application, calibrated-parent, and projective XR path. Added independent
  default-off Planet Labels and individual planet/Pluto visibility controls; labels share their
  marker direction, have bounded deterministic offsets, and do not change Sun/Moon/pole labels.
  No stable, core, grid, equator, calibration, or spindle behavior changed. Physical Quest
  validation remains pending.
- Normally merged the extension as `8a66c4b` into development master and deployed it through
  successful Actions/Pages run `29951224433`. This is development-only hosted evidence, not
  physical Quest validation or a stable change.

- Integrated the physically preferred far finite holographic Earth-core proxy into normal
  development behavior. The Earth Core toggle now selects exactly one direct marker when ON and
  none when OFF, including diagnostic isolation; the retained scientific marker is comparison-only.
  Added editable, non-persistent Swartz Creek development defaults: `42.9572`, `-83.8308`, and
  `240 m` MSL. No stable repository, calibration math, celestial grid, or parked spindle behavior
  changed.
- Normally merged the integration as `1d7d5fb` into development master and deployed it through
  successful Actions/Pages run `29943133628`. This is development-only deployment evidence; the
  integrated Quest toggle/default confirmation remains pending.

- Added one default-off development finite-core parallax experiment. The
  `coreStudy=finite-parallax` query replaces only the visible scientific core marker with a fixed
  `12 cm` local-metre 3D proxy along the scientific observer-to-core direction at `1.5`, `2.5`, or
  `4.0 m`. Native cameras produce stereo/head-motion parallax; the scientific core, celestial
  grid, calibration, prior studies, and parked spindle remain unchanged. Focused automated tests
  prove opposite projected motion for right/left camera translation, nonzero stereo disparity,
  and the expected inverse distance/parallax relationship. Physical Quest go/no-go validation is
  still pending.
- Normally merged the experiment as `f496f78` into development `master` and published it through
  successful Actions/Pages run `29924654192`. The hosted page and relative bundle return HTTP 200
  and embed the merge build identifier. This is development-only deployment evidence, not physical
  Quest acceptance or stable promotion.

- Added default-off development observer-offset geocentric presentation studies: a bounded
  observer-to-core ribbon, reference-surface marker, sparse reference-Earth wireframe, local
  geodetic tangent patch, and combined comparison mode. They are selected by `geoStudy`, use only
  the validated finite homogeneous contract, add diagnostic isolation, and leave the validated
  celestial grid/equator and parked spindle unchanged. No production variant is selected pending
  physical Quest comparison.
- Normally merged the study work as `a63a24a` into development `master` and published it through
  successful Actions/Pages run `29917770378`. This remains development-only; physical Quest
  comparison is the next evidence gate.

- Added the architecture-only `ObserverOffsetGeocentricPresentation` contract for later
  development study aids. It reuses the existing shared Earth core, WGS84 semi-major reference
  radius, two-radius celestial-grid scale, local ENU tangent basis, and finite homogeneous anchor
  convention without adding scene objects or changing the validated grid/equator. The explicit
  WGS84 ellipsoid-versus-reference-sphere distinction prevents a future visual aid from silently
  moving the observer or inventing a second center. No deployment or physical test occurred.

- Repaired development pole-marker/grid convergence: marker and label anchors now use the grid's
  canonical exact antipodal directions and finite homogeneous convergence points. The grid,
  spindle, calibration, and styling remain unchanged.

- Added a development-only celestial coordinate grid: four restrained closed declination circles
  (`+60`, `+30`, `-30`, `-60`) and twelve explicitly open pole-to-pole longitude arcs at two-hour
  intervals. It shares the immutable geocentric core/axis/equatorial basis, uses a documented
  deterministic non-sidereal 0h reference, and adds reusable coordinate conversion, controls,
  diagnostics, isolation, and focused geometry/XR-safety tests. No spindle behavior, stable
  repository, stable workflow, or stable Pages deployment changed.
- Normal development-only integration merged `9025105` as `d4cd9ce` and published it through
  Actions run `29910750550`. Clean merged validation passes 468/468 tests across 46 files,
  type-check, build, audit, dependency tree, and diff check; hosted desktop controls and assets
  load without blocking console errors. Physical Quest stereo acceptance remains pending.

- Independently revalidated and normally integrated the unified geocentric celestial structure
  with merge `1acedcdac660214a7cbc9cf0ace469f1c2e3c20d`. Feature and merged `master` pass
  438/438 tests across 40 files, type-check, production build, diff, and dependency checks with no
  technical drift after the prior review. GitHub Actions run `29769161186` passed install,
  type-check, tests, build, artifact upload, and Pages deployment. Hosted desktop regression
  passed for calibration, horizon, core/spindle/equator/poles, parallax, toggles/reset/
  recalibration, seven bodies, Sun path, civil-hour notches, live updates, relative assets, and
  console health. Physical Quest acceptance remains pending.
- Normalized the remaining celestial and temporal project records: published baseline, local
  spindle correction, historical milestone evidence, and genuinely deferred work are now
  explicitly separated. Historical plans are retained for traceability without overriding current
  state. No production code, tests, dependencies, workflow, deployment, or physical Quest
  acceptance changed; independent integration remains pending.
- Reconciled stale project records with the published celestial baseline: the WGS84 Earth core,
  geocentric axis/poles, celestial equator, observer-centered horizon, body markers, Sun path,
  civil-hour notches, and live updates are already published; the rigid spindle, unified
  geocentric presentation contract, and renderer-gate remediation remain local. No production
  code, tests, dependencies, deployment, or physical Quest acceptance changed. Independent
  integration re-gate remains next.
- Closed the bounded unified-geocentric renderer gates locally: the default spindle now has one
  pale-steel color and one `0.72` opacity across the core; optional below-horizon hiding uses a
  visibility-only classifier and cannot create a default style seam. The equator now keeps static
  Float32 direction attributes and uploads Float32-rounded per-eye core/radius uniforms through
  its real render callback, avoiding callback-time geometry uploads after Three.js has prepared a
  draw. Permanent production-boundary tests cover shader-facing uploads, fitted projected
  core/ring agreement, Michigan/lateral/vertical views, eye routing, immutability, disposal, and
  non-degenerate spindle visibility. The local suite passes 438/438 tests across 40 files, type-check,
  build, diff/dependency checks, and desktop development/preview smoke checks. Integration,
  deployment, and physical Quest acceptance remain pending.
- Unified the finite WGS84 Earth core, rigid P03 spindle, exact projective NCP/SCP directions, and
  mean celestial-equatorial plane in one immutable presentation contract and one identity scene
  assembly. The equator now renders a finite two-Earth-radius reference ring centered on the core
  with bounded homogeneous coordinates, preserving coherent parallax without raw Earth-scale GPU
  vertices. The local horizon remains observer-centered and separate.
- Added permanent core/equator identity, axis/plane perpendicularity, ring-plane/fitted-center,
  shared-pole, observer-offset, transform/camera, projection-equivalence, GPU-bound, hierarchy,
  toggle/re-entry, and disposal coverage. DEC-029 supersedes only DEC-023's `w = 0` rendering
  choice. The preceding local unified tip passed clean install, type-check, 39 files / 432 tests,
  production build, dependency/diff checks, and development/production-preview orbit, calibration,
  reset, toggle, asset, and console smoke checks before this renderer-gate follow-up. This local
  follow-up adds continuous spindle styling and production rendering-boundary coverage; final test
  count and validation are recorded with its local commit. Independent integration, deployment,
  and physical Quest acceptance remain pending.
  Astronomy, calibration, bodies, Sun path, and time science are unchanged.

- Added one validated `EarthAxisSpindlePresentation` source containing the WGS84 core, normalized
  P03 axis direction, exact antipode, bounded extent, frame/revisions, provenance, and validity.
  Added strict local/world/projected collinearity, camera-view, calibration/recalibration,
  rigid-parent, toggle/reset/re-entry, pole-agreement, bounded-GPU, depth, and disposal coverage;
  the complete suite now passes 36 files / 421 tests.
- Added `docs/EARTH_AXIS_SPINDLE.md`, DEC-028, and developer-only spindle diagnostics. The
  historical spindle checklist was superseded by the canonical pending unified-geocentric Quest
  checklist. Physical acceptance, integration, publication, and deployment remain pending.
- Independently validated and normally integrated Milestone 2F with merge `31be4cc`. The feature
  and merged `master` pass 36 files / 416 tests, type-check, production build, dependency/diff
  checks, civil-time/provenance/failure/cache/motion probes, and development/preview regression.
  GitHub Actions run `29707073636` passed build and Pages deployment; hosted path/notch controls,
  zone override, repeated toggling, live-clock advancement, assets, existing layers, and console
  health pass. Physical Quest acceptance remains pending.

- Closed the remaining local Milestone 2F scientific contracts: daily-path observer provenance now
  carries an explicit application-owned schema version distinct from observer revision and WGS84
  model identity; path, sample, notch, cache identity, and temporal diagnostics retain it.
  Temporal failures now pass through one immutable context-enrichment boundary, including early
  invalid sampling-policy failures, and a deterministic shared-clock regression proves one
  simulated hour changes the directions of all seven supported bodies. The suite passes 416 tests.
  Integration, deployment, and Quest acceptance remain pending.

- Hardened the local Milestone 2F daily Sun-path science boundary with immutable full observer
  provenance on paths/samples/notches, deterministic structured warning disclosure, and
  context-rich `TEMPORAL_PATH_FAILURE` handling for otherwise generic path-construction failures.
  Failed daily paths do not enter the cache; an adversarial policy-version test proves cache
  isolation. This is local remediation only: independent review, integration, deployment, and
  Quest acceptance remain pending.

- Added a bounded local 24-hour apparent Sun path with exact valid civil-hour notches, an explicit
  IANA `Intl` time-zone contract, daylight-saving 23/25-hour handling, below-horizon continuity,
  projective linear-depth rendering, and a live-Sun emphasis. The existing central simulation
  clock now advances visible Sun, Moon, and planet state through one minute-or-better real-time
  refresh cadence; no second scientific clock, labels, ecliptic, phase, or body path was added.
- Recorded reported Quest feedback for the previously deployed body and Sun-clock experience: it
  was beautiful and compelling; markers were visible; and the user plausibly identified Sun,
  Mercury, and Venus. Labels were absent and limited identification of other bodies; the user also
  observed that the celestial equator is not the Sun's path. This observation concerns the
  published body markers, daily Sun path, civil-hour notches, and live updates—not the unmerged
  rigid spindle/unified geocentric correction. No angular, lifecycle, comfort, or all-seven
  identity claim is inferred.

- Independently validated and normally integrated the actual solar-system body layer with merge
  `b24b3e9`. The feature and merged `master` pass 383 tests, type-check, production build,
  dependency/diff checks, adversarial provider/provenance/cache probes, and development/preview
  regression. GitHub Actions run `29703133387` passed build and Pages deployment; hosted controls,
  default-hidden behavior, seven-body diagnostics, repeated toggling, relative assets, and browser
  console health pass. Physical Quest acceptance remains pending.
- Hardened the local actual-body scientific boundary with one immutable Astronomy Engine
  apparent-topocentric provider descriptor. The derived body service now validates active
  registry/snapshot agreement, derives its cache key from that active descriptor, verifies both
  EQD_TRUE and HORIZONTAL_ENU provenance, and rejects malformed results with structured errors.
  Adversarial local tests cover name/version/adapter mismatches, cache isolation, cross-result
  disagreement, and nested immutability. A follow-up diagnostic remediation now preserves full
  immutable expected/actual provider capability snapshots and deterministic mismatch fields for
  frame/profile/body/capability-only rejections.

- Added a local bounded actual solar-system body layer for Sun, Moon, Mercury, Venus, Mars,
  Jupiter, and Saturn. It consumes the existing explicit observer/clock configuration through the
  Astronomy Engine adapter, preserves actual apparent topocentric altitude/azimuth and
  below-horizon truth, and renders only projective marker directions with a global visibility
  toggle. No phase, labels, pointing, paths, ecliptic, projection, or new clock was added.
- Recorded the user's intentional promotion of actual body placement ahead of the still-planned
  long-term precession prerequisite review. Independent integration/publication and Quest body
  acceptance remain pending.
- Reconciled the successful Milestone 2D Meta Quest physical report as a bounded usability PASS:
  the user described the deployed spatial-reference experience as incredible and really coming
  together nicely. No detailed eye-mode, angular, drift, lifecycle, performance, or comfort
  measurements were invented; no production code changed.
- Added a durable long-term product roadmap that separates scientific truth, presentation,
  interaction, environmental, interpretive, and geographic/cultural concerns; records future
  capability families and their evidence/privacy/performance guardrails; and explicitly preserves
  the current physical eye-mode/local-horizon acceptance task without authorizing later work.
- Reconciled the published Milestone 2C Quest evidence as a conditional pass: the equator is good
  and workable, and axis/equator each form one clean line in either eye independently, while
  binocular viewing doubles both. The likely category is binocular fusion/stereo presentation;
  no exact cause or unreported physical result is invented.
- Added independent `both`, `left`, and `right` XR-eye presentation modes for axis/poles,
  celestial equator, and local horizon. Filtering uses actual `XRView.eye` identity, creates no
  per-eye geometry, leaves scientific state unchanged, and retains a visible desktop/mono fallback.
- Added a default-hidden 96-sample local astronomical-horizon Tier 1 reference at a bounded 24 m
  presentation radius. It spans canonical east/north around the calibrated observer tangent
  origin, aligns with existing cardinals under one parent yaw, uses linear non-writing depth, and
  discloses WGS84 geodetic up as the current approximation to astronomical vertical.
- Added DEC-024/DEC-025, binocular/horizon contracts, a Quest follow-up procedure, and 41
  deterministic eye-filter/horizon/calibration/depth/lifecycle regressions for 340 total tests.
- Independently validated and normally integrated Milestone 2D in merge `79705c9`. Semantic
  eye-order/missing-view probes, immutable-science checks, local ENU/cardinal/seam/yaw probes,
  lifecycle review, 340 tests, build, and development/production-preview regression pass. The
  retained feature branch is unchanged; publication and physical Quest acceptance remain pending.
- Published integrated Milestone 2D normally at `46cf613`. GitHub Actions run #16 passed install,
  type-check, 340 tests, build, Pages upload, and deployment. Hosted eye-mode and local-horizon
  controls, desktop fallback, readiness/reset, subpath assets, and console health pass; physical
  Quest acceptance remains pending.

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
  production/desktop gate. The existing
  axis-curvature and Earth-core distance-perception concerns remain separate and unresolved.
- Published the integrated celestial equator normally from `master` at `54d64d0`. GitHub Actions
  run #14 passed 21 files / 299 tests, build, artifact upload, and Pages deployment. Hosted
  observer/time/axis/equator controls, default-hidden visibility, readiness, reset clearing, and
  repository-subpath assets pass; physical Quest acceptance remains pending.

### Changed

- Replaced the two independently colored/faded/rasterized Earth-axis half-lines and core-covered
  joint with one pale steel, constant-width, projectively clipped spindle mesh/material. Pole
  markers use the same per-eye direction and exact negation; the spindle draws over the scientific
  core marker, remains visible through the transparent explanatory treatment, and retains the
  parent-only yaw plus linear non-writing depth contracts. No scientific or unrelated celestial
  layer changed.
- Replaced the initial offscreen-core opacity fallback with a bounded homogeneous projective-side
  classifier. North/south visibility and emphasis now remain distinct even when the geocentric
  core projects hundreds of NDC units outside the viewport.
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
- **Historical Milestone 2 planning state:** began Milestone 2 planning only. No celestial,
  astronomy-library, temporal, source, dependency, workflow, deployment, or configuration
  implementation was performed at that point.
- Defined Astronomy Engine adoption behind validation wrappers; selected canonical ENU as the
  scientific horizontal boundary and P03 precession-only mean pole/equator of date as the initial
  structural target, gated by a dedicated provider proof.
- **Historical planning contract:** defined one UTC simulation clock, explicit IANA civil-time
  schedules, sampled scientific precession trajectories, independently optional solar/lunar
  temporal capabilities, and strict separation between scientific coordinates and contemplative
  presentation. Later published milestones implemented the bounded body and Sun-clock subset.
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

- Rigid-spindle local gate: clean install, type-check, 36 files / 421 tests, production build,
  dependency/diff checks, and Vite development/production-preview browser regression pass. Camera
  orbit, `0 -> 90 degree` recalibration, reset/re-entry, three toggle cycles, existing celestial
  controls, relative preview asset loading, and clean browser consoles pass. Quest acceptance is
  **NOT RUN**.
- Independent implementation re-gate: the initial offscreen-core side-control fallback failed;
  bounded homogeneous classification and its Michigan regression resolved the material finding.
  The re-gate and post-fix production-browser shader/visibility smoke pass with a clean console.
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
- **Historical Milestone 1 limitation (superseded by later published celestial milestones):** the
  physical marker remained the trusted reference, while automatic heading, compass, geolocation,
  magnetic correction, persistence, and visible astronomy were absent at that milestone.
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
