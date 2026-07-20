# Milestone 2D Physical Quest Acceptance

## Result

**PASS — bounded physical usability acceptance**

**Date recorded:** 2026-07-19 America/New_York
**Evidence source:** direct user report after a Meta Quest headset test of the deployed application

## Historical status notice

This file records the Milestone 2D published state and its bounded physical evidence. It is not a
current roadmap or implementation-status authority. Later milestones implemented and published
the seven-body layer plus central-clock live updates, daily Sun path, and civil-hour notches.
Future-work statements in this record are historical to Milestone 2D unless explicitly updated.
They do not establish physical acceptance of the current local rigid-spindle/unified-geocentric
correction, which remains unmerged, undeployed, and **NOT RUN** on Quest.

## User-provided evidence

The user reported:

> “Just tested... that is incredible... this is really coming together nicely.”

This confirms that the deployed experience ran in the headset, that the current visible spatial
reference experience was present, and that it was coherent and compelling enough for the user to
begin discussing later celestial layers such as the Sun, Moon, planets, and the distinction between
actual and celestial-equator-projected body positions.

No more detailed headset observations were supplied. This record does not infer any individual
checklist result from the positive assessment.

## Accepted current scope

The accepted Milestone 2D baseline combines three intentionally different structures:

- a **geocentric/projective Earth-axis layer**: the validated P03 mean-axis direction and a
  WGS84-derived Earth-core anchor, with projective NCP/SCP directions;
- a **geocentric/projective celestial-equator layer**: a P03-basis great circle centered on the
  modeled Earth core; and
- an **observer-centered local astronomical horizon**: a 96-sample, 24 m local tangent-plane
  reference based on canonical ENU and WGS84 geodetic up under the calibrated geographic parent.

This is a hybrid presentation by scientific necessity, not an observer-centered replacement for
the Earth-core model: the horizon is correctly observer-centered, while the Earth axis and
celestial equator retain their Earth-centered/projective scientific contracts. Marker size, line
thickness, and the local horizon radius are presentation aids and do not move their scientific
centers or directions.

## Automated and implementation evidence

The physical report is supported, but not replaced, by the integrated Milestone 2D evidence:

- immutable P03/WGS84 scientific snapshot and frame separation;
- exact tested north/south antipodes and a single calibrated geographic-yaw boundary;
- camera-relative Earth-core and homogeneous projective celestial rendering;
- actual `XRView.eye` filtering for presentation-only both/left/right layer modes;
- linear non-writing XR depth policy and explicit lifecycle/disposal ownership; and
- automated type, test, build, desktop, hosted, and prior independent-review evidence recorded in
  project records.

The reconciler reran the current automated suite after this record was created; its exact result is
recorded in `PROJECT_STATE.md` and the closeout commit.

## Not measured by this report

The user did not provide measurements or checklist-level observations for:

- angular accuracy, NCP altitude, SCP antipodality, or numerical world drift;
- individual `both`/`left`/`right` eye-mode combinations, binocular rivalry, or stereo comfort;
- controller coverage, recentering, tracking loss, reset/re-entry, or long-duration lifecycle;
- frame-rate/performance telemetry, seated mode, accessibility behavior, or extended comfort; and
- device/browser version, observer coordinates, selected UTC instant, or environmental conditions.

These omissions do not negate the successful bounded physical report. They remain useful future
regression evidence and must not be represented as separately verified results.

## Known limitations

- Tier 1 uses P03 precession-only mean-axis/equator terminology; it does not add nutation, polar
  motion, Chandler wobble, observed pole offsets, or a claim about Polaris.
- The local horizon is a WGS84-geodetic-up tangent-plane approximation, not a terrain, refracted,
  or natural visual horizon.
- Celestial directions are projective; marker and line visibility are presentation conventions,
  not literal celestial distances or a claim of environmental occlusion.
- The broader long-term geocentric locations, relationship circuits, persistence, advanced
  time-control UI, lunar-cycle visualization, annual paths, and other later roadmap goals were
  outside this Milestone 2D acceptance. Body layers and central-clock live updates were
  implemented and published later; they were not evidence available to this milestone report.

## Follow-up

At the time of this milestone, the planned follow-up was an independent scientific review of the
long-term precession model and trajectory prerequisites. That planning note is superseded as the
current task by `NEXT_TASK.md`; no trajectory work is authorized here. A future trajectory still
requires an accepted model, validity domain, fixtures, sampling, and presentation contract.
