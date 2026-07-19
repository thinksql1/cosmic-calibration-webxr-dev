# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Run the physical Quest acceptance test for actual solar-system body placement

Test the default-hidden actual-direction markers for Sun, Moon, Mercury, Venus, Mars, Jupiter,
and Saturn only after their independent local implementation/review and publication. Confirm
marker visibility, general Sun/Moon direction, planet separation, below-horizon continuity,
calibration/world locking, comfortable Sun-marker brightness, reset/recalibration, session
exit/re-entry, and absence of duplicate markers. Do not infer angular precision from this physical
check.

## Required review checks

- Verify actual apparent placement against the horizon and celestial-equator references without
  treating either as a projection target.
- Test all seven markers as one bounded layer, including bodies currently below the horizon.
- Record only observed headset behavior; Moon phase, labels, pointing, temporal motion, and
  projection modes remain out of scope.

## Exclusions

Do not implement celestial-equator projection, combined display, declination connectors, Moon
phase, labels, pointing, stars, precession, ecliptic, temporal clocks, broad layer management,
media, game integration, AI enhancement, relational circuits, or contemplative sequencing.

## Recommended execution

- **Model:** GPT-5.6
- **Reasoning effort:** Medium
- **Why:** a physical acceptance coordinator must distinguish the limited observed body-layer
  experience from automated scientific evidence without inventing measurements.
