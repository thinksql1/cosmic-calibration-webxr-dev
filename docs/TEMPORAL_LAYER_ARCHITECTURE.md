# Temporal Layer Architecture

## Purpose and status

**Status: partially implemented temporal architecture.** This document began as a design record;
its future-tense solar and lunar sections retain rationale for the capabilities that were later
implemented or remain deferred. Current temporal implementation status is governed by
`PROJECT_STATE.md`, `docs/ARCHITECTURE.md`, and [Solar 24-Hour Clock](SOLAR_24_HOUR_CLOCK.md).

The published baseline implements one central simulation clock; deterministic frozen and paused
modes; bounded live refresh; apparent Sun, Moon, and seven-body state; explicit IANA-zone
civil-day resolution with DST fold/gap metadata; a daily observer-relative apparent Sun path; and
exact civil-hour notches. Labels, event-jump controls, broad time manipulation, richer lunar
temporal visualization, and planetary trajectories remain deferred. All celestial layers consume
the same simulation snapshot; no scientific provider may call `new Date()` independently.

UTC, UT1, TT, civil-time, and provider claims trace to the [official astronomy source
register](OFFICIAL_ASTRONOMY_SOURCES.md).

## Central simulation clock

### Implemented non-visual subset

Milestone 2A implements the deterministic core as `frozen` or explicit-tick `realtime`, paused
state, signed finite rate, immutable UTC instant, and revision. Milestone 2F adds an explicit
browser-`Intl` IANA civil-time state, a cached local-day apparent-Sun schedule, and a
presentation-owned scheduler that feeds explicit elapsed milliseconds to the one central clock.
It does not add an ambient scientific clock, persisted time zone, editable calendar system, labels,
events, or Moon/planet paths.

### State contract

```text
SimulationClockState
  mode: live | paused | simulated
  instantUtcEpochMilliseconds
  anchorMonotonicMilliseconds
  rate: finite signed multiplier
  timeZoneIana
  locale
  calendar: iso8601-proleptic-gregorian
  revision

SimulationSnapshot
  instantUtcEpochMilliseconds
  instantUtcIso
  timeZoneIana
  civilFieldsAtInstant
  providerTime                         e.g. Astronomy Engine AstroTime
  timeScalePolicyId
  clockRevision
  timeZoneDataProvenance
```

The stored simulation instant is an absolute UTC timeline value. A live or accelerated clock is
derived from one UTC anchor and a monotonic elapsed clock, not by accumulating render-frame
deltas. Pausing freezes the absolute instant. A negative rate, along with user-facing
accelerated/reverse controls and arbitrary historical/future date selection, is reserved for a
later time-control milestone.

### Time-scale separation

- **System clock:** supplies a candidate `now` only when entering/live-syncing live mode.
- **UTC:** application interchange and simulation instant.
- **Local civil time:** a view of the instant using one explicit IANA zone; labels and civil
  sample schedules only.
- **UT1:** Earth-rotation time. Tier 1 accepts Astronomy Engine's documented approximation
  `UT1 ~= UTC`; Tier 3 supplies versioned IERS UT1-UTC.
- **TT:** uniform terrestrial ephemeris time. Tier 1 uses the pinned provider's documented delta-T
  model; a later tier may use a versioned model/table.
- **TAI/leap seconds:** not represented faithfully by JavaScript `Date` alone. Tier 1 records this
  limitation; higher tiers require a versioned leap-second source.
- **TDB/TCB/TCG:** not initial UI concepts. A provider may use an appropriate internal dynamical
  time, but the adapter records that policy and never labels it UTC.

No civil-time string is passed to an astronomy provider without first resolving it to an
unambiguous UTC instant.

### Civil-time resolver

The civil resolver takes an IANA zone ID, ISO calendar date/time fields, and an explicit
disambiguation policy. It returns zero, one, or multiple possible UTC instants plus provenance.

- **Repeated/fold time:** default to the earlier offset only when a deterministic default is
  required; mark `fold = earlier`. A UI must allow later-offset selection before editable time
  controls are released.
- **Nonexistent/gap time:** advance to the first valid instant after the gap and mark
  `gapAdjusted = true`; never pretend the requested wall time existed.
- **Zone unavailable:** reject the schedule or fall back only after explicit user choice; never
  silently substitute the device zone.
- **Zone rule update:** label schedules are invalidated when browser/tzdata provenance changes.

The browser's `Intl` implementation is the initial label engine. It does not replace storing an
IANA zone ID and a deterministic fixture policy. If the runtime does not expose its tzdb release,
provenance records the browser/runtime version and `tzdbVersion = unknown`; it never fabricates an
IANA release number.

## Update cadence and interpolation

Scientific calculation cadence is distinct from XR rendering cadence.

