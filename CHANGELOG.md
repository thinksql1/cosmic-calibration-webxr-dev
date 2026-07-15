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
- `NEXT_TASK.md` now contains the bounded independent integration-gate re-run.

### Validated

- `npm ci`, type-check, 15/15 unit tests, and production build passed.
- Desktop development and production-preview scenes passed manual inspection in Chromium with no console errors or warnings.
- Production asset references remain relative and suitable for an unknown Pages project subpath.

### Known limitations

- Quest WebXR, passthrough, `local-floor`, stability, and recenter validation remain **NOT RUN**.
- The Three.js production chunk triggers Vite's 500 kB size advisory.
- No remote or deployment exists; the Pages workflow has not run.
- The remediation requires an independent integration-gate re-run before any merge or Quest work.

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
