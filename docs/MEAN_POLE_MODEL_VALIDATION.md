# Mean Pole Model Validation

**Status:** validated direct P03 provider for the bounded Milestone 2 Tier 1 domain

**Implementation:** `src/science/astronomy/meanPoleProvider.ts`

**Provider identity:** `Cosmic Calibration P03 mean-pole provider@1.0.0`. This single exported
identity is used by the provider registry, result provenance, scientific snapshots, and cache
keys.

## Selected model and naming

The initial structural axis is named:

```text
IAU P03 precession-only mean pole/equator of date
```

It is not called an instantaneous physical pole, Celestial Intermediate Pole, true pole, observed
pole, rotation-axis element, or generic celestial pole. The provider returns a mean model that
includes frame bias and P03 precession and excludes nutation and terrestrial/observed pole motion.

The equations are the P03 Fukushima-Williams angles from Capitaine, Wallace, and Chapront,
*Expressions for IAU 2000 precession quantities* (A&A 412, 2003), adopted through IAU 2006
Resolution 1. IAU SOFA release 2023-10-11 `pmat06`, `pfw06`, `obl06`, and `fw2m` are the independent
reference implementation and matrix-contract authority for this spike.

The TypeScript routine is an application implementation of the published P03 equations. It does
not contain copied SOFA routines, does not use an `iau`/`sofa` routine name, and is not represented
as software supplied or endorsed by SOFA.

## Input and time scale

The public provider accepts a typed request containing one immutable `SimulationInstant`, source
frame `GCRS`, P03 model reference epoch `J2000.0`, and matrix output frame
`P03_MEAN_EQUATOR_OF_DATE`. The frame declarations are also checked at runtime. Its constructor
accepts an injected `TerrestrialTimeProvider`. The production time provider converts explicit UTC
through Astronomy Engine `2.1.19` and returns:

- JD(TT);
- Julian centuries of TT from J2000.0;
- provider delta-T in seconds;
- the declared `UTC_APPROXIMATES_UT1` policy; and
- the `ASTRONOMY_ENGINE_ESPENAK_MEEUS` model tag.

The provider independently derives Julian centuries from JD(TT), rejects a disagreement greater
than `1e-12` century with the supplied century field, and applies the domain gate to that derived
value. This prevents a malformed time provider from bypassing the validated date domain.

P03 polynomials are evaluated in TT. UTC is never inserted directly into the polynomial. Tests
inject frozen JD(TT) values, which separates matrix/model validation from the runtime UTC-to-TT
approximation.

The reference epoch is J2000.0, JD(TT) `2451545.0`. One Julian century is exactly `36525` TT days.

## Matrix and frame contract

The four angles are `gamma_bar`, `phi_bar`, `psi_bar`, and mean obliquity `epsilon_A`. Coefficients
are arcseconds and are converted once to radians. Polynomial evaluation uses Julian centuries of
TT from J2000.0.

The bounded provider does not wrap these angles modulo a turn before `sin`/`cos`; direct
trigonometric evaluation is equivalent and keeps the published polynomial result observable.
The returned pole vector is normalized exactly once at the typed output boundary. This is the
explicit angle-normalization policy for the validated plus-or-minus-one-century domain.

The implemented passive bias-precession matrix is:

```text
M = R1(-epsilon_A) * R3(-psi_bar) * R1(phi_bar) * R3(gamma_bar)
```

Its direction is explicit:

```text
V(P03 mean equator/equinox of date) = M * V(GCRS)
```

This is the same direction documented by SOFA `pmat06`. Reversing or transposing that mapping at
the wrong stage would move the pole to the wrong side of GCRS and is caught by the full-matrix
fixture.

The mean-date north axis expressed in GCRS is:

```text
north_GCRS = transpose(M) * [0, 0, 1]
           = normalized third row of M
```

The south result is created only as:

```text
south_GCRS = -north_GCRS
```

It is not independently evaluated. Tests require exact JavaScript component negation and unit
length for both vectors.

## Mean celestial equator contract

The mean celestial equator of date is implemented and published as a bounded reference ring in
the infinite plane defined by this same axis. Its scientific plane is:

```text
dot(point_GCRS, north_GCRS) = 0
```

The first two rows of `M` are orthonormal GCRS-expressed basis axes in that plane. Tests prove both
are perpendicular to the third-row pole and to each other. The published equator derives its
orientation from this normal/basis rather than independently orienting a ring. The local
`fix/earth-axis-spindle` branch retains that science while unifying the finite Earth core,
spindle, equatorial plane/ring, and pole directions in one presentation contract. That local
presentation correction is not integrated, deployed, or physically Quest-accepted.

## Corrections included and excluded

