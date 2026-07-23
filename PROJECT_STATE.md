# Project State

## V3A local implementation record — 2026-07-23

V3A Course 40 is implemented locally on `feature/constellation-catalog-v3a-40` from clean
development commit `10b3229a873dabd91d3c5bc55451038c04e42241`. It preserves V2 geometry and all
accepted solar/lunar, calibration, XR, and semantic-material contracts while adding 11 audited
BSC5P figures, 48 new canonical records, original reviewed connectivity, Course-40 selection,
extended groups, and diagnostic isolation states. Focused tests, the full 590-test suite,
type-check, build, and diff check pass locally. Feature `e6f3da3` merged as
`1e8584589b38fc476ef924e95a76a3d69e174e67`; development Actions/Pages run `30041239809` passed.
Hosted Course-40 verification confirmed the visible exact build SHA, all 40 controls, all 11 new
identifiers, and the master-OFF Introduction Anchors default. Physical Quest review remains
pending. Stable is untouched.

## Current control record — 2026-07-23

The historical narrative below is retained as evidence but is superseded for active planning by
the accepted `d54a830ab04fb920838e78a350c0a7e540740997` baseline: Quest-approved lunar transit
presentation and 29-constellation catalog/learning groups remain checkpointed development
baseline. `quest-approved-expanded-constellations-v1` tags that accepted commit on the development
remote only. Semantic celestial color implementation `66722d8` was merged to development as
`55fb0c5` and deployed through the successful development-only Actions/Pages run `30027473325`.
The query-gated study adds Moonlit Water and Legacy Purple lunar palettes plus Unified, Highlight
Selected Group, and Experimental Group Palette constellation modes. It changes material style only;
Quest acceptance of this color system is pending. Stable remains
`7c8b756b9d14f90c853e62896142b5c1d381e4ff` and is untouched.

The active personalization study preserves that geometry while resolving Axis, pole markers, pole
labels, and Earth Core OFF by default; restoring Lunar Purple; and adding curated persisted
constellation/lunar appearance selectors and resets. It awaits Quest validation.

Feature `eb97879` merged as `b813f81`; development-only Actions/Pages run `30033294200` passed
and the hosted bundle exposed that exact build. Physical Quest acceptance remains pending.

## Quest-approved checkpoint and expanded constellation catalog V2 (development study)

`quest-approved-lunar-transit-v1` is an immutable annotated development tag at
`0d3f7219774bac51c0b3f5061205a307e67546d3` / visible build `0d3f721`. It records physical Quest
acceptance of the real-sky bridge, first seven constellation figures, outer-body labels, finite
core, safe Sun path, and the complete solar/lunar presentation. It is not a stable release.

The current development branch adds query-gated `constellationStudy=expanded` using
`COSMIC_CONSTELLATION_CATALOG_V2_EXPANDED_29`: 29 conventional Western figures, 22 additions
including Libra, canonical NASA HEASARC BSC5P EQJ/J2000 star records, project-authored
connectivity, deterministic learning-group visibility sets, and the already accepted immutable
great-circle/shared-orientation renderer. The first set remains a seven-only compatibility mode;
the normal URL remains unchanged. This expanded study awaits physical Quest validation. No
constellation labels, all-88 catalog, lessons, eclipse work, or stable promotion is authorized.
Feature commit `349a3c7` was merged as `704d5e2`; development Actions/Pages run `30020584006`
completed successfully and its hosted bundle verified the exact merge SHA. Physical Quest
validation remains pending.

## Lunar Phase Transit Path and clean Moon billboards (development feature)

Physical Quest review accepted the compact `24 m` / `3.2 m` Moon phase dial, its procedural phase
faces, and continuous phase indicator, while reporting occasional image flattening/tilt and small,
compressed labels. The development feature keeps that accepted instrument and the separate Moon
Daily Path intact, and adds a third query-gated layer: an apparent topocentric EQJ lunation track
from previous New Moon through next New Moon.

Astronomy Engine `2.1.19` supplies arbitrary `SearchMoonPhase` events at all eight canonical
longitudes and apparent topocentric J2000 directions through `Equator(..., ofdate=false,
aberration=true)`. Sixty-minute provider samples plus exact events are minor-arc subdivided to at
most `1°`, retained below the current horizon, and transformed by one current real-sky orientation.
The current transit marker interpolates continuously along that path; no sample uses its own
historical/future horizontal frame. An expected inertial previous-New/next-New endpoint residual is
measured, not hidden with a false closing segment.

Compact-dial and transit Moon images now live under independent identity-scale billboard anchors,
separate from label anchors and rotated line geometry. Images remain square; label toggles cannot
change their matrices. Dynamic `256 px`-high label textures preserve measured text aspect ratios.
Dedicated Small/Medium/Large/XL phase-label heights are `0.45/0.90/1.80/3.60 m`, with Medium
default. Focused and complete automated validation passes `571/571` tests across `71` files,
type-check, and production build. Desktop fixed-lunation diagnostics confirm eight ordered events,
`712` provider/render vertices, `0.8124°` maximum spacing, equal above/hidden sample counts at the
fixed test time, exact event-path alignment, `0.0006°` current path error, clean square image
anchors, and dynamic label widths. Feature commit `6cca323` was normally merged as `77e99e9`;
development Actions/Pages run `30011414309` completed successfully. A follow-up isolation guard
narrows the previous/next diagnostic to the actual adjacent events. Physical Quest validation
remains pending.

## Safe Sun path and query-gated Moon presentation (development feature)

The seven first-set constellation figures have passed physical Quest review: all seven were
recognizable, smooth, world-locked, and stereo-stable. The one failed comparison URL exposed an
independent Sun-path defect: `apparent-sun-civil-day-projective-path` threw from `onBeforeRender`
while science was not ready, aborting the left-eye traversal before the right eye.

The current feature makes Sun-path readiness science/update-owned and locally suppressible. Its
ordered Astronomy Engine samples are unchanged, but rendering now uploads one immutable
application-direction buffer outside eye callbacks, subdivides spherical intervals to at most
`1 degree`, and lets native XR model-view/projection operate independently for each eye. No
ordinary not-ready state throws.

A query-gated Moon study uses the same central clock, observer, IANA civil day, calibrated
geographic parent, and Astronomy Engine `2.1.19`. The Moon path is apparent topocentric,
airless under the current correction profile, sampled every five civil minutes, and preserves
lunar parallax. The separate symbolic phase dial has eight conventional phases, immutable local
ring/notch geometry at a finite `24 m` presentation anchor, procedural cached Moon disks with a
visible framing border, optional native-Sprite labels, a continuous current-phase indicator, and
an optional current appearance. The dial is educational synodic-cycle presentation—not the
Moon's daily path or physical orbit. Current illuminated fraction is provider-owned; the first
release uses a documented standardized waxing-right/waning-left icon orientation while reporting
the calculated Sun tangent for a future exact-roll refinement. The normal URL remains unchanged.
Feature commit `09eb70d` was normally merged into development as `4fa087c`; clean merged
validation passed `564/564` tests across `67` files, type-check, production build, zero-vulnerability
audit, unchanged top-level dependency tree, diff checks, and desktop query/control diagnostics.
Actions/Pages run `30003777513` completed successfully and the hosted app reported the exact merge
SHA. Physical Quest acceptance of these new presentation layers remains pending.

## First constellation line layer (deployed development study)

`feature/first-constellation-lines` adds a query-gated first set of Orion, Ursa Major,
Cassiopeia, Cygnus, Taurus, Leo, and Scorpius. The 43-star J2000 coordinate subset comes from the
public-domain NASA HEASARC BSC5P catalog; the 40-segment conventional Western connectivity is a
small project-authored versioned selection, not an IAU boundary or standardized IAU figure.
Each open segment is one immutable sampled minor-great-circle arc with a maximum `1.5 degree`
interval and a 120-interval safety cap.

The layer consumes the physically accepted `EQJ -> HORIZONTAL_ENU` bridge and the existing
geographic calibration parent exactly once. Its shader follows the celestial-grid bounded
homogeneous contract: canonical unit buffers remain immutable, one shared orientation matrix is
updated outside eye callbacks, and native XR cameras project the same geometry independently.
The normal URL and controls remain unchanged unless `constellationStudy=first-set` is explicit;
the query-gated master defaults OFF and all seven individual selections default enabled. Automated
validation currently passes `552/552` tests across `61` files, type-check, and production build.
Feature `3d6af53` was normally merged into development as `92ccdb0`; clean merged validation
passed, and Actions/Pages run `29974413436` deployed the merge successfully. Physical Quest
validation of line recognizability, smoothness, world locking, and stereo stability remains
pending. Constellation labels and catalog expansion remain deferred.

The existing Sun path was reported visually wobbly during the real-sky Quest review. That issue is
known and non-blocking; this feature does not change the Sun path. A diagnostic comparison exists
only to detect whether constellation lines reproduce the observation.

## Real-sky equatorial orientation bridge (development foundation accepted on Quest)

`feature/real-sky-equatorial-orientation` adds a query-gated, provider-native bridge from catalog
J2000 RA/declination to geometric local `HORIZONTAL_ENU` at the central-clock UTC and validated
observer. Astronomy Engine `2.1.19` owns `EQJ -> EQD -> HOR`; the explicit HOR
`(north, west, up)` to application `(east, up, -north)` remap is right-handed with determinant
`+1`. The normal URL retains the validated canonical non-sidereal grid. `real-sky` mode reuses its
topology and bounded homogeneous buffers, applying one immutable shader rotation about the encoded
Earth core outside per-eye callbacks. `overlay` adds exactly one intentional warm comparison copy.

