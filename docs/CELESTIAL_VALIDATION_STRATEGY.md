# Celestial Validation Strategy

## Milestone 2A implemented checks

The non-visual foundation adds deterministic store, serialization, explicit-tick clock, calibration-adapter, configuration, snapshot, exact-cache, LRU, axis-basis, and boundary tests. Remediation adds accepted-event same-yaw invalidation, nested mutation resistance, malformed restore rejection, provider-version consistency, semantic clock no-op behavior, true-LRU recency, and the height-datum warning. They retain the frozen 2A0 JPL/SOFA/P03 fixtures unchanged. Snapshot checks verify exact pole antipodes, unit/perpendicular/right-handed equator preparation, frame/provenance metadata, structured readiness, warnings, and no stale cache reuse after observer/time/calibration/profile changes. The checks are not a visual or Quest celestial validation.

## Purpose

Scientific validation is designed before implementation. This strategy separates pure coordinate
correctness, provider accuracy, physical calibration, WebXR tracking, and presentation. A source
inspection or plausible picture is never converted into `PASS`.

Reference authorities and their limitations are recorded in the [official astronomy source
register](OFFICIAL_ASTRONOMY_SOURCES.md).

Evidence states remain `PASS`, `FAIL`, `UNCERTAIN`, `NOT RUN`, and `NOT APPLICABLE`.

## Validation layers

1. **Pure mathematical contracts:** deterministic, dependency-free vectors, matrices, angles,
   frame tags, and schedules.
2. **Provider contract tests:** pinned Astronomy Engine calls and exact correction profiles.
3. **Golden astronomical fixtures:** versioned outputs from SOFA, JPL Horizons, and/or NOVAS.
4. **Desktop visual diagnostics:** known vectors and dates rendered in a non-XR scene.
5. **Physical Quest acceptance:** floor/up, north, world locking, comfort, and observed sky
   relationship.
6. **Independent scientific review:** required before promoting a new pole model, precision tier,
   or long-term precession path.

## Milestone 2A0 executed evidence

Milestone 2A0 captured the first bounded offline fixtures. They validate a non-visual contract,
not a visible celestial layer or a complete product error budget.

### Astronomy Engine versus NASA/JPL Horizons

The comparison tolerance was fixed at `0.02 degrees` before Astronomy Engine output was inspected.
Astronomy Engine documents a plus-or-minus-one-arcminute design target; the slightly larger test
threshold allows for provider-model and printed-reference differences while remaining small
enough to expose sign, unit, epoch, and hemisphere mistakes.

| Body/case | Observer | UTC | Horizons profile | Largest coordinate difference | Largest directional separation | Result |
|---|---|---|---|---:|---:|---|
| Sun, June-solstice date (not the exact event instant) | `38.8977 N`, `77.0365 W`, 17 m numeric height | `2025-06-21T16:00:00Z` | DE441, airless apparent topocentric | `0.000181 degrees` | `0.000170 degrees` | PASS |
| Moon, ordinary date, below horizon | `33.8688 S`, `151.2093 E`, 58 m numeric height | `2025-10-15T10:00:00Z` | DE441, airless apparent topocentric | `0.004592 degrees` | `0.001276 degrees` | PASS |
| Sun, equator on the March-equinox date (not the exact event instant), below horizon | `0`, `0`, 0 m numeric height | `2025-03-20T00:00:00Z` | DE441, airless apparent topocentric | `0.008280 degrees` | `0.000300 degrees` | PASS |

The fixtures use Horizons API version `1.2`, DE441, `TIME_TYPE=UT`, `REF_SYSTEM=ICRF`,
`QUANTITIES=2,4`, `APPARENT=AIRLESS`, decimal degrees, and exact user geodetic sites. The complete
query URLs, settings, retrieval date `2026-07-16`, expected values, and tolerance are stored in
`tests/science/fixtures.ts`. No test calls Horizons over the network.

The frozen text prints RA/declination to `0.00001 degrees` and azimuth/altitude to `0.000001
degrees`; those resolutions are recorded in every fixture. The allowed `0.02 degrees` is governed
by provider/profile differences rather than by output rounding alone.

The query's height is above the Horizons reference ellipsoid; Astronomy Engine's input is above
mean sea level. Each fixture tags both conventions and the fact that the same numeric height was
compared without geoid conversion. JPL documents that these datums can differ by more than 100
meters. These fixtures therefore validate the bounded direction/sign/time/profile contract, not
an exact identical physical observer or a vertical-datum conversion.

