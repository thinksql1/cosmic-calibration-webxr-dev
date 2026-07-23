# Constellation Catalog V3B Course 50

`COSMIC_CONSTELLATION_CATALOG_V3B_COURSE_50` retains every accepted V2 and Quest-approved V3A figure unchanged, then appends HYA, ERI, CET, VUL, LAC, EQU, SCT, SER, LUP, and CRU. Canonical stars and project-authored segments are reviewed in [the V3B source review](CONSTELLATION_CATALOG_V3B_SOURCE_REVIEW.md).

- `?constellationStudy=first-set` remains the original seven; `expanded` remains 29; `course-40` and `course-v3a` remain 40.
- `?constellationStudy=course-50` selects the 50-figure catalog; `course-v3b` is its alias.
- Course-50 defaults preserve the study contract: master OFF, Introduction Anchors selected, and only ORI/UMA/CAS enabled when master is turned on. Unified Celestial Lavender, Observation Orange, Subtle strength, persistence, query overrides, and the shared material cache remain unchanged.
- `V3B Difficult Figures` contains exactly HYA, ERI, CET, VUL, LAC, EQU, SCT, SER, LUP, and CRU. `All Course 50` contains exactly 50. Accepted V3A learning groups retain their membership.

The accepted renderer remains unchanged: immutable normalized J2000 directions, minor great-circle interpolation at no more than 1.5 degrees, one shared real-sky orientation update, native XR stereo, no camera/eye parenting, no render-time astronomy, and local suppression for invalid figures. Appearance changes resolve through the shared semantic material cache and do not rebuild geometry.

The implemented Course-50 geometry totals **50 constellations, 291 unique stars, 260 segments, 1,608 rendered vertices, and 260 line objects** (plus optional endpoint markers). The larger total is attributable to intentionally preserving local bends in the open Hydra and Eridanus routes; no prior V3A performance limit is redefined by this development-only course milestone.

V3B deliberately leaves labels, Moon-alignment work, Milky Way/Galactic Center, eclipse, guided-preset, and allocentric-galaxy work deferred. V3B is development-only and is not Quest-approved until the physical validation task is completed.