The catalog bridge uses EQJ J2000. The existing mean-date grid uses the provider's EQD longitude
phase so its NCP/SCP convergence remains exactly aligned with the validated pole markers; raw J2000
`+Z` and the current mean-date pole are not falsely conflated. The rigid grid is geometric and
non-refracted. Airless topocentric EQD cross-checks cover Sun, Moon, Mercury, Jupiter, and Uranus
without changing any body direction. Focused and complete validation passed `531/531`
tests across `56` files, type-check, production build, dependency audit/tree, and diff checks.
Desktop fixed-time verification confirms a stationary pole, sidereal RA rotation, the intentional
32-line canonical/real-sky overlay, zero grid/pole error, and no callback errors. Feature
`2e257db` was normally merged into development as `ccf37fd`; clean merged validation passed, and
Actions/Pages run `29969698393` deployed the merge successfully. Physical Quest review found the
grid complete, pole convergence credible, no obvious east/west mirror or north/south inversion,
natural planet placement, sound world locking/stereo behavior, and no blocking callback or
incomplete-frame error. The bridge is accepted as the constellation-coordinate foundation; the
canonical grid remains available and is still the ordinary default.

The latest user-reported Quest result accepts the native Sprite planet-label contract and Medium
as the preferred preset: `2.24 × 0.56 m` at the unchanged `24 m` presentation distance. Attachment,
world locking, stereo stability, and toggle behavior passed. Medium was already the default; this
does not establish a constellation-label scale or decluttering policy.

## Outer planets and independent Planet Labels (development deployed)

The local `feature/outer-planets-and-labels` extension expands the existing Astronomy Engine
apparent-topocentric body catalog from Sun/Moon plus Mercury through Saturn to Sun, Moon, Mercury,
Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto. Uranus and Neptune are major planets;
Pluto is explicitly a dwarf planet. Earth remains intentionally omitted from the observer sky.
All bodies use the same validated WGS84 observer, central simulation clock, `EQD_TRUE` to
`HORIZONTAL_ENU` provider path, application-basis mapping, calibrated geographic parent, and
projective XR presentation contract. The feature was normally merged as
`8a66c4b3cc448663ef31efe8a02be5343da115b2` and deployed to development Pages only through
successful Actions run `29951224433`; the hosted bundle exposes that exact build SHA, Uranus, and
Planet Labels. Physical Quest testing confirms Mercury-through-Pluto markers and the repaired
native Sprite labels render and remain associated with their markers. Planet Labels defaults OFF,
affects only enabled planet/Pluto labels, reuses each
marker direction with a bounded offset, and has no collision-layout claim. The core proxy, grid,
equator, poles, horizon, Sun path, body positions, Swartz Creek defaults, and parked spindle are
unchanged. No stable change is implied.

Physical Quest testing of build `51b6fff376bdddf8db59b8611914cd607bed0789` passed the
Mercury-through-Pluto markers but failed Planet Labels: the control was explicitly ON and no label
was visible. Audit classified this as a Class C rendering defect. The custom label shader ignored
the plane's vertex position, collapsing every textured quad to one clip-space point and zero
rasterized area. The local repair replaces only label presentation with reusable finite `24 m`,
tangent-offset, world-anchored Three.js sprites. Textures must contain visible alpha; normal and
forced Uranus-proof state are distinguished; invalid labels suppress locally. The repaired
contract has now passed physical Quest rendering, attachment, world-locking, stereo, and toggle
gates. Its original Small, Medium, and Large sizes were too small; the five-preset revision was
tested and Medium was selected. No constellation-label scale or overlap approval is implied.

Repair feature `3a31b92619ee4b0e61224173b4b67a48bcb4664d` was normally merged into
development as `c18e28a9536facb4ac39487fe6071646744ca860`. Clean merged validation passed
`508/508` tests across `54` files, type-check, build, dependency audit/tree, and diff checks.
Development Actions/Pages run `29960227474` completed successfully, and the hosted bundle reports
the merge SHA and includes the finite-label proof and diagnostics. This is deployment evidence only;
the later physical Quest result accepted the repaired labels; stable remains unchanged.

Scale revision `cd37479b65c4c9366fde914ec15b7be761383231` updates only the immutable Sprite
dimensions: old Large is new Small, with Medium/Large/XL/XXL at `2×/4×/8×/16×` that base and
Medium as default. All `511/511` tests across `54` files, type-check, build, audit, dependency
tree, diff checks, and desktop selector/query verification passed. Development Actions/Pages run
`29962714264` passed and the hosted bundle reports that exact SHA. The later physical Quest
comparison selected Medium; stable is unchanged.

## Integrated finite holographic Earth-core proxy (development only)

Feature `f61b6f1b22871915cc756f6f4f206051d74f3d1a`, normally merged into development as
`f496f78a11711acafcaee0e8dbe5ba9cb762ab16`, adds one near-field holographic
proxy at `1.5`, `2.5`, or `4.0 m`. Physical Quest testing selected the `4.0 m` far proxy as the
normal development Earth Core visual. Its direction is derived exclusively from the validated
scientific observer-to-core vector, while its local distance is explicitly presentation
compression rather than the literal WGS84 Earth-core distance. The proxy is a fixed `12 cm` 3D
mesh below the existing calibrated geographic parent; native left/right XR camera projection
creates parallax without camera parenting, screen-space animation, render callbacks, or per-eye
geometry mutation. The Earth Core toggle is authoritative: ON selects exactly one direct marker
(normally the finite proxy), while OFF submits no direct core marker. The scientific homogeneous
anchor remains available for diagnostics and explicit comparison only. Swartz Creek, Michigan
(`42.9572`, `-83.8308` east-positive degrees, `240 m` MSL) is the editable, non-persistent
development default. This presentation proxy is not the literal Earth-core distance. The protected
stable repository and parked spindle remain unchanged. Physical confirmation of the integrated
toggle/defaults remains pending. Development merge `1d7d5fbd4ec46d1466261a8421bdbe4d0ac2f0ce`
passed type-check, `494/494` tests across `52` files, build, audit, dependency tree, diff check,
and desktop input verification; Actions run `29943133628` completed successfully and deployed
development Pages only.

## Observer-offset geocentric presentation contract (local architecture)

The development study branch now contains a non-rendering, immutable
`ObserverOffsetGeocentricPresentation` contract. It preserves the existing shared WGS84 Earth
core, actual ellipsoidal observer origin, two-semi-major-radius celestial-grid scale, local ENU
tangent basis, geographic-parent-only yaw, and finite homogeneous `(P / R, 1 / R)` anchor
encoding. It records the slight WGS84 ellipsoid/reference-sphere difference rather than moving
either the observer or core. No study geometry, grid/equator change, deployment, stable change, or
physical acceptance is implied. The five query-gated explanatory variants were subsequently
implemented and deployed to development; no production variant has been selected.

## Observer-offset geocentric presentation study (development only)

The study branch now adds query-gated, default-off explanatory aids: baseline, observer-to-core
radius, reference-surface marker, sparse reference-Earth wireframe, local tangent patch, and a
combined comparison mode. They consume the immutable observer-offset contract and bounded finite
homogeneous anchors without changing the celestial grid, equator, poles, calibration, horizon,
solar layers, or parked spindle. Merge `a63a24a568fbe23271fbb17aa898eb71a94e5e97` was pushed
normally to development `master`; Actions run `29917770378` passed and development Pages serves
the study controls. Physical Quest comparison remains pending; no production design has been
selected.

## Development pole-marker/grid convergence repair (local)

The successful development celestial grid is authoritative. Audit found a finite-vs-infinite
presentation mismatch: meridian endpoints use the finite Earth-core-centered grid radius while
pole markers/labels previously used projective infinity. The local repair gives markers and labels
the exact canonical grid pole directions and the same finite homogeneous endpoint. The parked
spindle is unchanged. Feature `f9a74e4` was normally merged as `a74e2eb` and deployed only to
development through successful Actions run `29913823513`; physical confirmation remains pending.

## Development-only celestial coordinate grid

`feature/celestial-coordinate-grid` adds a default-hidden geocentric reference grid without
changing the protected stable repository. It reuses the published P03/WGS84 core, axis, and
equatorial-basis contract: closed declination circles at `+60`, `+30`, `-30`, and `-60` degrees,
plus twelve intentionally open pole-to-pole meridian semicircles every two hours. Its deterministic
0h reference is explicitly non-sidereal because no validated sidereal/vernal-equinox presentation
reference exists in the current model. The unresolved spindle issue is deliberately unchanged.
Feature commit `90251054ec2ad8c957054879496e72e864e4416a` was normally merged as
`d4cd9ce68376d321a711d3dfa4526c5c5e2ee0f7` into the development repository only and pushed to
`dev/master`. Clean merged validation passes `npm ci`, type-check, 468/468 tests across 46 files,
production build, audit, dependency tree, and diff check. Development Actions run `29910750550`
passed build and Pages deployment. The hosted development app loads repository-relative assets;
observer/calibration readiness and master/family grid controls pass with no blocking console error.
Physical Quest stereo acceptance remains NOT RUN.

**Last updated:** 2026-07-22 America/New_York

**Updated by:** Codex / project control

**Current phase:** The unified geocentric axis/core/equator correction is independently revalidated, integrated, pushed, and deployed; its canonical physical Quest acceptance remains pending.