Horizons `a-app` uses its documented EOP-corrected IAU76/80 equator/equinox of date and notes a
small offset from IAU06/00A. These cases validate bounded apparent directions and sign/time/profile
contracts; they do not establish identical internal precession-nutation implementations. Horizons
uses EOP-aware UT and apparent-place deflection; this Tier 1 adapter declares UTC approximately
equal to UT1 and does not claim an undocumented provider deflection correction.

The coordinate checks intentionally remain alongside the preferred angular-separation checks so
an azimuth sign/unit error cannot hide behind spherical comparison. The largest coordinate error
occurs near nadir, where azimuth is ill-conditioned; its much smaller directional separation is
the physically relevant comparison.

### P03 mean pole versus IAU SOFA

The application P03 matrix is checked against all nine components of IAU SOFA C release
2023-10-11 `pmat06` at JD(TT) `2450124.4999`. The component tolerance is `1e-12`, based on SOFA's
own published test scale and declared before application output was judged.

A separate temporary C# calculation reproduced the published matrix first, then generated frozen
J2000, present-era, and future-domain pole vectors. The provider tests also require exact
north/south negation, unit length, mean-equator perpendicularity, continuity, determinism,
mean/true discrimination, and domain rejection. All pass. The process and values are recorded in
[Mean Pole Model Validation](MEAN_POLE_MODEL_VALIDATION.md).

### Current automated boundary

- Existing Milestone 0/1 tests: 66 retained and passing.
- New scientific tests: 69 passing.
- Total: 8 files / 135 tests passing.
- Type-check and production build: PASS.
- Desktop visual and Quest celestial validation: NOT APPLICABLE; no visible behavior changed.

## Pure mathematical test plan

### Vector and matrix invariants

- All accepted direction vectors are finite and unit length within a numerical tolerance justified
  by floating-point operations.
- Rotation matrices are orthonormal, right-handed, and preserve norm.
- Matrix inverse/round-trip returns the starting vector within tolerance.
- Known basis transformations preserve frame tags and reject mismatched origins/times.
- Angle normalization covers negative angles, wrap at `0/2pi`, and antipodal cases.
- Degree/radian/sidereal-hour conversions are explicit and round-trip.

### Existing-to-celestial mapping

For canonical ENU and uncalibrated Three.js coordinates:

| Scientific direction | ENU | Expected Three.js |
|---|---|---|
| north horizon | `(0, 1, 0)` | `(0, 0, -1)` |
| east horizon | `(1, 0, 0)` | `(1, 0, 0)` |
| south horizon | `(0, -1, 0)` | `(0, 0, 1)` |
| west horizon | `(-1, 0, 0)` | `(-1, 0, 0)` |
| zenith | `(0, 0, 1)` | `(0, 1, 0)` |
| nadir | `(0, 0, -1)` | `(0, -1, 0)` |

Astronomy Engine HOR basis tests add:

```text
HOR north  (1, 0, 0) -> ENU north  -> Three -Z
HOR west   (0, 1, 0) -> ENU west   -> Three -X
HOR zenith (0, 0, 1) -> ENU up     -> Three +Y
```

The existing north-yaw known vectors remain regression tests. The scientific source vector must
not be mutated when the geographic presentation group rotates.

### Axis, pole, and equator invariants

- `norm(northAxis) = 1`.
- `southAxis = -northAxis` component by component after normalization.
- North/south endpoint angular separation is 180 degrees.
- Every equator sample has unit norm and `dot(sample, northAxis) = 0`.
- Opposite equator samples are antipodal.
- The sampled equator closes without an orientation seam.
- A model change updates axis, poles, and equator atomically from one snapshot.
- Mean and true axis records cannot be combined under one model ID.

### Horizon and latitude cases

- At geodetic latitude 0 degrees, both mean celestial poles lie on the ideal geometric horizon.
- At +90 degrees, the mean NCP is at zenith and the SCP at nadir.
- At -90 degrees, the mean SCP is at zenith and the NCP at nadir.
- At signed mid-latitudes, the corresponding pole altitude equals the signed ideal latitude under
  the declared geodetic-horizon model.
- The celestial equator has the complementary horizon relationship and remains perpendicular to
  the selected axis.
- Below-horizon visibility changes style/visibility only, never direction.

### Time and schedule determinism

- A frozen simulation instant produces identical results regardless of wall-clock time.
- No layer-level call to `new Date()` or device time can change a fixed test.
- UTC-to-local labels use the supplied IANA zone, not the test machine zone.
- DST spring gaps and autumn folds use the declared resolution policy.
- Ordinary solar civil days produce 24 hourly boundaries; selected one-hour DST transitions
  produce the correct 23/25 schedule and preserve distinct UTC instants for repeated labels.
