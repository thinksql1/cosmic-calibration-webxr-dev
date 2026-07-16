# Project State

**Last updated:** 2026-07-16 America/New_York

**Updated by:** Codex / project control

**Current phase:** Milestone 2 celestial reference-frame architecture planning

**Overall status:** **Milestone 1 COMPLETE.** Automated, desktop, hosted, and reported physical
Quest 3 acceptance validation pass. Milestone 2 is planning-only; no celestial implementation has
started.

## One-paragraph state summary

Milestone 0 is complete and its deployed build remains at
https://thinksql1.github.io/cosmic-calibration-webxr/. The first Milestone 1 independent gate
failed because calibration depended on optional DOM overlay, capture could use a stale/default
controller transform when no current pose existed, and an overlay action could also produce XR
`select`. Commit `2275661` remediated those defects with a controller-only lifecycle, exact
event-frame target-ray pose validation, and `beforexrselect` isolation. The independent re-gate
found no blocking or material issue, and merge commit `8a20899` integrated the retained feature
branch normally into local `master`. Clean install, type-check, 66 deterministic tests, production
build, dependency/diff inspection, and development/production-preview desktop behavior pass on
merged `master`. Commit `ddcf676` was pushed normally and GitHub Pages run #5 deployed it
successfully. The hosted Milestone 1 controls, simulation, reset, repository-subpath assets, and
console health passed desktop inspection. The user then reported the deployed Quest 3 acceptance
flow passed: hosted controls, immersive AR/passthrough, controller start/capture separation,
controller-based north capture, coherent N/S/E/W geometry, world locking, floor alignment,
cancel/recalibrate/reset, and session lifecycle were usable with no blocking defect observed.
Milestone 1 is complete. This establishes physical usability for the tested flow, not
laboratory-grade angular accuracy, broad device coverage, or unreported edge-case outcomes.

## Working and verified

- `npm ci`: passed from the committed lockfile.
- `npm run typecheck`: passed with TypeScript `7.0.2`.
- Current `npm run test`: 3 files and 66 tests passed with Vitest `4.1.10`.
- `npm run build`: passed with Vite `8.1.4`; `dist/` contains relative `./assets/...` references.
- Current remediation `git diff --check` and `npm ls --depth=0`: passed; no dependency or
  workflow file changed. Earlier Milestone 0 integration checks also passed on `master`.
- Independent Milestone 0 re-gate: no blocking or material findings; implementation/workflow gate passed, with overall result **CONDITIONAL PASS** solely because physical Quest validation is pending.
- Desktop development scene rendered with origin, X/Y/Z axes, floor ring, and zenith/nadir line.
- OrbitControls interaction changed the camera view; resize updated the canvas to the tested viewport; unsupported WebXR messaging remained readable with no console errors or warnings.
- Production preview loaded successfully on the feature branch and again from integrated `master`; relative production assets loaded with no console errors or warnings.
- GitHub Pages workflow run #2 passed on the published `b1bf282` commit: build completed with 15/15 tests and deploy completed successfully.
- The hosted site loads at `https://thinksql1.github.io/cosmic-calibration-webxr/`; its static assets resolve under the repository subpath, the desktop canvas renders, the compatibility fallback is readable, and the browser console has no warnings or errors.
- Initial physical Quest 3 evidence: immersive AR entry PASS, passthrough PASS, world locking/stability PASS, and session exit/re-entry/recenter PASS.
- Controlled standing-floor Quest 3 retest: immersive AR, passthrough, reference geometry, origin/floor alignment, horizon ring, zenith/nadir line, world locking, lifecycle/recenter, comfort, and usability PASS.
- Original Milestone 1 implementation validation: clean `npm ci`, TypeScript check, 3 test files /
  43 tests, production build, `git diff --check`, and dependency-tree inspection PASS before the
  independent gate exposed the three runtime-input defects.
- Milestone 1 remediation clean install, type-check, deterministic unit/integration suite (3 files /
  66 tests), production build, `git diff --check`, and dependency-tree inspection PASS. Coverage
  includes controller-only input, current-event pose validity, cross-controller release
  gating and stale-press invalidation, overlay isolation, and cleanup races.
- Desktop development and production-preview simulation: known bearings `0°`, `90°`, `180°`, and `270°` produced the expected signed yaw; recalibration replaced the prior result; reset restored uncalibrated state; geographic labels rendered; relative assets loaded; console remained clean.
- Independent Milestone 1 re-gate: PASS for controller-only lifecycle, current-event pose proof,
  DOM-overlay suppression, coordinates/frame separation, tests, documentation, dependencies, and
  deferred-scope review; physical Quest behavior remains NOT RUN.
