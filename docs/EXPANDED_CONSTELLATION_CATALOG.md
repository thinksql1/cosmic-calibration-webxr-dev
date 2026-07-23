# Expanded constellation catalog V2

## Status

Development-only, query-gated expanded line study pending physical Quest validation. It preserves
the Quest-accepted seven-figure renderer and adds 22 figures, including Libra, for **29 total**.
Constellation labels, IAU boundaries, and all-88 coverage remain deferred.

Feature `349a3c7` was merged as `704d5e2` and deployed by development Actions/Pages run
`30020584006`; hosted-bundle inspection confirmed the V2 catalog and merge build identifier.

## Data contract

`COSMIC_CONSTELLATION_CATALOG_V2_EXPANDED_29` separates canonical BSC5P J2000 star records,
project-authored connectivity, figure metadata, and learning groups. NASA HEASARC BSC5P HR records
are public U.S.-government data; the coordinates are fixed `EQJ_J2000`, `J2000.0`, with proper
motion deliberately omitted for this visual course layer. Conventional Western connectivity is
project-authored, not an IAU standard or a copied external line table. Shared anchors, including
Alpheratz and Elnath, have one canonical coordinate record.

Included: ORI, UMA, CAS, CYG, TAU, LEO, SCO, CEP, DRA, AUR, GEM, CMA, CMI, VIR, BOO, CRB, LYR,
AQL, HER, SGR, OPH, AND, PEG, PER, ARI, PSC, CAP, AQR, and LIB. Each figure records its selected
stars, segment endpoint pairs, recognizable-form rationale, suggested future label anchor, and
priority in source. Libra is intentionally included so the declarative Zodiac group is not
structurally misleading.

## Rendering and budget

Every open segment is a canonical EQJ minor great-circle arc, sampled once at no more than `1.5°`
and capped by the accepted 120-interval policy. Canonical buffers are immutable; the accepted
shared EQJ-to-application orientation and calibrated geographic parent are updated outside eye
callbacks. Native XR cameras project the same buffers. No line is camera/eye parented or rebuilt
for time, location, head motion, or a visibility toggle.

The implementation retains one `THREE.Line` and material/buffer pair per segment. It is bounded by
29 figures, at most 180 catalog stars, 220 segments, 4,000 rendered vertices, and zero per-eye
geometry rebuilds. The diagnostics report actual counts, active figures, draw-object names,
materials, buffers, orientation updates, and local suppression.

## Study controls

`?constellationStudy=first-set` retains the accepted seven-only behavior. `?constellationStudy=expanded`
or `course-set` exposes the 29-figure catalog but starts master OFF with Introduction Anchors
(Orion, Ursa Major, Cassiopeia) selected. A group is a deterministic replacement preset; individual
checkboxes can refine it. `All Expanded Constellations` and `Clear Constellations` are explicit.
The normal URL remains unchanged.

Learning groups are Introduction Anchors, Circumpolar, Winter, Spring, Summer, Autumn, Zodiac,
All Expanded, Added Only, and Clear. They are visibility metadata, not a guided course framework.

## Physical validation

Validate first-set preservation, each seasonal group, Zodiac including Libra, all-expanded
responsiveness, world locking, left/right-eye coherence, no wobble/deformation, no duplicates after
group changes, and preservation of the approved solar/lunar presentation. If the full set is
educationally dense but technically sound, preserve it and make guided presets the next bounded
task.
