# 24-Hour Apparent Sun Path and Live Celestial Updates

## Scope

This bounded temporal layer draws the **observer-relative apparent Sun direction** over one
selected local civil day. It is not a claim that the Sun orbits Earth, an annual ecliptic, a
celestial-equator projection, or a literal-distance solar-system model. The existing live Sun
marker remains the authoritative calculated current direction; when the path is enabled without
the global body layer, only that Sun marker is retained as a presentation cue.

The layer consumes the existing immutable scientific snapshot, approved Astronomy Engine adapter,
and `AE_APPARENT_TOPOCENTRIC_AIRLESS` policy. UTC instants remain authoritative for astronomy.

## Civil day and time zone

The visible civil day is resolved from an explicit IANA time-zone identifier. The browser `Intl`
IANA implementation is the current resolver; its run-time time-zone-data version is recorded as
`unknown` rather than invented. Observer longitude does not silently determine a time zone. The
UI initializes from the browser-resolved zone and allows an explicit IANA override. There is no
persistent location or time-zone storage.

The service finds the start of the selected local date and the start of the next local date, then
enumerates real UTC minute instants in that interval. A notch is emitted at every valid local
minute `00` boundary:

- ordinary days normally have 24 notches;
- spring-forward days omit a skipped local hour;
- fall-back days retain both repeated local-hour instants, with `fold` and UTC-offset metadata;
- no nonexistent hour is fabricated and no repeated hour is collapsed.

Hour text is retained as typed metadata (`localLabel`, offset, fold) but is intentionally not
rendered in this milestone.

## Science and caching

The daily path is sampled every ten minutes, plus the exact local-day endpoint and every exact
civil-hour instant. Hour notches are independently calculated at those instants and reference an
exact matching path sample; they are never produced by equal-angle division or interpolation. The
selected policy is `LOCAL_CIVIL_DAY_EXACT_HOURS_PLUS_10_MINUTES_V1`, with at most 192 samples.
This is a smooth bounded presentation policy, not an unvalidated sub-arcminute path claim.

The science cache key includes observer value/revision, selected civil date, IANA resolver and
time-zone revision, provider descriptor/version, correction/frame policy, configuration revision,
and sampling-policy version. A path is stable within its civil day and is not recomputed each
minute. It rebuilds for observer, date/local-midnight, time-zone, provider, configuration, or
policy changes. The current live body state has its own active-time behavior.

## Rendering and depth

ENU directions map once to the application basis and pass through the existing calibrated
geographic parent, which applies geographic yaw exactly once. The path and notches use homogeneous
projective `w = 0` directions with a per-eye rotation-only frame; no astronomical-scale coordinate
enters an ordinary GPU transform. The path is open across the true local-day interval rather than
being closed as a decorative circle.

The warm line uses reduced opacity below the horizon; the user can hide that presentation portion
without changing science. Materials explicitly disable depth testing and depth writing under the
existing linear XR depth contract. This is an overlay convention, not real-world occlusion.

## Real-time updates

`RealtimeCelestialUpdateScheduler` is presentation-owned and advances only the existing central
`SimulationClock` from explicit render-loop monotonic elapsed milliseconds. It owns no astronomy,
does not read ambient time, and creates no timer. Running time triggers a snapshot/body refresh at
least once per real minute at rate `1`; existing accelerated rates shorten that cadence, while
paused and frozen modes remain deterministic. The entire daily geometry is cached until its civil
identity changes; the live Sun, Moon, and planet state refresh together. The current civil-hour
notch and Sun emphasis move with the refreshed snapshot.

## Controls and lifecycle

The layer has only three bounded controls: Sun daily path, Sun civil-hour notches, and
below-horizon path presentation. The global solar-system-body toggle retains its existing meaning.
All are hidden by default except the below-horizon policy, which is preselected for when the path
is shown. The scene handle preallocates bounded geometry/materials, has explicit `clear` and
idempotent `dispose`, and creates neither geometry nor materials during cadence updates.

## Limitations and physical boundary

- Coordinates are airless apparent topocentric directions; atmospheric refraction and rise/set
  limb/event semantics are not claimed.
- Visible hour labels, sunrise/sunset events, annual Sun paths, seasonal comparison, ecliptic,
  planet paths, Moon phase, and a general temporal-control system are deferred.
- Browser IANA time-zone data is used without a claimed database release version.
- Desktop and automated checks do not establish Quest readability, physical comfort, or perceptual
  motion quality.

Quest acceptance is pending. Use the temporal procedure in
[Quest Testing](QUEST_TESTING.md#milestone-2f-24-hour-sun-path-and-live-celestial-updates-pending).
