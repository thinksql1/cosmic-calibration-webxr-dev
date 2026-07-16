# Milestone 2 Celestial Reference Architecture

## Status and scope

This document is the architecture contract for future Milestone 2 implementation. It defines
frames, scientific ownership, transforms, axis/pole/equator models, precision tiers, display
layers, and invalidation. It contains no application implementation.

External model and platform facts trace to the [official astronomy source
register](OFFICIAL_ASTRONOMY_SOURCES.md). Recommendations and unresolved assumptions are labelled
separately near the end of this document.

The architecture preserves the validated Milestone 1 convention:

- `+Y` is local up and the XZ plane is local horizontal.
- Uncalibrated application north is Three.js `-Z`; east is `+X`.
- North calibration applies a signed Y-axis yaw only to the geographic presentation parent.
- The XR camera, renderer, `local-floor` reference space, controllers, room diagnostics, and
  scientific source values are never rotated to perform geographic calibration.

## Implemented foundation and first visual consumer

Milestone 2A implements the application-owned observer, explicit-tick UTC clock, read-only
geographic-calibration view, Tier 1 configuration, provider registry, immutable P03
axis/equator-basis snapshot, and bounded exact-key cache described in [Scientific State
Foundation](SCIENTIFIC_STATE_FOUNDATION.md). Milestone 2B extends that snapshot with a
validated observer-horizontal Earth-axis result and consumes it in the first bounded presentation
layer: one symbolic axis and exact antipodal NCP/SCP endpoints. Calibration yaw remains
presentation-parent work. The visible layer passed independent review and is integrated into
local `master`; publication and physical Quest acceptance remain pending. No celestial-equator
geometry, precession path, body display, temporal
clock, or contemplative sequence has been added. See [Earth Axis and Celestial
Poles](EARTH_AXIS_AND_CELESTIAL_POLES.md).

## Non-negotiable invariants

1. Every scientific vector carries its origin, orientation/frame, units, epoch/date, observer,
   correction profile, and provenance.
2. Tracking, room, geographic, terrestrial, celestial, horizontal, and presentation frames are
   distinct even when a transform happens to be identity for one test case.
3. North and south celestial poles are exact antipodes of one selected axis vector.
4. The celestial equator is derived from that same selected axis, never oriented independently.
5. Precession, nutation, polar motion, Chandler wobble, and observed pole offsets are separate
   model components.
6. A presentation group may scale, style, fade, or inherit geographic yaw; it may not calculate
   an ephemeris or silently change a scientific direction.
7. Every celestial layer consumes the same immutable observer/time snapshot for one update.
8. A WebXR reset or room change invalidates room-to-geographic calibration, not celestial
   ephemeris truth. Rendering pauses until the mapping is coherent again.
9. Scientific coordinates are never inferred from a visible mesh or a retained Three.js world
   matrix.
10. Accuracy, model, and uncertainty are named; the word `pole`, `horizon`, or `apparent` is never
    used without its selected definition where ambiguity matters.

## Reference-frame hierarchy

```text
XR tracking / local-floor frame                         physical tracking
├── room-relative diagnostic frame                     presentation only
└── calibrated geographic presentation frame           room -> geographic yaw
    ├── local floor/cardinal presentation
    └── observer-centered celestial presentation frame display mapping only
        ├── Earth-axis presentation
        ├── NCP/SCP presentation
        ├── celestial-equator presentation
        ├── precession-path presentation               future
        ├── ecliptic presentation                      future
        ├── Sun temporal presentation                  future
        ├── Moon temporal presentation                 future
        └── other optional presentation layers         future

Scientific model graph (not Three.js parenting)
WGS84-like Earth-fixed terrestrial state
    -> selected Earth orientation / pole model
EQJ/GCRS-like celestial source state
    -> mean or true equator-of-date transform
    -> observer-centered topocentric horizontal frame
    -> canonical east/north/up unit direction
    -> explicit geographic-to-Three.js basis map
```

