# Semantic celestial color system

## Status and scope

This development-only, query-gated presentation layer follows Quest acceptance of the expanded
29-constellation/lunar-transit build. It changes only material color and opacity assignment. It
does not change astronomy, catalog coordinates, connectivity, path sampling, geometry buffers,
object transforms, calibration, real-sky orientation, or XR projection.

## Color-space contract

The existing Three.js renderer keeps its established output-color-space and tone-mapping settings;
semantic hex tokens are supplied through native Three.js `Color` material/uniform paths and no
per-token manual gamma conversion is applied. Textures retain their existing explicitly sRGB
contract. Quest passthrough contrast remains a physical-test decision, not a claim from raw hex.

## Lunar palettes

`Moonlit Water` is the default: Daily Path `#7898D8`, visible transit `#7667C7`, Earth-hidden
transit `#354B83`, notches `#D5DDF2`, and current transit `#72D3D8`. This retains purple in the
lunation layer while making it blue-violet/water-related rather than constellation lavender.
`Legacy Purple` preserves the pre-change material values for direct comparison. The daily and
transit paths remain distinct scientific layers.

## Constellation modes

- **Unified** (default): accepted lavender, including first-set mode.
- **Highlight Selected Group**: one group accent plus dim lavender-gray visible context.
- **Group Palette — Experimental**: one stable primary learning-group color per constellation.

Strength controls only material color/opacity: Subtle and Standard are normal choices; Vivid is
diagnostic. Introduction Anchors is a selection preset, not a permanent color identity. Zodiac
temporarily takes priority when it is the active focus; otherwise each figure has stable seasonal,
circumpolar, or zodiac primary metadata. Color is never the only group indication: controls,
enabled-list diagnostics, and visibility remain available.

## Lifecycle and accessibility

Constellation line materials are cached by semantic color/opacity role and reused; canonical
geometry is immutable. Lunar roles own bounded shared materials: Daily Path, visible transit,
hidden transit, shared phase notches, and current marker. No material is created per frame or eye.
Luminance and RGB-distance diagnostics make selected/context, visible/hidden, lunar/constellation,
and lunar/Sun distinctions inspectable; they are descriptive XR evidence, not WCAG compliance.

Moon image textures, Sprite anchors, label texture sizing, label scale, and compact-dial geometry
remain untouched. A reserved next-phase token is reported for a future already-authorized marker
only; this milestone does not add a new object.

## Physical gate

Validate Unified preservation, selected-group attention, experimental-palette noise, Moonlit Water
versus Legacy Purple, daily-versus-transit distinction, grayscale/luminance separation, and both
eyes. Do not begin the guided course framework until this visual gate is physically reviewed.
