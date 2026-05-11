---
name: "Apply Findings"
description: "Turn validated findings into a short implementation loop with explicit verification and minimal safe steps."
requiredSources:
  - dex
---
# Apply Findings

Use this after an audit, review, or investigation has produced concrete findings.

## Goal

Convert findings into a small, practical implementation loop.

## Process

1. Gather the current findings from the conversation or a findings document
2. Synthesize them into one short implementation plan:
   - highest-risk issues first
   - smallest safe steps
   - explicit verification per step
3. Execute incrementally
4. Review the result
5. Clean up only after behavior is confirmed
6. Simplify only after the fix works

## Plan format

For each task, include:
- `WHY`
- `WHAT`
- `WHERE`
- `HOW`
- `VERIFY`
- `DONE WHEN`

## Rules

- one implementation flow is enough
- do not invent work before findings exist
- keep the plan minimal, direct, and testable

## Output

Create or update an implementation plan document and, when appropriate, convert it into DEX tasks.
