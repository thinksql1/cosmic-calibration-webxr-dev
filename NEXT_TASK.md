# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Run the Milestone 0 Quest 3 manual acceptance test.

## Why this is next

Milestone 0 automated validation, desktop validation, and hosted GitHub Pages deployment passed. Physical Quest validation is the remaining acceptance evidence and must be performed against the exact published build.

## Recommended execution

**Model:** GPT-5.6 Sol

**Reasoning effort:** High

**Mode:** Guided physical-device validation

**Thread:** Main control thread

## Objective

Use a physical Meta Quest 3 and `docs/QUEST_TESTING.md` to evaluate the published Milestone 0 build at `https://thinksql1.github.io/cosmic-calibration-webxr/`. Record the exact tested commit, device/browser versions, result for every checklist criterion, and supporting evidence. Do not claim success from desktop or hosted-browser checks.

## Required work

1. Confirm the Quest 3, safe test area, and published HTTPS URL are available.
2. Open `https://thinksql1.github.io/cosmic-calibration-webxr/` in Quest Browser and record commit `b1bf282` plus Quest OS and browser versions.
3. Execute every criterion in `docs/QUEST_TESTING.md`, recording **PASS**, **FAIL**, or **NOT RUN** with notes and safe evidence.
4. Verify passthrough, floor registration, gravity alignment, world stability, drift, session exit/re-entry, and recenter behavior on device.
5. Update `docs/QUEST_TESTING.md`, `PROJECT_STATE.md`, and `CHANGELOG.md` only with observed evidence; do not infer untested results.

## Prohibited scope

- Do not change application behavior, dependencies, repository visibility, Pages configuration, remote, or history while testing.
- Do not expose private room details in screenshots or video.
- Do not begin north calibration, controller raycasting, geolocation, Astronomy Engine, celestial geometry, persistence, or time controls.
- Do not infer Quest passthrough, floor registration, stability, drift, re-entry, or recenter behavior from the hosted desktop/browser check.

## Acceptance criteria

1. Every checklist item has a recorded PASS, FAIL, or NOT RUN result.
2. The tested HTTPS URL, commit, Quest model, Quest OS, Quest Browser version, date/time, and room conditions are recorded.
3. Passthrough, floor registration, gravity alignment, world stability, drift, exit/re-entry, and recenter behavior have device evidence or remain explicitly NOT RUN/FAIL.
4. No Quest or overall Milestone 0 success is claimed without physical evidence.

## Stop conditions

- A Quest 3, safe environment, supported Quest Browser state, or the published HTTPS site is unavailable.
- Any physical result requires application changes, broader scope, or a safety-compromising test setup.

## Expected return format

```text
Objective:
Status: Complete | Partial | Blocked

Validation:
- PASS:
- FAIL:
- NOT RUN:

Exact next task:
- <one bounded task>
```
