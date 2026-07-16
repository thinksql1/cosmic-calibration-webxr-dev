# Changelog

## Unreleased

### Added

- Deterministic Vitest coverage for pending requests, renderer binding, active sessions, cleanup, retry, cleanup failure, and end-during-binding lifecycle transitions.
- Pure horizontal projection, signed-yaw, bearing, and cardinal-direction calibration math with an explicit `-Z` application-north convention.
- In-memory north-calibration state, left/right tracked-controller target-ray capture, calibration-only aiming rays, recoverable invalid-direction handling, and duplicate-capture suppression.
- A dedicated geographic-reference group with restrained N/S/E/W labels and cardinal axes plus shared desktop bearing simulation.
- Physical setup and troubleshooting guidance in `docs/CALIBRATION.md`, architecture details, and a separate Milestone 1 Quest checklist.
- Deterministic coverage for controller-only calibration, explicit release gating, exact event-frame
  target-ray poses, tracking failure, overlay input isolation, and late-session cleanup.

### Changed

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

### Validated

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

### Known limitations

- The earlier chair-height observation was environmental and resolved by resetting the Quest floor for standing use; this evidence is limited to the tested Quest 3 environment.
- The Three.js production chunk triggers Vite's 500 kB size advisory.
- Milestone 0 does not establish future north calibration, geographic heading, controller ray, persistence, astronomy, or celestial-geometry behavior.
- Milestone 1 physical acceptance is limited to the reported Quest 3 flow. No laboratory-grade
  angular-error measurement, Quest OS/browser version, controller-by-controller coverage,
  DOM-overlay availability, or targeted pose-loss observation was supplied.
- The physical marker remains the trusted reference. Automatic heading, compass, geolocation,
  magnetic correction, persistence, and astronomy remain absent.
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
