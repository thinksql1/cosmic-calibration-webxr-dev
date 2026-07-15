# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Implement the minimal floor-relative WebXR passthrough technical spike.

## Why this is next

Establish evidence that the browser, device, passthrough, and `local-floor` assumptions can support a stable spatial reference frame before calibration or celestial work begins.

## Recommended execution

**Model:** GPT-5.6 Sol

**Reasoning effort:** High

**Mode:** Plan, then bounded implementation
**Thread:** Main control thread

## Objective

Create the smallest Vite, TypeScript, Three.js, and WebXR proof that feature-detects immersive AR, requests a floor-relative reference space where supported, renders neutral reference geometry, and retains a working desktop fallback.

## Allowed paths

- Root Vite/TypeScript configuration, `src/`, `public/`, and focused tests needed for the spike.
- `README.md`, narrow documentation in `docs/`, and durable project records as verified results require.

## Prohibited scope

- No Astronomy Engine, geolocation, north calibration, controller interaction, celestial bodies, or time controls.
- No deployment or GitHub remote creation.
- No native application, accounts, analytics, multi-user features, or contemplative claims.

## Acceptance criteria

1. Minimal Vite/TypeScript application renders a Three.js desktop fallback with origin marker, axes, horizon ring, and zenith/nadir line.
2. Interface reports immersive-AR availability and provides Enter AR only where supported.
3. Immersive path requests a floor-relative reference space and documents fallback/unsupported behavior.
4. Production build passes without TypeScript errors.
5. Documentation gives local setup, desktop verification, and Quest 3 test instructions without unrun claims.
6. Quest verification remains **NOT RUN** until physically tested on a Quest 3.

## Validation methods

- Static inspection, type-check/build, and desktop runtime verification.
- Diff and documentation inspection for prohibited features and unsupported claims.
- Physical Quest 3 only: immersive-AR availability, passthrough, floor alignment, recenter behavior, and stability.

## Quest test boundary

Do not mark immersive AR, passthrough, `local-floor`, or floor alignment as passed without physical Quest 3 evidence.

## Stop conditions

- A broader architecture decision is required.
- Desktop fallback cannot be preserved.
- An unsupported requirement has no boundary-preserving fallback.
- Completion would require deployment, remote configuration, or prohibited scope.

## Expected return format

```text
Objective:
Status: Complete | Partial | Blocked

Changes:
- <file and purpose>

Validation:
- PASS:
- FAIL:
- NOT RUN:
- NOT APPLICABLE:

Quest evidence:
- <physical-test result or NOT RUN>

Known limitations:
- <item or none>

Exact next task:
- <one bounded task>
```
