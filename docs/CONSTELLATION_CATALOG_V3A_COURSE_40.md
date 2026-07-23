# Constellation Catalog V3A Course 40

`COSMIC_CONSTELLATION_CATALOG_V3A_COURSE_40` is a development-only 40-figure course milestone. It imports the immutable V2 29 figures and their canonical records unchanged, then adds the 11 audited figures documented in [the V3A source review](CONSTELLATION_CATALOG_V3A_SOURCE_REVIEW.md). The fixed-J2000 proper-motion policy is unchanged.

## Compatibility and defaults

- `?constellationStudy=first-set` remains the original seven.
- `?constellationStudy=expanded` remains V2 with 29.
- `?constellationStudy=course-40` selects V3A; `course-v3a` is an alias.
- The ordinary development URL has no constellation study controls or geometry.
- In Course 40, master is OFF, Introduction Anchors is selected, and turning master ON initially shows only `ORI`, `UMA`, and `CAS`.
- Unified, Celestial Lavender, Observation Orange, Subtle strength, persistence, query overrides, resets, and the shared semantic material cache are reused without rebuilding geometry.

## Learning groups

| Group | Members |
|---|---|
| North Star and Circumpolar | UMI, UMA, CAS, CEP, DRA |
| Winter Extended | ORI, TAU, AUR, GEM, CMA, CMI, PER, MON, LEP |
| Spring Extended | LEO, VIR, BOO, CRB, UMA, CNC, CVN, COM, CRV, CRT |
| Summer Compact Figures | CYG, LYR, AQL, DEL, SGE |
| Autumn Extended | AND, PEG, PER, ARI, PSC, CAP, AQR, TRI |
| Complete Zodiac | ARI, TAU, GEM, CNC, LEO, VIR, LIB, SCO, SGR, CAP, AQR, PSC |
| Orion Neighborhood | ORI, TAU, GEM, CMA, CMI, MON, LEP |
| V3A Additions Only | UMI, CNC, CVN, COM, CRV, CRT, MON, LEP, DEL, SGE, TRI |
| All Course 40 | all 40 catalog identifiers |

V2 groups retain their exact membership. `Complete Zodiac` has exactly 12 and V3A Additions Only exactly 11.

## Rendering and performance

The accepted renderer is unchanged: canonical EQJ/J2000 unit vectors, immutable minor great-circle samples at no more than 1.5°, one shared real-sky orientation update outside eye rendering, calibrated geographic parent, native stereo projection, and local suppression. The Course 40 geometry has **190 unique stars, 170 segments, 1,163 rendered vertices, and 170 line objects** (plus optional endpoint marker objects), within the 215/190/1,600/190 limits. No color action rebuilds geometry.

The V3A canonical and real-sky diagnostic states, per-figure isolations, group states, grid/planet/lunar integration states, geometry-hash state, and performance state are registered in `xrObjectIsolation`. They are development diagnostic support only; they do not authorize physical Quest acceptance.

## Deferred work

V3B retains Hydra, Eridanus, Serpens, Cetus, Vulpecula, Lacerta, Equuleus, Scutum, Lupus, and Crux. Constellation labels, Milky Way/Galactic Center work, and deferred lunar observations remain separate backlog items. Physical Quest validation is the required next task.
