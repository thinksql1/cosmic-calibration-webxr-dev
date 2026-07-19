# Milestone 2 Sequence

## Purpose

This sequence turns the accepted celestial architecture into bounded, reviewable work. It is a
dependency order, not authorization to begin implementation. Each step must preserve the tested
room/geographic frame and must pass its own independent review before the next visible layer is
started.

The [long-term product roadmap](LONG_TERM_PRODUCT_ROADMAP.md) records broader possible product
families and their guardrails. It does not reorder this sequence, select the next task, or
authorize implementation.

The scientific evidence behind this order is indexed in the [official astronomy source
register](OFFICIAL_ASTRONOMY_SOURCES.md).

The first step is deliberately narrower than the complete scientific foundation. Research found
that Astronomy Engine exposes a useful true-equator-of-date frame but does not document a public
precession-only mean-equator-of-date transform. The project must prove the application adapter and
mean-pole provider before selecting visible axis or precession geometry.

**Current status:** Milestone 2A0 is complete on
`feature/milestone-2a0-astronomy-validation`. Astronomy Engine `2.1.19`, the canonical ENU
boundary, and the application-owned P03 mean-pole provider passed their bounded fixture gates.
Milestone 2A's non-visual state/snapshot/cache foundation passed its independent gate and is
integrated and published. Milestone 2B consumes the validated snapshot for only a coherent Earth
axis and NCP/SCP presentation layer. Its independent, automated, desktop, workflow, and hosted
gates pass and it is integrated and published normally. The user has physically tested the
hardened geocentric replacement and celestial equator. The equator is good/workable and each eye
individually receives one clean axis/equator line, while binocular viewing doubles both layers.
Milestone 2D therefore adds bounded eye-presentation modes and a local tangent-plane horizon. The
user has now explicitly promoted bounded actual Sun/Moon/major-planet placement ahead of the
previously selected long-term precession prerequisite review; that review remains planned and is
not silently removed.

## Sequence overview

```text
2A0 astronomy adapter and pole-model validation spike
  -> 2A scientific foundation
      -> 2B mean Earth axis and antipodal celestial poles
          -> 2C mean celestial equator
              -> 2D eye-presentation modes and local horizon
                   -> 2E actual apparent Sun/Moon/major-planet directions
                       -> later validated precession/ecliptic/projection/temporal milestones
```

Every milestone consumes the same observer, time, frame, provenance, and correction contracts.
Later layers may extend those contracts; they may not bypass them.

## Milestone 2A0 - astronomy adapter and pole-model validation spike

**Result:** PASS for the bounded Tier 1 non-visual contract. See
[Astronomy Adapter Contract](ASTRONOMY_ADAPTER_CONTRACT.md) and
[Mean Pole Model Validation](MEAN_POLE_MODEL_VALIDATION.md).

**Objective:** establish that the proposed runtime library, canonical frame mapping, and a
precession-only mean-pole provider can satisfy the architecture before the project builds on them.

**Inputs**

- The six Milestone 2 architecture and research documents.
- The existing room/geographic frame convention and north calibration.
- A reviewed, exact Astronomy Engine package version and license notice.
- Bounded SOFA, NOVAS, and/or JPL Horizons reference fixtures with complete provenance.

**Outputs**

- A minimal, non-visual Astronomy Engine adapter with strongly tagged vectors and correction
  profiles.
- An immutable observer/time snapshot boundary sufficient for deterministic tests.
- Proven `EQJ -> HOR -> canonical ENU -> Three.js` basis/sign mappings.
- A written and tested determination of how the application will obtain an IAU P03
  precession-only mean pole/equator of date.
- Measured bundle/build impact and an exact dependency/license record.

**Dependencies:** architecture approval only. This spike does not depend on visible celestial
geometry.

**Acceptance criteria**

1. The pinned package imports in the current browser/Vite/TypeScript target without unrelated
   dependencies.
2. All scientific outputs carry frame, origin, instant, observer, correction, units, provider,
   version, and precision metadata.
3. Basis-vector, round-trip, invalid-input, and deterministic-clock tests pass.
4. Bounded Sun/Moon or frame cases agree with recorded independent fixtures within tolerances
   declared before comparison.
5. The precession-only mean-pole provider is demonstrated against SOFA/P03 evidence, or the spike
   stops without inventing a fallback.
6. Astronomy Engine true `EQD`, mean-axis geometry, and any future observed/CIP mode remain
   explicitly distinct.
