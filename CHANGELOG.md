# Changelog

## Unreleased

### Added

- Deterministic Vitest coverage for pending requests, renderer binding, active sessions, cleanup, retry, cleanup failure, and end-during-binding lifecycle transitions.

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

### Validated

- The independent re-gate found no blocking or material implementation, lifecycle, workflow, test, documentation, dependency, or deferred-scope findings.
- On the feature branch, `npm ci`, type-check, 15/15 unit tests, production build, `git diff --check`, and `npm ls --depth=0` passed.
- On integrated `master`, the same `npm ci`, type-check, 15/15 unit tests, production build, diff, and dependency-tree checks passed again.
- Desktop development and production-preview scenes passed Chromium inspection for reference geometry, OrbitControls, resize, readable fallback status, and console health; production preview passed again after integration.
- Production asset references remain relative and suitable for an unknown Pages project subpath.
- GitHub Pages workflow run #2 passed its build (15/15 tests) and deployment jobs; the hosted production page loaded at `https://thinksql1.github.io/cosmic-calibration-webxr/` with subpath-safe assets, a rendered desktop canvas, readable fallback status, and no browser-console warnings or errors.

### Known limitations

- Quest WebXR, passthrough, `local-floor`, stability, and recenter validation remain **NOT RUN**.
- The Three.js production chunk triggers Vite's 500 kB size advisory.
- Physical Quest validation remains required; hosted desktop-browser evidence does not establish passthrough, floor registration, stability, drift, session re-entry, or recenter behavior.
- Overall Milestone 0 status is **CONDITIONAL PASS** pending hosted physical Quest testing.

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
