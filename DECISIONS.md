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

### DEC-020: Present the P03 mean axis as one observer-centered directional proxy
- **Date:** 2026-07-16
- **Status:** Accepted
- **Owner:** Darrell Wright / project control
- **Decision:** The first celestial visual layer consumes the immutable Milestone 2A snapshot and
  proves the GCRS P03 pole/matrix pair becomes the mean-date `+Z` axis before converting that
  Earth-fixed mean axis through the WGS84 geodetic ENU basis. Earth rotation about the same axis
  is analytically invariant and is not replaced by fabricated sidereal motion. Presentation maps
  ENU once into `(east, up, -north)`, uses a symbolic `1.8 m` observer-centered line with exact
  antipodal NCP/SCP endpoints, and inherits accepted north yaw only from the geographic parent.
  The physical geocentric axis, observer-centered directional proxy, room floor, and geometric
  horizon remain explicitly distinct. Below-horizon styling may subdue or hide a segment but may
  not recalculate or independently place either pole.
- **Rationale:** This preserves the validated P03/frame provenance while giving an embodied,
  room-scale representation without claiming literal celestial distance or Earth-center
  placement. Keeping the transformation in science and the yaw/radius/style in presentation
  prevents direct-provider coupling, double rotation, false date motion, and independent pole
  drift. The axis-specific Earth-rotation invariance must not be reused for the future equator,
  stars, or bodies.

### DEC-021: Use a geocentric world-scale core with projective celestial poles
- **Date:** 2026-07-18
- **Status:** Accepted; supersedes DEC-020 for new implementation
- **Owner:** Darrell Wright / project control
- **Decision:** Compute the modeled WGS84 Earth-center displacement in local ENU from validated
  observer state, place one P03 mean-axis line through that core, and retain NCP/SCP as exact
  antipodal projective directions at infinity. The observer remains at the modeled surface origin
  and is not moved onto the axis. Declared asymptotic finite points `10^13 m` from the core remain
  CPU-side diagnostics for a convergence bound below `0.14 arcseconds`; they are not physical
  distances or a required GPU representation. Finite core/pole marker and label dimensions are
  appearance only. Geographic calibration yaw remains parent-only. DEC-022 owns the revised safe
  renderer and depth contract.
- **Rationale:** The product requires an actual modeled Earth-core point and a world-scale axis,
  which a nearby line through the user cannot represent. Celestial poles have no finite physical
  distance, so explicitly projective directions avoid inventing one while preserving one exact
  geocentric centerline. Mean-sea-level elevation currently enters WGS84 placement as a disclosed
  Tier 1 numeric ellipsoid-height approximation. The replacement requires new independent,
  hosted, and Quest validation; prior proxy evidence cannot validate it.

### DEC-022: Render the geocentric axis with camera-relative homogeneous geometry and linear XR depth
- **Date:** 2026-07-18
- **Status:** Accepted, integrated, published, and conditionally physically accepted as workable;
  detailed A–K Quest observations were not individually captured
- **Owner:** Darrell Wright / project control
- **Decision:** Preserve the DEC-021 WGS84 core, P03 axis, and projective pole science in immutable
  CPU values, but never upload its `10^13 m` diagnostic finite proxies as GPU positions. For each
  active desktop/XR eye, apply the calibrated parent once, subtract the camera from the finite core
  in JavaScript double precision, and rotate the core and pole direction into that eye's view
  frame. Render the core with homogeneous `w = 1` and poles with `w = 0` using bounded
  coefficient/quad geometry. The shared renderer uses ordinary `0.01–100 m` linear depth; all
  celestial materials disable depth testing and writing, so compositor-visible depth remains
  representative. The Earth-axis handle owns and idempotently disposes its geometry, materials,
  label textures, and draw callbacks.
- **Rationale:** Logarithmic depth distributes depth-buffer values but does not repair raw
  large-coordinate model-view precision and may expose non-linear values to an XR compositor that
  expects the declared linear near/far mapping. Camera-relative/homogeneous rendering preserves
  the scientific line and per-eye world direction without large GPU translations. Explicit
  ownership prevents repeated session/readiness transitions from leaking GPU resources.

### DEC-023: Render the mean celestial equator as a geocentric homogeneous projective great circle
- **Date:** 2026-07-18
- **Status:** Accepted, independently validated, integrated, and published; physical Quest
  validation pending
