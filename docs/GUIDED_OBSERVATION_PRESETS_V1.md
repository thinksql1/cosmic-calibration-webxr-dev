# Guided Observation Presets V1

## Purpose and scope

Guided Observation Presets V1 adds a small, declarative starting point for focused observation
without creating a lesson engine. It is implemented on the V3A Course-40 branch rooted at
`36346b2b5a80567ac4344db6595bbd0cd7dea427`. It deliberately excludes V3B difficult figures and
does not alter stable.

The feature provides three temporary, restorable configurations:

1. Local Orientation
2. Introduction Anchors
3. North Star and Circumpolar

It does not add narration, audio, timers, completion tracking, next/previous navigation,
constellation labels, new astronomy, or any geometry.

## Architecture

Preset definitions, transitions, and snapshot semantics live in
`src/presentation/guidedObservationPresets.ts`. They contain identifiers, display text,
objectives, ordering, and explicitly controlled partial state only. They contain no DOM, Three.js,
scene-object, or render-callback references.

The live integration in `src/main.ts` follows one route:

```text
Guided Observation UI
  -> public entry point
  -> GuidedObservationController
  -> live control adapter write
  -> renderCelestialAxis()
```

The public UI-facing entry points are:

- `applyGuidedObservationPresetState(id)`
- `restoreGuidedObservationPresetState()`
- `guidedObservationStatus()`

The adapter reads and writes only existing controls. One controller transition performs one
adapter write followed by the existing centralized refresh. No preset button directly changes a
scene object, runs astronomy, changes geometry, or calls the renderer refresh itself.

## Authorized and excluded state

The adapter may capture and restore local-horizon visibility, constellation master visibility,
learning-group and individual figure selection, constellation appearance controls, axis,
pole-marker, pole-label, and Earth Core visibility.

It does not read, capture, restore, or modify calibration/yaw, observer location, simulation date
or time, time speed, canonical records, connectivity, geometry, planets, Sun, Moon, XR camera or
eye state, or unrelated persistence. The V3A `COSMIC_CONSTELLATION_CATALOG_V3A_COURSE_40` data
and original seven figures remain unchanged.

## Snapshot and Restore lifecycle

The first successful preset captures the original authorized live state. Changing to another
preset keeps that original snapshot. Restore writes it back, clears the snapshot and active preset,
and is safe to select again. A later preset application captures a fresh original state.

If a user changes a control that Guided Observation owns, the active label becomes `Modified` while
the original snapshot remains available. Changes to calibration, observer/time, planetary, solar,
lunar, and unrelated controls do not invalidate the label. Programmatic preset writes do not fire
that invalidation path.

## Temporary appearance boundary

`GuidedObservationTemporaryScope` wraps the complete controller transition with `try/finally`.
While it is active, `persistAppearanceFromControls()` returns before writing
`cosmic-calibration:appearance:v1`. This lets the live controls and material selection change for
instruction without replacing the user’s saved appearance. Restore uses the same scope.

Normal manual appearance changes still use the existing persistence path. A reload therefore uses
the normal persisted preference and does not resume a guided preset.

## Preset definitions

### Local Orientation

- Enables the existing local horizon.
- Hides constellation lines and clears the selected constellation set.
- Sets axis, north/south pole marker control, pole labels, and Earth Core off.
- Leaves planets, Sun, Moon, calibration, observer state, and simulation time untouched.

### Introduction Anchors

- Shows constellation lines and selects exactly `ORI`, `UMA`, and `CAS` through the existing
  Introduction Anchors group.
- Uses the existing Highlight Selected Group presentation mode so selected figures can use
  Observation Orange; the base is temporarily Celestial Lavender and strength is Subtle.
- This is the project’s existing mechanism for “unified lavender context plus selected orange,”
  rather than a new color mode.

### North Star and Circumpolar

- Shows constellation lines and selects exactly `UMI`, `UMA`, `CAS`, `CEP`, and `DRA` through the
  existing North Star and Circumpolar group.
- Uses Celestial Lavender base, Observation Orange selected-group highlight, and Subtle strength.
- Sets axis, pole markers, pole labels, and Earth Core off. It adds no Polaris marker.

## Query-gated UI and accessibility

The compact `Guided Observation` details section appears only when a constellation study is
enabled, including `?constellationStudy=course-40`; it remains hidden on the normal URL. It uses
native buttons for the three presets and Restore Previous State, a native disabled Restore state,
`aria-pressed` for the active preset, and a `role=status` active-state message. The controls follow
the existing panel and native pointer/keyboard interaction model, which is also the project’s
Quest-compatible HTML-control route.

The status is `Active: None`, the active preset name, or `Active: Modified`. The UI is a view of
controller status, not another state store.

## Validation

Focused tests cover the pure registry/session behavior, controller mapping and snapshot lifecycle,
temporary persistence scope, live invalidation, and thin UI binding/listener behavior. Production
and browser validation results are recorded in the project-control documents for the feature
commit. Before commit, `npm ci`, type-check, four focused files (`15` tests), the complete suite
(`79` files / `606` tests), production build, dependency audit, dependency-tree comparison, and
`git diff --check` passed. The audit reported zero vulnerabilities. The build retains the existing
single large-chunk advisory; no dependency, lockfile, or bundle-architecture change was made.

Browser validation uses both the normal URL and Course-40. It verifies normal study controls are
hidden, all three selections map to their exact identifiers, Modify/Restore status behavior works,
and no immediate console errors occur. The production preview passed these checks with normal
defaults off and Course-40 state restored after a reload. It does not establish Quest stereo
behavior.

## Physical Quest checklist

1. Open the exact Course-40 development URL in a fresh private Quest Browser session.
2. Confirm normal URL defaults and Guided Observation query gating.
3. Apply Local Orientation; verify horizon on, constellations off, selection cleared, and axis,
   pole markers, labels, and Earth Core off.
4. Apply Introduction Anchors; verify `ORI`, `UMA`, `CAS` and subtle Observation Orange.
5. Apply North Star and Circumpolar; verify `UMI`, `UMA`, `CAS`, `CEP`, `DRA`.
6. Switch presets repeatedly; verify no duplicate lines, flicker, incomplete eyes, or stereo
   instability.
7. Manually change a guided control; verify `Active: Modified` and an enabled Restore action.
8. Restore; verify the original state returns and Restore disables.
9. Confirm grid, planets, Sun, Moon, calibration, observer state, and simulation time remain
   unchanged. Do not investigate Moon/path alignment in this test.

Physical Quest validation is pending. This feature is not Quest-approved merely from desktop,
automated, or hosted checks.

## Deployment status

The existing development Pages workflow has a `workflow_dispatch` trigger and can build this exact
feature ref without merging development `master`. It was not dispatched from this environment:
the local GitHub CLI is unavailable, no API credential is configured, and the browser session is
signed out. The automatic push trigger remains master-only, whose current contents include excluded
V3B work; merging or deploying that branch would violate this feature’s boundary. An authenticated
manual dispatch on the feature ref is the safe next deployment action.
