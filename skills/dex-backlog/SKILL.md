---
name: "DEX Backlog"
description: "Convert a validated plan into a clean DEX task hierarchy with small, testable execution chunks."
requiredSources:
  - dex
---
# DEX Backlog

Use this skill after a plan has been validated.

## Goal

Turn a validated plan into DEX tasks that are easy for an orchestrator to execute across sessions.

## Rules

- prefer one parent task plus clear subtasks
- break down by **testable chunks**, not file count
- keep subtasks ready for one focused execution subagent each
- avoid hidden assumptions and vague tasks
- every task should include:
  - **Why** it matters
  - **What** changes
  - **How** to approach it
  - **Done when** / verification

## Process

1. Read the validated plan file
2. Identify the parent deliverable
3. Identify meaningful subtasks when appropriate
4. Use DEX `plan` if the markdown already breaks down cleanly
5. Refine or replace weak automatic breakdowns manually
6. Preserve dependency order from the validated plan

## Session linkage

If the work is also tracked in a Craft session:
- add a work-type label such as `feature`, `bug`, `refactor`, or `research`
- add `task::<parent-or-active-task-id>` when supported
- keep orchestration separate from implementation sessions

## Output

Show the created DEX parent task, subtasks, and recommended execution order.