- Local Milestone 1 integration: merge commit `8a20899` retained the feature branch and did not
  rewrite history. Merged `master` passed `npm ci`, type-check, 66/66 tests, production build,
  `git diff --check`, dependency inspection, and development/production-preview desktop checks.
- GitHub Pages workflow run #5 passed on pushed commit `ddcf676`: checkout, Node setup, clean
  install, type-check, 66/66 tests, production build, artifact upload, Pages configuration, and
  deployment completed successfully.
- Hosted Milestone 1 verification passed at
  `https://thinksql1.github.io/cosmic-calibration-webxr/`: Physical North controls and desktop
  simulation are visible, `90°` produces `-90.0°`, reset restores uncalibrated state, relative
  assets resolve under the project subpath, and the browser console has no warnings or errors.
- Physical Quest 3 Milestone 1 acceptance: PASS, based on the user's reported completed deployed
  test. Immersive AR, passthrough, controller-only calibration start and later capture, coherent
  N/S/E/W alignment, world locking, floor alignment, cancel, recalibration, reset, and usable
  session lifecycle passed with no blocking physical defect reported.
- Milestone 1 physical evidence establishes usability of the tested north-marker flow. It does not
  include a reported angular-error measurement, Quest OS/browser versions, controller-by-controller
  coverage, DOM-overlay availability, or a separately observed tracking-loss/pose-rejection result.

## Implemented but not fully verified

- Secure-context, WebXR API, immersive-AR support, and owned-session lifecycle handling are implemented and unit-tested without an XR runtime.
- An explicit user action requests `immersive-ar` with `requiredFeatures: ['local-floor']`. Internally, the controller distinguishes idle, requesting, acquired/render-binding, binding-after-end, active, and ending/cleanup phases.
- An acquired session is owned and given an `end` listener before renderer binding. Binding failure requests `session.end()` and blocks retry until cleanup settles; cleanup failure is surfaced while stale ownership is cleared.
- The renderer is alpha-enabled, clears its opaque background in XR, and uses the Three.js XR animation loop.
- Floor-relative reference geometry is authored around `Y = 0` and the XR reference-space type is `local-floor`.
- The GitHub Pages workflow is configured to use GitHub Actions with Pages/OIDC permissions limited to its deploy job. Successful deployment runs have completed; its first push-triggered run failed before Pages was enabled and does not represent an application failure.
- Physical north-marker calibration supports either tracked controller, target-ray visualization during calibration only, horizontal projection with a `0.25` magnitude threshold, explicit signed yaw, cancel/recalibrate/reset, and simulated/physical result provenance.
- Geographic N/S/E/W labels and cardinal axes live in a dedicated group. Calibration never rotates the camera, renderer, room/floor frame, room axes, controllers, or future scientific source coordinates.
- Optional DOM overlay is requested for immersive calibration controls; `local-floor` remains the only required XR feature.
- Controller-only calibration no longer depends on DOM overlay. Native select/squeeze transitions
  separate begin from capture, and spatial feedback remains available without overlay.
- Capture requires the exact native input event frame pose for the connected target-ray space and
  active reference space. Missing, stale/default-only, invisible, disconnected, and non-finite
  poses are rejected without replacing a previous accepted calibration.
- Interactive DOM-overlay controls cancel `beforexrselect`; native input and overlay listeners are
  removed on session cleanup, and late renderer-binding continuation cannot bind an inactive manager.

## In progress

- Define the Milestone 2 celestial reference-frame architecture and sequencing only.

## Blocked

- None. Milestone 2 implementation remains intentionally out of scope until architecture planning
  is reviewed and accepted.

## Known defects or limitations

- Milestone 0 Quest 3 coverage is limited to the tested physical environment; it does not establish behavior for all rooms, boundaries, browsers, or device configurations.
- Milestone 1 Quest 3 acceptance passed for the reported controller-based calibration flow,
  geographic alignment, world locking/floor alignment, lifecycle, and cancel/recalibrate/reset.
  Exact angular error, controller-by-controller coverage, DOM-overlay availability, and targeted
  tracking-loss/pose-rejection behavior were not reported separately.
- Calibration is in memory only and is deliberately invalidated across session exit. Reload, recenter, boundary reset, tracking-origin change, or room change requires deliberate recalibration.
- The physical marker remains the trusted true-north reference for Milestone 1. No automatic
  heading, compass, geolocation, magnetic declination, or true-versus-magnetic-north correction
  exists.
