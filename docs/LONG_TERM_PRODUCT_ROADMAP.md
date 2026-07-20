# Long-Term Product Roadmap

## Purpose and status

This document preserves the product's long-term direction without authorizing implementation. It
is a scope-curation record, not a delivery schedule, a scientific claim, or a backlog that may be
started opportunistically.

The current published baseline includes true-north calibration, observer-centered local horizon,
WGS84 Earth core, geocentric P03 axis/poles, celestial equator, reversible eye presentation, and
default-hidden actual apparent markers for Sun, Moon, Mercury, Venus, Mars, Jupiter, and Saturn.
It also includes the central simulation clock, IANA/DST-aware civil-day handling, the bounded
observer-relative daily Sun path, civil-hour notches, live celestial updates, scientific
provenance, and structured warnings/errors. The local `fix/earth-axis-spindle` branch adds a
rigid continuous spindle, unified finite core/axis/equator/pole presentation, and renderer-boundary
validation; it remains unmerged, undeployed, and physically unaccepted.

Except entries explicitly marked as part of the published baseline, every item below is
**planned**, **exploratory**, **deferred**, or **research required** until a separate bounded task
is authorized. Existing milestone gates, physical Quest evidence, and the dependency sequence in
[Milestone 2 Sequence](MILESTONE_2_SEQUENCE.md) remain controlling.

## Product north star

Cosmic Calibration may grow into a scientifically grounded spatial-orientation system that helps a
person relate their body, local tangent plane, Earth, and selected celestial reference frames as
one coherent reality. It must remain calm, optional, privacy-respecting, and explicit about what
is measured science, what is a display convention, and what is an interpretation or symbolic
practice.

The product does not need to become a general-purpose planetarium. Future work should add one
traceable relationship at a time, preserve the existing physical calibration and rendering
contracts, and earn its own automated, desktop, hosted, and device evidence.

## Non-negotiable boundaries

- Scientific truth is traceable: source/model/version, frame, observer, instant, corrections,
  uncertainty, and declared accuracy tier remain attached to scientific outputs.
- Presentation geometry may compress scale, select visibility, or use projective rendering, but
  must disclose the convention and may not silently change a scientific direction or center.
- Interaction changes control state and presentation choice; it does not invent coordinates,
  mutate snapshots, or substitute a headset pose for an astronomical input.
- Environmental mode (passthrough or immersive) consumes the same scientific state. A mode change
  cannot create a different astronomy model.
- Interpretive, spiritual, astrological, cultural, and contemplative material is optional and
  never presented as established scientific fact.
- Geographic, ecological, and cultural knowledge carries source, provenance, uncertainty,
  permissions, and appropriate sensitivity handling. A point, a region, and an inferred location
  are not interchangeable.
- Below-horizon, below-surface, and non-visible relationships remain scientifically meaningful;
  any hiding, fading, or occlusion is a presentation decision.
- No future feature is authorized merely because it appears in this document.

## Recommended architecture layers

The following six layers are intentionally separate. The division makes it possible to extend the
experience without conflating a scientific computation with an artistic or personal response.

| Layer | Owns | Must not own |
|---|---|---|
| Scientific truth | Observer/time/configuration state; astronomy and geodesy; tagged frames; immutable results; provenance and uncertainty | Three.js meshes, opacity, labels, interaction, or interpretive meaning |
| Presentation geometry | World/projective/local geometry; symbolic scale; material, visibility, labels, eye-presentation selection | Ephemeris calculations, P03 reconstruction, observer guessing, or scientific mutation |
| Interaction | Explicit user actions, controls, validation messages, reversible preferences, accessibility choices | Hidden calibration changes, ambient scientific time, or alternate scientific models |
| Environmental mode | Passthrough/immersive presentation adaptation, contrast/readability policy, device-specific lifecycle | Separate astronomy, separate location truth, or environmental claims unsupported by sensors |
| Interpretive and contemplative systems | Optional symbolic layers, guided emphasis, traditions selected by the user, pacing | Scientific coordinates, accuracy claims, therapeutic claims, or forced beliefs |
| Geographic, ecological, and cultural knowledge | Named points, sourced regions, collection metadata, local datasets, uncertainty and permissions | Silent geocoding, assumed ownership, unsourced cultural meaning, or implicit location sharing |