The two graphs intentionally meet only at the final display adapter. A Three.js parent-child
relationship is not evidence that a scientific frame transform occurred.

## Frame contracts

### 1. XR tracking / `local-floor` frame

- **Origin:** user-agent/device native origin at an established or estimated floor in a safe
  standing position.
- **Axes and handedness:** WebXR native `+X` right, `+Y` up, `-Z` forward; right-handed.
- **Units:** meters.
- **Parent:** WebXR device/session; represented by the Three.js scene root.
- **Rotated by:** only the XR system's tracking/reference-space behavior.
- **Must never be rotated by:** north calibration, observer longitude, sidereal time, precession,
  an ephemeris, or presentation sequencing.
- **Nature:** physical tracking frame.
- **Varies with observer/time:** no astronomical dependency.
- **Varies with XR recentering:** yes; a reference-space reset can change the physical mapping.
- **Persistence:** session-scoped.
- **Invalidation:** session end, reference-space reset/discontinuity, boundary/floor reset, room
  change, or lost/re-established tracking origin.

### 2. Room-relative diagnostic frame

- **Origin/axes/units:** inherits the XR frame; origin marker and diagnostics are authored in
  meters around `Y = 0`.
- **Parent:** XR tracking frame.
- **Rotated by:** nothing astronomical or geographic.
- **Nature:** physical diagnostic presentation.
- **Varies with observer/time:** no.
- **Varies with XR recentering:** follows the XR frame.
- **Persistence:** none.
- **Invalidation:** session/scene disposal; it remains visible while geographic calibration is
  absent.

The existing floor ring is a room-level diagnostic circle. It is not automatically the
astronomical horizon.

### 3. Calibrated local geographic frame

- **Origin:** the chosen physical calibration origin, represented at the local-floor origin for
  the current session. A future translated origin requires an explicit tracked transform.
- **Axes and handedness:** semantic east/up/south mapped to Three.js: `+X = east`, `+Y = up`,
  `-Z = north`, `+Z = south`; right-handed.
- **Units:** meters for presentation positions; directions are unitless.
- **Parent:** XR tracking frame.
- **Rotated by:** the accepted physical-north yaw around local `+Y`.
- **Must never be rotated by:** date/time, longitude, precession, nutation, object motion, or layer
  style.
- **Nature:** calibrated physical-to-geographic presentation mapping.
- **Varies with observer location:** its yaw does not; the scientific contents below it may.
- **Varies with date/time:** no.
- **Varies with XR recentering:** the mapping becomes invalid and must be recalibrated.
- **Persistence:** in-memory/session-scoped under the accepted Milestone 1 contract.
- **Invalidation:** all existing north-calibration invalidators plus a changed trusted north
  reference.

### 4. Earth-fixed terrestrial frame

- **Origin:** Earth center of mass.
- **Axes and handedness:** a WGS 84/ITRS-like Earth-centered, Earth-fixed right-handed frame:
  `+Z` along the selected conventional terrestrial pole, `+X` through the reference meridian,
  `+Y` completing the frame eastward.
- **Units:** meters for observer position; unitless for directions.
- **Parent:** mathematical Earth model, not the XR scene graph.
- **Rotated by:** Earth orientation only when related to a celestial frame.
- **Must never be rotated by:** XR recentering or physical north-calibration yaw.
- **Nature:** mathematical/scientific.
- **Varies with observer location:** the observer vector does.
- **Varies with date/time:** an idealized WGS 84 Earth-fixed position does not; its relation to a
  celestial frame does.
- **Varies with XR recentering:** no.
- **Persistence:** observer input may be retained only under a future explicit privacy policy;
  none is authorized now.
- **Invalidation:** observer/datum/height changes or a precision-tier/EOP change.

Tier 1 is explicitly `WGS84_APPROX_EARTH_FIXED`, not a claim to a fully realized ITRS station
coordinate. Tier 3 may add a named ITRF realization and epoch.

### 5. Earth rotational-axis model frame

