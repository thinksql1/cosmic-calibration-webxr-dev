# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Re-run the Milestone 1 independent integration gate

## Why this is next

The first gate found three material XR-input defects. The feature branch now includes bounded
remediation for controller-only calibration, exact current-event target-ray pose validation, and
DOM-overlay `beforexrselect` isolation. Those changes require independent inspection and
reproduction before integration, publication, or physical Quest acceptance.

## Objective

Independently review the complete Milestone 1 branch and the remediation diff, reproduce all
automated and desktop checks, and confirm that no blocking or material finding remains.

## Required work

1. Review the feature against its Milestone 0 baseline and inspect the remediation separately.
2. Verify the controller-only begin, release, capture, cancel, recalibrate, reset, feedback, and
   cross-controller gating paths from actual control flow.
3. Verify capture requires the exact current input-event frame pose and rejects missing,
   stale/default-only, disconnected, invisible, non-finite, and nearly vertical inputs.
4. Verify failed recalibration preserves the prior accepted calibration.
5. Verify interactive overlay controls cancel `beforexrselect`, outside-overlay controller input
   remains functional, and all session/overlay listeners are cleaned up, including late binding.
6. Re-run clean install, type-check, all tests, production build, diff check, and dependency review.
7. Inspect development and production-preview desktop behavior, simulation, controls, resize,
   relative assets, and browser console.
8. Confirm documentation matches actual behavior and physical Quest validation remains NOT RUN.
9. Integrate, publish, or begin physical validation only under separate explicit authorization.

## Acceptance rules

- **PASS:** No blocking or material finding remains and all required local validation passes.
- **FAIL:** Any input race, invalid-pose capture, overlay collision, regression, unsupported claim,
  or validation failure remains; return one bounded remediation task and do not integrate.

## Prohibited scope

- Do not infer physical Quest PASS from source, tests, or desktop behavior.
- Do not begin Milestone 2, astronomy, geolocation, magnetic correction, persistence, or anchors.
- Do not merge, push, deploy, or test on Quest without the authorization required by the gate task.
