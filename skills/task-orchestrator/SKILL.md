---
name: "Task Orchestrator"
description: "Coordinate one task through research, planning, DEX breakdown, execution handoff, and review using small subagents."
requiredSources:
  - dex
---
# Task Orchestrator

Use this skill when a task is large enough to benefit from planning, DEX tracking, or multiple sessions.

## Goal

Keep the main session small and decisive while using focused subagents for bounded work.

## Responsibilities

The orchestrator should:
1. decide whether the task needs research first
2. decide whether a plan is needed
3. validate the plan before implementation
4. create or refine DEX tasks
5. select one next task at a time
6. launch the right subagent with the right sources
7. validate the returned work before sending it to review

## Source routing

Choose sources by need:
- `context7` + `brave-search` for research and current docs
- `dex` for task creation, progress, and result tracking
- `chrome-devtools` for browser-visible verification

## Subagent rules

When spawning subagents:
- use `permissionMode: allow-all`
- provide only the minimum context required
- assign exactly one bounded objective
- require concrete verification, not broad commentary

## Decision guide

- If the task is unclear or broken: use `@investigate-first`
- If the task needs a plan: create the plan, then use `@plan-validate`
- If the plan is ready: use `@dex-backlog`
- If implementation should start: use `@dex-next-task`, then spawn one implementation subagent
- If implementation is done: use `@dex-review` or let the review automation handle it

## Output

Return the next action, the recommended source set, and whether the next step should stay in the orchestrator or move to a subagent.