**Overall status:** **The published feature merge on `master`/`origin/master` is `1acedcdac660214a7cbc9cf0ace469f1c2e3c20d`.** The published baseline includes the WGS84 Earth core, one rigid continuous spindle, one unified finite-core geocentric presentation contract, geocentric axis/poles, celestial equator, observer-centered local horizon, actual body markers, Sun path, civil-hour notches, and live celestial refresh. The technical review and final independent integration re-gate passed; feature and merged `master` each pass 438/438 tests across 40 files, type-check, build, diff, and dependency checks. The normal no-force merge retained `fix/earth-axis-spindle`; GitHub Actions run `29769161186` passed install, type-check, tests, build, artifact upload, and Pages deployment. Hosted desktop regression passed for the geocentric structure and existing celestial/temporal layers. Physical Quest acceptance of the corrected structure remains **NOT RUN**. Historic Milestone evidence below remains scoped to its recorded published commit and must not be read as evidence for the current correction. Milestone 1 is complete; Milestone 2A is published; hardened geocentric Milestone 2B was independently validated, integrated, and published. The independent renderer gate found no
blocking or material defect. It reproduced per-eye cache invalidation and eye-order behavior,
single-yaw calibration at `+/-90` and `180` degrees, projective antipodes, linear non-writing XR
depth, owned-resource disposal, and independent precision maxima. Feature and merged `master`
both pass clean install, type-check, 18 files / 291 tests, production build, diff/dependency
checks, development/preview readiness, controls, reset, relative assets, teardown, and clean
browser consoles. Normal merge commit `706baab` retains the feature branch and integrates the
WGS84 Earth core, homogeneous NCP/SCP directions, per-eye camera-relative core, linear XR depth,
and idempotent disposal without changing dependencies or workflows. Normal push of `cdb5f4c`
succeeded without force. GitHub Actions run #11 passed build and deploy in 39 seconds and published
the Pages artifact. Hosted observer/time/Earth-core/axis controls, readiness, visibility, reset,
repository-subpath assets, and clean browser console pass; the old `1.8 m` proxy is absent.
The user has now physically tested the published experience and reported that it is workable. This
is recorded as a **CONDITIONAL PASS**: no blocking physical issue was reported, but the detailed
A–K Quest observations were not individually captured and are not inferred here.
Milestone 2C consumes that same immutable P03 snapshot and geocentric baseline for a bounded
homogeneous projective mean-equator layer. Independent source/math/lifecycle review, temporary
latitude/longitude/elevation/seam/asymmetric-eye/recalibration probes, type-check, 21 files / 299
tests, production build, dependency/diff checks, and development/production-preview controls,
readiness, visibility, reset, recalibration, teardown, and clean-console checks pass. Normal merge
commit `0926cbf` retains the feature branch. Documentation commit `54d64d0` was pushed normally;
GitHub Actions run #14 passed 21 files / 299 tests, build, artifact upload, and Pages deployment.
Hosted observer/time/axis/equator controls, default-hidden visibility, readiness, reset clearing,
and repository-subpath assets pass. The user reports the equator good and workable; axis and
equator each form one clean line in either eye independently, while binocular viewing produces
doubled lines. This is a **CONDITIONAL PASS** classified as binocular fusion/stereo presentation,
with no conclusively proven cause and no unreported subtest results inferred.
The user's existing Milestone 2B physical concerns remain separate and unresolved: the pole-to-core
axis appeared curved, and the Earth-core distance did not feel perceptually obvious. Milestone 2C
does not claim to repair either observation.
Milestone 2D now adds presentation-only `both`/`left`/`right` modes independently to axis/poles,
equator, and local horizon. It also adds a default-hidden 96-sample, 24 m observer-origin local
tangent-plane horizon using canonical ENU and the existing calibrated parent. WGS84 geodetic up is
disclosed as the Tier 1 approximation to astronomical vertical. The scientific axis, Earth core,
P03 pole, celestial equator, camera-relative transforms, and linear depth contract are unchanged.
The independent gate found no blocking or material defect. Feature and merged `master` pass clean
install, type-check, 26 files / 340 tests, production build, dependency/workflow/diff checks,
temporary semantic-eye and horizon/yaw probes, and development/production-preview controls,
fallback, reset/reload, teardown, and clean-console checks. Normal merge `79705c9` retains the
feature branch. Normal push of documentation commit `46cf613` triggered GitHub Actions run #16, which
passed install, type-check, 340 tests, build, Pages artifact upload, and deployment. Hosted axis,
equator, local-horizon, and all three eye-mode controls, defaults, desktop fallback, readiness,
reset, repository-subpath assets, and clean console pass. The user has now physically tested the
deployed spatial-reference experience in a Meta Quest headset and described it as incredible and
really coming together nicely. This is a **PASS for bounded physical usability**: the experience
ran, the visible reference feature was present, and no blocking issue was reported. Individual eye
mode combinations, angular measurements, drift, lifecycle/recenter coverage, and long-duration
comfort were not reported and are not inferred. The accepted baseline remains a hybrid scientific
presentation: geocentric/projective Earth core, axis, and equator; observer-centered local horizon.
The user explicitly promoted bounded actual Sun, Moon, Mercury, Venus, Mars, Jupiter, and Saturn
placement ahead of the previously selected long-term precession prerequisite review. The local body
layer uses the existing Astronomy Engine adapter and central clock to create immutable airless
apparent-topocentric EQD_TRUE/HORIZONTAL_ENU values, retains below-horizon truth, and renders only
homogeneous projective marker directions below the calibrated geographic parent. It has no phase,
labels, pointing, projection, ecliptic, paths, stars, or new temporal controls. Precession review
remains planned. A local remediation now binds the active body registry and immutable snapshot to
one frozen provider descriptor, derives cache identity from that active descriptor, and rejects
malformed equatorial/horizontal provenance before a ready body state can exist. The follow-up
diagnostic remediation preserves complete immutable expected/actual provider capability snapshots
and deterministic mismatch fields, so frame/profile/body/capability-only failures remain visible.
Final independent revalidation found no blocking or material defect. Feature and merged `master`
pass clean install, type-check, 30 files / 383 tests, production build, dependency/diff checks,
adversarial identity/provenance/cache probes, development/preview lifecycle checks, and clean
browser consoles. Normal merge `b24b3e9` retains the feature branch. GitHub Actions run
`29703133387` passed install, type-check, tests, build, artifact upload, and Pages deployment.
Hosted horizon/axis/poles/equator controls remain available; the body layer starts hidden, toggles
to the seven validated directions without duplication, loads repository-subpath assets, and has no
blocking console errors. The user has since reported positive bounded Quest use of the body layer:
markers were visible and Sun, Mercury, and Venus were plausibly identifiable, while missing labels
limited identification of other bodies. The user also noticed that the celestial equator does not
match the Sun's path. This is historical feedback about the then-published seven-body layer, not a complete angular-accuracy, lifecycle,
or comfort acceptance record.

Milestone 2F adds an observer-relative apparent Sun trace over the explicit IANA
local civil day. The immutable science service samples the airless apparent-topocentric Sun every
ten minutes plus every valid civil-hour boundary; ordinary and DST 23/25-hour schedules retain
their actual UTC instants, skipped hours, and repeated-hour metadata. The established central
simulation clock advances visible body state through one bounded application scheduler at least
once per minute at normal real-time rate. The celestial equator remains a wholly separate P03
reference. The projective line/notches preserve below-horizon directions without celestial-scale
GPU coordinates; their visual style and the live Sun emphasis are presentation-only. The local
work now passes 416 deterministic tests, type-check, and build. The bounded remediation adds
complete immutable, explicitly schema-versioned WGS84 observer provenance on the returned path
and every sample/notch,
deterministic structured scientific warnings, `TEMPORAL_PATH_FAILURE` wrapping for generic
aggregation/provider failures, temporal error context, failed-path cache rejection, and a
sampling-policy cache-isolation regression, uniform early-failure enrichment, and a permanent
production-path regression proving one simulated hour changes all seven supported body
directions. Final independent review found no blocking or material defect. Feature and merged
`master` pass clean install, type-check, 36 files / 416 tests, production build,
dependency/diff checks, deterministic civil-time/provenance/failure/cache/motion probes, and
development/production-preview regression. Normal merge `31be4cc` retains the feature branch.
GitHub Actions run `29707073636` passed install, type-check, tests, build, artifact upload, and
Pages deployment. Hosted controls, path/notch visibility, repeated toggling, zone override,
repository-relative assets, clean console, and a 60.45-second live-clock advance pass. Physical
Quest acceptance remains pending and is not inferred from desktop evidence.

The user described the already deployed body and Sun-clock experience as beautiful and compelling.
That report concerns the historical published seven-body layer, observer-relative daily Sun path, civil-hour
notches, and live updates; it does not physically accept the now-published rigid spindle, unified
geocentric presentation, or renderer-boundary remediation. The reported plausible identification
of Sun, Mercury, and Venus, along with absent labels limiting other identification, remains
bounded feedback rather than all-seven, angular, stereo, lifecycle, or comfort acceptance.

The published Earth-axis correction reconciles the user's later physical observation that the
published axis looked bowed or hinged at the Earth core. Investigation confirmed that the
scientific core and P03 pole directions were already exactly collinear; the presentation split the
axis into independently colored and faded north/south line objects and then drew the core marker
over their joint. The integrated feature derives one exact-antipodal spindle descriptor and
renders one bounded projective screen-space strip through the core. Type-check, 36 files / 421
tests, production build, dependency/diff checks, and development/production-preview camera,
toggle, reset, recalibration, asset, and console regression pass. No astronomy, calibration,
observer, horizon, equator, Sun-path, notch, or body science changed. Integration and deployment
are complete; physical Quest acceptance is not performed or inferred.

The published correction also reconciles the celestial equator with the rigid spindle.
The prior equator science already had the correct P03 plane normal/basis and WGS84 core, but its
`w = 0` direction-only renderer discarded the finite center, making the visible ring
translation-invariant. One `GeocentricCelestialStructurePresentation` now supplies the identical
core/center, axis/plane normal, exact pole antipodes, orthonormal plane basis, revisions, and
provenance to both layers. A finite two-WGS84-radius reference ring is rendered as bounded
homogeneous points below one identity geocentric scene node; the local horizon remains an
observer-centered sibling. Integration and deployment passed; physical Quest acceptance remains
**NOT RUN**.

## One-paragraph state summary

