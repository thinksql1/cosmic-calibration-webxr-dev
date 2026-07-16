# Decision Log

## Accepted decisions

### DEC-001: Target Quest 3 through Quest Browser
- **Date:** 2026-07-15
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Initial target is Meta Quest 3 through Quest Browser.
- **Rationale:** Selected surface for the initial mixed-reality proof.

### DEC-002: Deliver a static WebXR site for GitHub Pages
- **Date:** 2026-07-15
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Initial delivery is a static WebXR site designed for GitHub Pages.
- **Rationale:** Chosen low-cost initial delivery path; external setup remains unauthorized.

### DEC-003: Use Vite, TypeScript, Three.js, and WebXR initially
- **Date:** 2026-07-15
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Initial stack is Vite, TypeScript, Three.js, and WebXR.
- **Rationale:** It fits static browser delivery and spatial rendering. Dependency versions are not durable decisions.

### DEC-004: Defer Astronomy Engine
- **Date:** 2026-07-15
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Astronomy Engine is deferred until the celestial-reference-frame milestone.
- **Rationale:** Milestone 0 isolates platform and reference-frame feasibility.

### DEC-005: Limit Milestone 0 to the technical spike
- **Date:** 2026-07-15
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Milestone 0 is limited to the reviewed WebXR passthrough and floor-relative reference-frame spike.
- **Rationale:** A narrow proof addresses the highest-risk platform assumptions first.

### DEC-006: Keep scientific and contemplative layers distinct
- **Date:** 2026-07-15
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Scientific and contemplative layers must remain clearly distinguished.
- **Rationale:** Interpretations must not be presented as scientific fact.

### DEC-007: Require physical Quest 3 evidence
- **Date:** 2026-07-15
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Quest-specific acceptance requires physical Quest 3 evidence.
- **Rationale:** Desktop/static checks cannot establish device behavior.

### DEC-008: Use a calm, precise, low-noise visual language
- **Date:** 2026-07-15
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** The initial visual language is calm, spacious, precise, luminous, and low-noise.
- **Rationale:** Geometry should orient rather than overwhelm.

### DEC-009: Separate room, geographic-display, and scientific source frames
- **Date:** 2026-07-15
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Unrotated application north is local `-Z`, east is local `+X`, and physical north calibration applies signed Y-axis yaw only to a dedicated geographic-reference group. The room/floor frame, XR camera, renderer, controllers, and future scientific source coordinates are not rotated by calibration.
- **Rationale:** An explicit tested convention prevents visual trial-and-error from becoming an implicit scientific coordinate rule and keeps future astronomy data traceable.

### DEC-010: Keep north calibration operable without DOM overlay
- **Date:** 2026-07-15
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** DOM overlay is an optional enhancement. Standard tracked-controller events provide
  the complete north-calibration flow: an initial completed primary action begins and arms
  calibration, a later primary action captures an exact current-event target-ray pose, squeeze or
  deliberate holds provide cancel/recalibrate/reset actions, and overlay controls cancel
  `beforexrselect` to avoid dual DOM/XR actions.
- **Rationale:** Optional WebXR features cannot be the only path to a required in-headset task.
  Explicit release gating separates start from capture, current-event pose proof prevents stale
  headings, and overlay isolation keeps both interaction paths coherent.

### DEC-011: Keep celestial modeling accuracy-first and temporal layers independently optional
- **Date:** 2026-07-16
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Future celestial geometry must be derived from traceable scientific calculations in
  a dedicated celestial frame that remains separate from room/floor and local geographic display
  frames. Precession, solar, lunar, and other temporal layers must be independently optional and
  validated before display. Visual minimalism is functional: it supports focused attention, does
  not excuse decorative inaccuracy, and does not present contemplative or metaphysical claims as
  scientific fact.
- **Rationale:** Celestial phenomena have different dependencies, timescales, and validation
  requirements. Frame separation preserves scientific traceability; optional layers prevent
  temporal complexity from obscuring orientation; accuracy-first presentation preserves trust.

## Proposed decisions awaiting review

None yet.

## Superseded decisions

None yet.
