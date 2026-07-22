# Celestial Coordinate Grid

## Status

Implemented on the development-only `feature/celestial-coordinate-grid` branch. It is not a stable publication or a physical Quest acceptance result. The unresolved Earth-axis spindle investigation is deliberately out of scope and remains unchanged.

## Coordinate convention

The grid is a child of the existing identity-only `geocentric-celestial-structure-frame`, beneath the one calibrated geographic parent. It uses the validated P03 mean-axis direction as north, the same Earth-core anchor and two orthonormal application-basis equatorial vectors as the celestial equator, and the same finite two-WGS84-radius bounded homogeneous presentation contract.

The current `0h` direction is the existing deterministic `LOCAL_CANONICAL_UNLABELED` equatorial basis first vector. Positive longitude/RA rotates by the right-hand rule from that vector toward the second vector about the north-pole axis. This is a deterministic celestial-longitude reference, not a vernal-equinox, Greenwich-sidereal-time, local-sidereal-time, or real-sky RA alignment. The repository has Julian TT and provider RA/declination outputs, but does not propagate a validated sidereal zero direction into this presentation. A future validated sidereal reference can replace the basis input without changing grid geometry topology.

`equatorialCoordinatesToDirection(ra, units, declination, basis)` accepts explicit `hours` or `degrees`, validates declination from -90 through +90 degrees, and returns a finite normalized application-basis direction. Future constellation rendering must use this utility and must not introduce a separate coordinate convention.

## Geometry

- Declination: closed circles at `+60`, `+30`, `-30`, and `-60` degrees. The existing `0` degree celestial equator remains the sole equatorial reference; it is not duplicated. Each circle lies in a plane parallel to the equator and has a radius proportional to `cos(declination)`.
- Right ascension: intentionally open pole-to-pole semicircles every two hours from `0h` to `22h`. Each contains exactly one equatorial crossing. A meridian is one half of a great circle; closing it would create the unwanted vertical-loop behavior, so meridians use `THREE.Line`, never `LineLoop`, and their final vertex is never connected to the first.

Static Float32 attributes encode bounded homogeneous points `(EarthCore / R + direction, 1 / R)`. Geometry changes only for a new scientific snapshot, never for an individual XR eye. Each line’s small non-throwing `onBeforeRender` callback only suppresses that draw when its native Three.js matrix state is non-finite, allowing remaining grid lines and the XR frame to proceed.

## Controls and diagnostics

The default-hidden master **Celestial coordinate grid** switch controls the feature. **Declination lines** and **Right ascension lines** independently filter the two line families; the celestial equator remains independent. `?diag=1` reports active line count, family state, render callbacks, invalid-line suppression, and the standard duplicate-name/draw diagnostics. Object isolation includes all grid lines, each family, `0h`, `2h`, `+30`, `-60`, and equator-plus-grid; the existing floor/local-horizon/axis isolation choices remain separate.

## Deferred

Constellations, labels, star catalogues, sidereal anchoring, ecliptic, and trajectory rendering are not included.