- **Origin:** scientific Earth center.
- **Axes:** `+Z_axis` is the selected north-axis unit vector; `-Z_axis` is the south endpoint. The
  remaining axes are derived from the selected equator/origin convention and are not invented by
  the renderer.
- **Units:** unit vectors for orientation; optional conceptual Earth-radius units for scientific
  diagrams.
- **Parent:** a tagged celestial orientation such as EQJ/GCRS-like.
- **Rotated by:** the selected named pole model at the simulation instant.
- **Must never be rotated by:** separate N/S controls, visual label orientation, or geographic yaw
  in the scientific model.
- **Nature:** scientific.
- **Varies with observer location:** no geocentrically; its horizontal appearance does.
- **Varies with date/time:** yes according to the selected model.
- **Varies with XR recentering:** no.
- **Persistence:** derived/cache only, keyed by time/model/provider version.
- **Invalidation:** simulation time, pole model, precision tier, provider version, or relevant EOP
  revision changes.

### 6. Celestial source frames

At minimum the provider boundary recognizes:

- **EQJ:** Astronomy Engine's J2000 mean-equator orientation; origin is separately tagged as
  geocenter, heliocenter, or barycenter. Its axes must not be renamed ICRS without a verified
  frame-bias contract.
- **EQD_TRUE:** true equator/equinox of date, including the provider's precession and nutation.
- **GCRS/CIRS:** standards-level frame names reserved for a provider that actually implements the
  corresponding IAU/SOFA contract.
- **ECL_J2000 / ECT_TRUE:** future ecliptic frames, kept distinct from equatorial frames.

Axes are right-handed, units are AU for body vectors or unitless after explicit normalization,
and origins are scientific. These frames do not depend on XR state or north calibration.

### 7. Observer-centered horizontal/apparent frame

- **Origin:** topocentric observer location.
- **Canonical axes and handedness:** `east`, `north`, `up` (ENU), right-handed when represented as
  `(east, north, up)`.
- **Units:** unitless direction plus separately tagged distance if needed.
- **Parent:** the selected celestial source transformed using observer location and simulation
  time.
- **Rotated by:** Earth orientation, observer latitude/longitude, selected apparent corrections,
  and optionally refraction for an explicitly refracted result.
- **Must never be rotated by:** XR recentering, presentation radius, or label billboarding.
- **Nature:** scientific/coordinate conversion.
- **Varies with observer location/date/time:** yes.
- **Varies with XR recentering:** no; only its later room mapping becomes invalid.
- **Persistence:** derived/cache only.
- **Invalidation:** observer/time/correction/provider/precision revision.

Astronomy Engine's `HOR` vector uses `(north, west, zenith)`. The adapter converts it to ENU as:

```text
east  = -HOR.y
north =  HOR.x
up    =  HOR.z
```

### 8. Observer-centered celestial presentation frame

- **Origin:** display origin at the calibrated observer marker.
- **Axes:** Three.js `x = east`, `y = up`, `z = south`, so north is `-z`.
- **Units:** meters only for display radius and line placement; directions remain normalized.
- **Parent:** calibrated geographic frame.
- **Rotated by:** inherited geographic yaw plus presentation-only transforms that do not alter
  direction (uniform radial scale, label facing, visibility).
- **Must never be rotated by:** a second hidden astronomy rotation.
- **Nature:** presentation.
- **Varies with observer/time:** child objects update from scientific directions.
- **Varies with XR recentering:** rendering pauses and calibration is invalidated.
- **Persistence:** none; rebuilt from scientific state.
- **Invalidation:** scientific result revision, layer style/visibility revision, calibration
  revision, or XR reference-space invalidation.

The canonical ENU to uncalibrated Three.js direction map is exact:

```text
three.x =  east
three.y =  up
three.z = -north
```

For azimuth `A` clockwise from north toward east and altitude `h`, both in radians at this
boundary:

```text
east  = cos(h) * sin(A)
north = cos(h) * cos(A)
up    = sin(h)

three = (east, up, -north)
```

