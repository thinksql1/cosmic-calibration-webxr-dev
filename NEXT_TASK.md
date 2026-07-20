# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Independently revalidate and integrate the rigid Earth-axis spindle correction

Independently verify the local `fix/earth-axis-spindle` commit and, only if the gate passes, perform
a normal non-rewriting integration into `master`. Preserve all validated astronomy and calibration
contracts and treat physical Quest acceptance as separate evidence.

## Required review checks

- Reproduce exact north/core/south collinearity, antipodal pole agreement, and zero core-to-axis
  distance in local and transformed world frames.
- Verify one descriptor, one calibrated geographic parent, one yaw application, and one bounded
  projective spindle strip across recalibration, reset, session re-entry, toggles, and teardown.
- Inspect development and production-preview cameras for continuity, through-core visibility,
  duplicate geometry, unaffected celestial layers, relative assets, and console health.
- Run the clean-install, type-check, complete test, production build, diff, dependency, and Git
  checks before deciding whether normal integration is safe.

## Exclusions

Do not push, deploy, perform or infer physical Quest acceptance, add labels or celestial features,
change astronomy/calibration/observer science, rewrite history, squash, or delete the feature
branch.

## Recommended execution

- **Model:** GPT-5.6 Sol
- **Reasoning effort:** High
- **Why:** independently verify projective collinearity, core anchoring, pole agreement, transform
  invariance, transparent-Earth rendering, lifecycle, integration, and deployment readiness.
