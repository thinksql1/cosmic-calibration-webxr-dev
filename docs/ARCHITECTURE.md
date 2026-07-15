# Milestone 0 Architecture

## Purpose and boundary

Milestone 0 isolates the browser and WebXR platform risk. Three.js supplies one small scene graph and renderer; WebXR supplies capability detection, immersive-session lifecycle, and the requested floor-relative reference space. No calibration or astronomy layer is implemented.

## Shared desktop and XR scene

`src/scene/createReferenceScene.ts` creates one scene used in both modes. Desktop uses a perspective camera with `OrbitControls`. XR uses the same authored geometry through the renderer's XR camera. The renderer uses an XR-compatible animation loop in both cases.

The desktop scene has a dark background. During an immersive session the scene background is cleared and renderer alpha is zero so an AR compositor can show the environment. This is only a passthrough-enabling assumption; transparent rendering does not prove Quest passthrough.

## Coordinate conventions

- `+Y`: local up / zenith
- `-Y`: local down / nadir
- `Y = 0`: requested local floor/reference plane
- X and Z: room-relative axes with no geographic meaning

The origin marker and horizon ring are authored at the reference origin and `Y = 0`. The session requests `local-floor`, and Three.js is configured for the same reference-space type. Code structure alone does not prove accurate floor registration, world stability, or recenter behavior.

## Capability-state model

`src/xr/state.ts` distinguishes:

- insecure context;
- missing WebXR API;
- capability check in progress;
- immersive AR supported or unsupported;
- capability-check failure;
- session starting, cleaning, active, ended, or denied/failed.

Detection checks `window.isSecureContext`, then `navigator.xr`, then `isSessionSupported('immersive-ar')`. Pure interfaces keep this logic testable without a headset or browser XR runtime.

## Session lifecycle

The controller keeps one explicit internal phase: `idle`, `requesting`, `binding`, `binding-ended`, `active`, or `ending`. It owns at most one session at a time.

1. An explicit Enter AR action requests `immersive-ar` with `requiredFeatures: ['local-floor']`; no optional future features are requested.
2. Once `requestSession()` resolves, the controller records ownership and attaches a one-time `end` listener before awaiting Three.js renderer binding.
3. Only a still-owned session whose binding succeeds becomes renderer-bound active. A session that ends during binding stays non-active, blocks retry until binding settles, then reports ended.
4. Binding failure enters cleanup, calls `session.end()`, and blocks retry until the cleanup operation settles. The terminal UI state reports whether cleanup also failed; internal ownership is cleared so stale references do not persist.
5. A normal end clears ownership once and restores the desktop state. A new session request is allowed only after no request, binding, active session, binding-after-end operation, or cleanup operation remains unresolved.

The controller emits restrained phase-labelled diagnostics only for renderer-binding and cleanup failures. `src/main.ts` writes those diagnostics once to the browser console; raw stacks are not placed in the status UI.

## Static hosting

`vite.config.ts` uses a relative `./` base. Built script and style references therefore work under an unknown GitHub Pages project subpath without hardcoding a repository name. The current application has no router, backend, or server-only behavior.

The workflow keeps validation and artifact upload in the build job. The Pages-authorized deploy job runs `actions/configure-pages@v5` and `actions/deploy-pages@v4` with `pages: write` and `id-token: write`; the workflow-level permission remains `contents: read`. It cannot be exercised until an authorized remote and Pages configuration exist.

## Module boundaries

- `src/main.ts`: renderer, camera, controls, DOM status, diagnostics, and lifecycle wiring.
- `src/scene/createReferenceScene.ts`: neutral floor-origin reference geometry.
- `src/xr/state.ts`: capability classification and owned immersive-session state transitions.
- `tests/xr-state.test.ts`: deterministic capability and session-lifecycle behavior.

These boundaries are deliberately narrow. They are not a generalized future architecture.

## Deferred architecture

Geolocation, geographic calibration, controllers, persistence, astronomy calculations, celestial rendering, time controls, and experiential layers are absent. Later scientific modules must keep source coordinates and units separate from display coordinates and teaching-scale transforms so claims remain traceable. That future separation is a constraint, not an implemented capability.