The Three.js vector is then normalized, multiplied by a presentation radius, and parented once
under the geographic group. The group's Milestone 1 yaw maps geographic north to physical north.

## Full transform pipeline

```text
provider ephemeris or standards-defined axis
  -> tagged source vector (origin, EQJ/EQD/etc., AU or unit)
  -> selected date-dependent frame transform
  -> light-time / aberration / parallax profile as applicable
  -> observer-centered topocentric direction
  -> optional explicitly named refraction model
  -> horizontal azimuth/altitude or provider HOR vector
  -> canonical normalized ENU direction
  -> exact ENU-to-Three basis permutation/sign map
  -> display radius and layer style
  -> child of calibrated geographic presentation group
  -> room-relative world-locked geometry
```

### Ownership by step

- **Scientific:** ephemeris, precession, nutation, Earth orientation, parallax, aberration,
  refraction model, and topocentric direction.
- **Coordinate conversion:** tagged frame matrices, HOR-to-ENU, azimuth/altitude-to-ENU,
  ENU-to-Three basis mapping, angle normalization, and unit normalization.
- **Display only:** radius, teaching scale, line thickness, color, opacity, labels, fades, and
  below-horizon style.

Degrees and sidereal hours are accepted only at named provider boundaries. Internal matrix and
trigonometric operations use radians. Tests cover every conversion boundary, and no layer calls
`new Date()` or an astronomy API directly.

## Observer and location model

The minimum observer snapshot is:

```text
observerId / revision
latitudeDegreesGeodetic          north positive, [-90, +90]
longitudeDegreesEast            east positive, normalized convention documented
heightMeters
heightDatum                      mean-sea-level | WGS84-ellipsoid | unknown
locationSource                   manual | browser | imported-test-fixture
horizontalUncertaintyMeters?     optional, never fabricated
verticalUncertaintyMeters?       optional, never fabricated
timeZoneIana                     labels only
northCalibrationRevision         physical room mapping
floorVerticalRevision            physical room mapping
refractionProfile                none initially
```

Rules:

- Latitude is geodetic, not geocentric. A provider conversion to a geocentric vector is explicit.
- Longitude is east-positive in the scientific model.
- Elevation's datum is mandatory when known. An unknown altitude may use a documented default
  only for a precision tier that accepts it, while retaining `unknown` provenance.
- UTC drives calculations; `timeZoneIana` drives labels and civil sampling only.
- North calibration and floor/up calibration are not geodetic location fields and are invalidated
  by XR reference-space changes.
- No geolocation permission or persistence is part of this architecture task.

## Earth axis and celestial poles

### Selected initial structural model

The first visible axis milestone is specified as the **IAU P03 mean pole/equator of date,
precession-only**. Milestone 2A0 proved an application-owned provider against IAU SOFA `pmat06`
and bounded it to J2000.0 plus or minus one Julian century. It is a structural teaching model and
deliberately excludes nutation, polar motion, Chandler wobble, and observed celestial-pole offsets.

This mean model is not asserted to be Earth's physical instantaneous spin axis. The later
standards-level CIP, a terrestrial pole affected by polar motion, and an observation-corrected pole
are distinct quantities; none is an alias for the P03 mean structural axis.

The validated provider must not be replaced silently by Astronomy Engine `EQD`,
`RotationAxis(Earth)`, or a fixed tilted line. The locally implemented Milestone 2B visual
consumer accepts only the validated P03 snapshot and exposes no direct provider import.

An optional later **true pole of date** uses an explicitly named IAU 2006/2000A
precession-nutation/CIP-compatible provider. Astronomy Engine's combined `EQD` may support a Tier
1 true-of-date view only after its semantics and numerical behavior are compared with the
standards fixtures; it is not labeled as full observed CIP because it omits IERS celestial-pole
offsets.

### Coherence rules