7. Type-check, tests, production build, dependency inspection, and documentation review pass.

**Physical Quest boundary:** no physical astronomical-placement claim is made. A production build
may receive a smoke test only if dependency or performance behavior warrants it; there is no new
visible XR feature to accept.

**Explicit exclusions:** visible Earth axis, poles, equator, ecliptic, precession paths, Sun, Moon,
planets, geolocation, user-facing time controls, persistence, and contemplative sequencing.

**Stop condition:** if no supportable mean-pole provider or validation route is found, stop and
return a bounded scientific-model remediation/research task. Do not substitute `EQD`, a body-axis
helper with different semantics, or a decorative circle.

## Milestone 2A - scientific foundation

**Objective:** implement the production-quality, non-visual observer, simulation-time, reference-
frame, and astronomy-provider foundation validated by 2A0.

**Inputs**

- Accepted 2A0 adapter and pole-provider result.
- Explicit observer values with datum, uncertainty, and provenance.
- One UTC simulation instant plus an explicit IANA time-zone ID for labels/schedules.

**Outputs**

- Validated observer state and revision/invalidation rules.
- One central deterministic simulation clock and immutable calculation snapshot.
- Tagged frame/vector/matrix types and canonical ENU conversions.
- Provider cache keyed by observer, time, correction, model, and provider revisions.
- Offline golden fixtures and a reproducible fixture manifest.

**Dependencies:** 2A0 PASS and explicit approval to adopt the exact dependency.

**Acceptance criteria**

1. No celestial layer calls `new Date()` or reads location independently.
2. UTC calculation and civil label/schedule concerns are separated.
3. Unit, handedness, sign, time-scale, datum, and correction boundaries are tested.
4. Observer/time/provider changes invalidate exactly the affected results.
5. Existing Milestone 0/1 automated, desktop, and north-frame behavior do not regress.
6. No visible celestial geometry or unverified precision claim is introduced.

**Physical Quest boundary:** existing scene and north calibration regression only; celestial
scientific correctness remains an automated/reference-fixture gate.

**Explicit exclusions:** automatic geolocation/time-zone selection, EOP feeds, visible celestial
layers, temporal clocks, and time controls.

## Milestone 2B - mean Earth axis and celestial poles

**Current result:** the earlier observer-centered implementation was superseded by the integrated
and published geocentric DEC-021/DEC-022 model. The first geocentric renderer gate rejected raw
large GPU coordinates, logarithmic XR depth, and missing disposal; the hardened re-gate,
integration, publication, and hosted regression subsequently passed. The user has physically
tested the published experience and accepted it as workable with no blocking issue reported.
Physical acceptance is **CONDITIONAL PASS** because detailed A–K observations were not captured.

**Objective:** render one coherent world-scale P03 mean-axis-of-date system through the modeled
WGS84 Earth core, with the observer retained at the surface and exact antipodal projective north
and south celestial-pole directions.

**Inputs**

- Validated mean-axis provider and scientific snapshot from 2A.
- Observer geodetic latitude/longitude and calibrated geographic frame.
- Initial geodetic geometric horizon contract.

**Outputs**

- One geocentric mean Earth-axis line through the modeled core with projective NCP/SCP directions.
- Optional, clearly styled below-horizon continuation and pole labels.
- Proven latitude/horizon relationship and model/provenance disclosure.
- Bounded manual observer and frozen/current-time diagnostic controls backed by the Milestone 2A
  state stores; no automatic location or general time-animation system.

**Dependencies:** 2A PASS; accepted DEC-021 world-scale/projective-pole and below-horizon policy.

**Acceptance criteria**

1. The two pole endpoints are normalized exact negatives derived from one mean-axis value.
2. Pole altitude/azimuth behavior passes authoritative latitude/date fixtures, including both
   hemispheres and the equator.
3. North recalibration remaps the presentation parent only; it never mutates scientific values.
4. The layer says `P03 mean pole/equator of date`, not generic, true, instantaneous, or observed
   pole.
5. Existing floor, horizon diagnostic, cardinal, controller, and session behavior remain intact.

**Physical Quest boundary:** conditionally accepted from the user's practical report that the
published experience is workable. Individual floor/up, north-alignment, pole-altitude, world-
locking, below-horizon, readability, stereo, and comfort observations were not separately
captured; do not claim them as independently verified or claim angular precision beyond the
combined evidence budget.

**Explicit exclusions:** celestial equator, precession path, nutation, polar motion, EOP, ecliptic,
Sun, Moon, planets, animated/general time controls, automatic location, and persistence.