The existing decision to keep scientific and contemplative layers distinct remains the durable
governing rule; this roadmap does not create a competing scientific or rendering decision.

## Shared foundations required before expansion

### Observer and location

**Status: Planned; local-first design required.**

Persistent observer locations should be explicit, user-controlled records rather than inferred
browser data. A future record should preserve latitude, east-positive longitude, elevation above
the declared datum, optional name, source/provenance, uncertainty, and support for multiple saved
locations. It must clearly distinguish a manually entered point, an imported point, and an
approximate region-derived point.

Persistence of location must not imply persistence of room calibration. North calibration remains
room/session-sensitive and requires its own explicit recovery policy. Browser geolocation, city
search, network lookup, and cloud synchronization are not implied by location persistence.

### Central astronomy time

**Status: Foundation exists; richer controls planned.**

All future celestial layers use the central simulation clock and immutable snapshot boundary. A
future control surface may add an explicit real-time mode, pause/resume, date/time selection,
bounded rate and reverse playback, and a deliberate `Now` action that supplies a system instant
to the central clock. It must retain UTC identity, time-scale provenance, civil-time ambiguity
handling, and revision-based invalidation.

Scientific sampling should occur at a declared lower cadence selected by an angular-error budget;
rendering may interpolate only between compatible validated samples. No layer gets its own clock,
ambient `new Date()` loop, or independently interpreted civil time.

### Cross-layer presentation rules

- Labels and pointers use an angular or screen-space policy that preserves object direction while
  managing overlap; a readable label is not a new scientific location.
- Point markers, enhanced study size, symbolic distance, and projective directions are labelled
  as presentation conventions. They never claim literal object distance or diameter.
- Visibility, opacity, eye mode, labels, and diagnostics are independently optional and do not
  change scientific coordinates.
- Common calibration, observer, time, and snapshot contracts serve both passthrough and immersive
  modes. Visual treatment may differ for contrast and comfort, not for scientific truth.

## Future capability families

### 1. Celestial reference structures

| Capability | Status | Scientific/presentation contract | Dependencies and gates |
|---|---|---|---|
| Validated long-term precession trajectory | Planned; research required | Sample one adopted long-term model with declared date domain; preserve pole antipodes and disclose that a rendered path is not an observed instantaneous pole | Current physical acceptance; dedicated model/fixture decision; projective-rendering and Quest review |
| Ecliptic | Planned | One explicitly named mean or true ecliptic great circle, distinct from the P03 celestial equator | Independently validated obliquity/frame fixtures; separate model provenance and visibility gate |
| Earth geographic, observer-horizontal, celestial-equatorial, and ecliptic grids | Exploratory | Each grid names its center, plane, basis, epoch, and display scale. A local horizon grid is not a celestial grid | Individual frame/scale/label-density reviews; do not introduce a generic grid bundle by default |
| Stars and constellations | Exploratory; research required | Catalog/provider, epoch, proper-motion policy, magnitude/visibility policy, and constellation-culture source are explicit | Batched/LOD performance design, label-density controls, source licensing, Quest contrast and comfort evidence |

### 2. Solar, lunar, and planetary layers

#### Shared three-mode contract

For future extensions of the published Sun, Moon, and body presentation, use only clearly named
modes:

1. **Actual direction** — the validated apparent or declared physical direction for one observer,
   instant, correction profile, and provider.
2. **Celestial-equator projection** — a labelled pedagogical projection using the same source
   vector, not a replacement for the actual direction.
3. **Both with optional declination connection** — retains both named objects and may draw a
   labelled connection that preserves the difference rather than hiding it.

Actual direction remains authoritative. Projection is useful only when visibly and semantically
distinct. Declination, phase, illumination, and distance metadata never become a substitute for
the body direction.

