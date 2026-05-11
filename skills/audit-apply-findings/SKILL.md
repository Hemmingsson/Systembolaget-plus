---
name: "Audit Apply Findings"
description: "Compatibility alias for the workspace-native @apply-findings workflow."
requiredSources:
  - dex
---
# Audit Apply Findings

This skill exists as a compatibility alias for older wording.

## Use in this workspace

Prefer **`@apply-findings`** for the actual workflow.

The intended behavior is:
- take validated findings from an investigation, audit, or review
- turn them into one short implementation loop
- keep steps explicit and easy to verify
- convert the result into DEX tasks when that helps execution

## Output standard

For each task, keep the plan explicit about:
- `WHY`
- `WHAT`
- `WHERE`
- `HOW`
- `VERIFY`
- `DONE WHEN`
