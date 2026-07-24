# Guided Observation Presets V1

## Purpose and status

Guided Observation Presets V1 is a small declarative observation layer, not a lesson engine. The
first V3A-only hosted build failed physical Quest testing: manual constellation group selection
left the master layer off and the color mode Unified, so no constellation lines appeared and
selected figures remained Celestial Lavender. That same Course-40 surface hid the existing lunar
controls. This is a failure record, not a Quest acceptance.

The corrective branch, `feature/all-features-guided-presets-v1`, is based on current development
`master`. It intentionally contains V3A Course 40, V3B Course 50, grid/orientation, planets
through Pluto, Sun, and the existing Moon systems together with Guided Observation. Stable is not
changed. Physical Quest validation remains pending after hosted verification.

## Architecture

Definitions, transition rules, and snapshot semantics are in
`src/presentation/guidedObservationPresets.ts`. The definitions are typed presentation state only;
they have no DOM, Three.js, astronomy, geometry, or render-callback references.

The sole live path is:

```text
UI -> public entry point -> GuidedObservationController -> live control adapter write -> renderCelestialAxis()
```

The public UI-facing entry points in `src/main.ts` are:

- `applyGuidedObservationPresetState(id)`
- `restoreGuidedObservationPresetState()`
- `guidedObservationStatus()`

The adapter uses existing checkbox/select ownership and performs one centralized refresh after a
successful transition. Buttons do not alter scene objects, invoke astronomy, write persistence, or
rebuild geometry.

## Authorized state and restoration

The preset service may read, snapshot, and write only local-horizon visibility, constellation
master visibility, learning group/figure selections, constellation appearance controls, axis,
pole-marker, pole-label, and Earth Core visibility. It never captures or writes calibration/yaw,
observer location, clock/time controls, catalog data, connectivity, geometry, planets, Sun, Moon,
XR camera/eye state, or unrelated persistence.

The first successful preset captures authorized pre-preset state. Switching presets retains that
original snapshot. Restore writes the snapshot, clears active state and the snapshot, and is safe
when repeated. A manual change to a guided control clears the active label to `Modified` but keeps
the original snapshot available; unrelated controls do not affect preset state.

`GuidedObservationTemporaryScope` surrounds controller apply and Restore with `try/finally`.
While active, `persistAppearanceFromControls()` does not write
`cosmic-calibration:appearance:v1`. Temporary instructional colors are therefore restorable and a
reload returns to ordinary persisted appearance. Manual appearance changes continue to persist.

## Initial presets

### Local Orientation

- Enables the existing local horizon.
- Hides constellation lines and clears selected constellations.
- Turns axis, pole markers, pole labels, and Earth Core off.
- Leaves planets, Sun, Moon, calibration, observer, and time unchanged.

### Introduction Anchors

- Enables constellation lines and selects exactly `ORI`, `UMA`, and `CAS`.
- Uses Highlight Selected Group, Celestial Lavender base, Observation Orange highlight, and
  Subtle strength.

### North Star and Circumpolar

- Enables constellation lines and selects exactly `UMI`, `UMA`, `CAS`, `CEP`, and `DRA`.
- Uses Highlight Selected Group, Celestial Lavender base, Observation Orange highlight, and
  Subtle strength.
- Turns axis, pole markers, pole labels, and Earth Core off. It adds no Polaris marker.

## Course-study behavior and controls

Guided Observation is query-gated with constellation study controls, including
`?constellationStudy=course-40`, and hidden on the normal URL. The compact native-button section
contains the three presets, Restore Previous State, and `Active: None`, active-preset, or
`Active: Modified` status. `aria-pressed`, native disabled Restore, and a status role provide
keyboard, pointer, and Quest-control-panel accessibility.

A manual non-clear learning-group selection is explicit instructional intent: it turns the
constellation master on, selects that group, and applies the existing Highlight Selected Group
mode without writing appearance persistence. With the accepted defaults, selected figures resolve
to Observation Orange and remaining context to a Celestial Lavender-derived material. The former
manual path only changed checkboxes, which was the direct cause of the observed Quest failure.

Constellation-course queries now also expose and activate the current lunar study control surface.
Moon Daily Path, Lunar Phase Transit, notches, transit marker, phase dial, current Moon appearance,
lunar palette, and their existing controls retain current default visibility and scientific
geometry. No lunar redesign or Moon/path-alignment work is included.

## Testing and browser validation

Focused tests cover the registry/session, controller, temporary persistence, UI binding, manual
course-group rendering eligibility, orange-versus-lavender material resolution, and the Course-40
lunar control surface. Full command totals and hosted evidence are recorded in project-control
documents after the final integration validation and deployment.

Desktop browser validation uses normal and Course-40 URLs. It verifies normal query gating;
manual group selection enables/submits constellation lines and resolves selected orange material;
each preset selects its exact set; lunar controls coexist with constellation controls; and no
immediate console errors occur. Browser evidence does not establish Quest stereo behavior.

## Physical Quest checklist

1. Open the exact Course-40 all-features URL in a fresh private Quest Browser session.
2. Confirm Guided Observation and the complete lunar control surface appear only in the study URL.
3. Apply Local Orientation: horizon on, constellations off, selection cleared, and axis/poles/
   labels/Earth Core off.
4. Apply Introduction Anchors: `ORI`, `UMA`, `CAS`, visible lines, and subtle Observation Orange.
5. Apply North Star and Circumpolar: `UMI`, `UMA`, `CAS`, `CEP`, `DRA`, visible lines, and orange.
6. Manually change a learning group; confirm master visibility, immediate orange update, and no
   duplicate lines.
7. Toggle Moon Daily Path, Lunar Phase Transit, notches, marker, dial, and current Moon controls.
8. Switch/Restore presets repeatedly; confirm both-eye completeness and no flicker or instability.
9. Confirm grid, planets, Sun, calibration, observer/time, V3A, and V3B remain available.
10. Do not investigate Moon/path alignment in this validation.

## Explicit non-goals

No narration, audio, timers, completion tracking, labels, V3B catalog changes, astronomy changes,
Moon/path redesign, Galactic Center/Milky Way work, eclipse visualization, stable promotion, or
Quest-approval tag is included.
