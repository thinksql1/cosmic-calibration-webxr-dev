# Project State

**Last updated:** 2026-07-15 America/New_York

**Updated by:** Codex / project control

**Current phase:** Milestone 0 / remediation complete; independent integration re-gate pending

**Overall status:** Local remediation validation passed; the independent integration gate must re-run before any merge. Quest verification is **NOT RUN**.

## One-paragraph state summary

The Milestone 0 Vite, TypeScript, Three.js, and WebXR technical spike remains on `feature/milestone-0-webxr-spike`. An independent gate found a renderer-binding session-ownership defect, missing lifecycle coverage, an insufficient Pages permission boundary, and documentation overstatement. The focused remediation now owns each requested session before renderer binding, subscribes to its end event before binding, blocks duplicate starts throughout request/binding/active/cleanup work, attempts cleanup after binding failure, and covers those transitions with 15 Vitest tests. Local type-check, tests, production build, development-mode inspection, and production-preview inspection passed. Quest passthrough, floor registration, stability, drift, and recenter behavior remain **NOT RUN**; the Pages workflow has not run.

## Working and verified

- `npm ci`: passed from the committed lockfile.
- `npm run typecheck`: passed with TypeScript `7.0.2`.
- `npm run test`: 1 file and 15 tests passed with Vitest `4.1.10`.
- `npm run build`: passed with Vite `8.1.4`; `dist/` contains relative `./assets/...` references.
- Desktop development scene rendered with origin, X/Y/Z axes, floor ring, and zenith/nadir line.
- OrbitControls interaction changed the camera view; unsupported WebXR messaging was readable in the Codex in-app Chromium browser with no console errors or warnings.
- Production preview loaded successfully in the same Chromium surface with no console errors or warnings.

## Implemented but not fully verified

- Secure-context, WebXR API, immersive-AR support, and owned-session lifecycle handling are implemented and unit-tested without an XR runtime.
- An explicit user action requests `immersive-ar` with `requiredFeatures: ['local-floor']`. Internally, the controller distinguishes idle, requesting, acquired/render-binding, binding-after-end, active, and ending/cleanup phases.
- An acquired session is owned and given an `end` listener before renderer binding. Binding failure requests `session.end()` and blocks retry until cleanup settles; cleanup failure is surfaced while stale ownership is cleared.
- The renderer is alpha-enabled, clears its opaque background in XR, and uses the Three.js XR animation loop.
- Floor-relative reference geometry is authored around `Y = 0` and the XR reference-space type is `local-floor`.
- The GitHub Pages workflow is present with Pages/OIDC permissions limited to its deploy job, but has not run because no remote or Pages site exists.

## In progress

- Re-run the independent Milestone 0 integration gate before any merge or Quest work.

## Blocked

- Quest device verification requires an authorized deployed HTTPS URL and a physical Meta Quest 3.

## Known defects or limitations

- Quest testing: **NOT RUN**.
- WebXR passthrough, transparency, floor alignment, stability, drift, session re-entry, and recenter behavior are unverified on physical hardware.
- Desktop Chromium reports immersive AR as unsupported; desktop validation cannot exercise a browser XR session.
- The production bundle contains a 547.64 kB minified Three.js chunk and triggers Vite's 500 kB advisory; no runtime defect was observed.
- No Git remote or deployed URL exists, and the Pages workflow is unexercised.

## Important unknowns

- Current Quest Browser immersive-AR and passthrough behavior.
- `local-floor` accuracy, stability, and response to recenter/session changes.
- Final GitHub repository name and Pages enablement.
- Milestone 1 controller behavior and later astronomy validation tolerances.

## Active artifacts

| Artifact | Purpose | Status |
|---|---|---|
| `src/` | Milestone 0 scene, renderer, UI, and WebXR state/session logic | Remediated locally; device behavior unverified |
| `tests/xr-state.test.ts` | Capability and deterministic session-lifecycle tests | 15/15 passed |
| `README.md` | Commands, behavior, deployment strategy, and limits | Current |
| `docs/ARCHITECTURE.md` | Implemented Milestone 0 boundaries and lifecycle model | Current |
| `docs/QUEST_TESTING.md` | Physical Quest acceptance checklist | Ready; NOT RUN |
| `.github/workflows/deploy-pages.yml` | Pages validation/build/deploy configuration | Present; not run |
| `COSMIC_CALIBRATION_WEBXR_PROJECT_BRIEF.md` | Product concept and long-term context | Active reference |
| `PROJECT_CHARTER.md` | Project definition and boundaries | Active |
| `DECISIONS.md` | Accepted foundation decisions | Active; unchanged this task |
| `NEXT_TASK.md` | One bounded independent integration gate | Active |

## Environment

| Item | Current value | Verified? |
|---|---|---|
| Operating system | Windows | Yes |
| Runtime/toolchain | Node.js `v24.18.0`; npm `11.16.0` | Yes |
| Runtime dependency | Three.js `0.185.1` | Yes |
| Development dependencies | Vite `8.1.4`; TypeScript `7.0.2`; Vitest `4.1.10`; Three/WebXR types | Yes |
| Build command | `npm run build` | Passed |
| Test command | `npm run test` | 15/15 passed |
| Deployment target | GitHub Pages workflow configuration only | Not exercised |

## Risks

| Risk | Likelihood | Impact | Mitigation or next evidence |
|---|---|---|---|
| Session lifecycle regression remains despite local tests | Low/unknown | High | Independent lifecycle review and physical Quest test after integration |
| Quest Browser behavior differs from desktop-tested assumptions | Medium | High | Execute the physical checklist |
| `local-floor` registration or recenter behavior is unstable | Medium | High | Record floor, motion, drift, re-entry, and recenter evidence |
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
| 2026-07-15 | Physical Quest 3 validation | NOT RUN | `docs/QUEST_TESTING.md` |

## Current decision horizon

Re-run the independent integration gate for the remediation before any local merge, publication, or physical Quest acceptance work.
