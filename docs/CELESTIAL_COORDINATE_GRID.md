# Celestial Coordinate Grid

## Status

Implemented on the development-only `feature/celestial-coordinate-grid` branch. It is not a stable publication or a physical Quest acceptance result. The unresolved Earth-axis spindle investigation is deliberately out of scope and remains unchanged.

## Coordinate convention

The grid is a child of the existing identity-only `geocentric-celestial-structure-frame`, beneath the one calibrated geographic parent. It uses the validated P03 mean-axis direction as north, the same Earth-core anchor and two orthonormal application-basis equatorial vectors as the celestial equator, and the same finite two-WGS84-radius bounded homogeneous presentation contract.

The ordinary mode's `0h` direction remains the existing deterministic
`LOCAL_CANONICAL_UNLABELED` equatorial basis first vector. Positive longitude/RA rotates by the
right-hand rule from that vector toward the second vector about the north-pole axis. The
query-gated real-sky study now supplies provider-native EQD sidereal phase without changing this
topology; the ordinary mode remains canonical until Quest validation passes. Catalog J2000
coordinates use the separate `EQJ -> HOR` bridge documented in
[Real-Sky Equatorial Orientation](REAL_SKY_EQUATORIAL_ORIENTATION.md).

`equatorialCoordinatesToDirection(ra, units, declination, basis)` remains the canonical grid
geometry utility. Future constellation catalog rendering must use
`catalogEquatorialJ2000ToHorizontalEnu` and must not infer real-sky catalog placement from the
grid's local sampling phase or introduce another coordinate convention.

## Geometry

- Declination: closed circles at `+60`, `+30`, `-30`, and `-60` degrees. The existing `0` degree celestial equator remains the sole equatorial reference; it is not duplicated. Each circle lies in a plane parallel to the equator and has a radius proportional to `cos(declination)`.
- Right ascension: intentionally open pole-to-pole semicircles every two hours from `0h` to `22h`. Each contains exactly one equatorial crossing. A meridian is one half of a great circle; closing it would create the unwanted vertical-loop behavior, so meridians use `THREE.Line`, never `LineLoop`, and their final vertex is never connected to the first.

Static Float32 attributes encode bounded homogeneous points `(EarthCore / R + direction, 1 / R)`.
Real-sky mode applies one shared proper shader matrix to only the direction term about the encoded
core; time changes do not rebuild buffers. Geometry never changes for an individual XR eye. Each
line’s small non-throwing `onBeforeRender` callback only suppresses that draw when its native
Three.js matrix state is non-finite, allowing remaining grid lines and the XR frame to proceed.

## Pole convergence contract

The canonical `+90°` and `-90°` results from `getCanonicalCelestialPoleDirections` are the exact
endpoints of every right-ascension meridian. Pole markers and labels use those same directions and
the same finite bounded homogeneous anchor as the meridian endpoint: `(EarthCore / R ± direction,
1 / R)`. The shared chain is canonical direction → identity geocentric assembly → one geographic
calibration transform → per-eye native model-view/projection. Markers retain their screen-space
quad primitive, size, styling, and label offset, but their center now projects identically to the
grid convergence point rather than the superseded direction-at-infinity anchor.

## Controls and diagnostics

The default-hidden master **Celestial coordinate grid** switch controls the feature. **Declination lines** and **Right ascension lines** independently filter the two line families; the celestial equator remains independent. `?diag=1` reports active line count, family state, render callbacks, invalid-line suppression, and the standard duplicate-name/draw diagnostics. Object isolation includes all grid lines, each family, `0h`, `2h`, `+30`, `-60`, and equator-plus-grid; the existing floor/local-horizon/axis isolation choices remain separate.

## Deferred

Constellations, constellation labels, star catalogues, ecliptic, and trajectory rendering are not
included. Real-sky orientation remains query-gated pending physical Quest validation.