| Capability | Status | Required honesty and scope |
|---|---|---|
| Apparent Sun | Published baseline; full physical acceptance pending | Uses the explicit observer/time/correction profile and a visibility-safe actual-direction marker. Projection/both modes remain deferred; never encourage unaided solar viewing. |
| Solar temporal path and events | Published 24-hour apparent-path subset; physical Quest pending | Uses central clock and explicit IANA `Intl` civil resolver; retains below-horizon samples and exact valid civil-hour boundaries. Sunrise/sunset limb/refraction events remain deferred. |
| Apparent Moon | Published baseline; full physical acceptance pending | Preserves material topocentric parallax in the apparent direction and provenance. Phase/illumination, literal distance, and projection/both modes remain deferred. |
| Moon study scale | Exploratory | Separate true angular size, enhanced study size, and focused-Moon mode. All enhancement is declared presentation, not a physical claim. |
| Lunar temporal paths | Planned after Moon direction | Support next-24-hour and local-midnight approaches only when the sampling/phase contracts are independently validated; never show a circular observer-centered lunar orbit. |
| Mercury, Venus, Mars, Jupiter, Saturn | Published baseline; full physical acceptance pending | One Tier 1 correction profile and immutable provenance; no labels, disks, rings, paths, zodiac, or all-at-once planetarium default. |
| Object pointing and labels | Planned shared utility | Use angular/screen-space rules, object-specific constraints, collision handling, and source/model diagnostics. A pointer remains an aid, not an astronomical measurement. |

### 3. Interpretation and contemplative options

**Status: Exploratory and opt-in only.**

Astronomy remains a stable input; interpretation is a separately selected view. The system may
eventually offer these options only with clear labels, reversible controls, and no scientific or
personal-practice claims.

- **Astrology:** may present tropical and sidereal frameworks, house or chart conventions, and
  historical/interpretive context using accurate astronomical inputs. It is an interpretive
  framework, not a scientific model of causation, and must not mutate scientific state.
- **Lunar magic, pagan, and witchcraft traditions:** may be offered as user-selected tradition or
  interpretive material with provenance and respect for living traditions. It must remain distinct
  from lunar phase, direction, and ephemeris facts, and must never prescribe personal practice.
- **Merkaba and symbolic geometry:** may be a contemplative layer with explicit modes such as
  body-relative, gravity-relative, celestial-axis-relative, geocentric, or relational. It makes no
  physical-energy or scientific claim, and no symbolic transform changes the Earth axis, horizon,
  or celestial-equator truth.
- **Contemplative sequencing:** may control only emphasis, visibility, fades, pacing, and optional
  attention cues over already accepted layers. It requires an immediate stop/exit path and cannot
  drive astronomical coordinates.

### 4. Geocentric places, regions, and Earth relationships

**Status: Exploratory; source and privacy design required.**

Future geographic content can use the existing WGS84 Earth model to represent selected surface
locations, regional extents, and relational diagrams. It must preserve the distinction between an
exact modeled point, an approximate point, a polygon/region, and a user-curated collection.

| Capability | Status | Contract |
|---|---|---|
| Geocentric locations and points | Exploratory | A WGS84 surface point may use an Earth-core radial relationship, datum/elevation, source, uncertainty, and point-vs-region label. It must not be presented as an occult or magnetic pole unless that is the separately sourced object. |
| Regions and collections | Planned architecture | Regions remain regions, with source/version/uncertainty and simplification policy. Collections are user-defined groupings, not inferred facts. |
| Resin geography and ecological use cases | Exploratory | Support sourced places, ecological context, and collection metadata without inventing harvest provenance, conservation permission, or cultural significance. |
| Local CSV/JSON import | Planned; bounded import format first | Validate schema, coordinate convention, datum, source, uncertainty, and text fields locally. GeoJSON is a later extension after region semantics and performance limits are defined. No silent projection, geocoding, or network enrichment. |

### 5. Relationship circuits and scale explanation

**Status: Exploratory; only after individual endpoints are accepted.**

Possible educational circuits include Earth–Sun–observer, Earth–Moon–observer,
Earth–Sun–geographic-location, Earth–Moon–location, and later Earth–Sun–Galactic Center. A
circuit must declare each center, direction, source frame, time dependence, distance policy, and
visual compression. A finite line, symbolic node, or expanded marker cannot silently substitute
for physical scale.

Potential render strategies include geocentric, local observer-relative, split-scale, or
comparison views. Each must disclose which relationships are literal directions, which are
compressed distances, and which are conceptual connections. The current Earth-core/axis renderer
is not authorization for any of these circuits.

### 6. Media, games, and AI assistance

**Status: Deferred; use only as spatial context after the underlying scientific layer is accepted.**

Future media, interactive experiences, or game-like exercises may provide spatial context around
validated geometry. They must not replace scientific position or visibility evidence with spectacle.

