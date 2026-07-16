# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Re-run the Milestone 2A independent scientific integration gate

## Recommended execution

- **Codex model:** GPT-5.6 Sol Max
- **Reasoning effort:** High
- **Why:** an independent reviewer must verify scientific state, frame provenance, restoration, immutability, and cache invalidation without repairing the implementation.
- **Branch:** `feature/milestone-2a-scientific-foundation`

## Objective

Independently re-gate the local Milestone 2A remediation before any integration or visible celestial work.

## Required review scope

- Verify accepted calibration events invalidate scientific snapshots even for equal yaw/origin; failed and cancelled captures do not.
- Verify clock revisions are semantic/value-based while calibration revisions are accepted-event-based, and explicitly appear in cache identity.
- Verify clocks own canonical immutable instant copies and that complete direct clock validation suppresses all provider work for malformed state.
- Verify recursive immutability of configuration, snapshots, provenance, warnings, Earth-axis/equator vectors, and cache values without caller-owned aliases.
- Verify restore paths reject malformed versions, modes, time values, safe-integer revisions, profiles, policies, models, providers, and provider arrays.
- Verify P03 provider/version identity agrees across registry, provenance, snapshot, cache key, documentation, and tests.
- Verify exact time-source/rate/accepted-calibration key coverage, true LRU recency, warning/error separation, and conditional MSL-versus-ellipsoid warning metadata/content.
- Re-run `npm ci`, `npm run typecheck`, `npm run test`, `npm run build`, `git diff --check`, and `npm ls --depth=0`.

## Explicit exclusions

- No implementation changes during independent review.
- No Earth-axis/pole/equator/precession geometry, bodies, time/location UI, geolocation, media, or contemplative sequencing.
- No merge, push, deployment, new dependency, workflow change, or Quest test unless a later explicit authorization follows a passing gate.

## Acceptance criteria

1. All confirmed Milestone 2A gate findings are resolved by actual control flow and meaningful deterministic tests.
2. The scientific state/cache contracts remain non-visual, frame-tagged, and Three.js-free.
3. All automated checks pass with no dependency change or visible application change.
4. Project records accurately distinguish local remediation from independent acceptance.

## Stop conditions

Stop and return one bounded remediation task if a stale snapshot can survive a meaningful input change, any nested result is mutable, restoration accepts unsupported runtime values, provider identity differs across boundaries, or a scientific/frame invariant is ambiguous.