- **Owner:** Darrell Wright / project control
- **Decision:** Consume the immutable P03 snapshot's validated GCRS equator basis and its
  science-owned horizontal sampling basis. Render the complete mean-equator locus as 96 bounded
  homogeneous `w = 0` directions, with no finite celestial radius or observer-centred hoop. The
  modeled WGS84 Earth core remains the scientific center of the projective limit and the accepted
  geocentric axis remains the normal. The same calibrated geographic parent applies yaw once; the
  existing linear non-writing XR overlay/depth and resource-ownership contracts remain unchanged.
- **Rationale:** A full unlabeled great circle is invariant under rotations of its in-plane sampling
  phase. Validating the GCRS P03 basis while deriving a deterministic local parameterization in the
  science layer preserves the shared plane without fabricating an axis-only transform for general
  celestial coordinates. Homogeneous directions avoid unsafe large GPU positions.

### DEC-024: Keep XR eye presentation separate from scientific coordinates
- **Date:** 2026-07-18
- **Status:** Accepted, integrated, and published; physical validation pending
- **Owner:** Darrell Wright / project control
- **Decision:** Give the axis/poles, celestial equator, and local horizon independent `both`,
  `left`, and `right` presentation modes. Bind left/right through the browser-provided
  `XRView.eye` identity each frame and use view index only for the corresponding Three.js XR
  subcamera layer channel. Do not clone geometry, alter per-eye scientific transforms, or change
  snapshots, calibration, P03 values, Earth-core placement, or depth. Desktop and `eye: none`
  remain visible monoscopic fallbacks.
- **Rationale:** Physical Quest evidence reports one clean line in each eye independently but
  doubled axis/equator lines binocularly. Presentation filtering permits diagnosis and reversible
  accessibility experiments without misclassifying the report as duplicate geometry or changing
  scientific truth. Different layers in different eyes may cause binocular rivalry and are not
  claimed universally comfortable.

### DEC-025: Render the Tier 1 local horizon in the calibrated observer tangent plane
- **Date:** 2026-07-18
- **Status:** Accepted, integrated, and published; physical validation pending
- **Owner:** Darrell Wright / project control
- **Decision:** Render a default-hidden, 96-sample, bounded 24 m local-horizon circle centered on
  the calibrated observer tangent origin. Canonical east/north span the plane, WGS84 geodetic up
  is its Tier 1 normal, ENU maps to application basis once, and the geographic parent applies yaw
  once. Use finite local coordinates and linear non-writing/non-testing depth. Keep the existing
  room-floor ring, geocentric Earth axis, and projective celestial equator scientifically distinct.
- **Rationale:** The local horizon is observer-centered by definition and supplies an embodied
  reference for axis/equator tilt. The 24 m radius is presentation scale, not distance to a natural
  horizon. A gravity-defined astronomical vertical may differ through unmodeled deflection of the
  vertical, so diagnostics disclose the WGS84 geodetic-up Tier 1 approximation.

### DEC-026: Present the first body layer as actual apparent topocentric directions
- **Date:** 2026-07-19
- **Status:** Accepted, independently validated, integrated, and published; physical Quest review pending
- **Owner:** Darrell Wright / project control
- **Decision:** The first visible body layer consists only of Sun, Moon, Mercury, Venus, Mars,
  Jupiter, and Saturn. Each consumes the immutable observer/time/configuration state through the
  validated Astronomy Engine adapter under one explicit Tier 1 correction profile, retains
  EQD_TRUE/HORIZONTAL_ENU provenance and below-horizon truth, and maps to the calibrated scene
  only as a homogeneous projective apparent direction. The active registry and immutable snapshot
  must agree on one frozen provider name/version/adapter/body-set/frame descriptor before a body
  call or cache lookup; both result forms must validate that descriptor and their shared
  observer/instant/profile provenance. A provider-identity rejection preserves immutable complete
  expected/actual descriptor diagnostics with deterministic differing fields. Marker color/size
  improve visibility but
  do not claim literal body size or distance. Geographic yaw stays parent-only.
- **Rationale:** Actual direction is the authoritative basis for later teaching projections. A
  bounded projective marker layer can be validated against the established horizon/equator/axis
  references without fabricating a nearby solar system or expanding into phases, labels, paths,
  ecliptic, astrology, or a second temporal system. The user explicitly promoted this layer ahead
  of, but did not cancel, the planned long-term precession prerequisite review.

