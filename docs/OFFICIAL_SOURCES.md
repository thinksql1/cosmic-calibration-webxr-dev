# Official Sources

**Verified:** 2026-07-15

This pack is grounded in official OpenAI documentation. Product capabilities change; re-check these sources when Codex has a major release.

## Project instructions

- Custom instructions with `AGENTS.md`
  https://developers.openai.com/codex/agent-configuration/agents-md

- Codex customization overview
  https://developers.openai.com/codex/customization/overview

Key points used:

- Codex reads `AGENTS.md` before work.
- Instruction files can be layered by directory.
- Closer instructions override broader instructions.
- The combined project-instruction size has a default limit, so root guidance should stay compact.
- Durable guidance should be refined when repeated mistakes reveal a real gap.

## Models

- Codex models
  https://developers.openai.com/codex/models

- GPT-5.6 overview
  https://openai.com/index/gpt-5-6/

Key points used:

- Sol is intended for complex, open-ended, high-polish work.
- Terra is the pragmatic everyday model.
- Luna is suited to clear, repeatable, lower-cost work.
- Reasoning effort is selectable.
- Model routing should reflect task ambiguity, risk, and repeatability.

## Long-running work and Goal Mode

- Follow a goal
  https://developers.openai.com/codex/use-cases/follow-goals/

- Long-running work
  https://developers.openai.com/codex/long-running-work

- Prompting
  https://developers.openai.com/codex/prompting

- Iterate on difficult problems
  https://developers.openai.com/codex/use-cases/iterate-on-difficult-problems

Key points used:

- `/plan` can precede `/goal`.
- Goals need verifiable stopping conditions.
- Long-running iteration benefits from a durable log containing current results, changes, regressions, and next hypotheses.
- Parallel goals should not write to the same files.

## Threads, subagents, and worktrees

- Codex best practices
  https://developers.openai.com/codex/learn/best-practices

- Worktrees
  https://developers.openai.com/codex/environments/git-worktrees

- Codex app introduction
  https://openai.com/index/introducing-the-codex-app/

Key points used:

- Keep one task per coherent unit of work.
- Use bounded subagents for exploration, tests, and triage.
- Worktrees isolate independent tasks in the same Git repository.
- Avoid write conflicts between parallel workers.

## Skills and external tools

- Build skills
  https://developers.openai.com/codex/build-skills

Key points used:

- A skill packages a repeatable workflow in a `SKILL.md` with optional scripts, references, and assets.
- Turn a workflow into a skill after it becomes repeatable; do not begin by installing everything.

## Safety and configuration

- Codex best practices
  https://developers.openai.com/codex/learn/best-practices

- Codex configuration and security references linked from the official documentation
  https://developers.openai.com/codex/

Key points used:

- Keep sandboxing and approvals tight by default.
- Loosen access only for trusted repositories or demonstrated workflow needs.
- Use infrastructure—tests, hooks, rules, version control, and least privilege—to enforce important constraints.
