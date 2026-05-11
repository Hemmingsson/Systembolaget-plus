# Plan: Adapt copied guidance into workspace-native workflow rules and skills

## Goal

Replace the too-literal imported guidance with workspace-native instructions that fit the current Craft Agents + DEX workflow, naming, labels, automations, and subagent model.

## Steps

1. Review the current `AGENTS.md`, skills, and automations that were added from the examples.
2. Identify copied wording, references that do not fit this workspace, and anything redundant with the existing workflow.
3. Rewrite the affected skills so they:
   - use this workspace’s labels, sources, and subagent model
   - stay general instead of depending on external repo-specific conventions
   - focus on Craft-native flow: research → plan → validate → DEX backlog → execute subagent → review
4. Add anything missing that the examples implied but the current setup still lacks.
5. Validate all updated skills and configs.
6. Summarize what changed and why.

## Expected result

A cleaner, consistent workflow where the rules and skills feel authored for this workspace rather than pasted in from another system.