### DEC-027: Derive the daily apparent Sun path from explicit IANA civil time while retaining UTC astronomy
- **Date:** 2026-07-19
- **Status:** Accepted, independently validated, integrated, and published; physical Quest
  acceptance pending
- **Owner:** Darrell Wright / project control
- **Decision:** Use the existing central UTC `SimulationClock` and approved airless apparent
  topocentric provider to calculate an observer-relative Sun path for the selected local civil
  date. Resolve that date and its valid hourly boundaries through an explicit browser `Intl` IANA
  time-zone identifier, retaining skipped/repeated DST hours exactly as distinct UTC instants with
  metadata. Render only bounded homogeneous projective directions below the calibrated geographic
  parent; civil-hour notches lie on independently calculated Sun samples, never on the celestial
  equator. A presentation-owned scheduler advances the central clock from explicit monotonic
  elapsed input and refreshes live body state no less than once per minute at normal rate.
- **Rationale:** Civil time defines a human daily clock, whereas UTC defines the scientific input to
  astronomy. Keeping the contracts separate avoids a decorative 24-segment equator, a false fixed
  civil day at DST transitions, and an ambient second scientific clock. The path remains a bounded
  apparent observer reference and does not imply a geocentric physical solar orbit.

### DEC-028: Render the Earth rotational axis from one authoritative spindle descriptor
- **Date:** 2026-07-19
- **Status:** Accepted, independently validated, integrated, and published; physical Quest
  acceptance pending
- **Owner:** Darrell Wright / project control
- **Decision:** The Earth-axis presentation owns one validated descriptor containing the finite
  WGS84 core, one normalized P03 axis direction, its exact component-negated antipode, bounded
  display extent, coordinate-frame identity, observer/calibration revisions, provenance, and
  validity. One per-eye projective image-line equation renders one constant-width spindle strip;
  NCP/SCP markers consume the same direction and exact negation. Separate north/south line objects,
  materials, rotations, parents, and coincident centerlines are prohibited. Geographic yaw remains
  parent-only and depth remains layer-local, linear, non-testing, and non-writing.
- **Rationale:** The prior analytic geometry was collinear, but independently colored, faded,
  clipped, and rasterized halves plus a core marker over their joint created a perceptual hinge.
  One descriptor and one strip make collinearity a presentation invariant, preserve the transparent
  explanatory Earth treatment, and leave every scientific model and unrelated celestial layer
  unchanged.

### DEC-029: Present the core, axis, poles, and celestial equator as one geocentric assembly
- **Date:** 2026-07-20
- **Status:** Accepted, independently validated, integrated, and published; physical Quest
  acceptance pending
- **Owner:** Darrell Wright / project control
- **Decision:** Create one immutable `GeocentricCelestialStructurePresentation` per ready snapshot.
  Its Earth-core anchor is also the celestial-equator center; its normalized positive axis is also
  the equatorial-plane normal and NCP direction; SCP is the exact component negation; and two
  orthonormal basis vectors span the plane through the core. Render a finite explanatory equator
  reference ring at two WGS84 semi-major radii with bounded homogeneous points
  `(coreView / radius + directionView, 1 / radius)`. Parent spindle and equator beneath one
  identity geocentric assembly and apply geographic yaw once on the existing parent. Keep the
  local horizon observer-centered as a sibling.
- **Rationale:** DEC-023's `w = 0` ring preserved plane orientation but erased the finite core from
  visible geometry, so its projected ring could not communicate the clarified core/plane/axis
  relationship. The finite homogeneous construction is projectively exact, keeps GPU components
  near unit scale, produces coherent parallax, and leaves all astronomy and calibration science
  unchanged. This supersedes only DEC-023's rendering-at-infinity choice; its P03 mean-equator
  science and historical evidence remain valid.

### DEC-030: Use a deterministic non-sidereal basis for the first celestial coordinate grid
- **Date:** 2026-07-22
- **Status:** Accepted for development-only implementation
- **Owner:** Darrell Wright / project control
- **Decision:** The first coordinate grid reuses the validated geocentric structure's P03 north
  axis and right-handed equatorial basis. Its 0h direction is the existing local canonical first
  basis vector; positive RA rotates toward the second vector by the right-hand rule. It contains
  four closed declination circles and twelve intentionally open pole-to-pole two-hour meridian
  arcs, with static bounded homogeneous geometry and no per-eye geometry mutation.