- `southAxis = -northAxis` exactly after normalization.
- NCP and SCP markers are endpoints of one axis object, not separately calculated objects.
- The mean celestial equator uses the plane through the origin with normal `northAxisMean`.
- A true/CIP equator, if enabled, uses `northAxisTrue` and is a distinct layer/model ID.
- At ideal geodetic latitude `phi`, the mean NCP altitude in the geometric geodetic horizon is
  `phi`; the SCP is antipodal. Southern observers see the SCP above the horizon.
- Both endpoints may render when one is below the horizon. Below-horizon style is independently
  optional and never changes the direction.

### Observer-centered representation

The physical Earth axis passes through the geocenter, not through the user. In an
observer-centered sky display, a line through the local origin connecting antipodal pole
directions is a **translated directional proxy parallel to the geocentric axis**. If a future
teaching-scale Earth model is shown, the physical-axis representation passes through that model's
explicit conceptual Earth center. The UI and documentation must distinguish those two views.

For the axis-only Tier 1 transform, the snapshot applies its GCRS-to-P03 mean-date matrix and
requires the resulting north direction to be mean-date `+Z`. Earth rotation about that same axis
cannot change it. A full WGS84 Earth-fixed-to-ENU basis then yields north pole direction
`(east 0, north cos(phi), up sin(phi))` for geodetic latitude `phi`; longitude cancels. This
identity is proven from the tagged P03 result and is deliberately scoped to the rotational axis.
It must not be reused for the future celestial equator, stars, or bodies, which require a complete
date/Earth-rotation transform.

## Celestial equator

- **Model:** mean equator of date for the initial structural layer; optional true/CIP equator is a
  separately named later layer.
- **Parent scientific frame:** selected Earth-axis model.
- **Definition:** all unit directions `q` satisfying `dot(q, northAxis) = 0`.
- **Date dependency:** identical to the selected axis model; no independent yaw or tilt.
- **Observer dependency:** none before the horizontal transform; apparent horizon relationship
  depends on observer latitude.
- **Presentation:** a sampled great circle at one display radius. Segment count is a rendering
  choice only. The entire circle may be shown with below-horizon segments subdued or hidden by an
  independent visibility policy.
- **Labels:** optional, sparse, and model-qualified (`Mean celestial equator of date` when detail
  is requested).
- **Validation:** unit length, closure, every sample perpendicular to the axis, antipodal sample
  pairs, and known latitude/horizon cases.

## Horizon model

The project distinguishes:

1. **Quest floor plane:** device tracking `Y = 0`; a physical calibration surface.
2. **Geodetic geometric horizon:** plane through the observer perpendicular to the WGS 84
   ellipsoid normal; the initial scientific horizon.
3. **Astronomical horizon:** plane perpendicular to the local gravity/astronomical vertical; it
   can differ from the geodetic normal due to deflection of the vertical.
4. **Natural/visible horizon:** terrain, buildings, room surfaces, and occlusion.
5. **Dip horizon:** geometric line of sight affected by observer elevation and Earth curvature.
6. **Refracted apparent horizon:** atmospheric optical effect.

The initial celestial-reference implementation uses the **geodetic geometric horizon at altitude
zero with refraction disabled**. The calibrated Quest up vector is treated as the physical display
mapping for that mathematical up direction, with its error recorded separately. The room floor
ring may visually coincide with altitude zero after calibration, but it is not scientific evidence
that terrain, gravity vertical, horizon dip, or refraction has been modeled.

## Precision tiers

### Tier 1 - contemplative visual accuracy

- **Purpose:** consumer Quest directional relationships, visible bodies, horizon relationships,
  and temporal markers near ordinary present-era dates.
- **Scientific target:** retain Astronomy Engine's documented plus-or-minus-one-arcminute
  application-library target for supported ephemeris calculations; no combined XR angular claim.
- **Inputs:** validated geodetic latitude/east longitude, documented height assumption, UTC,
  manual true-north calibration, floor/up mapping, explicit correction profile.
- **Models:** pinned Astronomy Engine plus validated application transforms; UTC approximates UT1;
  no live EOP.
