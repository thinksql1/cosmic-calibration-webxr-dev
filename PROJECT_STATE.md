# Project State

**Last updated:** 2026-07-15 America/New_York

**Updated by:** Codex / project control

**Current phase:** Milestone 0 physical validation / controlled floor retest pending

**Overall status:** **CONDITIONAL PASS**. Automated and desktop validation passed; physical Quest immersive AR, passthrough, stability, and session lifecycle are verified, while standing-floor alignment requires a controlled retest.

## One-paragraph state summary

Milestone 0 is integrated into `master` through merge commit `df8b26a` and published through the existing GitHub Pages workflow. The independent re-gate found no remaining blocking or material implementation, lifecycle, workflow, test, documentation, dependency, or scope defects. Local automated and desktop Chromium validation passed, and the public site is https://thinksql1.github.io/cosmic-calibration-webxr/. Initial physical Quest testing verified immersive AR entry, passthrough, spatial stability, and exit/re-entry/recenter. The reference geometry appeared at approximately chair/seated height rather than the physical floor; a seated or chair-height Quest environment calibration is a plausible but unconfirmed environmental cause. No application defect has been established. A standing/room-scale floor-calibration retest is required before floor alignment can pass.

## Working and verified

- `npm ci`: passed from the committed lockfile.
- `npm run typecheck`: passed with TypeScript `7.0.2`.
- `npm run test`: 1 file and 15 tests passed with Vitest `4.1.10`.
- `npm run build`: passed with Vite `8.1.4`; `dist/` contains relative `./assets/...` references.
- `git diff --check` and `npm ls --depth=0`: passed on the feature branch and again after integration into `master`.
- Independent Milestone 0 re-gate: no blocking or material findings; implementation/workflow gate passed, with overall result **CONDITIONAL PASS** solely because physical Quest validation is pending.
- Desktop development scene rendered with origin, X/Y/Z axes, floor ring, and zenith/nadir line.
- OrbitControls interaction changed the camera view; resize updated the canvas to the tested viewport; unsupported WebXR messaging remained readable with no console errors or warnings.
- Production preview loaded successfully on the feature branch and again from integrated `master`; relative production assets loaded with no console errors or warnings.
- GitHub Pages workflow run #2 passed on the published `b1bf282` commit: build completed with 15/15 tests and deploy completed successfully.
- The hosted site loads at `https://thinksql1.github.io/cosmic-calibration-webxr/`; its static assets resolve under the repository subpath, the desktop canvas renders, the compatibility fallback is readable, and the browser console has no warnings or errors.
- Initial physical Quest 3 evidence: immersive AR entry PASS, passthrough PASS, world locking/stability PASS, and session exit/re-entry/recenter PASS.

## Implemented but not fully verified

- Secure-context, WebXR API, immersive-AR support, and owned-session lifecycle handling are implemented and unit-tested without an XR runtime.
- An explicit user action requests `immersive-ar` with `requiredFeatures: ['local-floor']`. Internally, the controller distinguishes idle, requesting, acquired/render-binding, binding-after-end, active, and ending/cleanup phases.
- An acquired session is owned and given an `end` listener before renderer binding. Binding failure requests `session.end()` and blocks retry until cleanup settles; cleanup failure is surfaced while stale ownership is cleared.
- The renderer is alpha-enabled, clears its opaque background in XR, and uses the Three.js XR animation loop.
- Floor-relative reference geometry is authored around `Y = 0` and the XR reference-space type is `local-floor`.
- The GitHub Pages workflow is configured to use GitHub Actions with Pages/OIDC permissions limited to its deploy job. Successful deployment runs have completed; its first push-triggered run failed before Pages was enabled and does not represent an application failure.

## In progress

- Repeat only the Quest floor-alignment validation using a deliberately established standing/room-scale floor calibration.

## Blocked

- No technical blocker is established. Controlled standing-floor calibration evidence is required before determining whether the observed elevation was environmental or application-related.

## Known defects or limitations

