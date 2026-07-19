# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Run the physical Quest acceptance test for the 24-hour Sun path and real-time celestial updates

Test the deployed observer-relative apparent Sun path, its civil-hour notches, and the bounded
real-time body refresh after true-north calibration. Record only observations. Do not infer
angular accuracy, full daylight-saving behavior, long-duration stability, or comfort from desktop
or automated checks.

## Required review checks

- Enable the body layer, Sun path, and civil-hour notches. Confirm the live Sun remains on or
  closely follows the warm daily path; confirm the path differs from the celestial equator and
  continues below the horizon.
- Confirm the notches lie on the Sun path, remain readable without looking like nearby objects,
  and preserve a coherent world lock while moving carefully.
- Leave the application open through at least one minute boundary in real-time mode; confirm the
  Sun and existing body markers refresh, without duplicate geometry or a one-hour freeze.
- Check show/hide, below-horizon policy, recalibration, reset, exit/re-entry, reload, readability,
  Sun brightness, and comfort. DST behavior is a deterministic software contract; physical
  testing need not wait for a transition day.

## Exclusions

Do not implement labels, ecliptic, celestial-equator projection modes, Moon phase, other body
paths, stars, precession, persistent location, a broad time-control UI, media, game integration,
AI enhancement, or contemplative sequencing.

## Recommended execution

- **Model:** GPT-5.6 Sol
- **Reasoning effort:** High
- **Why:** physical reconciliation must distinguish observed path/readability/cadence evidence from
  the deterministic civil-time, provider, and cache contracts already covered by automated tests.