Milestone 0 is complete and its deployed build remains at
https://thinksql1.github.io/cosmic-calibration-webxr/. The first Milestone 1 independent gate
failed because calibration depended on optional DOM overlay, capture could use a stale/default
controller transform when no current pose existed, and an overlay action could also produce XR
`select`. Commit `2275661` remediated those defects with a controller-only lifecycle, exact
event-frame target-ray pose validation, and `beforexrselect` isolation. The independent re-gate
found no blocking or material issue, and merge commit `8a20899` integrated the retained feature
branch normally into local `master`. Clean install, type-check, 66 deterministic tests, production
build, dependency/diff inspection, and development/production-preview desktop behavior pass on
merged `master`. Commit `ddcf676` was pushed normally and GitHub Pages run #5 deployed it
successfully. The hosted Milestone 1 controls, simulation, reset, repository-subpath assets, and
console health passed desktop inspection. The user then reported the deployed Quest 3 acceptance
flow passed: hosted controls, immersive AR/passthrough, controller start/capture separation,
controller-based north capture, coherent N/S/E/W geometry, world locking, floor alignment,
cancel/recalibrate/reset, and session lifecycle were usable with no blocking defect observed.
Milestone 1 is complete. This establishes physical usability for the tested flow, not
laboratory-grade angular accuracy, broad device coverage, or unreported edge-case outcomes.
Historical Milestone 2 planning defined explicit scientific frames, a single UTC simulation clock,
sampled rather than decorative precession paths, independently optional solar/lunar temporal
capabilities, precision tiers, error sources, validation gates, and a conservative delivery
sequence. Later milestones implemented the bounded body and Sun-clock subset. Milestone 2A0 now
pins `astronomy-engine@2.1.19` behind application-owned contracts, validates apparent
topocentric Sun/Moon and canonical ENU against three NASA/JPL Horizons DE441 fixtures, and
validates an application-owned IAU P03 precession-only mean-pole provider against the full IAU
SOFA `pmat06` matrix fixture plus J2000/present/future pole vectors. The provider uses explicit TT,
keeps mean and true frames distinct, derives south by exact negation, and exposes the same axis as
the future equator normal. The first independent Milestone 2A gate identified calibration-event
revision, nested immutability, restoration, provider-version, clock equality, cache-key, LRU, and
height-datum warning defects. The second re-gate then found seven remaining runtime-boundary
groups: caller-owned clock instants, incomplete direct clock validation, missing time/calibration
cache identity, unvalidated serialized configuration revisions, an aliased equator normal,
unconditional/incomplete height warnings, and missing regression/status evidence. The bounded
second remediation owns and validates those values, suppresses providers for invalid clocks,
keys provenance explicitly, and adds 49 deterministic regressions for a 239-test suite. The final
independent gate reproduced the failed probes and found no blocking or material issue. Merge
commits `1757781` and `6fcaa33` integrated the retained 2A0 and 2A branches normally into
`master`; clean install, type-check, 239 tests, production build, diff check, and dependency audit
pass on the merged result. Commit `ca0a9d7` was pushed normally, GitHub Pages run #7 passed, and
the unchanged hosted Milestone 1 application regressed cleanly. No visible celestial geometry was
introduced in that deployment. Milestone 2B extends the snapshot with an explicit
`GCRS -> P03 mean-date axis -> WGS84 Earth-fixed -> HORIZONTAL_ENU` contract and renders one
published observer-centered `1.8 m` symbolic axis under the existing geographic parent. The local
replacement adds snapshot-owned WGS84 Earth-core placement and a meter-scale geocentric line
with poles represented as directions at infinity. Manual in-memory
observer input and explicit central-clock UTC fixtures support desktop/Quest validation without
geolocation or persistence. Its independent gate, 270-test suite, merged-master validation, and
development/production-preview desktop checks pass. GitHub Pages run #9 passed on `5b657e4`;
hosted observer/time/axis controls, NCP/SCP rendering, equator/northern/southern cases,
visibility controls, reset, repository-subpath assets, and console health pass. Its independent
renderer gate, normal integration, and publication later passed; bounded physical feedback is
recorded below without inferring the unreported detailed checklist cases.

## Working and verified

- `npm ci`: passed from the committed lockfile.
- `npm run typecheck`: passed with TypeScript `7.0.2`.
- Final Milestone 2A gate and merged-master `npm run test`: 12 files and 239 tests passed with Vitest `4.1.10`.
- `npm run build`: passed with Vite `8.1.4`; `dist/` contains relative `./assets/...` references.
- Milestone 2B integrated scientific/presentation cases pass for equator, both mid/high hemispheres,
  exact antipodes, longitude cancellation, P03 frame coherence, ENU/application mapping,
  observer/time/calibration identity, below-horizon policies, optional markers/labels, and stale
  scene clearing. The 15-file / 270-test suite retains all 239 integrated tests and adds 31
  Milestone 2B regressions.
- Milestone 2B development and production preview pass for manual observer/current/frozen UTC
  controls, axis readiness, equator/northern/southern/high-northern visual cases,
  recalibration/reset, orbit, zoom, resize, relative assets, and clean application console output.
  Physical Quest validation is NOT RUN.
- GitHub Pages workflow run #9 passed on exact commit `5b657e4`: install, type-check, 15 test
  files / 270 tests, build, upload, and deployment succeeded. Hosted desktop verification passes
  for the observer/time/axis controls, ready NCP/SCP geometry, equator/mid-north/mid-south cases,
  display controls, reset/not-ready clearing, relative project-subpath assets, and console health.
- Current Milestone 2A0 `git diff --check` and `npm ls --depth=0`: passed; exact
  `astronomy-engine@2.1.19` is the only dependency delta and no workflow changed. Earlier
  Milestone 0/1 integration checks also passed on `master`.
- Independent Milestone 0 re-gate: no blocking or material findings; implementation/workflow gate passed, with overall result **CONDITIONAL PASS** solely because physical Quest validation is pending.
- Desktop development scene rendered with origin, X/Y/Z axes, floor ring, and zenith/nadir line.
- OrbitControls interaction changed the camera view; resize updated the canvas to the tested viewport; unsupported WebXR messaging remained readable with no console errors or warnings.
- Production preview loaded successfully on the feature branch and again from integrated `master`; relative production assets loaded with no console errors or warnings.
- GitHub Pages workflow run #2 passed on the published `b1bf282` commit: build completed with 15/15 tests and deploy completed successfully.
- The hosted site loads at `https://thinksql1.github.io/cosmic-calibration-webxr/`; its static assets resolve under the repository subpath, the desktop canvas renders, the compatibility fallback is readable, and the browser console has no warnings or errors.
- Initial physical Quest 3 evidence: immersive AR entry PASS, passthrough PASS, world locking/stability PASS, and session exit/re-entry/recenter PASS.
- Controlled standing-floor Quest 3 retest: immersive AR, passthrough, reference geometry, origin/floor alignment, horizon ring, zenith/nadir line, world locking, lifecycle/recenter, comfort, and usability PASS.
- Original Milestone 1 implementation validation: clean `npm ci`, TypeScript check, 3 test files /
  43 tests, production build, `git diff --check`, and dependency-tree inspection PASS before the
  independent gate exposed the three runtime-input defects.
- Milestone 1 remediation clean install, type-check, deterministic unit/integration suite (3 files /
  66 tests), production build, `git diff --check`, and dependency-tree inspection PASS. Coverage
  includes controller-only input, current-event pose validity, cross-controller release
  gating and stale-press invalidation, overlay isolation, and cleanup races.
- Desktop development and production-preview simulation: known bearings `0°`, `90°`, `180°`, and `270°` produced the expected signed yaw; recalibration replaced the prior result; reset restored uncalibrated state; geographic labels rendered; relative assets loaded; console remained clean.
- Independent Milestone 1 re-gate: PASS for controller-only lifecycle, current-event pose proof,
  DOM-overlay suppression, coordinates/frame separation, tests, documentation, dependencies, and
  deferred-scope review; physical Quest behavior remains NOT RUN.
- Local Milestone 1 integration: merge commit `8a20899` retained the feature branch and did not
  rewrite history. Merged `master` passed `npm ci`, type-check, 66/66 tests, production build,
  `git diff --check`, dependency inspection, and development/production-preview desktop checks.
- GitHub Pages workflow run #5 passed on pushed commit `ddcf676`: checkout, Node setup, clean
  install, type-check, 66/66 tests, production build, artifact upload, Pages configuration, and
  deployment completed successfully.
- Hosted Milestone 1 verification passed at
  `https://thinksql1.github.io/cosmic-calibration-webxr/`: Physical North controls and desktop
  simulation are visible, `90°` produces `-90.0°`, reset restores uncalibrated state, relative
  assets resolve under the project subpath, and the browser console has no warnings or errors.
- Physical Quest 3 Milestone 1 acceptance: PASS, based on the user's reported completed deployed
  test. Immersive AR, passthrough, controller-only calibration start and later capture, coherent
  N/S/E/W alignment, world locking, floor alignment, cancel, recalibration, reset, and usable
  session lifecycle passed with no blocking physical defect reported.
- Milestone 1 physical evidence establishes usability of the tested north-marker flow. It does not
  include a reported angular-error measurement, Quest OS/browser versions, controller-by-controller
  coverage, DOM-overlay availability, or a separately observed tracking-loss/pose-rejection result.
- Milestone 2 focused research is recorded against official Astronomy Engine, IAU/SOFA, IERS,
  USNO/NOVAS, JPL, NGA, IANA, W3C, and primary long-term-precession sources, with capabilities,
  limits, versions/dates where available, evidence class, and license implications.
- Documentation defines explicit tracking, room, calibrated geographic, Earth-fixed, mean-axis,
  celestial-source, horizontal, and presentation boundaries. Canonical ENU maps to Three.js as
  `(east, up, -north)` before the existing geographic parent applies its calibrated room yaw.
- Architecture validation confirms scope is documentation-only: no runtime/source/test/package,
  lockfile, workflow, Vite, or deployment configuration was changed, and no dependency was
  installed.
- Milestone 2A0 package verification: official `astronomy-engine@2.1.19`, MIT, ESM/CommonJS/browser
  exports, bundled TypeScript declarations, no declared package dependencies, and one exact pinned
  runtime dependency change. The tarball declares MIT but has no standalone license file, so a
  future distributing bundle must preserve the upstream repository notice.
- Milestone 2A0 adapter validation: three NASA/JPL Horizons DE441 airless apparent topocentric
  Sun/Moon fixtures pass the predeclared `0.02 degrees` threshold; maximum measured coordinate
  difference is `0.008280 degrees` and maximum directional separation is `0.001276 degrees`.
  Each fixture discloses the Horizons ellipsoid-height versus Astronomy Engine mean-sea-level
  height mismatch. Northern, southern, equatorial, solstice/equinox-date, ordinary, and
  below-horizon evidence is represented.
