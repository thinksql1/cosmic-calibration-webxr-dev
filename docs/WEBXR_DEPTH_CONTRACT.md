# WebXR Depth Contract

## Decision

The application uses ordinary linear WebGL/WebXR depth. Global logarithmic depth is disabled.

```text
camera near: 0.01 m
camera far: 100 m
celestial overlay depth test: disabled
celestial overlay depth write: disabled
```

This keeps the depth attachment produced by ordinary room/geographic objects consistent with the
near/far interpretation exposed to the XR compositor.

## Why logarithmic depth was rejected

The first geocentric renderer used a `2 * 10^13 m` far plane and Three.js logarithmic depth.
Although logarithmic depth improves depth-buffer distribution, it does not improve large-world
vertex/model-view precision. More importantly, an XR compositor is allowed to consume the
application depth attachment for reprojection or composition. Supplying logarithmic fragment
depth under an ordinary linear near/far contract makes those values non-representative.

The hardened renderer no longer needs a celestial far plane because poles are homogeneous
directions and the Earth core is projected from a camera-relative vector.

## Celestial overlay behavior

Axis lines, the Earth-core marker, pole markers, and labels use custom shaders. They:

- receive only camera-relative core meters or unit directions;
- clamp their own visible clip-space depth near the far boundary;
- set `depthTest = false`;
- set `depthWrite = false`;
- never clear, replace, or resolve the main depth attachment; and
- never request a second XR layer.

The bounded local-horizon reference also uses linear depth with `depthTest = false` and
`depthWrite = false`. Its 24 m vertices are ordinary local coordinates; it neither changes the
celestial overlay projection nor writes compositor depth.

Consequently, their depth value cannot contaminate compositor-visible depth. Ordinary reference
geometry retains default Three.js depth testing and writing.

## Occlusion interpretation

The overlay intentionally remains visible through the room floor and other virtual diagnostics.
This is not a claim that the Earth core or below-horizon pole is physically unoccluded. The
application currently has no authoritative Earth-surface, terrain, room-mesh, or passthrough depth
occluder. Visibility is a presentation aid and never changes scientific placement.

## WebXR layer behavior

The application does not assume that `XRWebGLLayer.ignoreDepthValues` is available, requested, or
honored. The depth buffer is safe whether the runtime consumes it or ignores it because all
content that writes depth follows the ordinary linear projection contract.

The current Three.js WebXR manager remains responsible for creating the base/projection layer and
updating `depthNear`/`depthFar` from the application camera.

## Validation

Committed tests enforce:

- the absence of `logarithmicDepthBuffer` from renderer creation;
- the `100 m` linear far plane;
- homogeneous core/direction shader inputs;
- the absence of raw `10^13 m` values in the scene renderer;
- explicit non-testing/non-writing celestial materials;
- unchanged default depth behavior for ordinary Three.js materials; and
- page-teardown disposal.

Development and production-preview checks verify shader compilation and console health. Physical
Quest compositor behavior, passthrough contrast, and comfort remain **NOT RUN**.
