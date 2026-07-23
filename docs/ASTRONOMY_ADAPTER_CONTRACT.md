# Astronomy Adapter Contract

**Status:** Milestone 2A0 bounded contract validated on 2026-07-16

**Runtime provider:** `astronomy-engine@2.1.19`

This document records the application-owned astronomy boundary. The bounded Milestone 2E body
layer consumes its typed actual apparent results through a separate service; presentation never
imports the provider. It does not authorize ecliptic, projection, paths, phase, labels, stars, or
precession rendering.

## Package and containment

The installed package is the official npm package `astronomy-engine`, version `2.1.19`, maintained
by Donald Cross and licensed under MIT. Its package metadata exposes CommonJS, ESM, browser files,
and `astronomy.d.ts`; the package declares no runtime package dependencies and `sideEffects:
false`. Registry metadata reports an unpacked package size of `1,838,627` bytes; that is not a
browser-chunk measurement. The installed tarball declares MIT in `package.json` but contains no
standalone license file; the upstream repository license is therefore the notice source that a
future distributing bundle must preserve.

A no-write Vite `8.1.4` library-mode validation using the project's Oxc minifier successfully
bundled this adapter and Astronomy Engine into one dependency-free ESM chunk: `75,901` bytes
minified and `25,178` bytes gzip. This proves the bounded module can bundle; it is not a prediction
of the later production chunk because facade imports and tree-shaking may differ.

Raw provider objects and imports are contained in
`src/science/astronomy/astronomyEngineAdapter.ts`. Project code receives application-owned frozen
objects only. A boundary test fails if another scientific source module imports Astronomy Engine
or if the science layer imports Three.js.

## Module boundary

```text
explicit UTC string
  -> SimulationInstant

observer input
  -> validated WGS84 observer

SimulationInstant + observer + named correction profile
  -> Astronomy Engine adapter
  -> tagged equatorial or canonical ENU result

canonical ENU
  -> presentation-only mapper outside science
  -> application basis (east, up, -north)
```

The adapter does not read the system clock, call a network service, render geometry, or import
Three.js.

## Simulation-instant contract

`SimulationInstant` is a serializable, immutable record containing:

- canonical ISO 8601 UTC text;
- Unix milliseconds for the same instant; and
- an explicit origin: `frozen-test`, `user-selected`, or `system-selected`.

Creation requires a `Z` or `+00:00` offset. Scientific functions receive an instant; they never
construct an implicit current time. JavaScript's inability to represent a leap-second label is
not hidden. Future leap-second-aware ingestion belongs behind this boundary.

## Observer contract

| Field | Contract |
|---|---|
| Latitude | finite WGS84 geodetic degrees in `[-90, +90]`; north positive |
| Longitude | finite degrees east of Greenwich; normalized to `[-180, 180)` |
| Elevation | meters with an explicit vertical datum |
| Horizontal datum | `WGS84` |
| Vertical datum | `MEAN_SEA_LEVEL` or `WGS84_ELLIPSOID` |
| Source | optional string provenance |
| Uncertainty | optional non-negative horizontal/vertical meters |

The application sanity interval for elevation is `[-12000, 100000]` meters. This is an input-error
guard, not a claim that every point in that interval is a supported surface observer.

Astronomy Engine documents observer height above mean sea level. The adapter therefore accepts
only `MEAN_SEA_LEVEL` for provider calculations. A WGS84 ellipsoidal elevation remains valid
observer data but is rejected at this provider boundary until a reviewed geoid conversion exists.
It is never passed through silently. Legitimate below-sea-level values are accepted.

## Frame and unit contract

| Tag | Meaning in this spike | Units |
|---|---|---|
| `EQJ_J2000` | Astronomy Engine J2000 mean equator/equinox catalog frame | RA sidereal hours, declination degrees, or normalized unit vector |
| `EQD_TRUE` | Astronomy Engine topocentric true equator/equinox of date; precession and nutation included by the documented `ofdate=true` operation | RA sidereal hours, declination degrees, distance AU, or unit vector |
| `HORIZONTAL_ENU` | application-owned observer-local east/north/up basis | azimuth/altitude degrees and normalized unit direction |
| `GCRS` | geocentric celestial reference axes used by the P03 provider | normalized Cartesian unit direction |
| `P03_MEAN_EQUATOR_OF_DATE` | P03 precession-only mean equator/equinox triad of the selected TT date | tagged rotation-matrix target frame |
| `APPLICATION_BASIS` | presentation basis outside science | normalized `(x, y, z)` |

