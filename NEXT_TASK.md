# Next Task

This file contains exactly one bounded next task.

## Task

**Title:** Independently revalidate and integrate the 24-hour Sun path and real-time celestial updates

Independently review the local observer-relative apparent Sun path, its civil-hour notches, and
the bounded real-time body refresh before any integration or publication. Verify complete
immutable observer provenance, deterministic scientific warnings, structured temporal failures,
cache rejection/isolation, civil-time and DST correctness, live cadence, lifecycle, regression,
and desktop behavior. Merge and publish only if every blocking scientific and rendering gate
passes.

## Required review checks

- Reproduce generic-provider, malformed-provider, observer-mismatch, civil-resolver, aggregation,
  rollover, and sampling-policy cache probes. Confirm no generic error reaches the public path
  boundary and no failed path is cached.
- Verify the observer revision, provenance-schema version, and WGS84 model remain distinct and
  consistent across path/samples/notches; confirm early temporal failures receive uniform complete
  context and one production scheduler advance changes all seven supported body directions.
- Verify the observer and warning contracts are complete, deeply immutable, and serializable;
  retain existing ordinary/DST scheduling, exact notch, live-cadence, and lifecycle evidence.
- Run full automated validation and desktop/preview regression before considering a normal merge.

## Exclusions

Do not implement labels, ecliptic, celestial-equator projection modes, Moon phase, other body
paths, stars, precession, persistent location, a broad time-control UI, media, game integration,
AI enhancement, or contemplative sequencing.

## Recommended execution

- **Model:** GPT-5.6 Sol
- **Reasoning effort:** High
- **Why:** independent review must adversarially verify structured temporal failures, observer
  provenance, warning disclosure, cache safety, civil-time correctness, live updates, and release
  readiness before physical evidence can be collected.
