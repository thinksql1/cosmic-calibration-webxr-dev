# Scientific Cache Policy

The scientific snapshot cache is bounded, in-memory only, and exact-key only. It uses a maximum of 32 recursively immutable snapshots by default and evicts the least-recently-used entry when full. A cache hit refreshes recency; `A`, `B`, access `A`, then insert `C` evicts `B`. It exposes hit, miss, and entry diagnostics, and `clear()` resets both entries and diagnostics.

## Key and invalidation

The key includes observer revision/content, time revision/exact UTC/mode/paused status, calibration revision/yaw/origin/accepted-capture identity, configuration revision/precision/model/profile/refraction/canonical enabled providers, and Astronomy Engine/P03 provider names and versions. A new accepted calibration event misses even when it has the same yaw and origin. Provider input order is normalized and duplicates are rejected before a key exists. Any observer update, selected instant, calibration reset/recalibration, configuration replacement, or provider version replacement therefore misses. No mutable object identity is trusted.

## Time policy

Frozen and paused selections cache at the exact UTC instant. A running, unpaused clock deliberately bypasses the cache: it builds synchronously for the explicitly ticked instant and increments misses. There is no time bucketing or quantization of body positions or the P03 axis. This prioritizes scientific correctness and predictable invalidation over cache-hit rate.

## Boundaries

The cache is not serialized, persisted, network-backed, shared across sessions, or updated in a background timer. It contains no raw library objects or presentation objects. A cache hit returns the same deeply immutable scientific snapshot; callers cannot mutate cached scientific values or alter a cache key by mutating a prior configuration input.
