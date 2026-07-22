# Finite Core Parallax Experiment

**Status:** Development-only finite-core presentation, selected by physical Quest comparison.
The normal Earth Core visual is the far `4.0 m` proxy; the near and medium query-gated modes remain
available for comparison. This is not a literal Earth-core distance, and integrated toggle/default
verification remains pending.

## Question

The scientific Earth-core marker appears attached to the distant celestial structure because its
finite homogeneous anchor reconstructs a point roughly one Earth radius from the observer. A
human-scale lateral head movement produces effectively no visible angular change at that distance.
The comparison is like looking past a nearby point on a window toward distant trees: the nearby
point should slide oppositely against the trees as the head moves, while the distant reference
barely changes.

This experiment asks whether one finite, world-locked holographic proxy can provide that cue
without changing the scientific model.

## Two deliberately separate meanings

The **scientific Earth core** remains the existing shared WGS84/geocentric source used by the
celestial grid, equator, poles, and scientific core marker. Its observer distance is approximately
6.37 million metres. Even a 0.10 m head translation subtends only about `1.6e-8` radians at that
distance.

The **finite holographic core proxy** is a presentation compression. It uses only the normalized
scientific observer-to-core direction, but stops at one of three local distances:

- near: `1.5 m`
- medium: `2.5 m`
- far/default normal development: `4.0 m`

It is not the literal Earth-core location and must never replace the scientific source of truth.

## Rendering contract

Normal development uses the far proxy whenever **Earth Core** is enabled. `?coreStudy=finite-parallax` keeps
the near/medium/far comparison path; an explicit scientific baseline remains diagnostic-only. Earth Core OFF
always hides both representations. Finite mode hides the existing scientific core marker, enables the celestial grid
as the distant reference, and shows one `12 cm` diameter low-poly translucent 3D proxy. The proxy
is an ordinary finite local-metre mesh under:

```text
scene
  geographic-reference-frame
    finite-core-parallax-experiment
      finite-core-holographic-proxy
```

Its local center is:

```text
scientific observer origin
  + normalize(scientific Earth core - scientific observer origin)
  * selected finite presentation distance
```

The geographic parent applies calibrated yaw once. The proxy is never parented to a camera or XR
eye, and no render callback rewrites it. Native Three.js model-view and projection matrices allow
the two XR eyes and head translation to produce ordinary stereo disparity and translational
parallax. The celestial grid, homogeneous scientific core anchor, calibration, and every other
scene object remain unchanged.

Distance is selected with `coreDistance=near`, `medium`, or `far`. With `diag=1`, the panel reports
the build identifier, direction, local/world transform, eye-camera positions, per-eye NDC centers,
stereo disparity, camera translation, projected motion, finite state, and local suppression.

## Acceptance gate

Accept the mechanism for possible production-core work only if Quest testing confirms all of the
following:

- moving the head right makes the proxy move left relative to the grid;
- moving left makes it move right;
- the two eyes perceive coherent near-field depth;
- the proxy remains fixed in the calibrated world rather than following the head;
- one bounded distance is calm, legible, and comfortable;
- the grid and all other validated geometry remain unchanged;
- no callback or incomplete-frame errors occur.

Reject and park/remove the core presentation if a simple finite world-locked object still reads as
background-attached, behaves like an overlay, requires camera manipulation, or creates unacceptable
scale contradiction or discomfort. Do not simulate parallax in a shader.

The pole-to-pole line/spindle investigation remains parked. It must not resume until the core
representation itself passes this physical test.