- **Rationale:** The repository provides provider RA/declination values and Julian TT but has no
  validated sidereal/vernal-equinox direction in the scene presentation. A deterministic local
  reference is honest, testable, and reusable for later constellation work without falsely
  claiming real-sky RA alignment or reviving the former camera-relative equator approach.

### DEC-031: Keep observer-offset explanatory aids on the existing finite geocentric contract
- **Date:** 2026-07-22
- **Status:** Accepted for development-only architecture; no visible study variant selected
- **Owner:** Darrell Wright / project control
- **Decision:** Use one immutable `ObserverOffsetGeocentricPresentation` derived from the existing
  `GeocentricCelestialStructurePresentation`. Its finite points use the existing bounded
  homogeneous encoding `(P / R, 1 / R)`, with `R` equal to the two-WGS84-semi-major-radius
  celestial grid. The core remains the one shared center; the actual observer remains a separate
  WGS84 ellipsoidal local origin. Preserve WGS84 local ENU geodetic up for tangent cues, while
  exposing a separately labeled one-semi-major-radius reference-sphere point for explanatory
  geometry. Apply geographic yaw only on the existing parent and never mutate anchors per eye.
- **Rationale:** The finite grid is mathematically centered on the core, but an observer near the
  surface sees it from an off-center perspective. A named contract permits bounded explanatory
  studies without falsely re-centering the model, uploading raw Earth-scale vertices, or quietly
  treating the WGS84 ellipsoid as a perfect sphere.

### DEC-032: Compare observer-offset explanation aids before selecting a production visual
- **Date:** 2026-07-22
- **Status:** Accepted for development-only Quest study; production choice pending
- **Decision:** Expose baseline, core-radius, reference-surface, wireframe-Earth, tangent-plane,
  and combined modes only through the development `geoStudy` query/control path. Keep them static,
  default-off, bounded-homogeneous, and sourced solely from DEC-031's contract. Use physical Quest
  comparison to select the smallest calm cue set; do not promote an aid based on desktop review.
- **Rationale:** The issue is perceptual communication rather than a failed grid/core coordinate
  relationship. Reversible, isolated study modes gather the needed evidence without re-centering
  the observer, modifying the celestial structure, or treating a dense explanatory cage as the
  final visual language.

### DEC-033: Test finite natural parallax without changing the scientific core
- **Date:** 2026-07-22
- **Status:** Accepted for one development-only go/no-go experiment; physical Quest result pending
- **Owner:** Darrell Wright / project control
- **Decision:** Keep the shared scientific Earth core and all homogeneous celestial geometry
  unchanged. When `coreStudy=finite-parallax` is explicit, hide the scientific core marker and
  show one fixed local-metre 3D proxy along the contract's normalized observer-to-core direction
  at `1.5`, `2.5`, or `4.0 m`. Parent it only to the calibrated geographic frame and let native XR
  eye cameras create stereo disparity and head-motion parallax. No shader-simulated parallax,
  camera parenting, eye-specific mutation, line, sphere, or other study aid is allowed.
- **Rationale:** Literal Earth-core distance makes human head-motion parallax imperceptible. A
  deliberately disclosed near-field proxy is the smallest test of whether ordinary finite-object
  depth can make the core read as a hologram against the distant grid without corrupting the
  scientific geocentric model.

### DEC-034: Use the Quest-selected finite proxy as normal development Earth Core presentation
- **Date:** 2026-07-22
- **Status:** Accepted for development only; integrated Quest confirmation pending
- **Decision:** The normal development Earth Core visual is one `4.0 m`, `12 cm` finite
  holographic proxy along the immutable scientific observer-to-core direction. The Earth Core
  toggle is authoritative: ON selects exactly one direct core representation and OFF selects none.
  The scientific homogeneous core anchor remains scientific truth and an explicit diagnostic
  comparison option; it is not displayed beside the normal proxy. Swartz Creek, Michigan is the
  editable non-persistent development default (`42.9572`, `-83.8308`, `240 m` MSL).
- **Rationale:** Quest comparison preferred the far proxy. The finite depth is a disclosed
  practical holographic presentation aid, not a literal 6.37-million-metre core distance.