- Milestone 2A0 mean-axis validation: all nine IAU SOFA `pmat06` matrix components and four frozen
  P03 pole vectors pass `1e-12` component thresholds; north/south exact antipodes,
  mean-equator-axis perpendicularity, continuity, determinism, mean/true tags, and domain rejection
  pass.
- At the final integrated Milestone 2A checkpoint, `npm run typecheck`, 12 files / 239 tests, and
  `npm run build` passed while the entry point intentionally did not import science. Milestone 2B
  now consumes the snapshot visibly; its clean build emits a 662.83 kB minified / 178.12 kB gzip
  application chunk and retains Vite's size advisory.

## Implemented but not fully verified

- Secure-context, WebXR API, immersive-AR support, and owned-session lifecycle handling are implemented and unit-tested without an XR runtime.
- An explicit user action requests `immersive-ar` with `requiredFeatures: ['local-floor']`. Internally, the controller distinguishes idle, requesting, acquired/render-binding, binding-after-end, active, and ending/cleanup phases.
- An acquired session is owned and given an `end` listener before renderer binding. Binding failure requests `session.end()` and blocks retry until cleanup settles; cleanup failure is surfaced while stale ownership is cleared.
- The renderer is alpha-enabled, clears its opaque background in XR, and uses the Three.js XR animation loop.
- Floor-relative reference geometry is authored around `Y = 0` and the XR reference-space type is `local-floor`.
- The GitHub Pages workflow is configured to use GitHub Actions with Pages/OIDC permissions limited to its deploy job. Successful deployment runs have completed; its first push-triggered run failed before Pages was enabled and does not represent an application failure.
- Physical north-marker calibration supports either tracked controller, target-ray visualization during calibration only, horizontal projection with a `0.25` magnitude threshold, explicit signed yaw, cancel/recalibrate/reset, and simulated/physical result provenance.
- Geographic N/S/E/W labels and cardinal axes live in a dedicated group. Calibration never rotates the camera, renderer, room/floor frame, room axes, controllers, or future scientific source coordinates.
- Optional DOM overlay is requested for immersive calibration controls; `local-floor` remains the only required XR feature.
- Controller-only calibration no longer depends on DOM overlay. Native select/squeeze transitions
  separate begin from capture, and spatial feedback remains available without overlay.
- Capture requires the exact native input event frame pose for the connected target-ray space and
  active reference space. Missing, stale/default-only, invisible, disconnected, and non-finite
  poses are rejected without replacing a previous accepted calibration.
- Interactive DOM-overlay controls cancel `beforexrselect`; native input and overlay listeners are
  removed on session cleanup, and late renderer-binding continuation cannot bind an inactive manager.

## In progress

- Milestone 2B is complete as the current workable geocentric axis baseline: its scientific,
  rendering, stereo-math, depth, lifecycle, deployment, and practical Quest-use gates are complete.
  Physical acceptance is **CONDITIONAL PASS** because the user tested the hosted build and reported
  it workable without supplying individual A–K observations. The next bounded milestone is the
  now-published celestial equator; later precession and other deferred layers remain excluded.
- Milestone 2C adds only the P03 mean celestial equator: a validated snapshot-owned,
  Earth-core-centred projective great circle with one visibility control. Independent validation,
  integration and publication pass; physical acceptance is conditional on the supplied clean-
  monocular/binocular-doubling evidence.
- Milestone 2D reconciles that evidence and adds independent eye presentation plus a bounded
  calibrated local horizon. Independent review, normal integration, publication, and hosted
  desktop regression pass. The user now reports a successful, compelling headset experience;
  bounded physical usability is accepted without inferring checklist-level eye-mode or numerical
   outcomes.
- Milestone 2E actual solar-system placement is intentionally promoted before the long-term
  precession prerequisite review. Its seven-body actual-direction layer passed independent review,
  normal integration, automation, deployment, and hosted regression; physical Quest acceptance
  remains pending and is not the current active task.
- Milestone 2F 24-hour Sun path and bounded live updates passed final independent review, normal
  integration, automation, Pages deployment, and hosted desktop regression. Physical Quest
  acceptance remains pending but is not the active task; the unified geocentric correction's
  canonical physical Quest test is current.
- The published rigid spindle and finite Earth-centred equator share one authoritative direction,
  exact antipode, WGS84 core, calibrated parent, and projective image-line/ring representation.
  Renderer-gate remediation preserves that structure while addressing continuity, production
  upload evidence, public-handle lifecycle contracts, and record consistency. Independent
  revalidation, integration, deployment, and hosted desktop regression passed; physical Quest
  acceptance is the only active task and remains explicitly unperformed.

## Blocked

- None. Published body/solar-temporal physical evidence and corrected-spindle Quest evidence remain
  pending, but the current bounded work is not blocked on them.

## Known defects or limitations

- Milestone 0 Quest 3 coverage is limited to the tested physical environment; it does not establish behavior for all rooms, boundaries, browsers, or device configurations.
- Milestone 1 Quest 3 acceptance passed for the reported controller-based calibration flow,
  geographic alignment, world locking/floor alignment, lifecycle, and cancel/recalibrate/reset.
  Exact angular error, controller-by-controller coverage, DOM-overlay availability, and targeted
  tracking-loss/pose-rejection behavior were not reported separately.
- Calibration is in memory only and is deliberately invalidated across session exit. Reload, recenter, boundary reset, tracking-origin change, or room change requires deliberate recalibration.
- The physical marker remains the trusted true-north reference for Milestone 1. No automatic
  heading, compass, geolocation, magnetic declination, or true-versus-magnetic-north correction
  exists.
- Desktop Chromium reports immersive AR as unsupported; desktop validation cannot exercise a browser XR session.
- The Milestone 2B production bundle contains a 662.83 kB minified application/Three.js/astronomy
  chunk and triggers
  Vite's 500 kB advisory; no runtime defect was observed.
- GitHub Pages run #9 deployed integrated Milestone 2B commit `5b657e4`; hosted desktop checks pass
  and no custom domain is configured.
- Calibration remains session-scoped and in memory. Session exit, reload, recenter, boundary reset,
  tracking-origin change, or room change requires deliberate recalibration as documented.
- Astronomy Engine validation is bounded to `2.1.19`, the named Sun/Moon operations, and Tier 1
  fixture semantics. It is not a general provider-accuracy or complete XR pointing claim.
- JPL Horizons fixture heights are reference-ellipsoid values while Astronomy Engine accepts
  mean-sea-level height. The same numeric values were compared without geoid conversion, tagged
  explicitly, and accepted only within the bounded direction tolerance; this is not vertical-datum
  validation or an exact same-observer Tier 2 comparison.
- The P03 provider is validated only for J2000.0 plus or minus one Julian century. It is not a
  full-cycle precession-path model and excludes nutation, CIP, polar motion, Chandler wobble, and
  observed offsets.
- UTC-to-TT uses Astronomy Engine's Espenak-Meeus delta-T implementation and its documented UT1
  approximately equal to UTC policy. No live EOP or leap-second service exists.
- The earlier observer-centered `1.8 m` symbolic axis is a superseded historical implementation,
  not the current published baseline. Published Milestone 2B now uses the world-scale WGS84 Earth
  core, keeps the observer on the surface, and represents NCP/SCP as projective directions at
  infinity. Its finite diagnostic points lie `10^13 m` from the core on the exact centerline with
  a documented sub-`0.14 arcsecond` convergence bound. The current published correction changes
  only the spindle/core/equator presentation contract; its physical Quest
  depth/visibility/comfort acceptance remains pending.
- Detailed physical Quest observations for axis/pole placement, world locking, below-horizon
  comprehension, readability, stereo, and comfort were not captured individually. The user did
  report the published experience workable and no blocking physical defect; this is a conditional
  acceptance baseline, not exhaustive physical verification.
- At a phone-sized `360 x 640` desktop viewport, the celestial controls can overlap the north-
  simulation panel. The supported desktop validation widths (`1024` through `1440` pixels) pass;
  physical Quest panel readability remains part of the required acceptance test.
- Published Quest evidence reports binocular doubling for the axis and equator even though each
  eye independently receives one clean line. This is not classified as duplicate geometry. The
  new eye modes are experimental and may create binocular rivalry; their comfort/effectiveness and
  the local horizon's perceptual value remain physically unverified.
- The corrected one-strip spindle is validated in desktop development and production-preview
  cameras, but its spinning-top appearance, through-Earth readability, stereo fusion, and comfort
  remain unmeasured on physical Quest hardware.

## Important unknowns

- Exact Quest OS and Quest Browser versions, numerical north-alignment error, controller-specific
  coverage, DOM-overlay availability, and targeted pose-loss behavior for the accepted Milestone 1
  test were not reported.
- Automatic observer/location acquisition and rendered civil-hour text labels remain unimplemented.
  The published baseline has manual in-memory observer entry, explicit UTC/current-time injection,
  IANA time-zone resolution with DST-aware civil-hour metadata, central-clock live updates, and
  axis diagnostics; it has no map, geolocation, persisted time zone, or broad user-programmable
  time-control system.
- Astronomy Engine does not expose the selected mean-only P03 quantity; the validated
  application-owned provider must remain separate from true `EQD` and be independently rechecked
  if its model/version/domain changes.
- Tier 2/Tier 3 quantitative tolerances, the adopted long-term precession model/date domain, and
  production observer/location provenance remain deliberately unresolved until bounded reference
  fixtures and implementation evidence exist.

## Active artifacts

