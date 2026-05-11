---
name: "DEX Next Task"
description: "Choose the next actionable DEX task and prepare a focused execution handoff."
requiredSources:
  - dex
---
# DEX Next Task

Use this skill to pick and start the next actionable DEX task.

## Process

1. List pending DEX tasks
2. Ignore blocked or completed items
3. Pick the most logical next task
4. Read the task details before implementation starts
5. Start the chosen task in DEX
6. Restate:
   - scope
   - assumptions
   - likely files or surfaces involved
   - verification steps

## Handoff guidance

After selecting the task, the orchestrator should usually launch one focused execution subagent.

### Subagent settings
- use `permissionMode: allow-all`
- enable only the sources that task needs

### Source selection
- always enable `dex` when task tracking is active
- add `context7` and `brave-search` when current docs or syntax matter
- add `chrome-devtools` when browser or UI verification is needed

## Guardrails

- do not start overlapping tasks unless explicitly requested
- if the task is still too large, break it down further first
- if requirements are unclear, refine the DEX task before coding
- build the simplest working version first

## Output

Return the chosen task ID, why it was selected, recommended sources for execution, and the verification checklist.