- **Validation:** fixed Horizons/NOVAS cases and SOFA frame fixtures, with per-operation tolerances
  approved before implementation.
- **Cost/product:** initial product tier; compact and offline-capable.

### Tier 2 - educational astronomical accuracy

- **Purpose:** reproducible comparison with authoritative planetarium/reference data, broader
  date ranges, explicit apparent positions, and separate mean/true pole modes.
- **Scientific target:** a published per-operation angular bound established by the validation
  corpus; no numerical bound is accepted in this planning document without benchmark evidence.
- **Inputs:** known datum/elevation, explicit refraction/atmosphere choice, versioned delta-T and
  leap-second policy, and tighter calibration/location uncertainty.
- **Models:** validated precession-only P03 or approved long-term provider, named nutation model,
  and more complete reference fixtures.
- **Validation:** SOFA/NOVAS/JPL cross-checks across the supported date domain.
- **Cost/product:** later optional educational mode; moderate calculation and fixture complexity.

### Tier 3 - high-precision reference mode

- **Purpose:** standards-level experiments with explicit uncertainty, not the initial product.
- **Scientific target:** set only after selecting a standards implementation, EOP source, date
  domain, and reference corpus; no current numeric claim.
- **Inputs:** versioned IERS UT1-UTC, polar motion, celestial-pole offsets, leap seconds, precise
  station datum/epoch, atmosphere, and uncertainties.
- **Models:** SOFA/IERS-consistent GCRS/CIRS/TIRS/ITRS transforms and higher-precision
  ephemerides where justified.
- **Validation:** IERS/SOFA validation programs and versioned JPL/NOVAS results.
- **Cost/product:** network/data provenance, caching, expiry, and substantially greater
  maintenance; deferred.

## Precession architecture

### Mathematical interpretation

A precession path is the locus of the selected **mean pole unit vector** in a declared celestial
frame over a declared time interval. It is not a ring attached visually to the current pole. The
northern path samples `p_mean(t_i)`; the southern path samples `-p_mean(t_i)` from the same time
samples and model.

The familiar description of the equatorial pole precessing around an ecliptic pole is useful only
as a first-order picture. The adopted model must also account for the selected ecliptic's motion
and changing obliquity, so the path is evaluated in one declared reference frame and epoch rather
than centered on an assumed fixed visual point.

The current contact markers are exactly:

```text
northContact = presentationRadius * p_mean(simulationInstant)
southContact = -northContact
```

after the same celestial-to-horizontal-to-display pipeline used by the path. The current axis
must intersect both path markers within numerical tolerance.

### Circle/path recommendation

Render an **accurately sampled trajectory**, not a forced perfect circle. Precession of the
equator, precession of the ecliptic, and changing obliquity mean the long-term locus is not
guaranteed to be an exact planar circle. A perfect analytical ring may exist only as an optional,
clearly labeled approximation after its error is quantified.

IAU P03 is the initial mean-pole definition near its validated date domain, but standard
polynomial precession is not suitable merely because a visual cycle spans roughly one precession
period. A full long-cycle product view requires a validated long-term model such as the Vondrák,
Capitaine, and Wallace expressions, a declared epoch/range, and comparison fixtures. Until that
work passes, the long-cycle path is deferred.

### Sampling contract

- Store model ID, source frame, epoch, start/end instants, sample spacing policy, provider version,
  and error evidence with the trajectory.
- Adaptively sample until angular interpolation error meets the approved path tolerance; visual
  segment length alone is not a scientific tolerance.
- Preserve time direction in metadata and offer direction cues only as optional annotations.
- North and south use the same sample times and exact negation.
- A time control outside the validated range makes the path unavailable rather than extrapolated
  silently.

### Separate smaller-motion layers