- Desktop Chromium reports immersive AR as unsupported; desktop validation cannot exercise a browser XR session.
- The production bundle contains a 574.29 kB minified application/Three.js chunk and triggers
  Vite's 500 kB advisory; no runtime defect was observed.
- GitHub Pages run #5 deployed the Milestone 1 application at `ddcf676`; no custom domain is configured.
- Calibration remains session-scoped and in memory. Session exit, reload, recenter, boundary reset,
  tracking-origin change, or room change requires deliberate recalibration as documented.

## Important unknowns

- Exact Quest OS and Quest Browser versions, numerical north-alignment error, controller-specific
  coverage, DOM-overlay availability, and targeted pose-loss behavior for the accepted Milestone 1
  test were not reported.
- Astronomy-library selection, time/location input contract, coordinate/epoch conventions, and
  quantitative astronomical validation tolerances for Milestone 2.

## Active artifacts

| Artifact | Purpose | Status |
|---|---|---|
| `src/calibration/` | Pure north projection/yaw math and calibration state | Implemented; automated PASS |
| `src/scene/` | Room/floor frame plus separate geographic-reference group | Implemented; desktop PASS; Quest Milestone 1 accepted |
| `src/xr/` | Owned session lifecycle and tracked-controller calibration adapter | Implemented; automated PASS; Quest controller-calibration flow accepted |
| `tests/` | Capability, session, calibration math/state, and controller integration tests | 3 files / 66 tests passed |
| `README.md` | Commands, workflow, conventions, deployment, and limits | Current |
| `docs/ARCHITECTURE.md` | Frame separation, yaw convention, lifecycle, and module boundaries | Current |
| `docs/CALIBRATION.md` | Physical setup, calibration procedure, limits, and troubleshooting | Current |
| `docs/QUEST_TESTING.md` | Milestone 0 evidence and Milestone 1 acceptance checklist | Milestone 1 Quest 3 acceptance PASS |
| `.github/workflows/deploy-pages.yml` | Pages validation/build/deploy configuration | Run #5 passed for Milestone 1 at `ddcf676` |
| `COSMIC_CALIBRATION_WEBXR_PROJECT_BRIEF.md` | Product concept and long-term context | Active reference |
| `PROJECT_CHARTER.md` | Project definition and boundaries | Active |
| `DECISIONS.md` | Accepted foundation and geographic-frame convention decisions | Current |
| `NEXT_TASK.md` | One Milestone 2 celestial reference-frame architecture task | Active; planning only |

## Environment

| Item | Current value | Verified? |
|---|---|---|
| Operating system | Windows | Yes |
| Runtime/toolchain | Node.js `v24.18.0`; npm `11.16.0` | Yes |
| Runtime dependency | Three.js `0.185.1` | Yes |
| Development dependencies | Vite `8.1.4`; TypeScript `7.0.2`; Vitest `4.1.10`; Three/WebXR types | Yes |
| Build command | `npm run build` | Passed |
| Test command | `npm run test` | 66/66 passed for remediation |
| Deployment target | GitHub Pages at `https://thinksql1.github.io/cosmic-calibration-webxr/` | Run #5 passed; Milestone 1 UI verified |

## Risks

| Risk | Likelihood | Impact | Mitigation or next evidence |
|---|---|---|---|
| Session lifecycle regresses after future changes | Low/unknown | High | Preserve current automated and physical evidence; revalidate on Quest after XR lifecycle changes |
| North marker is captured with an invalid or nearly vertical controller direction | Low/unknown | Medium | `0.25` horizontal threshold and readable rejection are tested; accepted flow passed, but targeted pose-loss evidence was not separately recorded |
| Reused yaw is invalid after a room, boundary, or tracking-origin change | Medium | High | Keep recalibration/reset visible; do not treat in-memory state as universally valid |
| Passthrough behavior differs outside the tested Quest 3 environment | Low/unknown | Medium | Revalidate on device after future rendering changes; do not generalize the tested Quest 3 result |
| Bundle size affects Quest startup/performance | Low/unknown | Medium | Measure on device before adding optimization complexity |
| Scientific and contemplative layers become conflated later | Medium | High | Preserve traceable scientific modules and explicit framing |

## Parking Lot

- Milestone 2 celestial architecture: Astronomy Engine, celestial bodies, ecliptic, poles, and
  real-time astronomy are planned but not implemented.
- Geolocation, persistent room calibration, automatic heading, and magnetic declination.
- Orbital-awareness, time navigation, and teaching-scale modes.
- Contemplative, sacred-geometry, cultural, and symbolic layers, clearly distinct from scientific claims.
- Star catalog, audio, hand tracking, persistent anchors, multi-user use, and native applications.

