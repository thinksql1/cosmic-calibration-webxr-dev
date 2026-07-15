# Delegation and Worktrees

## Principle

Delegate to reduce context noise or gain independent evidence—not to make the project look busy.

Separate tasks do not automatically share every decision. Each worker must receive an explicit contract.

## Default roles

### Explorer

Use for repository tracing, dependency discovery, option comparison, and risk identification.

Contract:

- Read-only
- Cite files, symbols, commands, and evidence
- Separate facts from inference
- Do not implement
- Return a concise recommendation

### Builder

Use after the approach and acceptance criteria are accepted.

Contract:

- Work only in named paths
- Implement one coherent unit
- Add or update tests
- Avoid unrelated cleanup
- Report exact validation
- Stop if scope or architecture must change

### Validator

Use independently after implementation.

Contract:

- Do not trust the builder's claims
- Reproduce expected behavior
- Inspect diff and tests
- Look for regressions, weakened assertions, missing edge cases, and unsupported documentation
- Return pass/fail/conditional-pass with evidence

### Curator

Use after technical acceptance.

Contract:

- Update state and handoff documents
- Do not imply unverified behavior
- Remove contradictions
- Preserve decision history
- Set one next task

## Worker prompt contract

Every worker prompt should include:

1. Recommended model and reasoning effort
2. Role
3. Objective
4. Project context
5. Inputs to inspect
6. Allowed paths
7. Prohibited actions
8. Required deliverables
9. Validation expectations
10. Stop conditions
11. Return format

## Parallelism matrix

| Work combination | Safe default |
|---|---|
| Explorer + explorer on different questions | Yes |
| Explorer + builder | Yes, if explorer is read-only |
| Builder + validator on already-finished commit | Yes |
| Builder + builder on separate worktrees and separate files | Usually |
| Builder + builder on shared interfaces | No without an accepted contract |
| Two goals editing the same checkout | No |
| Curator updating docs while implementation is changing | Usually wait |

## Worktrees

Use a Git worktree when:

- A worker will make substantial edits
- You want the local checkout undisturbed
- Two independent implementation paths need comparison
- A long-running task should remain isolated
- The diff must be reviewable before integration

Worktree assumptions:

- The project must be a Git repository.
- Untracked files may not automatically exist in a worktree.
- Setup may need to run inside each worktree.
- Each worktree should have a distinct branch and task.
- Shared external resources, ports, databases, and generated files can still conflict even when source files do not.

## Merge protocol

Before accepting a worker branch:

1. Ensure the branch is based on the expected baseline.
2. Review the diff.
3. Run validation in the integration context.
4. Resolve documentation and decision changes.
5. Merge or hand off deliberately.
6. Remove abandoned worktrees after their useful evidence is preserved.

## Worker result format

```text
Role:
Objective:
Status: Complete | Partial | Blocked

Evidence inspected:
- <file, symbol, command, or source>

Changes:
- <file and purpose>

Validation:
- PASS: <check and result>
- FAIL: <check and result>
- NOT RUN: <check and reason>
- NOT APPLICABLE: <check>

Findings:
- Confirmed:
- Inferred:
- Recommended:

Risks or limitations:
- <item>

Decision needed:
- <only when a real project-level choice remains>

Suggested next bounded task:
- <one task>
```

## Control-thread reconciliation

The control thread should not accept a worker result merely because it is polished.

It must decide:

- Does the result satisfy the original contract?
- Is the evidence sufficient?
- Did the worker expand scope?
- Does the recommendation conflict with accepted decisions?
- Is independent validation required?
- Which repository state files must change?
