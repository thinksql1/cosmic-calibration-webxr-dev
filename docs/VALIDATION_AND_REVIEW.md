# Validation and Review

## Definition of done

“Implemented” and “done” are different states.

A change is done only when:

- Required behavior exists
- Relevant existing behavior still works
- Evidence is recorded
- The diff is reviewable
- Documentation matches reality
- Known limitations are explicit
- The active task's acceptance criteria are satisfied

## Evidence states

Always classify checks as:

- **PASS** — run and satisfied
- **FAIL** — run and did not satisfy
- **NOT RUN** — applicable but unavailable or deferred
- **NOT APPLICABLE** — genuinely irrelevant

Never translate “not run” into “should work.”

## Validation ladder

Use the lowest levels needed for simple work and add higher levels as risk increases.

1. **Static inspection** — syntax, types, lint, schema, references
2. **Focused automated tests** — changed behavior
3. **Regression suite** — affected subsystem or full suite
4. **Runtime verification** — execute the real path
5. **Interface verification** — API, database, browser, file, or external contract
6. **Non-functional checks** — performance, accessibility, security, resilience
7. **Independent review** — separate validator or `/review`
8. **User/domain acceptance** — the result solves the real need

## Acceptance-criteria table

For every substantial task, use a table like this:

| Criterion | Validation method | Expected result | Actual result | Status | Evidence location |
|---|---|---|---|---|---|
| `<behavior>` | `<test/demo/review>` | `<observable>` | `<result>` | PASS/FAIL | `<path/log>` |

## Test integrity

Tests must not be weakened to make the work appear successful.

A validator should look for:

- Deleted or skipped tests
- Broadened tolerances
- Assertions replaced with existence checks
- Mocking away the behavior under test
- Snapshot updates that hide regressions
- Tests that pass without exercising the changed path
- Environment assumptions not present in production

## Independent validation

Use an independent validator when:

- The change is high-value or high-risk
- The builder used Goal Mode
- Architecture or schema changed
- The defect was difficult to reproduce
- Security, money, customer data, or production behavior is involved
- Visual quality or domain correctness matters
- The builder reports uncertainty

The validator receives the objective and acceptance criteria, but should not be coached toward the builder's preferred conclusion.

## Visual and experience validation

For UI, visualization, reports, generated media, or browser workflows, include:

- Intended viewport and environment
- Screenshots or recordings when useful
- Interaction states
- Empty, loading, error, and overflow states
- Responsive behavior
- Keyboard/accessibility behavior
- Visual comparison against the project standard
- Realistic data rather than only ideal samples

Automated tests support this evidence but do not replace human-visible inspection.

## Performance evidence

Do not say “performant” without a workload and measurement.

Record:

- Environment
- Dataset or request size
- Baseline
- New result
- Number of runs
- Variability
- Threshold
- Known bottlenecks

## Review output

A review should prioritize findings by impact:

1. Blocking correctness or safety defects
2. Likely regressions
3. Missing validation
4. Maintainability risks
5. Optional improvements

A review with no findings should still state what was inspected and which checks were run.

## Final evidence report

```text
Objective:
Result: PASS | CONDITIONAL PASS | FAIL

Acceptance criteria:
- <criterion>: PASS/FAIL — <evidence>

Commands/checks:
- <command>: <exit/result>

Runtime verification:
- <what was exercised>

Independent review:
- <result or not required>

Files changed:
- <path>: <purpose>

Known limitations:
- <item>

Unverified:
- <item>

Recommended next task:
- <one bounded task>
```
