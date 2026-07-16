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

### DEC-012: Adopt Astronomy Engine behind validation wrappers
- **Date:** 2026-07-16
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Astronomy Engine is the preferred application-level browser library for supported
  ephemerides, body events, and documented coordinate transforms, but it must be isolated behind
  strongly tagged project adapters and independently checked against SOFA, IERS, JPL Horizons,
  and/or NOVAS evidence appropriate to each operation. It is not the authority for a
  precession-only mean pole, live Earth Orientation Parameters, polar motion, or a combined XR
  accuracy claim. Adding an exact package version remains an implementation task with its own
  license, bundle, and validation gate.
- **Rationale:** The official JavaScript/TypeScript API fits static browser delivery and covers the
  future application ephemerides, while the standards/reference sources expose important pole,
  time-scale, and Earth-orientation boundaries that a single library abstraction must not hide.

### DEC-013: Use explicit tagged frames and a P03 mean structural axis
- **Date:** 2026-07-16
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Celestial calculations use explicit tracking, room, geographic, Earth-fixed,
  celestial, observer-horizontal, and presentation boundaries. Canonical scientific horizontal
  directions use east/north/up; the final display mapping is `(east, up, -north)` before the
  calibrated geographic parent applies its room yaw. The initial structural Earth-axis target is
  the IAU P03 precession-only mean pole/equator of date, subject to a validated provider proof.
  North and south poles are exact antipodes, and the mean celestial equator is derived from that
  same axis. True/CIP-like, observed, and polar-motion modes remain separately named layers.
- **Rationale:** Tagged frame provenance prevents sign, epoch, origin, and correction ambiguity.
  A precession-only mean structural model supports coherent poles, equator, and long-term-path
  planning without silently mixing nutation or observed Earth-orientation effects.

### DEC-014: Drive all celestial layers from one UTC simulation clock
- **Date:** 2026-07-16
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** All scientific layers consume one immutable simulation snapshot anchored to an
  absolute UTC instant. Local civil time is an explicit IANA-zone view used for labels and civil
  schedules, not an astronomy input by itself. UT1, TT, delta-T, and leap-second policies are
  recorded by precision tier and provider. No celestial layer reads the system clock or resolves
  civil time independently during rendering.
- **Rationale:** A central deterministic clock prevents inter-layer time drift and keeps daylight-
  saving labels, historical/future dates, accelerated time, and astronomical time-scale limits
  testable and explainable.

### DEC-015: Render precession as a validated sampled trajectory
- **Date:** 2026-07-16
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** The product term `precession circle` denotes a scientifically sampled long-term
  mean-pole trajectory, not a presentation primitive constrained to a perfect circle. Northern
  and southern samples are exact antipodes from one model; the selected-date pole is the same
  sample used for the current path-contact marker. A full-cycle display requires a separately
  validated long-term model and declared date domain. Nutation, polar motion, Chandler wobble,
  and observed celestial-pole offsets are never baked into the mean precession path.
- **Rationale:** Obliquity changes and model validity domains make a generic decorative ring
  scientifically misleading. Sampling the adopted model preserves coherent contact points and
  allows the rendered shape to express the actual model rather than visual preference.

### DEC-016: Pin the Tier 1 astronomy adapter to Astronomy Engine 2.1.19
- **Date:** 2026-07-16
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** The initial application-level ephemeris provider is exactly
  `astronomy-engine@2.1.19`, contained behind project-owned observer, instant, frame, correction,
  provenance, and ENU contracts. The initial body profile is provider-apparent topocentric and
  airless: light-time, parallax, aberration, precession, and nutation are explicit, while
  undocumented gravitational deflection is not claimed. Normal refraction is a separate explicit
  profile. Observer longitude is east-positive and
  provider elevation must be mean-sea-level meters. UTC is converted to TT with Astronomy
  Engine's Espenak-Meeus delta-T implementation under its documented UT1 approximately equal to
  UTC policy. This establishes Tier 1 only; changing provider/version/profile is a scientific
  change requiring fixture comparison.
- **Rationale:** The exact package passes TypeScript/Vite integration and bounded NASA/JPL
  Horizons Sun/Moon comparisons, while the wrapper prevents raw provider semantics, silent datum
  conversion, refraction, or time-scale assumptions from leaking into application code.

### DEC-017: Use the validated application-owned P03 mean-pole provider
- **Date:** 2026-07-16
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** The initial mean structural axis uses an application implementation of the
  published IAU P03 Fukushima-Williams bias-precession matrix with TT Julian centuries from
  J2000.0. The matrix direction is GCRS to P03 mean equator/equinox of date; its transposed +Z axis
  is returned as the mean north pole in GCRS, and south is exact component negation. Nutation,
  CIP/true-pole terms, observed offsets, polar motion, and Chandler wobble are excluded. The
  current project validation domain is J2000.0 plus or minus one Julian century; values outside it
  are rejected. The celestial equator must later derive from this same normal/basis.
- **Rationale:** The implementation reproduces all nine components of the IAU SOFA `pmat06`
  published fixture and separately frozen J2000/present/future pole vectors. Astronomy Engine does
  not expose this mean-only quantity, and substituting its true-of-date frame would silently add
  nutation.

### DEC-018: Use explicit immutable scientific snapshots and exact frozen-time caching
- **Date:** 2026-07-16
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Future scientific presentation consumes an immutable snapshot built from explicit observer, UTC clock, geographic-calibration, configuration, provider-version, and revisioned inputs. A missing or invalid input returns a structured non-ready result rather than partial geometry. The P03 axis and deterministic equator basis remain scientific data; calibrated yaw is recorded but applied only by the later presentation parent. Cache entries use the complete exact key and a bounded LRU policy. Frozen or paused instants may cache; an active unpaused clock deliberately bypasses caching. State serialization is versioned and revalidated, while room calibration and cache values are never persisted as universally valid truth.
- **Rationale:** This prevents ambient time, stale observer/calibration values, frame ambiguity, and cache reuse from becoming hidden inputs to visible astronomy. Exact-key caching favors correctness over speculative time quantization and keeps the later rendering layer small.

### DEC-019: Separate accepted calibration identity from semantic clock equality
- **Date:** 2026-07-16
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** Every accepted Milestone 1 calibration capture receives a monotonically increasing scientific identity and invalidates dependent snapshots even when yaw and origin match a prior capture. Failed/cancelled attempts retain the prior accepted identity; reset invalidates it. In contrast, simulation-clock revisions are value-based and do not change for an identical selected instant, mode, pause state, rate, or no-op tick. Public scientific configuration and snapshot values are recursively isolated from caller/provider mutation, and canonical provider identity/version participates in provenance and exact cache keys.
- **Rationale:** A physical recalibration is a new evidence event even when its numeric output repeats, while duplicate clock selections have no scientific change. Distinguishing these semantics prevents stale room calibration reuse without creating needless time/cache churn. Recursive isolation and one provider-version source prevent hidden mutation or inconsistent provenance from bypassing revisioned invalidation.

## Proposed decisions awaiting review

None yet.

## Superseded decisions

None yet.