## Milestone 2C - mean celestial equator

**Current result:** independently validated, normally integrated in merge `0926cbf`, and published
from `54d64d0`; 299 tests, development/preview regression, GitHub Actions run #14, hosted controls,
and the bounded projective-rendering gate pass. Physical Quest testing is pending.

**Objective:** render the great circle perpendicular to the exact same P03 mean axis used by 2B.

**Inputs:** accepted 2B axis, shared presentation radius, and geometric-horizon relationship.

**Outputs:** a segmented, optionally below-horizon mean equator-of-date layer with sparse optional
labels.

**Dependencies:** 2B PASS; no independent orientation control is permitted.

**Acceptance criteria**

1. Every sampled equator point is orthogonal to the selected axis within a predeclared numerical
   tolerance.
2. The equator is a closed great circle, and its plane normal is the axis used for NCP/SCP.
3. Equator/horizon behavior passes equatorial, mid-latitude, high-latitude, and southern cases.
4. Below-horizon continuity can be inspected without confusing the room floor with the
   astronomical horizon.
5. Visibility and labels are independently optional; minimal mode remains low-noise.

**Physical Quest boundary:** **CONDITIONAL PASS.** The user reports the equator good and workable,
with one clean equator line in either eye independently and binocular doubling. Individual results
for world locking, horizon crossings, seam, readability, and comfort were not supplied and are not
invented.

**Explicit exclusions:** true equator/nutation mode, precession path, ecliptic, bodies, temporal
ticks, and contemplative sequencing.

## Milestone 2D - eye-presentation modes and local horizon

**Current result:** independently validated, integrated, published, and physically accepted as the
current workable spatial-reference baseline. The user described the deployed Meta Quest experience
as incredible and really coming together nicely. This is a bounded product-usability PASS, not an
individual measurement of each eye-mode combination, world-locking behavior, angular accuracy, or
comfort condition.

**Objective:** reconcile the supplied binocular evidence, add independent reversible eye
presentation for axis/equator/horizon, and add one calibrated local altitude-zero reference circle.

**Inputs:** published 2B/2C layers, actual `XRView.eye` identity, canonical ENU, accepted geographic
calibration, and the Tier 1 WGS84 geodetic-up horizon contract.

**Outputs:** independent `both`/`left`/`right` layer modes, mono desktop fallback, bounded
diagnostics, and a default-hidden 96-sample 24 m local tangent-plane horizon.

**Dependencies:** 2C publication and the user's conditional physical evidence.

**Acceptance criteria:** eye filtering changes only visibility, uses actual XR eye identity without
scene copies, preserves all scientific coordinates and depth contracts, and the horizon contains
N/E/S/W, is perpendicular to local up, inherits yaw once, reuses/disposes owned resources, and
remains distinct from the room-floor ring and celestial equator.

**Physical Quest boundary:** the reported current experience has passed bounded physical usability
acceptance. Monocular combinations, rivalry/comfort, horizon/cardinal alignment, whether it
clarifies geocentric relationships, world locking, reset/re-entry, and readability remain
unmeasured regression cases; do not claim the modes cure binocular doubling before observation.

**Explicit exclusions:** precession, ecliptic, bodies, temporal clocks, broad layer management,
media, game, AI, and contemplative sequencing.

## Milestone 2E - actual solar-system body directions

**Current result:** implemented locally on `feature/actual-solar-system-bodies`; independent
integration/publication and physical Quest acceptance remain pending.

**Objective:** render the actual apparent topocentric directions of Sun, Moon, Mercury, Venus,
Mars, Jupiter, and Saturn as one optional bounded marker layer.

**Inputs:** immutable observer/time scientific snapshot, the validated Astronomy Engine adapter,
one explicit Tier 1 correction profile, canonical ENU, and the existing calibrated geographic
parent.

**Outputs:** typed provider-provenanced equatorial/horizontal body results, a separate bounded
observer/time/configuration/provider cache, and homogeneous projective actual-direction markers.

**Acceptance criteria:** every marker preserves its apparent altitude/azimuth and below-horizon
truth; presentation maps ENU once, applies geographic yaw only through the parent, uploads no raw
astronomical-distance GPU values, and does not add Moon phase, labels, pointing, ecliptic,
projection, temporal paths, or a broad planetarium interface.

**Physical Quest boundary:** test the actual body layer before beginning celestial-equator
projection or a later precession/ecliptic structure. The prior precession prerequisite review
remains a planned scientific task after this promoted bounded layer.