| Artifact | Purpose | Status |
|---|---|---|
| `src/calibration/` | Pure north projection/yaw math and calibration state | Implemented; automated PASS |
| `src/scene/` | Room/floor frame, geographic-reference group, geocentric axis/poles, equator, and local-horizon groups | Milestone 2D independent/desktop PASS and bounded physical-usability PASS; detailed eye-mode/lifecycle measurements remain unreported |
| `src/xr/` | Owned session lifecycle and tracked-controller calibration adapter | Implemented; automated PASS; Quest controller-calibration flow accepted |
| `src/science/astronomy/` | Typed observer/time/frame/correction contracts, Astronomy Engine adapter, ENU math, and P03 mean-pole provider | Milestone 2A0 bounded validation PASS; consumed only through the scientific snapshot |
| `src/science/state/`, `src/science/snapshot/`, `src/science/frames/`, `src/science/providers/` | Revisioned scientific state, immutable P03 snapshot/equator basis, axis-specific WGS84 observer-horizontal transform, and exact-key cache | 2A integrated/published; 2B transform independent/automated PASS and integrated; no Three.js import |
| `src/presentation/earthAxisPresentationModel.ts`, `src/presentation/mapEnuToApplicationBasis.ts` | Pure snapshot-to-geocentric-axis model and ENU metric/direction mapping to application `(east, up, -north)` | Unified geocentric replacement independently validated, integrated, and published; yaw excluded by API |
| `tests/` | Capability, session, calibration, controller, adapter, fixtures, scientific state, temporal/civil-time, geocentric placement, projective precision, depth, presentation, scene, and lifecycle tests | 438/438 tests across 40 files passing on integrated `master` |
| `README.md` | Commands, workflow, conventions, deployment, and limits | Current |
| `docs/ARCHITECTURE.md` | Frame separation, yaw convention, lifecycle, and module boundaries | Current |
| `docs/CALIBRATION.md` | Physical setup, calibration procedure, limits, and troubleshooting | Current |
| `docs/QUEST_TESTING.md` | Milestone 0/1 evidence and later-layer physical regression checklists | Milestone 1 Quest 3 PASS; 2B/2C conditional evidence retained; 2D bounded physical-usability PASS with unreported checklist cases preserved |
| `docs/EARTH_AXIS_AND_CELESTIAL_POLES.md` | Geocentric core, projective pole, world-scale render, controls, limits, and validation evidence | Integrated/published baseline; conditional physical Quest acceptance |
| `docs/EARTH_AXIS_SPINDLE.md` | Rigid one-line descriptor, projective renderer, root cause, guarantees, desktop evidence, and Quest checklist | Correction independently validated, integrated, and published; physical Quest evidence pending |
| `docs/CELESTIAL_REFERENCE_ARCHITECTURE.md` | Explicit frame hierarchy, transforms, axis/poles/equator, horizon, precision tiers, and layer contracts | Architecture/2A integrated; first 2B visual consumer integrated |
| `docs/ASTRONOMY_ENGINE_EVALUATION.md` | Runtime-library capability, limits, responsibility split, alternatives, and adoption gates | `2.1.19` bounded Tier 1 adapter validated |
| `docs/ASTRONOMY_ADAPTER_CONTRACT.md` | Implemented observer, time, frame, correction, ENU, provenance, error, and provider contract | Milestone 2A0 current evidence |
| `docs/SCIENTIFIC_STATE_FOUNDATION.md`, `docs/SCIENTIFIC_SNAPSHOT_CONTRACT.md`, `docs/SCIENTIFIC_CACHE_POLICY.md` | Milestone 2A state, snapshot, readiness, cache, and presentation-boundary contracts | Final independent gate PASS; integrated and published |
| `docs/MEAN_POLE_MODEL_VALIDATION.md` | P03 model, TT, matrix direction, fixtures, tolerances, corrections, and domain | Direct bounded provider validated |
| `docs/CELESTIAL_VALIDATION_STRATEGY.md` | Pure, golden, cross-reference, visual/Quest, and error-budget validation plan | First JPL/SOFA fixtures captured; later layers pending |
| `docs/TEMPORAL_LAYER_ARCHITECTURE.md` | Central simulation clock, bounded live refresh, solar daily-path sampling, civil-time, and label policies | Milestone 2F implemented, independently validated, and published |
| `docs/CELESTIAL_REFERENCE_ARCHITECTURE.md` | Original Milestone 2 frame, precision, and layer-design rationale | Historical design record; current implementation authority is `PROJECT_STATE.md`, `docs/ARCHITECTURE.md`, and focused feature documents |
| `docs/MILESTONE_2_SEQUENCE.md` | 2A0–2F milestones plus later dependency-planning material | Published milestone status is current; overlapping later planning is explicitly historical or deferred |
| `docs/MILESTONE_2D_PHYSICAL_ACCEPTANCE.md` | Positive Milestone 2D Quest evidence and unmeasured cases | Archived milestone-scoped evidence; not acceptance of the current unified correction |
| `docs/OFFICIAL_ASTRONOMY_SOURCES.md` | Official/primary source, capability, limitation, version, and license register | Research evidence current as of 2026-07-16 |
| `.github/workflows/deploy-pages.yml` | Pages validation/build/deploy configuration | Run `29707073636` passed for integrated Milestone 2F at `31be4cc`; hosted desktop PASS |
| `COSMIC_CALIBRATION_WEBXR_PROJECT_BRIEF.md` | Product concept and long-term context | Active reference |
| `PROJECT_CHARTER.md` | Project definition and boundaries | Active |
| `DECISIONS.md` | Accepted foundation, geographic-frame, astronomy, time, and precession decisions | Current |
| `NEXT_TASK.md` | Run the physical Quest acceptance test for the unified geocentric celestial structure | One canonical 23-step checklist remains pending |

## Environment

| Item | Current value | Verified? |
|---|---|---|
| Operating system | Windows | Yes |
| Runtime/toolchain | Node.js `v24.18.0`; npm `11.16.0` | Yes |
| Runtime dependencies | Three.js `0.185.1`; Astronomy Engine `2.1.19` | Yes; exact versions pinned |
| Development dependencies | Vite `8.1.4`; TypeScript `7.0.2`; Vitest `4.1.10`; Three/WebXR types | Yes |
| Build command | `npm run build` | Passed |
| Test command | `npm run test` | 438/438 tests across 40 files passed on feature and merged `master`; prior unified branch baseline was 432/432, spindle baseline was 421/421, and pre-feature integrated `master` baseline was 416/416 |
| Deployment target | GitHub Pages at `https://thinksql1.github.io/cosmic-calibration-webxr/` | Run `29769161186` deployed merge `1acedcdac660214a7cbc9cf0ace469f1c2e3c20d`; hosted unified-geocentric desktop regression PASS |

## Risks

| Risk | Likelihood | Impact | Mitigation or next evidence |
|---|---|---|---|
| Session lifecycle regresses after future changes | Low/unknown | High | Preserve current automated and physical evidence; revalidate on Quest after XR lifecycle changes |
| North marker is captured with an invalid or nearly vertical controller direction | Low/unknown | Medium | `0.25` horizontal threshold and readable rejection are tested; accepted flow passed, but targeted pose-loss evidence was not separately recorded |
| Reused yaw is invalid after a room, boundary, or tracking-origin change | Medium | High | Keep recalibration/reset visible; do not treat in-memory state as universally valid |
| Passthrough behavior differs outside the tested Quest 3 environment | Low/unknown | Medium | Revalidate on device after future rendering changes; do not generalize the tested Quest 3 result |
| Bundle size affects Quest startup/performance | Low/unknown | Medium | Measure on device before adding optimization complexity |
| Scientific and contemplative layers become conflated later | Medium | High | Preserve traceable scientific modules and explicit framing |
| A true-of-date or body-axis helper is mistaken for a precession-only mean pole | Low/medium | High | Preserve distinct `EQD_TRUE` and `IAU_P03_PRECESSION_ONLY` types plus the passing SOFA/P03 corpus |
| Frame, handedness, or correction metadata are lost at a library/display boundary | Medium | High | Use tagged adapters, canonical ENU, exact basis/round-trip tests, and immutable snapshots |
| A visually perfect precession circle overrides the scientific trajectory | Medium | High | Sample the adopted long-term model, derive south as the exact antipode, and disclose its date domain |
| Civil-time labels drift from astronomical instants across DST/rule changes | Medium | Medium | Store UTC instants, explicit IANA zone IDs, disambiguation metadata, and versioned fixtures separately |
| A library accuracy claim is misreported as complete XR accuracy | Medium | High | Keep ephemeris, observer, calibration, tracking, floor/up, time-label, and display errors separate |
| Tier 1 UTC/UT1/delta-T policy is reused as a Tier 2/3 claim | Medium | High | Keep time-scale provenance attached; require a separate EOP/leap-second precision decision before promotion |
| Earth-scale WebGL depth or marker sizing behaves differently on Quest | Medium/unknown | High | Independent desktop/preview gate first, then publish and physically test Quest depth, visibility, precision, comfort, and world locking before acceptance |

## Parking Lot

- The durable [long-term product roadmap](docs/LONG_TERM_PRODUCT_ROADMAP.md) preserves future
  celestial, geographic, interpretive, media, and performance directions. It is not a schedule or
  authorization: physical Quest validation of the query-gated real-sky orientation bridge is the
  only next task.
- After that physical acceptance, later work still requires a bounded selection from the established
  sequence: physical acceptance, validated long-term precession, ecliptic, accelerated or reverse
  simulation-time controls, arbitrary historical/future date selection, annual or multi-day
  path visualization, time-lapse trails, event-jump controls, richer lunar-cycle visualization,
  local-first observer persistence, or geographic knowledge. The published central clock,
  live refresh, civil-day Sun path, and civil-hour notches are not future work.
- Automatic geolocation, persistent room calibration, automatic heading, magnetic declination,
  star catalogs, audio, hand tracking, persistent anchors, multi-user use, and native
  applications remain deferred.

## Recent evidence