- Static frame geometry recalculates only when observer, time-model, or pole-model revisions
  change.
- Live Sun/Moon/body directions refresh through the bounded application scheduler no less than
  once per real minute at normal rate (and more often for existing accelerated rates). This is a
  freshness ceiling, not an astronomical accuracy claim or an interpolation guarantee.
- Accelerated time chooses sample spacing from simulation rate and an angular interpolation-error
  budget; it does not simply recompute once per render frame.
- Visual interpolation uses normalized spherical interpolation between two validated unit
  directions with matching observer/model/correction metadata.
- A time jump, observer change, correction change, provider-version change, reference-space
  invalidation, or discontinuity disables interpolation across the boundary.
- Labels update only when their formatted value or selected sample changes.

The render loop supplies monotonic elapsed input to the presentation scheduler, which is the sole
caller of the central clock's explicit `tick`; it never mutates an ephemeris result. Science
continues to receive only immutable clock state.

## Invalidation matrix

| Change | Scientific directions | Civil labels/schedules | Geographic room mapping | Presentation cache |
|---|---|---|---|---|
| UTC instant/rate | invalidate time-varying results | invalidate as needed | unchanged | invalidate affected layers |
| IANA zone/locale | geometry at an instant unchanged | invalidate | unchanged | labels only |
| Observer latitude/longitude/height | invalidate topocentric/horizontal results | solar/lunar schedules invalidate | north yaw unchanged | invalidate celestial layers |
| Refraction profile | apparent altitude results invalidate | event labels may invalidate | unchanged | invalidate affected layers |
| North recalibration | scientific results unchanged | unchanged | invalidate/remap | all geographic children remap |
| WebXR reference reset | scientific results unchanged | unchanged | invalidate until recalibration | hide/pause world-locked geographic layers |
| Provider/model version | invalidate | invalidate provider-derived events | unchanged | rebuild with new provenance |
| Time-zone database version | instant geometry unchanged | invalidate civil schedules | unchanged | labels/sampled civil layers rebuild |

## Implemented daily Sun-path subset and deferred extensions

The published 2F layer implements the apparent Sun daily path, exact civil-hour notches,
below-horizon continuity, and central-clock refresh described in this section. The design options
below remain useful only where they extend that published subset, such as rendered labels,
sunrise/sunset events, annual or multi-day paths, and a broader time-control surface.

### Scientific source

Every marker is an apparent topocentric Sun direction for one observer, one explicitly resolved
UTC instant, and one correction profile. The path includes below-horizon samples. Sunrise and
sunset are separately computed events with declared limb/refraction definitions; they are not
inferred from a line crossing the presentation floor ring.

### Default sampling convention

The default is **each valid local civil clock-hour boundary in the selected IANA-zone calendar
date**. An ordinary civil day produces 24 markers. A common one-hour daylight-saving transition
truthfully produces 23 or 25 markers; a skipped hour is absent and a repeated hour appears twice
with its UTC offset. Non-hour transitions and historical rule changes use the actual count returned
by the civil resolver rather than being forced to 23, 24, or 25. This is preferred over a visually
neat but false 24-marker civil day.

The architecture also supports a non-default **fixed 24 elapsed-hour mode**: 24 one-hour
intervals beginning at selected local midnight, represented by 25 path samples if both endpoints
are needed. On a DST transition this sequence may end at 23:00 or 01:00 on the adjacent civil
date and labels must show that fact. It is useful for motion comparison, not as the default civil
clock.

Each marker stores:

```text
instantUtc
localDateTimeLabel
utcOffset
fold/gap metadata
apparent ENU direction
aboveGeometricHorizon
correction profile and provider provenance
```

### Selected-date behavior

- `today` is defined in `timeZoneIana` at the simulation instant, not the device's implicit zone.
- A different selected date produces a new civil schedule and captures seasonal differences.
- The current-Sun marker uses the shared simulation instant and is independent of the hourly
  schedule.
- Below-horizon markers remain scientifically present and are styled/hidden only by the layer
  policy.

### Display modes

| Mode | Path | Ticks | Labels | Current Sun |
|---|---|---|---|---|
| `path-only` | on | off | off | optional emphasis |
| `ticks-only` | off | on | off | on |
| `major-labels` | on | on | sparse configurable major hours | on |
| `all-labels` | on | on | every resolved civil hour | on; non-minimal |
| `current-only` | off | off | optional object label | on |

Sun path, ticks, labels, current position, and sunrise/sunset annotations remain independently
optional layer IDs. Label density never changes marker coordinates.

## Deferred Moon next-24-hour temporal visualization

### Sampling convention

The next-24-hour Moon path uses **elapsed time**, not a civil calendar day:

- Start at the shared simulation instant `t0`.
- Compute 25 apparent topocentric positions at `t0 + k hours`, `k = 0..24`, creating 24 exact
  elapsed-hour intervals.
- Label in the selected IANA zone, including any skipped/repeated civil labels.
- Keep all below-horizon positions.
- Preserve topocentric parallax, because it is significant for the Moon.

This contract makes the physical motion interval stable across daylight-saving transitions. A
future alternate selected-civil-day lunar mode would be a different schedule ID.

### Display modes

- path only;
- hourly ticks without labels;
- major labels at a sparse interval;
- all hourly labels as an explicit non-minimal choice;
- current Moon emphasis;
- below-horizon styling independently selectable.

The path is the sampled apparent direction through time, not a representation of the Moon's
orbital plane.

## Deferred local-midnight lunar-cycle visualization

### Definition of midnight

`local midnight tonight` is the first start-of-local-date instant at or after the simulation
instant in the selected IANA zone. If the simulation instant is exactly that start instant, it is
included. Otherwise the next local date boundary is used.

For each successive local calendar date:

- Resolve wall time `00:00:00` using the civil resolver.
- If midnight is in a gap, use the first valid instant after the gap and mark the sample adjusted.
- If midnight is repeated, use the earlier offset by default and mark the fold; a future advanced
  mode may show both.
- Never add `24 * 60 * 60 * 1000` to obtain the next local midnight.

### Cycle endpoint

At the first sample, record the Moon-Sun geocentric ecliptic phase angle. Search forward for the
first recurrence of that phase angle after one complete phase wrap, using a provider operation
whose semantics are validated. The cycle ends at the first sampled local midnight on or after
that recurrence. This produces a variable number of daily points and is preferable to an assumed
fixed-day circle.

If a validated arbitrary-phase recurrence search is unavailable, the feature remains blocked; a
fixed 29- or 30-day approximation is not silently substituted.

Each daily sample contains the apparent topocentric Moon direction plus a separately computed
geocentric phase/illumination descriptor. The phase symbol is not used to calculate the sky
direction.

### Labels and clutter control

Default labels are sparse:

- first point: `Tonight` plus an optional date;
- major interval points: `+7d`, `+14d`, `+21d`, and final-cycle marker when present;
- selected/focused point: exact local date, UTC offset, and adjustment flag;
- optional modes: all dates, day offsets, or phase symbols.

Daily points trace the Moon's non-circular, observer-relative sampled sky positions. They must not
be joined or styled in a way that implies a circular lunar orbit around the observer.

## Shared temporal-layer result contract

```text
TemporalPath
  layerId
  observerProvenance                     WGS84 values, datum, source/uncertainty, revision,
                                         application-owned semantic schema version
  scheduleId and scheduleDefinition
  sourceStart/sourceEnd
  selectedTimeZone and tzdata provenance
  correctionProfile
  provider/model/version
  warnings[]                             deterministic, immutable non-fatal disclosures
  samples[]

TemporalSample
  instantUtc
  civilLabel metadata
  tagged scientific direction
  aboveGeometricHorizon
  event/phase metadata?                 optional, separately sourced
  validation provenance
```

Presentation code receives `TemporalPath` read-only. It may choose visibility, radius, label
density, color, and emphasis but cannot reschedule samples or alter directions.

The public temporal-path boundary returns only a ready immutable result or an
`AstronomyContractError`. Generic exceptions are wrapped as `TEMPORAL_PATH_FAILURE`; specific
lower-layer scientific errors retain their code and are enriched with immutable temporal operation
context. Failed paths never enter the cache or fall back to stale geometry during local-date
rollover.

The observer record keeps three independent identifiers: the mutable observer-state revision,
`SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_V1` provenance schema, and `WGS84_GEODETIC` geodetic model.
Every sample and civil-hour notch must match all three plus the observer values. A single
idempotent enrichment boundary completes both newly caught and already-typed temporal failures;
the code `TEMPORAL_PATH_FAILURE` is not itself evidence that required date/zone/provider/frame/
correction/sampling context is present.

## Explicitly deferred

- User-facing accelerated, reverse, pause/resume, date, and rate controls; arbitrary historical
  and future time selection; and event-jump controls.
- Geolocation and automatic time-zone selection.
- Leap-second-aware browser timeline implementation.
- Live IERS data, UT1 corrections, and polar motion.
- Rendered civil-hour labels, sunrise/sunset events, annual Sun paths, multi-day paths, analemma,
  persistent trails, and richer animation controls.
- Moon phase/orientation and next-24-hour or local-midnight lunar-cycle visualizations.
- Planetary trajectory/orbit visualization; ecliptic; Uranus, Neptune, Pluto; audio; and
  contemplative sequences.
- Persistence of location, time, layer state, or calibration.