| Effect | Architectural placement | Product timing |
|---|---|---|
| Precession | Precession-only mean structural axis and sampled long-term mean path | Initial axis uses the validated current mean model; long-term path follows in 2D |
| Nutation | Separately named true-minus-mean celestial-pole layer | Later optional educational/precision layer; never baked into the mean path |
| Polar motion | Terrestrial-to-intermediate transform from versioned IERS `xp/yp` | Tier 3 precision work; deferred from the initial product |
| Chandler wobble | Identified component of terrestrial polar motion, not a new celestial precession term | Optional educational layer only after operational data/model validation |
| Observed celestial-pole offsets (`dX/dY`) | Correction to the modeled CIP with EOP provenance | Tier 3 only; deferred |
| Display exaggeration | Presentation metadata with true/exaggerated scale visibly distinguished | Disabled by default; never modifies stored science |

No scientifically meaningful component is declared impossible forever, but live geophysical
monitoring, an unlabeled combined `wobble`, and decorative/exaggerated motion presented as true are
outside the planned product and remain excluded unless a new requirement and validation program
are approved.

## Visual-layer architecture

Every layer is independently selectable. `minimal` indicates whether it may appear in the calm
default composition, not whether its science is optional.

| Layer ID | Scientific source | Parent | Default | Update | Priority / labels | Scientific / interaction dependencies | Minimal |
|---|---|---|---|---|---|---|---|
| `room-diagnostics` | XR local-floor | room frame | on during calibration/diagnostics | XR mapping only | high / none | active XR reference space | yes, temporarily |
| `cardinal-directions` | accepted north calibration | geographic frame | on after calibration | calibration revision | high / N only or N/S/E/W | valid north calibration | yes |
| `geometric-horizon` | geodetic ENU altitude 0 | celestial presentation | on for orientation milestone | observer/calibration | high / optional single label | observer + floor/up + north | yes |
| `earth-axis-mean` | validated mean pole of date | celestial presentation | on in axis mode | time/model revision | high / optional model label | mean-pole provider | yes |
| `celestial-poles-mean` | endpoints of mean axis | axis presentation | on in axis mode | axis revision | high / NCP/SCP optional | mean axis | yes |
| `earth-axis-true` | named true/CIP provider | celestial presentation | off | time/model/EOP | medium / model-qualified | true-pole provider | no |
| `celestial-equator-mean` | plane normal to mean axis | celestial presentation | selectable | axis revision | high / optional | mean axis | yes, instead of extra layers |
| `celestial-equator-true` | plane normal to true axis | celestial presentation | off | true-axis revision | medium / optional | true axis | no |
| `precession-paths` | sampled mean-pole trajectories | celestial presentation | off | model/range revision | medium / sparse dates | validated long-term provider | no |
| `precession-contact` | current mean pole sample | precession presentation | on only with path | time revision | high / date optional | precession paths | no |
| `nutation-detail` | true-minus-mean pole | celestial presentation | off | time revision | low / optional magnitude | mean + true provider | no |
| `ecliptic` | named ecliptic frame/model | celestial presentation | off | date/model revision | medium / optional | validated provider | selectable |
| `sun-current` | apparent topocentric Sun | celestial presentation | off until Sun milestone | time/observer | high / optional | astronomy adapter | yes in Sun mode |
| `solar-path` | sampled apparent Sun | Sun temporal group | off | selected date/observer/zone | medium / none | temporal sampler | yes in solar-clock mode |
| `solar-hour-ticks` | civil-hour Sun samples | Sun temporal group | off | date/zone/observer | medium / none | solar path | selectable |
| `solar-hour-labels` | IANA civil labels | Sun temporal group | off | zone/date/locale | low / density mode | tick instants | no |
| `moon-current` | apparent topocentric Moon | celestial presentation | off until Moon milestone | time/observer | high / optional | astronomy adapter | yes in Moon mode |
| `lunar-next24-path` | elapsed-hour Moon samples | Moon temporal group | off | start/observer | medium / none | temporal sampler | yes in Moon-clock mode |
| `lunar-hour-ticks` | next-24-hour samples | Moon temporal group | off | start/observer | medium / none | next24 path | selectable |
| `lunar-midnight-cycle` | local-midnight Moon samples | Moon temporal group | off | zone/cycle/observer | medium / sparse | civil resolver + phase search | selectable |
| `lunar-labels` | IANA dates/offsets | Moon temporal group | off | zone/locale | low / major-only default | lunar samples | no |
| `lunar-phase-symbols` | geocentric phase/illumination | Moon temporal group | off | sample times | low / no text default | phase provider | no |
| `planets` | apparent topocentric bodies | celestial presentation | off | time/observer | medium / selected only | body adapter | selectable |
| `path-traces` | sampled validated body directions | body group | off | selection/time range | low / none | body + temporal sampler | no |
| `scientific-annotations` | provenance/model/error metadata | presentation overlay | off | model/state | low / demand-only | selected object/layer | no |
| `contemplative-cues` | presentation sequence only | contemplative root | off | sequence clock | separate / no science claim | validated scientific layers | selectable |

