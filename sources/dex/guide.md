# DEX

DEX is the persistent task backbone for this workspace. Use it for planning, task breakdown, multi-session continuity, and review-ready task results.

## Scope

This source manages the repo-local task backlog stored in [`.dex/tasks.jsonl`](../../.dex/tasks.jsonl).
The connected MCP server currently exposes these task operations:

- `list_tasks` — read task data and backlog state
- `create_task` — create parent tasks or subtasks
- `update_task` — update status, result, and task metadata

Use it for:
- validated implementation plans
- parent tasks and subtasks
- task start/completion tracking
- implementation results and verification notes
- handing work across sessions

## Guidelines

- Prefer DEX for work that spans more than one implementation step
- Research first, then plan, then validate, then create tasks
- Create rich task context, not one-line todos
- Results should include what changed, key decisions, and verification evidence
- Link Craft sessions to DEX with `task::<task-id>`
- Use a small orchestrator session to manage flow and spawn narrow subagents for execution
- When implementation is ready for review, move the Craft session to **Needs Review** so the review automation can inspect the task
- In Explore mode, only `list_tasks` should be used; task creation and updates belong in edit/execute flows

## Suggested workflow

1. Research the idea
2. Create the plan
3. Validate the plan
4. Convert the validated plan into DEX tasks or subtasks
5. Start the next actionable task
6. Spawn a focused implementation subagent in Execute mode
7. Record the result in DEX
8. Set session status to `needs-review`
9. Let the Craft automation run the review flow

## Examples

- List pending tasks and inspect the next actionable backlog item
- Create a parent task from a validated plan and add subtasks for testable chunks
- Update a task result with implementation evidence before requesting review
- Review a completed task's result before approving the implementation session
