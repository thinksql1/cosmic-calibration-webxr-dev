# Earth Axis and Celestial Poles

## Status

Milestone 2B passed independent scientific/visual review and was integrated normally into local
`master` at merge commit `09a6e67`. Automated and desktop development/production-preview
validation pass. Publication, hosted verification, and physical Quest acceptance have not run.

This layer renders only one coherent IAU P03 precession-only mean Earth axis and its exact
antipodal north and south celestial-pole endpoints. It is a Tier 1 structural display, not a true,
instantaneous, observed, magnetic, or geographic pole.

## Scientific model

The source is the validated Milestone 2A scientific snapshot. The selected pole model is:

```text
IAU P03 precession-only mean pole/equator of date
source vector frame: GCRS
mean-date transform: GCRS_TO_P03_MEAN_EQUATOR_OF_DATE
validated domain: J2000.0 +/- one Julian century
```

The model excludes nutation, celestial-intermediate-pole corrections, polar motion, Chandler
wobble, and observed celestial-pole offsets. The visible layer never calls Astronomy Engine or
the P03 provider and never reconstructs the bias-precession matrix.

## Axis-specific transform contract

The scientific snapshot builder owns the axis transform:

```text
validated P03 north vector in GCRS
  -> apply the snapshot's GCRS-to-P03-mean-date matrix
  -> prove the result is the mean-date +Z axis within 1e-12
  -> identify the same axis as Earth-fixed +Z
  -> full WGS84 geodetic Earth-fixed-to-ENU rotation
  -> observer-horizontal ENU north/south unit directions
```

For this axis only, Earth rotation is a rotation about the same `+Z` and therefore cannot change
the axis. No sidereal angle is fabricated. Longitude cancels analytically in the complete
Earth-fixed-to-ENU rotation. For geodetic latitude `phi`:

```text
NCP ENU = (east 0, north cos(phi), up sin(phi))
SCP ENU = -NCP ENU
```

This analytic relationship is a validation property, not a replacement for the P03 frame proof.
Changing the selected UTC instant rebuilds scientific identity and provenance; it correctly does
not invent local motion for the Earth-fixed mean axis. Future equator, stars, and body directions
will require their own complete date/Earth-rotation transforms and must not reuse this
axis-specific shortcut.

The presentation layer then performs only:

```text
ENU east  -> Three.js +X
ENU up    -> Three.js +Y
ENU north -> Three.js -Z
unit direction -> symbolic display radius
child of the calibrated geographic parent
```

The geographic parent applies the accepted Milestone 1 yaw exactly once. The axis data contains
no pre-applied room yaw, and the XR camera, renderer, `local-floor`, controllers, and room
diagnostics remain unrotated.

## Readiness

No axis is presented as scientifically valid until the snapshot has:

- a validated manual WGS84 observer;
- an explicit valid UTC simulation instant;
- a current accepted geographic calibration;
- the supported Tier 1 configuration and provider registry;
- a date inside the P03 validation domain; and
- passing pole, frame, unit-length, and antipodal invariants.

A missing or invalid input produces concise guidance and clears the celestial group without
removing Milestone 0/1 geometry. There is no default latitude, guessed pole, automatic location,
or persisted room calibration.

## Observer and time controls

The bounded diagnostic UI accepts manual geodetic latitude, east-positive longitude, and
elevation in meters above mean sea level. Values remain in memory and pass through the validated
observer state. Generic equator, mid-northern, mid-southern, and high-northern presets are
validation cases, not detected locations.

The selected UTC is owned by the central simulation clock. Fixed J2000, present-era, and bounded
future fixtures are available. **Use current time** is an explicit application action that passes
one system-supplied instant to the clock; scientific consumers never read ambient time. This is
not a general time-control or animation system.

## Presentation model

The physical Earth axis is geocentric. The rendered line is an observer-centered directional
proxy parallel to that scientific orientation. It passes through the calibrated local origin for
embodied comprehension and does not claim that Earth's center is at the user.

- Symbolic radius: `1.8 m` in each pole direction.
- One persistent group owns both touching axis halves, one observer-origin proxy, and both pole
  markers.
- North and south positions are exact component negations.
- NCP and SCP use restrained amber/cyan differentiation and optional billboard labels.
- No star, planet, halo, blinking, arrow, particle, or reticle semantics are used.

### Below-horizon convention

Both endpoints remain part of one scientific axis.

- **Full axis:** both halves remain visible with restrained equal emphasis.
- **Above-horizon emphasis:** the below-horizon half, marker, and label are subdued while the
  endpoint remains present.
- The user may hide the below-horizon line segment explicitly; the underlying pole data and
  marker remain available.

The room floor is not an opaque Earth surface and is not used for scientific occlusion. The
initial horizon is the airless WGS84 geodetic geometric horizon, not terrain, horizon dip,
atmospheric refraction, or the observed room boundary.

## Controls and diagnostics

Independent controls are limited to axis, markers, labels, below-horizon segment, and
below-horizon treatment. Compact diagnostics disclose pole altitude/azimuth, selected UTC,
observer latitude, accepted calibration identity, and provider version. The Tier 1/model limits
remain visible and diagnostics are collapsible.

Every new interactive element participates in the existing DOM-overlay `beforexrselect` guard.
When DOM overlay is unavailable, observer/time settings should be selected before AR entry;
controller-only physical-north calibration remains the required XR path.

## Validation evidence

Automated cases cover:

- equator, positive/negative mid-latitude, and positive/negative high-latitude relationships;
- exact NCP/SCP antipodes, unit length, north/south azimuth, and zenith/nadir undefined azimuth;
- longitude cancellation for the Earth-fixed axis;
- P03 matrix/vector coherence and explicit frame tags;
- ENU-to-application signs and absence of presentation yaw;
- observer, time, and same-yaw accepted-calibration identity updates;
- full/subdued below-horizon modes and independent visibility;
- one persistent scene group with no accumulated objects; and
- clearing stale geometry on scientific reset/not-ready state.

Desktop development and production preview verify the equator, northern, southern, and
high-northern visual cases; observer/time and visibility controls; calibration/recalibration/reset;
OrbitControls; zoom; resize; relative assets; and clean application console output.

## Exclusions

Milestone 2B does not implement a celestial equator, precession trajectory, nutation display,
polar motion, Chandler wobble, ecliptic, Sun, Moon, planets, stars, temporal markers, animated
time, geolocation, map search, persistence, Earth center/sphere, relational circuits, media,
audio, AI enhancement, or contemplative sequencing.