## Recent evidence

| Date | Evidence | Result | Location |
|---|---|---|---|
| 2026-07-15 | Baseline checkpoint | Local Git baseline established | Commit `96aea97` |
| 2026-07-15 | Initial Milestone 0 implementation | Independent integration gate failed; remediation required | Commit `420b7f9` |
| 2026-07-15 | Session lifecycle remediation | PASS; acquired-session ownership, cleanup, retry, and end-race tests added | `tests/xr-state.test.ts` |
| 2026-07-15 | Dependency installation | PASS; allowed set installed from lockfile | `npm ci` |
| 2026-07-15 | Type-check and unit tests | PASS; 15/15 tests | `npm run typecheck`; `npm run test` |
| 2026-07-15 | Production build and path inspection | PASS; relative asset paths | `npm run build`; `dist/index.html` |
| 2026-07-15 | Desktop development and production-preview inspection | PASS; scene, controls, status UI, and console checks | Local Vite dev and preview |
| 2026-07-15 | Independent Milestone 0 re-gate | PASS for implementation, workflow, automated, desktop, documentation, and scope checks; overall CONDITIONAL PASS pending Quest | Feature commit `eccc78b` |
| 2026-07-15 | Local Milestone 0 integration and revalidation | PASS; merged without rewriting history and reran the full local suite | Merge commit `df8b26a` on `master` |
| 2026-07-15 | GitHub Pages publication | PASS; public `thinksql1/cosmic-calibration-webxr` created, `master` pushed normally, Pages configured for GitHub Actions, workflow run #2 built and deployed | `https://github.com/thinksql1/cosmic-calibration-webxr/actions/runs/29457929634` |
| 2026-07-15 | Hosted desktop verification | PASS; production page, subpath assets, reference canvas, fallback status, and browser console inspected | `https://thinksql1.github.io/cosmic-calibration-webxr/` |
| 2026-07-15 | Initial physical Quest 3 acceptance evidence | PASS for immersive AR entry, passthrough, spatial stability, and exit/re-entry/recenter; floor alignment conditional because geometry appeared at chair/seated height | User-observed evidence at `https://thinksql1.github.io/cosmic-calibration-webxr/` |
| 2026-07-15 | Controlled standing-floor Quest 3 retest | PASS; origin and horizon ring aligned with the physical floor, ring was horizontal, zenith/nadir was vertical, world locking and lifecycle/recenter remained stable, and comfort/usability passed | User-observed evidence at `https://thinksql1.github.io/cosmic-calibration-webxr/` |
| 2026-07-15 | Milestone 1 local implementation validation | PASS; clean install, type-check, 43/43 tests, production build, desktop known bearings/reset/recalibration, relative preview assets, and clean console | `feature/milestone-1-north-calibration` |
| 2026-07-15 | Initial Milestone 1 independent integration gate | FAIL; optional-overlay dependency, stale/default pose capture risk, and overlay/XR select collision required remediation | Feature commit `8b3dbe2` |
| 2026-07-15 | Milestone 1 input remediation | Clean install, type-check, 66/66 tests, build, dependency/diff checks, and desktop development/preview PASS; independent re-gate pending | `feature/milestone-1-north-calibration` |
| 2026-07-16 | Independent Milestone 1 remediation re-gate | PASS; the three original input defects are resolved, automated/desktop checks pass, and physical Quest behavior remains NOT RUN | Commit `2275661` |
| 2026-07-16 | Local Milestone 1 integration and revalidation | PASS; normal no-fast-forward merge, retained feature branch, 66/66 merged-master tests, build, dependency/diff, and desktop development/preview checks | Merge commit `8a20899` on `master` |
| 2026-07-16 | Milestone 1 publication | PASS; normal push of `ddcf676`, workflow run #5 build/deploy success, hosted Physical North UI, simulation/reset, subpath assets, and console verified | `https://github.com/thinksql1/cosmic-calibration-webxr/actions/runs/29494408661` |
| 2026-07-16 | Milestone 1 physical Quest 3 acceptance | PASS; user reported the deployed hosted flow passed for AR/passthrough, controller start/capture separation, north capture, coherent cardinal geometry, world/floor stability, cancel/recalibrate/reset, and lifecycle; no blocking defect observed | User-reported Quest 3 evidence; no angular measurement or version details supplied |

## Current decision horizon

Define the Milestone 2 celestial reference-frame architecture and sequencing. Do not implement
astronomy, temporal layers, or celestial geometry until the planning work is accepted.