| Effect | Status |
|---|---|
| P03 precession of the mean equator/equinox | Included |
| GCRS/J2000 frame bias in the bias-precession matrix | Included |
| IAU 2000A/2000B nutation | Excluded |
| Celestial Intermediate Pole / true equator | Excluded |
| Observed celestial-pole offsets | Excluded |
| Terrestrial polar motion | Excluded |
| Chandler wobble | Excluded |
| Light-time, aberration, parallax, refraction | Not applicable to the structural axis |

No true or CIP-like result is returned through the `MeanPoleResult` type. Its discriminants are
`poleKind: MEAN`, `model: IAU_P03_PRECESSION_ONLY`, `vectorFrame: GCRS`, and
`meanEquatorFrame: P03_MEAN_EQUATOR_OF_DATE`. Provenance separately declares the matrix direction
(`GCRS` to mean date) and the returned pole-vector expression frame (`GCRS`), avoiding a generic
source/output label for a composite matrix-and-vector result.

## Validated domain

The application accepts `-1 <= T <= +1`, where `T` is Julian centuries of TT from J2000.0.
Inputs outside J2000.0 plus or minus one Julian century are rejected with
`MEAN_POLE_OUTSIDE_VALIDATED_DOMAIN`.

This is a conservative **project validation domain**, not a new claim about the full mathematical
or physical validity of P03. In particular, it is not permission to sample a full axial-precession
cycle. A future long-term path still requires the separately reviewed long-term model required by
DEC-015.

## Independent fixtures

### Published SOFA matrix

SOFA C release 2023-10-11 publishes a `pmat06` test at:

```text
JD(TT) = 2400000.5 + 50123.9999 = 2450124.4999
```

The repository test freezes all nine published matrix components and uses SOFA's documented
`V(date) = rbp * V(GCRS)` direction. The component threshold is `1e-12`, with stricter published
SOFA thresholds on several off-diagonal components. Reproducing all nine components guards
against sign, transpose, multiplication-order, coefficient, epoch, and degree/radian errors.

### Separately generated pole fixtures

A standalone temporary C# translation of the SOFA `pfw06`/`obl06`/`fw2m` calculation was compiled
with the Windows .NET compiler outside the repository. Before generating any additional fixture,
it reproduced the official SOFA test matrix; its pole components differed from the published
third row by less than `8e-17`. The generator then produced these frozen values:

| Case | JD(TT) | North mean pole in GCRS |
|---|---:|---|
| Earlier/published SOFA case | `2450124.4999` | `(-0.00037797349570340895, -0.0000001924880847894457, 0.9999999285679972)` |
| J2000.0 | `2451545.0` | `(-0.00000008056214211620058, -0.00000003305943169218395, 0.9999999999999962)` |
| Present-era frozen case | `2460848.167531584` | `(0.002474652002445657, -0.000007112524952668232, 0.9999969380187516)` |
| Future domain edge | `2488070.0` | `(0.009713469471883276, -0.00010877752855187328, 0.999952817226027)` |

The standalone generator is not a project runtime or dependency and was not committed. Fixture
values, source process, units, and `1e-12` component tolerance are frozen in
`tests/science/fixtures.ts`.

## Tolerance and results

The `1e-12` component threshold comes from the scale of SOFA's own published `pmat06` validation,
not from observing the TypeScript result and widening a test. At unit-vector scale it is tight
enough to expose any scientifically material transcription/order error in this bounded spike.

Results:

- all nine official SOFA matrix components pass;
- J2000, earlier, present, and future pole vectors pass their frozen component thresholds;
- north and south are finite, normalized, and exactly antipodal;
- the two mean-equator basis axes are perpendicular to the pole and each other;
- nearby dates are continuous and deterministic; and
- dates outside the project domain are rejected.

No nonzero angular discrepancy was resolvable at ordinary double-precision angle calculation for
the frozen pole vectors; the enforceable evidence is the per-component threshold above. This is a
software/model result, not a claim about physical Earth-axis realization or XR placement.

## Decision outcome and open questions

The mean-pole status is **validated direct P03 provider for the bounded Tier 1 contract**.

Still open or deferred:

- independent Tier 2 validation with a second compiled standards implementation;
- the accuracy impact of Astronomy Engine's UTC/UT1 and delta-T approximations across the full
  project domain;
- a true/CIP-like optional mode with explicit nutation;
- live EOP, observed offsets, polar motion, and Chandler wobble;
- the long-term model and date interval for precession trajectories; and
- physical Quest observer-horizontal placement and presentation acceptance.

Integrated Milestone 2B consumes this provider only through the validated scientific snapshot for
its observer-horizontal axis and pole presentation. The celestial equator is implemented and
published from the same validated P03 relationship; precession-trajectory geometry remains
unimplemented. Physical Quest acceptance of the current local spindle/core/equator presentation
correction remains NOT RUN.