- Quest immersive AR entry, passthrough, spatial stability, and exit/re-entry/recenter: physically verified **PASS**.
- Standing floor-height alignment: **CONDITIONAL / requires retest**. The geometry appeared at approximately chair/seated height during initial seated testing; the suspected seated or chair-height calibration cause is a hypothesis, not a confirmed diagnosis.
- Do not modify application code until the controlled standing-floor retest is complete.
- Desktop Chromium reports immersive AR as unsupported; desktop validation cannot exercise a browser XR session.
- The production bundle contains a 547.64 kB minified Three.js chunk and triggers Vite's 500 kB advisory; no runtime defect was observed.
- GitHub Pages has been exercised on the published `b1bf282` commit; no custom domain is configured.

## Important unknowns

- Standing/room-scale `local-floor` accuracy after the Quest floor is deliberately established with a controller at the physical floor.
- Exact height error and behavior after standing calibration and recenter.
- Milestone 1 controller behavior and later astronomy validation tolerances.

## Active artifacts

| Artifact | Purpose | Status |
|---|---|---|
| `src/` | Milestone 0 scene, renderer, UI, and WebXR state/session logic | Integrated into `master`; device behavior unverified |
| `tests/xr-state.test.ts` | Capability and deterministic session-lifecycle tests | 15/15 passed |
| `README.md` | Commands, behavior, deployment strategy, and limits | Current |
| `docs/ARCHITECTURE.md` | Implemented Milestone 0 boundaries and lifecycle model | Current |
| `docs/QUEST_TESTING.md` | Physical Quest acceptance checklist | Initial evidence recorded in project state; standing-floor retest pending |
| `.github/workflows/deploy-pages.yml` | Pages validation/build/deploy configuration | GitHub Actions source enabled; run #2 passed |
| `COSMIC_CALIBRATION_WEBXR_PROJECT_BRIEF.md` | Product concept and long-term context | Active reference |
| `PROJECT_CHARTER.md` | Project definition and boundaries | Active |
| `DECISIONS.md` | Accepted foundation decisions | Active; unchanged this task |
| `NEXT_TASK.md` | One standing-calibration floor-alignment retest task | Active |

## Environment

| Item | Current value | Verified? |
|---|---|---|
| Operating system | Windows | Yes |
| Runtime/toolchain | Node.js `v24.18.0`; npm `11.16.0` | Yes |
| Runtime dependency | Three.js `0.185.1` | Yes |
| Development dependencies | Vite `8.1.4`; TypeScript `7.0.2`; Vitest `4.1.10`; Three/WebXR types | Yes |
| Build command | `npm run build` | Passed |
| Test command | `npm run test` | 15/15 passed |
| Deployment target | GitHub Pages at `https://thinksql1.github.io/cosmic-calibration-webxr/` | Run #2 passed |

## Risks

| Risk | Likelihood | Impact | Mitigation or next evidence |
|---|---|---|---|
| Session lifecycle regression remains despite local tests | Low/unknown | High | Independent lifecycle review and physical Quest test after integration |
| Standing floor calibration differs from the initial seated environment | Medium | High | Deliberately establish the physical floor with a controller and repeat only floor alignment |
| `local-floor` registration is incorrect after controlled standing calibration | Medium | High | Record approximate height error, ring horizontality, vertical line, stability, re-entry, and recenter evidence |
| Transparent rendering does not expose passthrough as expected | Medium | High | Verify on Quest 3; do not infer from code |
| Bundle size affects Quest startup/performance | Low/unknown | Medium | Measure on device before adding optimization complexity |
| Scientific and contemplative layers become conflated later | Medium | High | Preserve traceable scientific modules and explicit framing |

## Parking Lot

- Astronomy Engine; celestial bodies, ecliptic, poles, and real-time astronomy.
- North calibration, geolocation, controllers, persistence, and magnetic declination.
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

## Current decision horizon

Repeat only the floor-alignment portion of the Quest acceptance test after deliberately establishing a safe standing/room-scale Quest floor calibration. Do not alter application code unless that controlled retest establishes an application-level defect.
