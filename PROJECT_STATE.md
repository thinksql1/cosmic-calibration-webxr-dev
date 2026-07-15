# Project State

**Last updated:** 2026-07-15 America/New_York

**Updated by:** Darrell Wright / project control

**Current phase:** Project activation / pre-build

**Overall status:** Ready for Milestone 0 after baseline checkpoint

## One-paragraph state summary

The repository is documentation-only: no application implementation, package configuration, tests, workflow, remote, or deployed URL exists. Node.js `v24.18.0`, npm `11.16.0`, and Git `2.50.1.windows.1` were verified during activation. The local Git baseline checkpoint is established. Milestone 0 remains a narrow WebXR passthrough and floor-relative reference-frame spike; all Quest-specific behavior remains **NOT RUN** until physically tested on Meta Quest 3.

## Working and verified

- Project and operating documentation; accepted orientation evidence.
- Git executable; Node.js `v24.18.0`; npm `11.16.0`.

## Implemented but not fully verified

- None. No application implementation exists.

## In progress

- None after the baseline checkpoint.

## Blocked

- None known for project activation.

## Known defects or limitations

- No WebXR, passthrough, floor alignment, or GitHub Pages behavior has been validated.
- Quest testing: **NOT RUN**.
- No automated tests, build command, deployment workflow, remote, or deployed URL exists.

## Important unknowns

- Quest Browser immersive-AR and passthrough behavior.
- `local-floor` stability, recenter behavior, and transparency semantics on Quest 3.
- Final repository name/Pages base path, Milestone 1 controller behavior, and astronomy validation tolerances.

## Active artifacts

| Artifact | Purpose | Status |
|---|---|---|
| `COSMIC_CALIBRATION_WEBXR_PROJECT_BRIEF.md` | Product concept and long-term context | Active reference |
| `PROJECT_CHARTER.md` | Project definition and boundaries | Active |
| `PROJECT_STATE.md` | Current evidence and constraints | Active |
| `DECISIONS.md` | Accepted foundation decisions | Active |
| `NEXT_TASK.md` | One bounded implementation task | Active |
| `docs/` | Operating, validation, safety, and session guidance | Active |

## Environment

| Item | Current value | Verified? |
|---|---|---|
| Operating system | Windows | Yes |
| Runtime/toolchain | Node.js `v24.18.0`; npm `11.16.0` | Yes |
| Git | `2.50.1.windows.1` | Yes |
| Build/test commands | None yet | Yes |
| Deployment target | GitHub Pages (planned only) | Yes |

## Risks

| Risk | Likelihood | Impact | Mitigation or next evidence |
|---|---|---|---|
| Quest Browser immersive-AR behavior differs from assumptions | Medium | High | Feature detection and physical Quest test |
| `local-floor` stability/recenter issue | Medium | High | Device test before calibration |
| Passthrough transparency differs from expectation | Medium | High | Test target browser/device |
| Scientific and contemplative layers become conflated | Medium | High | Traceable layer and explicit framing |
| GitHub Pages base path is unknown | Medium | Medium | Decide repository name before deployment |

## Parking Lot

- Astronomy Engine; celestial bodies, ecliptic, poles, and real-time astronomy.
- North calibration, geolocation, controllers, persistence, and magnetic declination.
- Orbital-awareness, time navigation, and teaching-scale modes.
- Contemplative, sacred-geometry, cultural, and symbolic layers, clearly distinct from scientific claims.
- Star catalog, audio, hand tracking, persistent anchors, multi-user use, and native applications.

## Recent evidence

| Date | Evidence | Result | Location |
|---|---|---|---|
| 2026-07-15 | Reviewed orientation report | Accepted evidence baseline | User-provided orientation report |
| 2026-07-15 | Toolchain verification | Node, npm, and Git available | Activation commands |
| 2026-07-15 | Repository inspection | Documentation-only baseline; no Git metadata before activation | Repository root inspection |
| 2026-07-15 | Baseline checkpoint | Local Git baseline established | `git commit` |

## Current decision horizon

Implement and validate only the minimal floor-relative WebXR passthrough technical spike; defer calibration and celestial geometry until evidence exists.