| Date | Evidence | Result | Location |
|---|---|---|---|
| 2026-07-15 | Baseline checkpoint | Local Git baseline established | Commit `96aea97` |
| 2026-07-15 | Initial Milestone 0 implementation | Independent integration gate failed; remediation required | Commit `420b7f9` |
| 2026-07-15 | Session lifecycle remediation | PASS; acquired-session ownership, cleanup, retry, and end-race tests added | `tests/xr-state.test.ts` |
| 2026-07-15 | Dependency installation | PASS; allowed set installed from lockfile | `npm ci` |
| 2026-07-15 | Type-check and unit tests | PASS; 15/15 tests | `npm run typecheck`; `npm run test` |
| 2026-07-15 | Production build and path inspection | PASS; relative asset paths | `npm run build`; `dist/index.html` |
| 2026-07-15 | Desktop development and production-preview inspection | PASS; scene, controls, status UI, and console checks | Local Vite dev and preview |
| 2026-07-15 | Independent Milestone 0 re-gate | PASS for implementation, workflow, automated, desktop, documentation, and scope checks; overall CONDITIONAL PASS pending Quest | Feature commit `eccc78b` |
| 2026-07-15 | Local Milestone 0 integration and revalidation | PASS; merged without rewriting history and reran the full local suite | Merge commit `df8b26a` on `master` |
| 2026-07-15 | GitHub Pages publication | PASS; public `thinksql1/cosmic-calibration-webxr` created, `master` pushed normally, Pages configured for GitHub Actions, workflow run #2 built and deployed | `https://github.com/thinksql1/cosmic-calibration-webxr/actions/runs/29457929634` |
| 2026-07-15 | Hosted desktop verification | PASS; production page, subpath assets, reference canvas, fallback status, and browser console inspected | `https://thinksql1.github.io/cosmic-calibration-webxr/` |
| 2026-07-15 | Initial physical Quest 3 acceptance evidence | PASS for immersive AR entry, passthrough, spatial stability, and exit/re-entry/recenter; floor alignment conditional because geometry appeared at chair/seated height | User-observed evidence at `https://thinksql1.github.io/cosmic-calibration-webxr/` |
| 2026-07-15 | Controlled standing-floor Quest 3 retest | PASS; origin and horizon ring aligned with the physical floor, ring was horizontal, zenith/nadir was vertical, world locking and lifecycle/recenter remained stable, and comfort/usability passed | User-observed evidence at `https://thinksql1.github.io/cosmic-calibration-webxr/` |
| 2026-07-15 | Milestone 1 local implementation validation | PASS; clean install, type-check, 43/43 tests, production build, desktop known bearings/reset/recalibration, relative preview assets, and clean console | `feature/milestone-1-north-calibration` |
| 2026-07-15 | Initial Milestone 1 independent integration gate | FAIL; optional-overlay dependency, stale/default pose capture risk, and overlay/XR select collision required remediation | Feature commit `8b3dbe2` |
| 2026-07-15 | Milestone 1 input remediation | Clean install, type-check, 66/66 tests, build, dependency/diff checks, and desktop development/preview PASS; independent re-gate pending | `feature/milestone-1-north-calibration` |
| 2026-07-16 | Independent Milestone 1 remediation re-gate | PASS; the three original input defects are resolved, automated/desktop checks pass, and physical Quest behavior remains NOT RUN | Commit `2275661` |
| 2026-07-16 | Local Milestone 1 integration and revalidation | PASS; normal no-fast-forward merge, retained feature branch, 66/66 merged-master tests, build, dependency/diff, and desktop development/preview checks | Merge commit `8a20899` on `master` |
| 2026-07-16 | Milestone 1 publication | PASS; normal push of `ddcf676`, workflow run #5 build/deploy success, hosted Physical North UI, simulation/reset, subpath assets, and console verified | `https://github.com/thinksql1/cosmic-calibration-webxr/actions/runs/29494408661` |
| 2026-07-16 | Milestone 1 physical Quest 3 acceptance | PASS; user reported the deployed hosted flow passed for AR/passthrough, controller start/capture separation, north capture, coherent cardinal geometry, world/floor stability, cancel/recalibrate/reset, and lifecycle; no blocking defect observed | User-reported Quest 3 evidence; no angular measurement or version details supplied |
| 2026-07-16 | Milestone 2 celestial architecture research | PASS for documentation scope; official/primary sources define the library boundary, frames, mean-axis target, time/observer contracts, precession semantics, temporal schedules, validation/error budget, and bounded sequence; no source or dependency change | `docs/CELESTIAL_REFERENCE_ARCHITECTURE.md` and five companion documents |
| 2026-07-16 | Milestone 2A0 astronomy adapter and mean-pole spike | PASS locally; exact `astronomy-engine@2.1.19`, three JPL Horizons DE441 fixtures, full SOFA `pmat06` matrix, J2000/present/future P03 poles, 135/135 tests, type-check, and unchanged production build. No visible geometry, merge, push, deployment, or Quest celestial test | `feature/milestone-2a0-astronomy-validation`; `docs/ASTRONOMY_ADAPTER_CONTRACT.md`; `docs/MEAN_POLE_MODEL_VALIDATION.md` |
| 2026-07-16 | Milestone 2A final independent gate and local integration | PASS; all runtime-boundary, immutability, restoration, provenance, calibration-identity, cache, vector, warning, P03, and fixture probes passed. Normal merge commits `1757781` and `6fcaa33` integrated retained 2A0/2A branches; merged `master` passes clean install, type-check, 239 tests, build, diff, and dependency checks. No visible celestial geometry or Quest celestial test | `master`; `docs/SCIENTIFIC_STATE_FOUNDATION.md`; `docs/SCIENTIFIC_SNAPSHOT_CONTRACT.md`; `docs/SCIENTIFIC_CACHE_POLICY.md` |
| 2026-07-16 | Milestone 2A publication regression | PASS; normal push of `ca0a9d7`, workflow run #7 install/type-check/239-test/build/upload/deploy success, hosted Milestone 1 UI, 90-degree simulation/reset, repository-subpath assets, and clean browser diagnostics verified. No visible celestial geometry was deployed | `https://github.com/thinksql1/cosmic-calibration-webxr/actions/runs/29529809825`; `https://thinksql1.github.io/cosmic-calibration-webxr/` |
| 2026-07-16 | Milestone 2B local Earth-axis/NCP/SCP implementation | PASS for local builder gate: validated snapshot consumption, P03 mean-date axis proof, WGS84 observer-horizontal transform, exact antipodes, symbolic axis/controls, development and production-preview golden cases, orbit/zoom/resize, relative assets, and console health. Independent integration/publication and physical Quest acceptance NOT RUN | `feature/milestone-2b-earth-axis-poles`; `docs/EARTH_AXIS_AND_CELESTIAL_POLES.md` |
| 2026-07-16 | Milestone 2B independent gate and local integration | PASS; independent probes confirmed snapshot-only consumption, P03-to-horizontal frame coherence, longitude cancellation, exact antipodes, single geographic yaw, readiness/reset behavior, 270 tests, desktop golden cases, production assets, and clean console. Normal merge commit `09a6e67` integrated the retained feature branch; merged `master` revalidation passed. Publication and Quest acceptance NOT RUN | `master`; `docs/EARTH_AXIS_AND_CELESTIAL_POLES.md` |
| 2026-07-16 | Milestone 2B publication and hosted desktop verification | PASS; normal push of `5b657e4`, workflow run #9 install/type-check/270-test/build/upload/deploy success, hosted observer/time/axis controls, NCP/SCP rendering, equator/mid-north/mid-south diagnostics, display controls, reset, repository-subpath assets, and clean console verified. Physical Quest acceptance NOT RUN | `https://github.com/thinksql1/cosmic-calibration-webxr/actions/runs/29540115500`; `https://thinksql1.github.io/cosmic-calibration-webxr/` |
| 2026-07-18 | Local geocentric Earth-core/axis replacement | PASS locally for clean install, type-check, 16 files / 276 tests, build, diff/dependency checks, development and production-preview readiness/status/reset/relative-assets/console checks. WGS84 core placement, projective antipodes, one centerline, and sub-0.14 arcsecond render convergence are tested. Independent gate, merge, push, deployment, and Quest validation NOT RUN | `feature/milestone-2b-geocentric-world-axis`; `docs/EARTH_AXIS_AND_CELESTIAL_POLES.md` |
| 2026-07-18 | Geocentric renderer hardening | PASS locally for type-check and 18 files / 291 tests. Raw large GPU positions and global logarithmic depth are removed; per-eye camera-relative core values, homogeneous pole directions, linear non-writing celestial depth, deterministic Float32/stereo/extreme-rotation budgets, runtime input rejection, reusable resources, and idempotent disposal are verified. Development and production-preview smoke checks pass with clean consoles. Independent re-gate, integration, publication, and physical Quest validation remain NOT RUN | `feature/milestone-2b-geocentric-world-axis`; `docs/GEOCENTRIC_RENDERING_PRECISION.md`; `docs/WEBXR_DEPTH_CONTRACT.md` |
| 2026-07-18 | Hardened geocentric renderer independent gate and integration | PASS; temporary independent probes verified eye-order/cache identity, changed-view invalidation, `+/-90` and `180` degree yaw, exact antipodes, and independently reproduced maxima of `6,478,139 m`, `0.249655 m`, `0.007780 arcseconds`, and `0.133622 arcseconds` for component magnitude, core Float32 error, pole Float32 error, and finite-proxy convergence. Feature and merged `master` pass clean install, type-check, 291 tests, build, dependency/diff, development/preview, teardown, and clean-console checks. Normal merge commit `706baab` retained the feature branch. Publication and physical Quest validation remain NOT RUN | `master`; `docs/GEOCENTRIC_RENDERING_PRECISION.md`; `docs/WEBXR_DEPTH_CONTRACT.md` |
| 2026-07-18 | Hardened geocentric renderer publication and hosted regression | PASS; normal non-force push of `cdb5f4c`, GitHub Actions run #11 successful build/deploy with one Pages artifact, and hosted geocentric title, observer/UTC/Earth-core/axis controls, readiness, visibility, reset, subpath assets, and clean console verified. The old `1.8 m` observer-centered proxy is absent. Physical Quest acceptance remains NOT RUN | `https://github.com/thinksql1/cosmic-calibration-webxr/actions/runs/29643004510`; `https://thinksql1.github.io/cosmic-calibration-webxr/` |
| 2026-07-18 | Milestone 2B physical Quest acceptance reconciliation | CONDITIONAL PASS; the user physically tested the published hardened geocentric Earth-core axis and reported, “I tested it and can work with this.” No blocking physical defect was reported. Detailed A–K observations, device/version data, and individual physical subtest results were not captured and are not inferred. The current implementation is accepted as the workable baseline for subsequent celestial work | User-reported Quest evidence; `357b4d6` / `https://thinksql1.github.io/cosmic-calibration-webxr/` |
| 2026-07-18 | Milestone 2C local celestial-equator implementation | PASS locally for type-check, 21 files / 299 tests, build, dependency/diff checks, and development/production-preview readiness/reset/console checks. It consumes the immutable P03 equator basis and science-owned horizontal sampling plane, renders 96 homogeneous projective samples under the existing calibrated parent, and leaves the Earth-core/pole renderer unchanged. No independent gate, merge, push, deployment, or Quest test | `feature/milestone-2c-celestial-equator`; `docs/CELESTIAL_EQUATOR.md` |
| 2026-07-18 | Milestone 2C independent gate, integration, and publication | PASS; independent probes covered five latitudes, longitude/elevation variation, plane/seam/antipode invariants, malformed-basis rejection, asymmetric eye poses, translation invariance, and same-yaw accepted-recalibration identity. Feature and merged `master` pass clean install, type-check, 21 files / 299 tests, build, dependency/workflow/diff checks, development/preview readiness/visibility/reset/recalibration/teardown, visual control comparison, and clean consoles. Normal merge `0926cbf` retains the feature branch; normal push of `54d64d0` triggered GitHub Actions run #14, which passed build and Pages deployment. Hosted controls, default-hidden equator visibility, readiness, reset, and subpath assets pass. Physical Quest acceptance remains pending. Existing axis-curvature and core-distance perception concerns are unchanged | `master`; `docs/CELESTIAL_EQUATOR.md`; GitHub Actions run #14 |
| 2026-07-18 | Milestone 2C physical evidence reconciliation | CONDITIONAL PASS; user reports the equator good/workable and one clean axis/equator line through either eye independently, with doubling only binocularly. No individual-eye duplicate was observed. Classified as binocular fusion/stereo presentation without claiming an exact cause or inventing other checklist evidence | User-reported Quest evidence; `docs/BINOCULAR_PRESENTATION_MODES.md` |
| 2026-07-18 | Milestone 2D local eye modes and horizon implementation | PASS for clean install, type-check, 26 files / 340 tests, build, dependency/diff, development, and production-preview checks. Actual `XRView.eye` identity controls independent axis/equator/horizon layer masks without scene copies; reversed order, monoscopic fallback, and missing-view suppression are tested. A 96-sample 24 m calibrated local tangent-plane horizon contains exact cardinals, uses linear non-writing depth, and owns reusable/idempotently disposable resources. Controls/readiness/reset/same-yaw rebuild/reload and clean consoles pass. Independent review, integration, publication, and Quest acceptance NOT RUN | `feature/milestone-2d-eye-modes-local-horizon`; `docs/BINOCULAR_PRESENTATION_MODES.md`; `docs/LOCAL_ASTRONOMICAL_HORIZON.md` |
| 2026-07-18 | Milestone 2D independent gate and integration | PASS; actual-eye filtering, reversed/repeated/single/none/missing view handling, independent layer state, immutable science, 96-sample ENU/cardinal/seam invariants, `+/-90` and `180` degree yaw, same-yaw revision reuse, linear depth, and idempotent lifecycle pass independent inspection and temporary probes. Feature and merged `master` pass clean install, type-check, 26 files / 340 tests, build, dependency/workflow/diff checks, development/preview fallback, reset/reload, and clean consoles. Normal merge `79705c9` retains the feature branch. Publication and physical Quest acceptance remain pending | `master`; `docs/BINOCULAR_PRESENTATION_MODES.md`; `docs/LOCAL_ASTRONOMICAL_HORIZON.md` |
| 2026-07-18 | Milestone 2D publication and hosted regression | PASS; normal non-force push of `46cf613`, GitHub Actions run #16 install/type-check/340-test/build/upload/deploy success, and hosted axis/equator/horizon controls, three eye selectors, default-hidden horizon, desktop fallback, readiness, reset, relative assets, and clean console verified. Physical Quest eye filtering and horizon acceptance remain NOT RUN | `https://github.com/thinksql1/cosmic-calibration-webxr/actions/runs/29657256876`; `https://thinksql1.github.io/cosmic-calibration-webxr/` |
| 2026-07-19 | Milestone 2D physical Quest acceptance reconciliation | PASS for the reported bounded usability scope; the user physically tested the deployed Meta Quest spatial-reference experience and described it as incredible and really coming together nicely. The experience ran and no blocking issue was reported. Individual eye modes, angular error, drift, reset/re-entry, performance, and comfort observations were not supplied and are not inferred | User-reported Quest evidence; `docs/MILESTONE_2D_PHYSICAL_ACCEPTANCE.md` |
| 2026-07-19 | Milestone 2E actual-body final gate, integration, and publication | PASS; complete provider identity/mismatch diagnostics, equatorial/horizontal provenance, cache isolation, immutable results, projective rendering, and lifecycle passed direct review and adversarial probes. Feature and merged `master` pass 30 files / 383 tests, type-check, build, dependencies/diff, development/preview, and clean-console checks. Normal merge `b24b3e9` retained the feature branch; Actions run `29703133387` passed build/deploy and hosted body-layer regression | `master`; `docs/SOLAR_SYSTEM_BODY_LAYER.md`; physical Quest acceptance pending |
| 2026-07-19 | Milestone 2F final gate, integration, and publication | PASS; civil-day/DST semantics, exact hour notches, observer schema provenance, structured warnings/failures, cache isolation, all-seven one-hour motion, presentation, and lifecycle passed direct review and deterministic probes. Feature and merged `master` pass 36 files / 416 tests, type-check, build, dependencies/diff, development/preview, and clean-console checks. Normal merge `31be4cc` retained the feature branch; Actions run `29707073636` passed build/deploy and hosted path/notch/live-clock regression. Physical Quest acceptance remains pending | `master`; `docs/SOLAR_24_HOUR_CLOCK.md`; `https://thinksql1.github.io/cosmic-calibration-webxr/` |

