# Symbolic Moon Phase Dial

## Meaning

The dial is a clock-like educational representation of the approximately monthly synodic phase
sequence. It is not the Moon's orbit, daily path, ecliptic, an IAU coordinate structure, or a
distance model. The separate Moon daily path answers where the Moon appears during one civil day.

The eight fixed states use Astronomy Engine's verified phase-longitude convention:

| Angle | Phase | Symbolic illumination |
| ---: | --- | --- |
| 0° | New Moon | dark |
| 45° | Waxing Crescent | right crescent |
| 90° | First Quarter | right half |
| 135° | Waxing Gibbous | mostly lit, waxing |
| 180° | Full Moon | full |
| 225° | Waning Gibbous | mostly lit, waning |
| 270° | Last Quarter | left half |
| 315° | Waning Crescent | left crescent |

“Last Quarter” is the sole UI term.

## Geometry

The dial center is `24 m` along the current apparent Moon direction. A deterministic right-handed
tangent basis is built from that direction: normal = Moon direction, right from a nonparallel
fallback cross product, and up = normal × right. The radius is `3.2 m`.

Ring and eight notch buffers are immutable local geometry under one named world anchor. Clock/time
updates move and rotate that anchor outside per-eye callbacks. The current indicator changes only
its local position. No dial object is camera- or eye-parented, and no per-eye geometry is mutated.

Phase labels are independently controlled native Three.js Sprites with cached canvas textures.
Their scale is phase-dial-specific rather than inherited from planet-label Medium. Labels default
off and may overlap in this bounded first study.

## Procedural phase images

Each canonical image is a deterministic `128 × 128` RGBA texture. For every disk pixel, the
generator reconstructs the visible unit-sphere normal and compares it with a canonical light
direction derived from phase longitude. A small radial variation gives legibility without making
a terrain claim. Background pixels remain transparent.

The image frame is a thin silver border. At New Moon the interior remains substantially dark while
the frame stays visible against passthrough; the frame is not illuminated lunar surface.
Waxing is conventionally lit on the right and waning on the left. All eight textures are generated
once, cached by canonical phase identifier, reused through toggles, and disposed idempotently.

The continuous indicator uses the authoritative phase longitude and does not snap to the eight
positions. Astronomy Engine supplies Moon phase and illumination; no arbitrary 29.5-day epoch is
used.

## Acceptance limits

Physical Quest review must confirm that the dial reads as a symbolic instrument, not an orbit;
New Moon remains visible without looking illuminated; opposite quarters and waxing/waning pairs
are unambiguous; labels/images are readable in both eyes; and the entire instrument remains
world-locked. No production choice is implied before that review.
