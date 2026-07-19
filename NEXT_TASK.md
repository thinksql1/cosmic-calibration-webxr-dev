# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Run the physical Quest acceptance test for the 24-hour Sun path and real-time celestial updates

Physically test the published observer-relative apparent Sun path, civil-hour notches, and bounded
real-time body refresh in Meta Quest passthrough. Record only directly observed evidence; do not
infer angular accuracy, long-duration stability, or unperformed lifecycle checks.

## Required review checks

- Open the deployed application, enter passthrough, calibrate true north, and confirm the horizon,
  axis, poles, celestial equator, and actual body markers remain coherent.
- Enable the Sun daily path and civil-hour notches; confirm the notches lie on the path, the path
  differs from the celestial equator, and above- and below-horizon portions remain understandable.
- Confirm the current Sun lies on or closely follows the path, leave the application open across a
  minute boundary, and observe whether body positions update without a jump or duplicate geometry.
- Check world locking, visibility/comfort, toggle cycles, recalibration, and immersive exit/re-entry.

## Exclusions

Do not implement labels, ecliptic, celestial-equator projection modes, Moon phase, other body
paths, stars, precession, persistent location, a broad time-control UI, media, game integration,
AI enhancement, or contemplative sequencing.

## Recommended execution

- **Model:** GPT-5.6 Terra
- **Reasoning effort:** High
- **Why:** bounded physical-evidence reconciliation should preserve the exact Quest observations,
  distinguish measured behavior from unmeasured cases, and close the milestone without beginning
  later celestial features.