No public result is simply named `equatorial`, `celestial`, or `world`. Right ascension remains in
sidereal hours, while all exposed horizontal and declination angles are degrees. Degree/radian
conversion is explicit and tested.

## Correction profiles

### `AE_APPARENT_TOPOCENTRIC_AIRLESS`

- provider light-time: included;
- topocentric parallax: included;
- aberration: included;
- gravitational light deflection: not documented by the selected provider operation and therefore
  not claimed;
- provider precession and nutation for true equator of date: included;
- atmospheric refraction: disabled;
- polar motion and live EOP correction: excluded.

This is the initial observer-relative body profile. It is also the profile used by the frozen JPL
Horizons comparisons.

### `AE_APPARENT_TOPOCENTRIC_NORMAL_REFRACTION`

The same body pipeline is used, followed by Astronomy Engine's documented `normal` refraction
model. This is a distinct selectable profile; it is not silently applied to the geometric horizon
or P03 structural axis.

### `IAU_P03_MEAN_PRECESSION_ONLY`

Frame bias and P03 precession are included. Nutation, aberration, light-time, parallax,
refraction, polar motion, Chandler wobble, and observed celestial-pole offsets are excluded or
not applicable. See [Mean Pole Model Validation](MEAN_POLE_MODEL_VALIDATION.md).

## Implemented operations

### Apparent topocentric equatorial

The adapter calls Astronomy Engine `Equator(body, time, observer, true, true)` for the bounded
Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto list. The provider documentation defines this as topocentric, light-time corrected, parallax
corrected, aberration enabled, and true-equator-of-date. The application result records:

- `EQD_TRUE` rather than a generic equatorial tag;
- `PROVIDER_APPARENT_TOPOCENTRIC` and `OF_DATE` status tags;
- topocentric center;
- explicit RA sidereal-hour, declination-degree, distance-AU, and unit-vector unit tags;
- a normalized tagged Cartesian direction; and
- exact provider, version, instant, observer, and correction provenance.

`PROVIDER_APPARENT_TOPOCENTRIC` means the exact provider profile above; it is not a claim of a
complete standards-level apparent-place reduction. In particular, the adapter does not claim an
undocumented gravitational-deflection mode. Cross-provider comparison uses the complete named
output semantics and an empirical tolerance.

### Observer-relative horizontal

The adapter feeds the true-of-date RA/declination into Astronomy Engine `Horizon`. Official
provider documentation defines azimuth as degrees clockwise from north:

```text
0 degrees   = north
90 degrees  = east
180 degrees = south
270 degrees = west
```

Altitude is degrees above the geometric local horizon, negative below it. Below-horizon values
are retained and never clamped.

### Real-sky equatorial rotations

The development study adds immutable matrix results at the existing adapter boundary using
Astronomy Engine `Rotation_EQJ_EQD`, `Rotation_EQD_HOR`, and `Rotation_EQJ_HOR`. Provider HOR is
`(north, west, up)`; the application explicitly remaps it to ENU and then `(east, up, -north)`
with determinant `+1`. Catalog J2000 directions use `EQJ -> HOR`. The already validated
mean-date grid uses the `EQD -> HOR` phase to retain exact pole-marker convergence. These are
geometric rigid rotations: elevation is provenance, not a matrix input, and refraction is absent.
See [Real-Sky Equatorial Orientation](REAL_SKY_EQUATORIAL_ORIENTATION.md).

Canonical ENU is calculated explicitly:

```text
east  = cos(altitude) * sin(azimuth)
north = cos(altitude) * cos(azimuth)
up    = sin(altitude)
```

Angles enter this formula in radians after explicit conversion. The output is normalized and
tagged `HORIZONTAL_ENU`.

### Presentation mapping

