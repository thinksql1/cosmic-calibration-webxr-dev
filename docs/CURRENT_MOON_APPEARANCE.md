# Current Moon Appearance

## Scientific input

Astronomy Engine `2.1.19` supplies:

- `MoonPhase(instant)`: geocentric Sun–Moon ecliptic longitude separation, with 0° New,
  90° First Quarter, 180° Full, and 270° Last Quarter;
- `Illumination(Body.Moon, instant)`: phase angle and illuminated fraction;
- `SearchMoonPhase(0, ...)`: the previous New Moon;
- `SearchMoonQuarter(...)`: the next principal phase.

The presentation uses the central simulation instant. Invalid provider state suppresses only the
phase presentation.

## Appearance

The optional current image is a native Three.js Sprite at a finite `24 m` anchor adjacent to the
actual apparent topocentric Moon direction, under the same calibrated geographic frame as the Moon
marker. The anchor is fixed shared scene state and native XR cameras project it independently.

The texture is regenerated only when its half-degree phase cache key changes or a relevant
presentation setting changes. Illumination shape follows authoritative phase longitude and is
cross-reported against the provider illuminated fraction. Near New Moon, the disk remains dark
but its non-illuminating silver frame stays visible.

The model calculates and reports the projected Sun direction in the Moon tangent plane and a
bright-limb orientation. The first study deliberately uses the same standardized
waxing-right/waning-left procedural orientation as the symbolic dial. Exact apparent sky roll is
therefore a known limitation, not a hidden claim. Physical Quest review will decide whether that
fallback is sufficient or whether a later bounded world-tangent image orientation is needed.

## Controls and lifecycle

`Current Moon Appearance` is independent of the existing Moon marker, Moon Path, phase dial,
notches, labels, images, and current indicator. Turning it off does not alter Moon science or the
marker. The Sprite, material, and current texture are reused; replacement texture disposal and
scene teardown are idempotent. No CSS, DOM overlay, camera parenting, per-eye mutation, or
downloaded Moon imagery is used.