Any AI assistance must be constrained by a hard/soft split:

- **Hard constraints:** validated astronomical outputs, explicit frame contracts, calibration
  state, user-selected privacy settings, source/licensing requirements, and safety boundaries.
- **Soft priors:** visual composition, label placement proposals, non-authoritative explanations,
  accessibility wording, or optional contextual media suggestions.

AI may not generate, smooth, or relabel a celestial coordinate as truth without a separately
validated scientific source. Media and game systems remain optional, reversible, and subordinate
to the calm, low-noise visual language.

## Privacy, provenance, and cultural care

- Exact home or sensitive coordinates remain local by default. Export, sharing, synchronization,
  and collaboration require an explicit opt-in and a visible destination.
- Ritual notes, practice preferences, and other sensitive personal material are not inferred,
  uploaded, or shared by default.
- Imported geographic, ecological, historical, or cultural datasets retain source attribution,
  license/permission information where available, and uncertainty. Absence of metadata is not a
  license to supply it from assumption.
- Cultural, religious, and tradition-specific material is framed in its context and never
  universalized as astronomical fact.
- Approximate regions, uncertain locations, and derived positions remain visibly distinguished
  from exact coordinate records.

## Performance and platform planning

Quest constraints must be treated as design inputs rather than post-hoc optimization work.

- Star fields need batching, level of detail, magnitude/visibility culling, and strict label
  density limits before broad catalogs are considered.
- Clock-driven layers need scientific sampling cadence, interpolation-error budgets, and revision
  invalidation rather than per-frame astronomy recomputation.
- Geographic regions, polygons, and collections need bounded data sizes, simplification, source
  metadata, and scalable visibility rules.
- Earth transparency, multiscale scenes, floating/camera-relative origin strategies, and depth
  behavior require explicit precision and XR compositor contracts; no raw celestial-scale GPU
  coordinate path may reappear.
- Passthrough contrast, eye-presentation modes, immersive switching, readability, and comfort
  require device evidence. Desktop checks are valuable regressions, not a substitute for Quest
  acceptance.

## Suggested dependency-aware horizons

These horizons describe a sensible order of evidence, not dates or commitments.

| Horizon | Candidate focus | Preconditions |
|---|---|---|
| Current | Independent integration gate for the local rigid spindle and unified geocentric core/axis/equator/pole presentation | Records reconciliation, existing technical validation, normal integration/deployment gates, and later physical Quest evidence; no feature expansion |
| Next celestial structures | Celestial-equator projection/combined body mode or precession review, selected only by a future bounded authorization | Published body/temporal baseline remains intact; projection needs its own science/presentation gate, and precession still requires model/date-domain/fixture review |
| Time and bodies | Broad time controls, annual or multi-day paths, lunar phase/cycle visualization, planetary trails, and later bodies | Explicit observer persistence/privacy policy where needed, clock/civil-time fixtures, per-body correction and presentation evidence |
| Geographic knowledge | Local-first places, regions, imports, collections | Data schema/provenance/privacy policy; bounded performance and cultural-review approach |
| Interpretive/contextual systems | Astrology, tradition-selected layers, Merkaba, contemplative sequencing, media/game/AI context | Stable accepted science layers; opt-in controls, provenance, and hard/soft constraint review |

The completed physical Quest task did not supersede the need for bounded sequencing. No later
horizon may begin until project control explicitly selects one bounded task and updates
`NEXT_TASK.md`.

## Evidence required for every future feature

Before implementation, a bounded task should state its scientific definition, source/model,
frames, observer/time dependencies, precision tier, rendering strategy, visibility default,
privacy implications, validation fixtures, lifecycle ownership, and physical acceptance checks.

Before publication, it should pass the appropriate automated, type, build, desktop/preview,
independent review, integration, hosted regression, and Quest evidence gates. If a layer is
interpretive rather than scientific, it must still pass interaction, accessibility, provenance,
privacy, and comfort review without borrowing the authority of science.

## Explicit non-commitments

This roadmap does not authorize automatic geolocation, automatic compass access, location sharing,
cloud accounts, a general planetarium, dense dashboards, forced animation, persistent room
calibration, medical/therapeutic claims, or any specific AI, media, game, or contemplative
experience. It also does not change the current validated P03, Earth-core, depth, calibration,
eye-presentation, horizon, or lifecycle contracts.
