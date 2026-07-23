# Quest-approved development checkpoints

## `quest-approved-expanded-constellations-v1`

- **Annotated tag:** `quest-approved-expanded-constellations-v1`
- **Exact development commit:** `d54a830ab04fb920838e78a350c0a7e540740997`
- **Visible build:** `d54a830`
- **Remote:** development remote only (`dev`)
- **Annotation:** Quest-approved milestone: 29-constellation catalog, seasonal learning groups, combined lunar phase-transit presentation, stable stereo rendering, and accepted celestial geometry.

Quest review accepted the 29-figure catalog, original-seven preservation, learning groups including
Libra/Zodiac, all-expanded performance, and the combined lunar phase-transit presentation. This
checkpoint protects those development results; it is not stable promotion.

Known limitations remain constellation labels, guided observation/course presets, eclipse
visualization, IAU boundaries, full-88 coverage, and stable promotion. Verify with:

```powershell
git show --no-patch --format=fuller quest-approved-expanded-constellations-v1
git rev-parse quest-approved-expanded-constellations-v1^{commit}
git ls-remote --tags dev quest-approved-expanded-constellations-v1
git switch -c recovery/expanded-constellations-v1 quest-approved-expanded-constellations-v1
```

Never move, recreate, or force-update this tag. Stable is neither tagged nor changed.

## `quest-approved-lunar-transit-v1`

- **Annotated tag:** `quest-approved-lunar-transit-v1`
- **Exact development commit:** `0d3f7219774bac51c0b3f5061205a307e67546d3`
- **Visible build:** `0d3f721`
- **Remote:** development remote only (`dev`)
- **Annotation:** Quest-approved milestone: real-sky grid, first constellation set, outer planets and labels, safe solar path, Moon daily path, compact phase dial, current Moon appearance, and Lunar Phase Transit Path.

Quest review accepted the real-sky coordinate foundation, seven first constellation figures, finite
Earth-core presentation, outer-planet markers and Medium planet labels, safe/smoother Sun path,
Moon Daily Path, compact phase dial/current appearance, and complete Lunar Phase Transit Path with
its event notches, clean Moon billboards, and readable phase labels. This is a recoverable
development checkpoint, not a stable release.

Known limitations: constellation labels, guided-course presets, eclipse visualization, IAU
boundaries, all-88 expansion, and stable promotion remain separate work. The canonical grid stays
available. The ordinary development URL remains feature-gated for constellation studies.

## Verification and rollback

```powershell
git show --no-patch --format=fuller quest-approved-lunar-transit-v1
git rev-parse quest-approved-lunar-transit-v1^{commit}
git ls-remote --tags dev quest-approved-lunar-transit-v1
git switch --detach quest-approved-lunar-transit-v1
```

To recover development investigation without moving the published tag, create a new branch from
the tag: `git switch -c recovery/lunar-transit-v1 quest-approved-lunar-transit-v1`. Do not force
move, delete, or recreate the tag. Stable is not tagged or changed by this checkpoint.