- Non-hour and historical zone transitions use the actual valid boundary count from the civil
  resolver rather than assuming every offset change is one hour.
- The Moon next-24-hour schedule contains 25 samples spanning exactly 24 elapsed hours.
- Successive local-midnight samples are calendar-resolved, not fixed-duration additions.
- Pause, resume, positive/negative rate, and time-jump invalidation are tested before time controls
  are released.

## Golden astronomical cases

Expected numerical values are not invented in this plan. Implementation captures them from the
named authoritative source with complete provenance and has an independent reviewer approve the
tolerance before production code is judged.

### Required case matrix

| Case | Observer/date intent | Required comparisons |
|---|---|---|
| Equator/J2000 | geodetic 0 degrees latitude at a fixed longitude/elevation; J2000 epoch expressed on the correct source time scale | basis transforms, mean axis/pole/equator, source frame labels |
| Equator/equinox | equatorial observer at an authoritative equinox instant | pole-on-horizon and Sun/horizon relationship when Sun work begins |
| Mid-northern | a frozen WGS 84 observer near 40 degrees north at equinox and solstice instants | pole altitude, equator orientation, Sun/Moon topocentric azimuth-altitude |
| High northern | a frozen observer at 70 degrees north | circumpolar/horizon behavior and rise/set edge cases |
| Mid-southern | a frozen observer near 34 degrees south | SCP-above-horizon signs, east/west convention, Sun/Moon positions |
| Date-domain edges | each provider's declared earliest/latest supported validation dates | graceful rejection or bounded agreement; no silent extrapolation |
| Current-era frozen | one explicitly recorded present-era UTC instant | present-era body and true-of-date comparisons without using live `now` |
| Historical/future precession | dates selected from the approved P03 or long-term-model validation corpus | mean pole samples, direction of motion, north/south coherence |
| DST gap/fold | authoritative IANA zones/dates from a pinned tzdb fixture | solar and midnight schedules/labels only; astronomy instants remain UTC |

Equinox and solstice instants come from an authoritative fixture such as JPL/USNO or a validated
provider result; they are not rounded calendar assumptions.

### Body cases when enabled

- Sun above and below horizon, near rise/set, and near meridian transit.
- Moon at multiple distances/phases, including a case where topocentric parallax materially
  distinguishes geocentric and observer-relative direction.
- At least one inner and one outer planet before planet layers are released.
- Apparent versus geometric/astrometric and refraction-off versus selected-refraction profiles are
  separate fixtures.

## Cross-library/reference validation

### Astronomy Engine versus JPL Horizons

For every body fixture record:

- target and observer center/site;
- geodetic latitude, east longitude, height and height datum;
- UTC/TT output choice and exact instant;
- apparent/astrometric quantity selection;
- aberration, light-time, topocentric, refraction, and horizon-dip settings;
- Horizons system version/query text and retrieval date;
- Astronomy Engine exact package version and API arguments;
- angular separation of resulting unit directions, not only separately rounded azimuth/altitude.

No live Horizons call is part of the normal unit suite. Curated results are stored as small,
reviewable fixtures with provenance.

### Frame transforms versus SOFA

Use the official SOFA C/Fortran validation environment or independently generated output to
create fixtures for:

- IAU 2006 precession-only mean pole/equator where supported;
- IAU 2006/2000A bias-precession-nutation/CIP result;
- UTC/UT1/TT conversions with explicit DUT1 and leap-second inputs;
- geodetic-to-geocentric observer vectors;
- GCRS/CIRS/terrestrial-to-horizontal matrix composition.

The project adapter must not be labeled SOFA-compatible until these cases pass and the frame bias,
matrix direction, and origin conventions are reviewed.

### NOVAS and secondary visual evidence

NOVAS provides an independent apparent/topocentric comparison for selected cases. Stellarium or
another trusted planetarium may provide secondary visual sanity evidence, but screenshots cannot
replace numerical SOFA/JPL/NOVAS fixtures.

## Precision-tier gates and tolerance policy

### Tier 1

- Astronomy Engine's documented plus-or-minus-one-arcminute design target is recorded as an
  upstream ephemeris target only.
- Each adapter operation receives a tighter numerical implementation tolerance where it is only a
  basis permutation, normalization, or matrix application.
- Each body golden receives a predeclared angular agreement tolerance supported by upstream
  evidence and observed fixture differences.
- Physical north/floor/tracking errors remain separate and can prevent a combined claim even when
  the ephemeris passes.

### Tier 2

- Release requires an approved date domain and published maximum observed errors by operation,
  source, body, and correction profile.