**Explicit exclusions:** Uranus, Neptune, Pluto, small bodies, stars, labels, pointing, Moon
phase, planet disks/rings, ecliptic, projection modes, declination connectors, paths, animation,
and temporal controls.

## Later validated precession trajectories

**Objective:** add scientifically computed north/south long-term mean-pole trajectories and a
date-dependent current contact marker without forcing the result into a perfect decorative ring.

**Inputs**

- Accepted axis/equator model and current mean-axis provider.
- A separately reviewed long-term precession model, validity domain, epoch, direction, sampling
  policy, and independent reference fixtures.
- A selected historical/future display interval and adaptive sampling tolerance.

**Outputs**

- One sampled north mean-pole trajectory and an exact-negated south trajectory.
- Current-date pole samples that touch the corresponding paths by construction.
- Model/date-domain disclosure, optional time labels, and visible distinction from nutation.

**Dependencies:** 2D independent and physical acceptance plus a dedicated scientific review of the long-term model. P03's normal
date domain is not silently stretched to a full precession cycle.

**Acceptance criteria**

1. Every path vertex is produced by the adopted precession-only model with recorded epoch/date.
2. South samples are exact negatives of matching north samples.
3. The current axis endpoints and current path markers are the same scientific samples.
4. Sampling error and the model's validity interval have declared, tested bounds.
5. Nutation, polar motion, Chandler wobble, and observational pole offsets are absent or separately
   named/controlled; none is baked into the mean path.
6. A non-circular result remains non-circular and is described as a trajectory, not corrected by
   presentation code.

**Physical Quest boundary:** verify path/contact coherence, label clarity, scale, world locking,
and comfort. Physical observation cannot validate a millennia-scale numerical trajectory; that
remains a reference-fixture/scientific-review gate.

**Explicit exclusions:** live EOP, combined apparent-pole animation, Sun, Moon, planets, ecliptic,
and broad time-navigation UI.

## Later milestones

Proceed one scientific dependency at a time after 2D. These are intentionally ordered but are not
part of the first Milestone 2 implementation authorization.

### Post-2D E - ecliptic

- **Objective:** add one explicitly named mean or true ecliptic great circle without conflating it
  with the adopted equator.
- **Inputs:** accepted celestial frame/time snapshot and independently validated ecliptic model.
- **Outputs:** one optional great-circle layer with model/epoch provenance.
- **Dependencies:** 2C PASS; the precession-path milestone is not required unless the chosen model
  shares its long-term provider.
- **Acceptance:** obliquity and equator/ecliptic intersections pass authoritative fixtures; the
  layer remains independently selectable and below-horizon continuous.
- **Quest boundary:** orientation, world locking, below-horizon style, label clarity, and comfort.
- **Exclusions:** Sun/Moon/planets, zodiac decoration, temporal ticks, and unqualified `ecliptic`
  naming.

### Post-2D F - apparent Sun

- **Objective:** add only the current apparent topocentric Sun direction.
- **Inputs:** accepted adapter, observer/time snapshot, explicit aberration/parallax/refraction
  profile, and Sun fixtures.
- **Outputs:** one optional current-Sun marker with above/below-geometric-horizon state.
- **Dependencies:** 2A PASS; ecliptic display is not a rendering dependency.
- **Acceptance:** selected observer/date cases agree with Horizons/NOVAS within predeclared
  tolerances; no system-clock or civil-label ambiguity exists.
- **Quest boundary:** observed directional plausibility, world locking, below-horizon behavior,
  scale/brightness, and comfort; never direct unprotected solar observation.
- **Exclusions:** path, hourly ticks, rise/set claims, time controls, glow spectacle, or physical
  arcminute-accuracy claims.

### Post-2D G - solar temporal clock

- **Objective:** add the selected-date apparent Sun path and independently optional civil-hour
  ticks, labels, current emphasis, and rise/set annotations.
- **Inputs:** accepted current-Sun layer, civil resolver, selected IANA zone/date, correction/event
  definitions, and temporal fixtures.
- **Outputs:** sampled path plus separate path/tick/label/current/event layers and schedule
  provenance.
- **Dependencies:** apparent Sun PASS and central clock/civil scheduling PASS.
- **Acceptance:** ordinary and selected one-hour 23/25 civil-day schedules are truthful; non-hour
  transitions retain their actual counts; below-horizon samples and event semantics are explicit.