Layer updates are event/revision driven. Head pose and rendering remain XR-frame-rate concerns;
astronomy does not recompute every render frame.

## Scientific and contemplative separation

### Scientific model

Owns observer state, simulation instant, reference frames, ephemerides, correction profiles,
validated unit directions, model/version provenance, and uncertainty components. It outputs
immutable snapshots and never controls opacity, pacing, emotional interpretation, or attention.

### Contemplative presentation

Owns visibility sequencing, emphasis, fades, optional labels, attention cues, pacing, and minimal
compositions. It consumes scientific results read-only. It may not rotate, offset, smooth into a
different direction, or replace missing science with decorative geometry.

### Presentation principles

- Show few relationships at once; every layer and label class is optional.
- Motion is slow, physically meaningful, and derived from the shared simulation clock.
- No dense dashboard, decorative star field, gratuitous animation, or forced camera motion is a
  default.
- Accuracy outranks spectacle. Calm, precise, luminous, low-noise presentation remains the visual
  language.
- Focused attention and sustained awareness are user-experience intentions. Altered or
  contemplative states may occur, but the application makes no scientific or guaranteed claim
  about them.

## Risks and deferred complexity

| Risk / question | Current disposition |
|---|---|
| Astronomy Engine has no public precession-only mean-pole-of-date provider | Milestone 2A0 validated a separate application-owned P03 provider; preserve its frame/time/domain contract |
| P03 cannot safely cover a full visual precession cycle | Use a validated long-term model or defer the full path |
| Library EQJ versus ICRS/GCRS frame bias | Keep the `EQJ` tag and validate before any aliasing |
| UTC approximated as UT1 | Allowed only in Tier 1 with disclosure; EOP is Tier 3 |
| Ellipsoidal versus mean-sea-level elevation | Preserve height datum and uncertainty; no silent conversion |
| Quest floor versus geodetic/astronomical vertical | Treat as separate error components and physical mapping |
| Refraction and terrain | Initial horizon is geometric/unrefracted; optional later models |
| Long-date delta-T and ephemeris reliability | Declare validated date domains per provider/tier |
| Layer clutter and comfort | Independent visibility, sparse labels, physical Quest gates |
| Location privacy/persistence | No collection or persistence in this milestone; future explicit consent design |
| General-purpose planetarium expansion | Out of scope; implement only bounded orientation relationships |

## Confirmed, recommended, assumed, deferred

- **Confirmed:** existing axes/yaw behavior; official source capabilities and distinctions recorded
  in `OFFICIAL_ASTRONOMY_SOURCES.md`.
- **Recommended:** Astronomy Engine with wrappers, mean structural axis, sampled precession path,
  canonical ENU intermediary, central time snapshot, and optional layers.
- **Assumed for planning:** the trusted physical marker continues to represent true north and the
  observer provides a valid geodetic location. Implementation must validate inputs.
- **Deferred:** geolocation, celestial-equator and later celestial geometry, Sun/Moon/planets,
  time controls, full-cycle precession, nutation detail, EOP, polar motion, persistence, and
  contemplative sequencing.