- Mean and true pole/equator modes must each have independent SOFA-aligned fixtures.
- Long-term precession paths require path interpolation and model-domain evidence, not only a
  current-date contact point.

### Tier 3

- Requires versioned IERS EOP/leap-second input, data freshness/expiry behavior, uncertainty
  propagation, and standards-implementation validation.
- Its numerical target remains unset until the provider/data architecture is selected; the
  project must not invent a high-precision number in advance.

Changing a tolerance is a reviewed scientific change. Tests may not be broadened merely to accept
a mismatch.

## Error budget architecture

The project records components separately:

| Component | Evidence / unit | Typical cause | Validation method |
|---|---|---|---|
| Ephemeris/model error | angular separation | truncated model, date range, body theory | JPL/NOVAS fixtures |
| Frame-transform error | angular/matrix residual | sign, frame bias, precession/nutation model | SOFA fixtures and round trips |
| Time-scale error | seconds plus derived angular effect | UTC/UT1/TT/delta-T/leap policy | SOFA/IERS time fixtures |
| Observer horizontal error | meters/degrees | latitude/longitude source and datum | known test observers/input validation |
| Observer height error | meters with datum | MSL versus ellipsoid, unavailable altitude | provenance and sensitivity tests |
| Refraction/atmosphere error | angular, condition-specific | pressure, temperature, humidity, terrain | profile comparison; never one universal value |
| North-calibration error | measured angular offset | trusted marker and controller pointing | physical repeated calibration |
| Floor/vertical error | degrees/height | Quest floor, boundary, gravity/geodetic mismatch | physical floor/plumb checks |
| XR tracking error | jitter/drift/relocalization | device tracking and environment | Quest world-locking tests |
| Display placement error | pixels/angular visual residual | line width, depth, label billboard, quantization | screenshots/known-vector overlays |
| Civil-label error | instant/offset/text | wrong zone, stale tzdata, DST fold/gap | pinned IANA-zone schedule fixtures |

The report may show a measured combined physical result for a defined test, but it never adds
unrelated worst-case values into one unsupported universal accuracy number.

## Desktop visual validation

Before Quest testing, provide a diagnostic mode that is excluded from minimal presentation and
can show:

- canonical north/east/up basis markers;
- selected frame/model/provenance;
- horizon plane and above/below color distinction;
- one coherent axis with antipodal pole endpoints;
- equator perpendicular to that axis;
- known latitude presets and frozen date fixtures;
- mean versus true pole difference only when both are supported;
- no geographic rotation of room axes/camera.

Check resize, OrbitControls, labels, line closure, occlusion policy, relative assets, and browser
console. Visual resemblance is supporting evidence only.

## Physical Quest validation

Each visible celestial milestone receives a bounded device checklist after automated and desktop
gates pass. At minimum verify:

- deliberate floor and true-north recalibration for the tested session;
- correct pole above/below-horizon hemisphere and approximate altitude relationship to latitude;
- one continuous axis and antipodal pole markers;
- equator orientation/perpendicularity by diagnostic evidence;
- below-horizon continuity does not masquerade as room-floor geometry;
- world locking under head turns, lean, height change, exit/re-entry, and recenter;
- labels remain upright/readable and do not follow the head incorrectly;
- minimal mode shows only the intended relationships;
- no flashing, forced camera movement, unstable scale, excessive brightness, or severe discomfort.

Quest evidence cannot establish arcminute scientific accuracy without an independently measured
physical reference. Record usability and observed alignment at the resolution actually tested.

## Fixture provenance schema

Every golden fixture records:

```text
fixtureId
sourceTitle / authority / URL
sourceVersion and retrieval date
query or routine and exact arguments
input time scale and UTC representation
observer datum, latitude, longitude, height
source and target frames/origins
correction/refraction/EOP settings
expected values and units at source precision
approved comparison method and tolerance
reviewer / acceptance date
```

Generated fixture updates are reviewed as scientific diffs. The test suite must fail if a fixture
lacks frame, time, observer, or correction metadata.

## Promotion gates

1. Pure frame/time/schedule tests pass.
2. Provider wrapper and dependency/version/license review pass.
3. Golden cases pass with predeclared tolerances.
4. Existing Milestone 0/1 automated and desktop behavior does not regress.
5. Diagnostic desktop visualization passes.
6. Independent scientific/code review finds no material frame or correction mismatch.
7. Physical Quest validation passes for each visible milestone.
8. Documentation states the tested tier, model, date domain, uncertainty, and unverified cases.

A failure at a higher gate does not rewrite a lower gate as passed; it creates one bounded
remediation task.