- **Quest boundary:** minimal modes, clutter, label readability, slow/meaningful change, world
  locking, brightness, and comfort.
- **Exclusions:** automatic time-zone/location, dense default labels, forced 24-marker DST days,
  and Moon/planet paths.

### Post-2D H - apparent Moon

- **Objective:** add the current apparent topocentric Moon direction with separately sourced phase
  metadata.
- **Inputs:** accepted adapter, observer/time/correction snapshot, parallax-aware Moon fixtures,
  and validated phase semantics.
- **Outputs:** one optional current-Moon marker plus read-only phase/illumination metadata.
- **Dependencies:** 2A PASS; Sun direction is needed only where the provider's phase contract
  requires it.
- **Acceptance:** topocentric cases distinguish material parallax from geocentric results and
  agree with independent fixtures; phase does not determine sky direction.
- **Quest boundary:** directional plausibility, world locking, below-horizon handling, label and
  phase-symbol clarity, brightness, and comfort.
- **Exclusions:** lunar path, orbit depiction, hourly/midnight samples, and circularized motion.

### Post-2D I - lunar temporal clocks

- **Objective:** deliver the next-24-elapsed-hour Moon path first, then the independently sampled
  local-midnight phase-cycle clock.
- **Inputs:** accepted Moon layer, central clock, IANA civil resolver, arbitrary-phase recurrence
  provider, and temporal/body fixtures.
- **Outputs:** 25 next-24-hour samples; a variable-length local-midnight sequence ending at the
  first sampled midnight on/after the validated matching-phase recurrence; independent labels and
  phase symbols.
- **Dependencies:** apparent Moon PASS and both elapsed-time/civil-schedule test suites PASS.
- **Acceptance:** exact 24-hour elapsed span, correctly resolved midnights/folds/gaps, non-circular
  apparent directions, phase/direction separation, and sparse default labels.
- **Quest boundary:** path comprehension, clutter modes, world locking, below-horizon continuity,
  label/phase clarity, brightness, and comfort.
- **Exclusions:** assumed 29/30-day fixed cycles, circular observer-centered orbit, dense default
  labels, and combined solar/lunar controls without separate validation.

### Post-2D J - planets and other bodies

- **Objective:** enable one body at a time only after its own scientific and presentation gate.
- **Inputs:** accepted adapter, body-specific correction profile/date domain, and independent
  golden fixtures.
- **Outputs:** optional current marker; a path only after separate temporal validation.
- **Dependencies:** 2A PASS plus that body's ephemeris/reference review.
- **Acceptance:** body-specific cases and supported-date edges pass; labels identify the object and
  model without implying telescope-grade pointing.
- **Quest boundary:** world locking, visibility modes, scale/brightness, label density, and comfort.
- **Exclusions:** all-at-once planetarium mode, decorative stars, orbital traces without sampled
  apparent-direction semantics, and unsupported bodies.

### Post-2D K - contemplative sequencing

- **Objective:** add optional visibility, emphasis, fades, and attention pacing over already
  accepted scientific layers.
- **Inputs:** immutable scientific snapshots, independent layer visibility controls, and an
  explicitly separate presentation clock/state.
- **Outputs:** calm minimal compositions and reversible sequences that never change a scientific
  coordinate.
- **Dependencies:** each participating layer has already passed its scientific, desktop, and Quest
  gate.
- **Acceptance:** switching/sequencing changes only presentation state; labels and layers remain
  independently optional; no forced camera motion, gratuitous animation, scientific distortion,
  or guaranteed altered-state claim appears.
- **Quest boundary:** pacing, distraction, readability, brightness, accidental activation,
  comfort, and an immediate stop/exit path.
- **Exclusions:** metaphysical claims as science, biometric inference, therapeutic claims, audio
  unless separately authorized, and scientific coordinates driven by presentation timing.

Do not turn this sequence into a general-purpose planetarium backlog. Each later authorization
must still predeclare its correction profile, cadence, error sources, fixtures, visibility
default, and evidence boundary.

## Sequence-wide controls

- One coherent unit is reviewed and committed at a time.
- Every new visible scientific layer requires automated reference evidence and a physical Quest
  presentation check; neither substitutes for the other.
- Precision promotion is explicit. Tier 1 limits are not relabelled Tier 2 or Tier 3.
- Existing floor and geographic calibration remain prerequisites and are regression-tested.
- Source/model/version updates are scientific changes with fixture comparison, not routine
  dependency maintenance.
- No layer is enabled by default merely because it has been implemented.