### DEC-035: Extend the apparent body catalog through Pluto with independent planet labels
- **Date:** 2026-07-22
- **Status:** Accepted for development-only physical Quest validation
- **Owner:** Darrell Wright / project control
- **Decision:** Retain the existing Astronomy Engine apparent-topocentric body pipeline and extend
  its bounded catalog with Uranus, Neptune, and Pluto. Mercury through Neptune are major planets;
  Pluto is a dwarf planet and Earth remains excluded from the observer sky. Add a default-off
  Planet Labels master plus individual planet/Pluto visibility controls. Labels reuse the exact
  projective marker direction with a small bounded offset; Sun, Moon, pole, grid, and horizon
  labels remain independent. Marker colors/sizes are symbolic, not physical-disk claims.
- **Rationale:** The provider directly supports the three bodies, so the smallest scientificly
  consistent extension reuses the validated observer/time/frame/rendering path. Labels address the
  reported identification limit without beginning a constellation system or a large collision
  layout engine.

### DEC-036: Render planet labels as finite world-anchored XR sprites
- **Date:** 2026-07-22
- **Status:** Accepted for development planet labels by physical Quest evidence
- **Owner:** Darrell Wright / project control
- **Decision:** Retain each apparent planet marker as its validated projective direction, but render
  its label as one finite native Three.js sprite at `24 m` along that exact direction plus a bounded
  tangent offset. Create a verified nonblank `512 × 128` canvas texture once, reuse the sprite and
  resources through toggles, and let native XR cameras project the fixed anchor per eye. Keep
  labels default-off, subordinate, non-writing, non-testing, and locally suppressible. The
  query-gated Uranus proof may force one marker/label while explicitly reporting forced state.
- **Rationale:** Physical Quest testing proved markers and controls but no labels. Audit showed the
  previous shader ignored plane vertices, making both textured triangles degenerate. A finite
  sprite is the smallest established WebXR scene primitive that preserves world locking, stereo,
  calibrated direction, and scientific honesty without camera parenting or per-eye geometry
  mutation. Physical Quest evidence accepts it for planet labels only; constellation-label scale
  and decluttering remain separately gated.

### DEC-037: Use five canonical planet-label readability presets for development Quest comparison
- **Date:** 2026-07-22
- **Status:** Accepted; physical Quest comparison selected Medium for planet labels
- **Owner:** Darrell Wright / project control
- **Decision:** Physical Quest testing confirmed the finite Sprite contract renders and remains
  marker-attached, but its former Small/Medium/Large dimensions were too small for comfortable
  reading. Preserve the old `1.12 × 0.28 m` Large dimensions as new Small, then define canonical
  non-compounding dimensions: Medium `2.24 × 0.56 m`, Large `4.48 × 1.12 m`, XL `8.96 × 2.24 m`,
  and XXL `17.92 × 4.48 m`. Default to Medium. XL and XXL are intentionally large Quest
  readability experiments; overlap handling is deferred.
- **Rationale:** The world anchor, texture, material, marker direction, and XR eye contract have
  physical evidence. Adjusting only immutable Sprite dimensions isolates the remaining readability
  question without compromising the validated rendering contract or introducing a collision system.

### DEC-038: Use provider-native EQJ catalog conversion and EQD phase for the real-sky grid study
- **Date:** 2026-07-22
- **Status:** Accepted for query-gated development study; physical Quest validation pending
- **Owner:** Darrell Wright / project control
- **Decision:** Convert catalog J2000 RA/declination through Astronomy Engine `Rotation_EQJ_HOR`
  into geometric `HORIZONTAL_ENU`. Orient the already validated mean-date grid with
  `Rotation_EQD_HOR`, changing only its longitude phase so its Earth-axis pole convergence remains
  exact. Remap provider HOR `(north, west, up)` to application `(east, up, -north)` with one proper
  determinant-`+1` matrix. Apply physical-north calibration only on the existing geographic
  parent. Keep canonical mode as the normal default until Quest acceptance.
- **Rationale:** Raw J2000 `+Z` differs from the current mean-date pole (about `0.149 degrees` at the
  audit epoch), so one mislabeled matrix cannot satisfy both catalog truth and exact validated pole
  convergence. The two explicit provider frames preserve each contract without double-applying
  UTC, longitude, sidereal phase, or calibration yaw. A shader-side rotation about the encoded core
  retains immutable homogeneous grid geometry and native stereo projection.

## Proposed decisions awaiting review

None yet.

## Superseded decisions

- DEC-020 is superseded by DEC-021 for the geocentric replacement. It remains recorded as the
  contract of the previously published Milestone 2B proxy.
