# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Independently validate and publish the geocentric Earth-core axis replacement

## Recommended execution

- **Codex model:** GPT-5.6 Sol
- **Reasoning effort:** Max
- **Why:** the replacement changes the accepted spatial model, uses Earth-scale WebGL depth, and
  must be checked independently for scientific centerline correctness, visual usability, and XR
  regression before it can replace the published proxy.
- **Branch under review:** `feature/milestone-2b-geocentric-world-axis`

## Objective

Independently verify the local WGS84 Earth-core placement, P03 geocentric centerline, projective
NCP/SCP contract, finite-render convergence bound, scene depth behavior, readiness, and retained
Milestone 0/1/2A behavior. If and only if the gate passes, merge normally into `master`, revalidate,
push without force under explicit publication authorization, verify GitHub Actions/Pages, and
leave one new physical Quest acceptance task.

## Required gate

1. Confirm the feature starts from published `master` commit `815624c` and is clean.
2. Review DEC-021, the complete diff, WGS84 formulas, elevation-datum limitation, frame tags, and
   single geographic-yaw path.
3. Independently reproduce equatorial/polar Earth-core placement, longitude invariance,
   observer-to-axis distance, one core-centered line, exact antipodal projective directions, and
   the stated render-convergence bound.
4. Confirm presentation never recomputes P03 or geocentric science and never places the observer
   on the axis except where the modeled location legitimately lies on it.
5. Verify finite marker/label/line appearance does not change scientific point centers or bend
   the centerline; NCP is not presented as Polaris or a finite-distance object.
6. Run clean install, type-check, the full test suite, production build, diff check, and dependency
   audit. No dependency or workflow change is allowed.
7. Validate development and production-preview rendering across equator, northern, southern, and
   polar cases; check depth, clipping, orbit/zoom/resize, reset, console, and retained north
   calibration behavior.
8. Treat physical Quest visibility, comfort, depth precision, and world locking as NOT RUN until
   the reviewed build is integrated, published, and confirmed hosted.

## Acceptance criteria

- The modeled Earth core is a WGS84/Tier 1 geocentric point relative to the surface observer.
- One P03 mean-axis centerline passes through the core; the observer is not substituted for core.
- NCP/SCP remain exact antipodal projective directions at infinity.
- Finite render points lie on the centerline and satisfy the documented convergence bound.
- ENU maps once to application basis and geographic yaw is inherited once from the parent.
- All existing and new tests, type-check, build, diff, dependencies, development, and preview pass.
- No equator, precession, body, temporal, media, relational, or contemplative feature is added.
- Publication occurs only after a passing gate and explicit authorized normal push; no force,
  rebase, squash, history rewrite, or branch deletion is used.

## Stop conditions

Stop without merge, push, or deployment if the core placement, projective-pole interpretation,
render precision, Quest-compatible depth approach, test integrity, dependency boundary, or any
retained milestone behavior is materially uncertain or fails.
