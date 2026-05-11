---
name: "DEX Review"
description: "Review a completed implementation session against its linked DEX task and approve or request changes."
requiredSources:
  - dex
---
# DEX Review

Use this skill to review completed implementation work that is linked to a DEX task.

## Goal

Validate that the implementation matches the DEX task scope, result, and verification evidence.

## Inputs

You should have one or more of:
- a Craft session ID to review
- a `task::<id>` label
- a completed DEX task ID

## Review process

1. Inspect the implementation session metadata and labels
2. Find the linked `task::<id>` value when present
3. Read the DEX task context and recorded result
4. Review the relevant code, files, and tests without expanding scope
5. If browser-visible behavior matters, use `chrome-devtools`
6. Verify:
   - the requested problem was solved
   - the implementation matches the intended scope
   - verification evidence is real and sufficient
   - the solution stayed reasonably simple
7. Decide one of:
   - **Approve**
   - **Request changes**
   - **Create follow-up task** if genuinely separate work is needed

## Session updates

When reviewing a Craft session:
- if approved, set the original implementation session status to `done`
- if changes are required, set it back to `todo`
- preserve existing labels; add `approved` or `changes-requested` only after merging with current labels

## Output

Provide a concise review summary with:
- verdict
- evidence checked
- gaps found
- exact next action