`src/presentation/mapEnuToApplicationBasis.ts` is deliberately outside the provider layer:

```text
ENU east  -> application +X
ENU up    -> application +Y
ENU north -> application -Z
```

This mapper has no Three.js import. Geographic calibration remains a later presentation-parent
transform and never mutates a scientific result.

## Time-scale contract

Astronomy Engine documents `AstroTime.ut` as a UT1/UTC approximation and `AstroTime.tt` as TT
derived through a delta-T model. This adapter resets the package's process-global delta-T hook to
its exported `DeltaT_EspenakMeeus` implementation before creating each provider time. The returned
application record states:

- input scale `UTC`;
- output scale `TT`;
- `UTC_APPROXIMATES_UT1`;
- delta-T model `ASTRONOMY_ENGINE_ESPENAK_MEEUS`;
- delta-T seconds, JD(TT), and Julian centuries from J2000.0; and
- provider version `2.1.19`.

This is a Tier 1 deterministic approximation, not an EOP-aware UT1 realization. Live IERS data,
polar motion, and a leap-second table are not implemented.

## Provenance and errors

Every adapter result records provider, exact provider version, simulation instant, observer,
source frame, output frame, named correction profile, and units. Fixture IDs can be attached by a
higher-level manifest without changing numerical values.

Application-owned `AstronomyContractError` codes distinguish invalid instant, invalid observer,
unsupported vertical datum, invalid angle, unsupported frame contract, unsupported correction
profile, and mean-pole domain failure. Raw provider objects and stack traces do not cross the
public data boundary.

The temporal Sun-path service follows the same boundary: all public failures are structured
`AstronomyContractError` values. Specific provider, provenance, civil-time, and configuration
codes are retained while gaining detached operation context. Unexpected path aggregation,
sample/notch, and provider exceptions use `TEMPORAL_PATH_FAILURE`. Its recursively immutable
diagnostic context records only safe observer/date/time-zone/provider/frame/correction/sampling
data and a causal code or message; it never exposes a provider implementation, browser/XR object,
cache instance, mutable exception, or stack trace.

Daily-path observer diagnostics additionally carry the immutable application-owned
`SOLAR_DAILY_PATH_OBSERVER_PROVENANCE_V1` schema identity, separately from observer-state revision
and the `WGS84_GEODETIC` model identity. The solar temporal service applies one uniform context
enrichment boundary even to an existing `TEMPORAL_PATH_FAILURE`, preserving its precise fields
while adding any missing safe scientific context.

### Actual-body provider identity and validation

The body layer uses one frozen application-owned descriptor:
`ASTRONOMY_ENGINE_APPARENT_TOPOCENTRIC_V1`. It binds the Astronomy Engine name/version, body-adapter
version, supported Sun/Moon/Mercury/Venus/Mars/Jupiter/Saturn/Uranus/Neptune/Pluto set, supported airless/normal
correction profiles, and the `EQD_TRUE -> HORIZONTAL_ENU` frame contract. The structural snapshot
retains a recursively frozen copy; `SolarSystemBodyStateService` verifies the active registry
descriptor against it before invoking the adapter or consulting its cache.

Each returned equatorial and horizontal result is then checked independently for body, observer,
instant, provider/version/adapter-version, correction profile, source/output frame, units, finite coordinates, and
unit direction. The pair must agree on every shared provenance field while retaining their named
output-frame distinction. `PROVIDER_IDENTITY_MISMATCH`, `UNSUPPORTED_PROVIDER_CAPABILITY`, and
`MALFORMED_PROVIDER_RESULT` are fatal structured errors. They cannot produce a ready body state or
reuse a cached body result.

For `PROVIDER_IDENTITY_MISMATCH`, the structured context contains detached, recursively immutable
expected and actual descriptor snapshots plus a deterministic `mismatchedFields` list. The
snapshots retain the provider ID/name/version, adapter version, body-set ID, supported body list,
supported correction-profile list, all declared source/output frames, and descriptor/collection
freeze status. A frame-, profile-, body-, or capability-only difference is therefore visible in
diagnostics without exposing a registry function or raw provider implementation.

## Numerical validation

