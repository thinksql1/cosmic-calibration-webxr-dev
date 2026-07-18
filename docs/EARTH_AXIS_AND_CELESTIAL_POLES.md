# Earth Core, Rotational Axis, and Celestial Poles

## Status

The geocentric world-scale replacement is implemented locally on
`feature/milestone-2b-geocentric-world-axis`. Automated and desktop development evidence is
recorded for the local branch. Independent review, integration, publication, and physical Quest
acceptance are NOT RUN.

This replaces the published Milestone 2B `1.8 m` observer-centered directional proxy. The
published site remains the earlier proxy until an independently validated merge and deployment
are separately authorized and completed.

## Scientific model

The scientific source remains the validated Tier 1 IAU P03 precession-only mean pole/equator of
date. It excludes nutation, celestial-intermediate-pole corrections, polar motion, Chandler
wobble, and observed pole offsets. NCP and SCP are celestial directions at infinity and are not
Polaris or literal finite-distance bodies.

The snapshot now owns two related products:

1. the validated P03 mean-axis direction transformed into observer-horizontal ENU; and
2. a WGS84 geocentric placement of the modeled Earth center relative to the observer's local
   tangent origin.

Presentation code consumes both products. It does not call Astronomy Engine, call the P03
provider, repeat time conversion, or derive an axis from latitude.

## Geocentric placement contract

The local scientific origin is the observer's modeled WGS84 surface location. The core is
computed by converting the observer's geodetic latitude, east-positive longitude, and elevation
to WGS84 Earth-fixed Cartesian position, negating that vector to reach Earth center, and rotating
the displacement into local ENU.

```text
observer WGS84 geodetic state
  -> observer Earth-fixed position
  -> Earth-center displacement
  -> local horizontal ENU meters
  -> application meters: east -> +X, up -> +Y, north -> -Z
  -> calibrated geographic parent applies yaw once
```

The modeled Earth-core point therefore is not the observer, floor origin, or an invented nearby
proxy. The observer remains at ENU `(0, 0, 0)` on the modeled surface and is generally millions
of meters from both Earth center and the rotational axis.

For a `WGS84_ELLIPSOID` elevation datum the numeric elevation is ellipsoid height. The current UI
declares mean-sea-level elevation; Tier 1 temporarily uses that numeric value as an ellipsoid-
height approximation and retains the existing datum warning. This means the point is the actual
center of the declared WGS84/Tier 1 model, not a claim of survey-grade geocentric position.

## One coherent axis and two projective poles

One line passes through the modeled Earth core parallel to the validated P03 mean-axis direction.
SCP is exact component negation of NCP. The observer is not moved onto that line.

Celestial poles are projective points at infinity. WebGL cannot store an infinite coordinate, so
the renderer uses declared finite asymptotic points on the exact geocentric centerline:

- finite render extent from core: `10,000,000,000,000 m` in each direction;
- maximum observer/core convergence bound: less than `0.14 arcseconds` for the WGS84 model;
- pole marker radius and label dimensions are enlarged display values only; and
- Earth-core marker radius is enlarged display size only.

The finite render points are not reclassified as astronomical pole distances. Their centers stay
on the one geocentric axis. The true scientific NCP/SCP values remain exact antipodal directions
at infinity in the snapshot and presentation contract.

## World-scale renderer

The shared scene remains meter-based. The celestial camera far range is extended to
`20,000,000,000,000 m`, and logarithmic depth is enabled. No global compression or miniature
Earth scale is applied. Room geometry remains at ordinary meter scale.

The group contains one modeled Earth-core marker, two line segments meeting at that core,
NCP/SCP marker proxies centered on the asymptotic render points, and optional billboard labels.
Line thickness, sphere radius, and label size are appearance parameters. They do not move point
centers, bend the centerline, or alter scientific direction.

## Readiness and controls

Readiness still requires validated observer, explicit UTC, accepted geographic calibration,
supported Tier 1 configuration/provider identity, and an in-domain P03 result. Not-ready state
clears the complete celestial group rather than showing guessed geometry.

Controls remain bounded to manual in-memory observer/time inputs and visibility for axis, Earth
core, pole markers, labels, and below-horizon treatment. There is no geolocation, network lookup,
persistence, or ambient scientific clock read.

The room floor is not an opaque Earth surface or an astronomical horizon. Hiding/subduing a
below-horizon segment is a presentation choice and never modifies the scientific axis.

## Validation evidence

Deterministic tests cover WGS84 equatorial/polar radii, longitude invariance, off-axis observer
separation, exact projective antipodes, one centerline, the sub-arcsecond convergence bound,
ENU-to-application mapping, single geographic yaw, immutable values, readiness, reset,
visibility, and all retained milestone regressions.

Desktop development verifies ready status, modeled core/axis diagnostics, central-clock and
observer controls, and a clean console. Physical Quest depth range, visibility, comfort, and
world locking remain NOT RUN and require independent integration/publication first.

## Exclusions

This replacement does not add the celestial equator, precession trajectory, nutation display,
polar motion, Chandler wobble, ecliptic, Sun, Moon, planets, stars, temporal markers, animated
time, geolocation, Earth sphere, relational circuits, media, audio, AI enhancement, or
contemplative sequencing.
