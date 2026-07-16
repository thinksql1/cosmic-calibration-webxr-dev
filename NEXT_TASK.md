# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Define Milestone 2 celestial reference-frame architecture

## Why this is next

Milestone 1 is complete: the local geographic frame can be physically calibrated on the tested
Quest 3 flow. Milestone 2 must first define a traceable celestial architecture before adding any
astronomy library, celestial geometry, temporal data, or new XR behavior.

## Objective

Produce an architecture-and-sequencing proposal for scientifically traceable, horizon-relative
celestial reference frames and optional temporal display layers. The proposal must preserve the
existing separation between room/floor, local geographic, and future celestial frames.

## Required planning work

1. Define the intended coordinate/frame chain, ownership, units, epoch/date conventions, and
   transformation boundaries for room/floor, geographic, Earth-rotational, celestial, and
   horizon-relative display frames.
2. Define how Earth’s rotational axis, north/south celestial poles, and celestial equator relate
   to the calibrated local geographic frame without rotating the room frame, XR camera, or
   scientific source coordinates.
3. Evaluate astronomy-library candidates and a validation strategy using authoritative reference
   data. Specify the required date/time, location, civil-time, and observer assumptions before
   selecting or adding a dependency.
4. Define module boundaries and an incremental delivery sequence with explicit validation gates,
   performance/comfort constraints, and a desktop-plus-Quest evidence plan.
5. Define the future precession-circle model:
   - Extend one Earth rotational axis toward both celestial poles.
   - Attach one long-term precession-path circle at each pole end.
   - Compute each pole’s astronomically correct, date-dependent contact point on its circle.
   - Keep north and south as one coherent axis system; never substitute decorative generic circles.
   - Model nutation and smaller motions separately, or explicitly defer them with a reason.
6. Define the future solar temporal-clock model:
   - apparent Sun path;
   - 24 hourly position ticks and optional hour labels;
   - current-Sun emphasis and below-horizon positions;
   - date, location, season, and civil-time handling; and
   - minimal, selectable display modes.
7. Define the future lunar temporal-clock model:
   - Moon next-24-hour path markers and optional hourly labels;
   - local-midnight Moon position;
   - successive local-midnight markers across a lunar cycle;
   - optional date/day labels and lunar-phase symbols; and
   - scientifically accurate non-circular motion.
8. Record the visual/contemplative presentation rule: minimalism is functional; every layer must
   be independently optional; focused attention must be supported rather than interrupted;
   accuracy outranks decorative complexity; and no metaphysical state claim may be presented as
   scientific fact.

## Deliverables

- A proposed Milestone 2 architecture document or clearly scoped amendment describing frame
  contracts, data flow, library-evaluation criteria, validation sources, module boundaries, and
  delivery order.
- Explicit deferred-items and risk notes for precision, timezone/civil-time handling, location
  assumptions, precession/nutation fidelity, and visual comfort.
- Any genuinely durable decision candidates for review; do not mark them accepted without evidence.

## Acceptance rules

- The plan distinguishes local geographic calibration from celestial calculations and display.
- It preserves a single coherent north/south rotational-axis and date-dependent precession model.
- It treats Sun and Moon paths as optional temporal layers backed by defined scientific inputs.
- It defines validation before implementation and makes no unsupported precision or metaphysical
  claim.
- No runtime, dependency, source, workflow, or deployment change occurs.

## Prohibited scope

- Do not implement or install Astronomy Engine.
- Do not add Earth-axis geometry, celestial poles, celestial equator, ecliptic, precession circles,
  nutation, Sun, Moon, planets, geolocation, time controls, temporal ticks, orbital paths, audio,
  or contemplative sequencing.
- Do not alter Milestone 1 behavior, publish, deploy, or begin a new physical test.
