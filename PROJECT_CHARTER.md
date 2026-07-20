# Project Charter

## Identity

**Project name:** Cosmic Calibration WebXR

**Repository location:** `C:\code\cosmic_calibration_webxr`
**Project owner:** Darrell Wright

## Purpose

**Problem:** Humans ordinarily experience Earth as a stationary, locally flat surface beneath a moving sky. This project will create a real-time mixed-reality cosmic-navigation system that makes the user’s actual relationship to Earth, its rotational axis, the Sun, Moon, planets, orbital paths, and celestial reference frames spatially perceptible.

**Who benefits initially:**

- The project owner and early Quest 3 testers.
- People interested in astronomy, spatial orientation, contemplative technology, sacred geometry, and embodied cosmic perspective.

**Why this matters now:**

- Enabling WebXR, Quest passthrough, browser-rendering, and astronomical-calculation technologies exist.
- A narrow proof can establish feasibility before a larger native application commitment.
- The owner wants a working experience soon rather than leaving the concept unbuilt.

## Intended outcome

**Primary deliverable:** A browser-accessible Quest 3 mixed-reality application that overlays scientifically grounded celestial reference geometry into the user’s physical environment and progressively supports embodied cosmic orientation.

**Success looks like:**

1. A user can open the hosted site in Quest Browser and enter mixed-reality WebXR passthrough.
2. A stable floor-relative reference frame appears correctly in the physical environment.
3. Later milestones can add north calibration and real-time celestial geometry without replacing the foundation.

## Scope

### In scope

- Vite, TypeScript, Three.js, and WebXR foundation; desktop fallback; immersive-AR feature detection; floor-relative reference geometry.
- North calibration in Milestone 1 and real-time Sun, Moon, and planet directions in Milestone 2.
- GitHub Pages-compatible static deployment.

### Explicitly out of scope

- Native Quest Store application, full star catalog/planetarium, accounts, analytics, and multi-user functionality.
- Medical, therapeutic, enlightenment, or guaranteed consciousness claims; full merkaba visualization.
- Production deployment during project activation.

## Constraints

### Technical

- Initial target: Meta Quest 3 using Quest Browser; initial delivery: static site compatible with GitHub Pages.
- Initial architecture hypothesis: Vite, TypeScript, Three.js, and WebXR. Astronomy Engine is deferred until Milestone 2.
- Feature-detect WebXR; retain a working desktop fallback. `local-floor` stability and recenter behavior require device evidence.

### Operational

- GitHub repository creation, remote configuration, push, Pages activation, and deployment require separate authorization.
- Prefer small validated milestones over broad partial implementation.

### Quality

- Maintain traceable scientific coordinates, units, calculations, and later validation tolerances.
- Maintain a calm, spacious, precise, luminous, low-noise visual language and user comfort/control.

### Non-negotiables

- Preserve scientific traceability.
- Do not represent contemplative or metaphysical interpretations as scientific fact.
- Preserve a working desktop fallback.
- Do not mark Quest behavior passed without a physical Quest test.
- Prefer small validated milestones over broad partial implementation.
- Maintain a calm, spacious, precise visual language with low visual noise.

## Evidence and validation

Use static inspection, build and focused tests when code exists, desktop runtime verification, physical Quest 3 testing, and later trusted astronomy-source comparison. Quest behavior is **NOT RUN** until physically tested on Quest 3.

## Initial architecture hypothesis

This is a hypothesis, not a binding permanent architecture: Vite and TypeScript provide the static shell; Three.js renders spatial geometry; WebXR provides immersive sessions and floor-relative reference spaces; later astronomy and calibration modules transform traceable scientific coordinates into display geometry.

## Open questions

- Exact Quest Browser immersive-AR behavior and passthrough transparency behavior.
- `local-floor` stability and recenter behavior.
- Final GitHub repository name and Pages base path.
- Controller behavior for Milestone 1 and acceptable astronomical validation tolerances.

## Milestones

| Milestone | Exit condition | Status |
|---|---|---|
| Orientation | Repository, requirements, and constraints reconciled | Complete |
| First vertical slice | One end-to-end path works and is validated | Complete (Milestones 0 and 1) |
| Core capability | Required behaviors are implemented and tested | Published Milestone 2 baseline; local geocentric correction pending independent integration gate |
| Production/readiness review | Acceptance rubric is satisfied | Published baseline complete; local correction pending independent review |
| Handoff/launch | Documentation and operational ownership are complete | Not started |

## Completion definition

The project is complete only when the primary deliverable exists, agreed acceptance criteria are met, validation evidence is recorded, limitations are explicit, and another capable person can continue from the repository documentation.
