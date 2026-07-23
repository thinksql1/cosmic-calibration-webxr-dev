# XR Planet Label Rendering

## Status

Build `51b6fff376bdddf8db59b8611914cd607bed0789` physically passed all planet
markers on Quest but failed planet labels: **Planet Labels** was ON and no labels appeared. The
failure was presentation-only. Body calculations, marker directions, controls, and calibrated
geographic placement were correct.

## Confirmed failure

The prior label object was a textured `PlaneGeometry` with a custom projective/NDC vertex shader.
The shader assigned the same clip-space body direction to every vertex and never used the plane's
`position`. Both triangles therefore collapsed to zero area. Objects were created once, their
browser canvases were populated, their visibility gates were ON, and they were submitted, but no
fragments could be rasterized. This is a Class C placement/projection failure. It was not a
pointer-selection requirement, texture-alpha policy, astronomical-state failure, or CSS/WebXR
overlay issue.

## Repaired contract

Each planet and Pluto label is now one ordinary Three.js `Sprite` beneath
`actual-apparent-solar-system-body-directions`, itself beneath the calibrated geographic frame.
It is not parented to the camera or either XR eye. Native Three.js model-view and projection
matrices independently render the same immutable world anchor for both eyes.

The anchor is presentation geometry:

```text
normalized apparent body direction * 24 m
    + tangentRight * 0.42 m
    + tangentUp * 0.32 m
```

The tangent basis is derived deterministically from the exact marker direction with a fallback
axis chosen away from parallel. The offset is perpendicular to the body direction, so the label
does not cover its own marker. `24 m` is a bounded visual distance, not astronomical distance.
Physical Quest testing confirmed that the Sprite contract renders and stays marker-attached. A
subsequent physical comparison selected Medium (`2.24 × 0.56 m`) as comfortably readable at the
unchanged `24 m` presentation distance. The old Large
(`1.12 × 0.28 m`) is now new Small. Canonical non-compounding readability presets are Small
`1.12 × 0.28 m` (`1×` old Large), Medium `2.24 × 0.56 m` (`2×`), Large `4.48 × 1.12 m` (`4×`),
XL `8.96 × 2.24 m` (`8×`), and XXL `17.92 × 4.48 m` (`16×`). Normal labels default to Medium.
XL and XXL are intentional physical-test extremes; collision/overlap resolution remains deferred.

Textures are deterministic `512 × 128` canvas textures using a system font, pale foreground,
dark translucent backing, padding, and shadow. Creation verifies nonzero alpha pixels before a
sprite can become available. Materials use `transparent=true`, opacity `0.94`,
`depthTest=false`, `depthWrite=false`, normal blending, `sizeAttenuation=true`, render order `29`,
and `frustumCulled=false`. No render callback changes geometry or placement. A bounded callback
records projection diagnostics only and catches its own failures.

## State and diagnostics

Normal labels default OFF and appear immediately when both their body and **Planet Labels** are
enabled. Disabling the master leaves markers visible; disabling one body hides its marker and
label. Objects, textures, and materials are created once, reused through toggles, and disposed
once. Invalid texture or transform state suppresses only that label.

`labelStudy=uranus-xr-proof` forces exactly one Uranus marker and one repaired label so the
contract can be checked independently of normal feature gates.
`labelScale=small|medium|large|xl|xxl` selects a canonical bounded proof size; invalid values fall
back to Medium. Diagnostics distinguish configured, submitted, visible, and
render-callback-observed labels and report texture alpha, material/depth state, finite anchor,
tangent offset, per-eye NDC centers, disparity, camera distance, callback errors, and suppression.

## Limits and future use

Inter-label collision layout remains deliberately absent; occasional overlap is a known first-pass
limitation. The Sprite contract and Medium preset are accepted for planet labels, but neither the
same scale nor the overlap policy is automatically approved for constellation labels.
Constellation lines and the real-sky orientation gate remain separate work.