| 2026-07-19 | Local rigid Earth-axis spindle correction | Local structural correction; the science remains collinear and one immutable descriptor/one bounded projective strip preserve exact antipodes and core incidence. The subsequent independent renderer review found a default core-opacity seam, so earlier local spindle-presentation acceptance is superseded by the current bounded remediation. Integration, deployment, and physical Quest acceptance are NOT RUN | `fix/earth-axis-spindle`; `docs/EARTH_AXIS_SPINDLE.md` |

| 2026-07-20 | Local unified geocentric structure reconciliation | Local structural correction; the old `w = 0` ring renderer erased the finite Earth-core center while snapshot science and the rigid spindle were correct. One shared core/axis/poles/equatorial-plane descriptor and bounded finite homogeneous ring preserve center, incidence, perpendicularity, parallax, one-yaw transforms, and lifecycle. The independent integration review identified four bounded blockers: default spindle core-opacity seam, production rendering-boundary evidence, restored public-handle lifecycle/eye/immutability assertions, and contradictory records. This remediation addresses those blockers locally; merge, push, deployment, and physical Quest acceptance remain NOT RUN | `fix/earth-axis-spindle`; DEC-029; `docs/CELESTIAL_EQUATOR.md` |
| 2026-07-20 | Local unified geocentric renderer-gate remediation | PASS locally: default spindle color/opacity are continuous across the core; explicit below-horizon hiding is visibility-only; static Float32 ring directions and per-eye Float32-rounded finite-core/radius uniforms avoid callback-time geometry upload; public-handle eye, immutability, and post-disposal contracts are restored. Production callbacks, fitted projected core/ring agreement, Michigan/lateral/vertical views, and non-degenerate spindle upload are covered. `npm ci`, type-check, 438/438 tests across 40 files, build, diff/dependency checks, and development/production-preview smoke checks pass. Independent revalidation, merge, push, deployment, and physical Quest acceptance remain NOT RUN | `fix/earth-axis-spindle`; `tests/scene/geocentric-production-render-boundary.test.ts` |
| 2026-07-20 | Cross-document celestial/temporal records normalization | PASS locally: current published baseline, local spindle correction, historical milestone/planning evidence, and genuinely deferred work are explicitly separated; the deployed body/Sun-clock observation is correctly attributed; no production code, tests, dependencies, workflows, deployment, or physical Quest evidence changed. `npm ci`, type-check, 438/438 tests across 40 files, production build, diff check, and dependency audit pass. Independent integration re-gate remains the one active task | `94d396a`; `docs/CELESTIAL_REFERENCE_ARCHITECTURE.md`; `docs/TEMPORAL_LAYER_ARCHITECTURE.md` |
| 2026-07-20 | Unified geocentric final gate, integration, and deployment | PASS; expected history and documentation-only final commits were confirmed with no technical drift or remaining material record contradiction. Feature and merged `master` pass 438/438 tests across 40 files, type-check, build, diff, and dependency checks. Normal merge `1acedcdac660214a7cbc9cf0ace469f1c2e3c20d` retained the feature branch; normal push aligned local and remote `master`. Actions run `29769161186` passed install, type-check, tests, build, artifact upload, and Pages deployment. Hosted load, relative assets, console, calibration, horizon, core/spindle/equator/poles, parallax, toggles/reset/recalibration, seven bodies, Sun path, civil-hour notches, and live updates passed bounded desktop regression. Physical Quest acceptance remains NOT RUN | `master`; `fix/earth-axis-spindle`; `https://github.com/thinksql1/cosmic-calibration-webxr/actions/runs/29769161186`; `https://thinksql1.github.io/cosmic-calibration-webxr/` |

## Current decision horizon

Physically validate the seven query-gated first-set constellation line figures on Quest. Inspect
each figure and the combined set for recognizability, correct real-sky placement, smooth immutable
great-circle sampling, rigid time response, world locking, and independent eye coherence. Record
only observed results. Do not expand the catalog, add constellation labels, or repair the separate
Sun-path wobble until this gate passes.