The tolerance was declared as `0.02 degrees` before provider results were compared. It is slightly
larger than Astronomy Engine's documented plus-or-minus-one-arcminute design target (`1/60`
degree) and accommodates reference/model and printed-fixture differences. It remains tight enough
to reject degree/radian mistakes, east/west reversal, a wrong hemisphere, or a mean/true epoch
mistake.

| Fixture | Independent source | Largest measured component error | Largest directional angular separation |
|---|---|---:|---:|
| Sun, Washington DC, 2025 June-solstice date (not the exact event instant) | JPL Horizons DE441, airless apparent topocentric | `0.000181 degrees` | `0.000170 degrees` |
| Moon, Sydney, ordinary present-era date, below horizon | JPL Horizons DE441, airless apparent topocentric | `0.004592 degrees` | `0.001276 degrees` |
| Sun, equator/Greenwich, 2025 March-equinox date (not the exact event instant), below horizon | JPL Horizons DE441, airless apparent topocentric | `0.008280 degrees` | `0.000300 degrees` |

Each fixture records the exact Horizons query URL, observer, numeric height, both providers'
different height-datum semantics, UTC instant, output profile, API version `1.2`, DE441 source,
retrieval date, equatorial `0.00001-degree` and horizontal `0.000001-degree` printed resolutions,
units, and tolerance in
`tests/science/fixtures.ts`. Tests enforce both individual coordinate differences and spherical
unit-vector angular separation. The current maximum is below the predeclared threshold; the
threshold is not a product-level pointing-accuracy claim.

Horizons requires topocentric height above its WGS84-compatible reference ellipsoid, while
Astronomy Engine requires mean-sea-level height. The fixture comparison deliberately uses the
same numeric meter value without pretending that a geoid conversion occurred. JPL warns the two
heights can differ by more than 100 meters. That datum mismatch is one reason these are bounded
direction comparisons at `0.02 degrees`, not exact same-observer or Tier 2 validation.

Horizons labels these `a-app` equatorial values in its EOP-corrected IAU76/80 equator/equinox of
date and notes an approximately 53 milliarcsecond equinox offset from IAU06/00A. They are therefore
an independent bounded apparent-direction comparison, not proof that the two providers implement
an identical true-frame series. Horizons also uses EOP-aware UT and documents apparent-place
deflection, whereas this adapter declares UTC approximately equal to UT1 and does not claim an
undocumented provider deflection correction. These frame, time, correction, and datum differences
justify the comparison tolerance without turning it into a product accuracy claim. A stricter
Tier 2 same-profile/same-observer frame comparison remains deferred.

## Implemented Milestone 2A orchestration

`ScientificSnapshotService` supplies the structural P03 orchestration boundary. It accepts an
explicit immutable observer/clock/calibration/configuration state set and a typed registry. The
separate `SolarSystemBodyStateService` uses the same validated snapshot inputs and registry for the
bounded ten-body actual-direction state; it has its own exact frozen-time cache identity so body
cadence does not bloat the structural P03 snapshot. Neither service permits provider calls from
presentation. See [Scientific Snapshot Contract](SCIENTIFIC_SNAPSHOT_CONTRACT.md),
[Scientific Cache Policy](SCIENTIFIC_CACHE_POLICY.md), and
[Actual Solar-System Body Layer](SOLAR_SYSTEM_BODY_LAYER.md).

## Decision and remaining limits

Astronomy Engine `2.1.19` is **validated for the bounded Tier 1 adapter operations in this
contract**. It is not validated as a generic astronomy authority, as a P03 mean-pole provider, or
for Tier 2/Tier 3 claims. The seven actual-body calls use the explicit current profile and require
their own bounded fixtures/physical review; event searches, ecliptic frames, refraction near the
horizon, and every later visible layer remain separate work.

Milestone 2B now reaches the adapter only through the validated scientific snapshot; presentation
does not import Astronomy Engine or the P03 provider directly. The integrated production build
emits a 662.83 kB minified / 178.12 kB gzip application/Three.js/astronomy chunk. The existing
500 kB size advisory remains and physical Quest startup/performance evidence is pending.
