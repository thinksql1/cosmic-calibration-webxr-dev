# Mean Celestial Equator

## Scientific definition

The celestial equator is Earth's equatorial plane extended outward. For the P03 mean pole of date,
the plane passes through the finite modeled WGS84 Earth core and its unit normal is the same
rotational-axis direction used by the spindle and NCP. Its deterministic right-handed basis
vectors `U` and `V` satisfy:

```text
center = EarthCore
normal = northAxisDirection
dot(U, normal) = dot(V, normal) = dot(U, V) = 0
|U| = |V| = |normal| = 1
point(theta) = EarthCore + R * (cos(theta) * U + sin(theta) * V)
```

NCP and SCP are the positive and exact negative projective extensions of that axis. The local
horizon is different: it is a bounded tangent circle centered on the surface observer.

## Unified presentation contract

`GeocentricCelestialStructurePresentation` is created once per ready snapshot and passed by
identity to both the spindle and equator presentation builders. It owns the Earth-core anchor,
axis and exact antipode, equator normal and two application-basis plane vectors, equator center and
display radius, projective pole directions, coordinate identity, revisions, provenance, and
validity. Scene code does not independently solve any of these relationships.

The finite presentation ring has radius `2 * WGS84 semi-major axis = 12,756,274 m`. It is a
bounded explanatory cross-section of the infinite plane, not a celestial-object distance. Two
Earth radii keeps every supported surface observer inside the ring and avoids placing an
equatorial observer directly on it.

## Rendering contract

The renderer samples one 96-point `LineLoop`. For camera-relative core `C`, radius `R`, and
transformed unit ring direction `d`, each finite point `C + R*d` is uploaded in the exactly
projectively equivalent bounded form:

```text
position.xyz = C / R + d
position.w = 1 / R
```

Spatial GPU components remain below the strict budget of `2` instead of using raw million-metre
vertices. Unlike the superseded `w = 0` direction loop, finite core translation remains in every
rendered vertex, so camera motion produces coherent parallax and the visible ring remains centered
on the core in 3D.

Axis and equator groups are children of one identity-only
`geocentric-celestial-structure-frame`. Its parent, `geographic-reference-frame`, applies yaw
exactly once to the whole rigid assembly. The observer-centered local horizon remains a sibling,
not a child of the geocentric structure.

## Perspective, transparency, and lifecycle

- A 3D right angle can project to a non-right screen angle; acceptance is based on exact 3D plane
  incidence and perpendicularity, not a constant 2D angle.
- The equator uses its existing restrained transparent, non-testing, non-writing layer-local depth
  treatment. Depth testing is not disabled globally and no duplicate rear ring is created.
- `clear()` preserves the single reusable ring; repeated toggles and re-entry do not allocate a
  second structure; idempotent `dispose()` releases the owned geometry and material once.
- P03, WGS84, observer, calibration, body, Sun-path, time, and provider science are unchanged.

## Validation boundary

Permanent tests cover core/center identity, axis/normal and pole identity, exact antipodes,
orthonormal plane bases, sampled ring-plane residuals, fitted center, observer offset, separate
local-horizon center, parent translation/rotation/yaw, representative camera transforms,
homogeneous/direct projection equivalence, GPU bounds, toggle/re-entry reuse, and disposal.

Desktop validation cannot establish Quest stereo fusion, passthrough readability, comfort, or
physical comprehension. The focused physical checklist remains pending in `docs/QUEST_TESTING.md`.

## Exclusions

This correction adds no ecliptic, annual path, orbital trail, labels, planets, phase, stars,
constellations, or new astronomy provider.
