# Scientific Cache Policy

The scientific snapshot cache is bounded, in-memory only, and exact-key only. It uses a maximum of 32 recursively immutable snapshots by default and evicts the least-recently-used entry when full. A cache hit refreshes recency; `A`, `B`, access `A`, then insert `C` evicts `B`. It exposes hit, miss, and entry diagnostics, and `clear()` resets both entries and diagnostics.

## Key and invalidation

The key includes observer revision/content; clock version, time revision, exact UTC, instant source, mode, signed rate, and paused status; calibration readiness, generic revision, explicit accepted-capture revision, yaw, and origin; configuration revision/precision/model/profile/refraction/canonical enabled providers; and Astronomy Engine/P03 provider names and versions. A new accepted calibration event misses even when it has the same yaw and origin. Equal UTC with a different source or returned clock rate also misses so a cached snapshot cannot report stale provenance. Provider input order is normalized and duplicates are rejected before a key exists. Any observer update, selected instant, calibration reset/recalibration, configuration replacement, or provider version replacement therefore misses. No mutable object identity is trusted.

The separate actual-body cache is narrower and excludes calibration yaw, but only after the ready
snapshot and active registry agree on the same frozen Astronomy Engine apparent-topocentric
descriptor. Its key uses the active descriptor itself: provider name/version, adapter version,
body-set identifier, supported frame policy, correction profile, observer, explicit clock state,
and configuration revision. A provider-identity mismatch is rejected before lookup, so an entry
created by one provider descriptor cannot cross into another provider boundary.

## Time policy

Frozen and paused selections cache at the exact owned UTC instant and source. The structural clock contract is revalidated and copied before keying. A running, unpaused clock deliberately bypasses the cache: it builds synchronously for the explicitly ticked instant and increments misses. There is no time bucketing or quantization of body positions or the P03 axis. This prioritizes scientific correctness, provenance fidelity, and predictable invalidation over cache-hit rate.

## Boundaries

The cache is not serialized, persisted, network-backed, shared across sessions, or updated in a background timer. It contains no raw library objects or presentation objects. A cache hit returns the same deeply immutable scientific snapshot; callers cannot mutate cached scientific values or alter a cache key by mutating a prior configuration input.
