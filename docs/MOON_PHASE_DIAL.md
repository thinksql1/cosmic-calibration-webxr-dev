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

The accepted dial ring, images, labels, anchors, and current appearance are preserved by the
semantic color milestone. A pale silver-blue label token is reserved for a future cache-keyed text
rebuild only; this feature deliberately leaves accepted canvas text textures unchanged.

## Acceptance limits

Physical Quest review must confirm that the dial reads as a symbolic instrument, not an orbit;
New Moon remains visible without looking illuminated; opposite quarters and waxing/waning pairs
are unambiguous; labels/images are readable in both eyes; and the entire instrument remains
world-locked. No production choice is implied before that review.

## Physical acceptance and billboard repair

Quest review accepted the compact dial, its procedural Moon faces, and its continuous phase
indicator. The `24 m` center and `3.2 m` radius remain unchanged. A later report identified
occasional Sprite flattening/tilt and compressed labels. Ring/notch geometry remains under its
rotated tangent anchor, but every image and label now uses a separate clean identity-scale
world anchor. Images remain square at local and world scale; label visibility and size changes
cannot mutate image matrices.

Phase labels now use measured dynamic-width `256 px`-high textures and dedicated
Small/Medium/Large/XL world-height presets (`0.45/0.90/1.80/3.60 m`), with Medium default. This
same repaired billboard contract is used by the separate Lunar Phase Transit Path described in
`LUNAR_PHASE_TRANSIT_PATH.md`.
