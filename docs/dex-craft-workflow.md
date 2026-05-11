# DEX + Craft Agents workflow

Short guide for how this repo uses **DEX** and **Craft Agents** together.

## What each tool does

- **Craft Agents** = orchestration, planning, labels, statuses, automations, subagents, review flow
- **DEX** = persistent task backbone in [`.dex/`](../.dex/)

Use Craft to manage the flow. Use DEX to store the actual tasks and results.

## Core idea

Use one **orchestrator session** and many **small subagents**.

The orchestrator should:
1. research first
2. create the plan
3. validate the plan
4. convert the plan into DEX tasks
5. start one task at a time
6. spawn a focused subagent for implementation
7. review the result
8. approve, request changes, or create follow-up work

## Workflow

### 1) Research first
Before coding:
- inspect existing repo patterns
- use **Context7** for framework/library docs
- use **Brave Search** for current docs, browser APIs, CSS, syntax, and best practices
- choose the **simplest working approach**

### 2) Create the plan
Keep the plan:
- short
- direct
- testable
- low-overhead

Each step should say:
- **Why**
- **What**
- **How**
- **Verification**

### 3) Validate the plan
Use `@plan-validate` before implementation.

Goal:
- remove scope creep
- reuse existing patterns
- verify latest syntax and APIs
- make sure verification is real

### 4) Create DEX tasks
Use `@dex-backlog` after the plan is validated.

Each DEX task should include:
- why it exists
- what changes
- how to approach it
- done-when / verification

### 5) Start the next task
Use `@dex-next-task`.

The orchestrator should then spawn **one focused implementation subagent** in **Execute** mode.

### 6) Implement the smallest version first
Subagents should:
- solve one task only
- keep context small
- avoid extra abstraction
- get something working before making it more advanced

### 7) Review
When implementation is ready:
- record the result in DEX
- move the implementation session to `needs-review`
- automation spawns a review helper
- review helper runs `@dex-review`

## Labels

Current labels:
- `automation`
- `review`
- `approved`
- `changes-requested`
- `feature`
- `bug`
- `refactor`
- `research`
- `priority::<n>`
- `project::<name>`
- `task::<dex-id>`

Use labels for routing and filtering only.

## Automations

### Research helper
When a session gets the `research` label:
- Craft spawns a helper session in `allow-all`
- helper uses:
  - `context7`
  - `brave-search`
- helper stays in research mode only

### Preflight helper
When a session gets `feature`, `bug`, or `refactor`:
- Craft spawns a helper session in `allow-all`
- helper checks existing patterns and current docs
- helper recommends whether to investigate, plan, or validate next

### Review helper
When a session moves to `needs-review`:
- Craft spawns a helper session in `allow-all`
- helper uses:
  - `dex`
  - `chrome-devtools` when browser/UI verification is needed

## Commands

### DEX
- `npm run dex:list`
- `npm run dex -- create "Task name" --description "..."`
- `npm run dex:plan -- <plan-file>`
- `npm run dex:mcp`

### Storage
- active tasks: [`.dex/tasks.jsonl`](../.dex/tasks.jsonl)
- archived tasks: [`.dex/archive.jsonl`](../.dex/archive.jsonl)

## Important files

- workflow rules: [AGENTS.md](../AGENTS.md)
- labels: [labels/config.json](../labels/config.json)
- automations: [automations.json](../automations.json)
- DEX source guide: [sources/dex/guide.md](../sources/dex/guide.md)
- skills:
  - [skills/plan-validate/SKILL.md](../skills/plan-validate/SKILL.md)
  - [skills/dex-backlog/SKILL.md](../skills/dex-backlog/SKILL.md)
  - [skills/dex-next-task/SKILL.md](../skills/dex-next-task/SKILL.md)
  - [skills/dex-review/SKILL.md](../skills/dex-review/SKILL.md)

## Example flow

### Example: new feature
1. Create or open an orchestrator session
2. Add `feature`
3. Let the preflight helper research patterns and docs
4. Create the plan
5. Run `@plan-validate`
6. Run `@dex-backlog`
7. Run `@dex-next-task`
8. Spawn one implementation subagent in Execute mode
9. Add `task::<dex-id>` to the implementation session
10. Implement and verify
11. Record the result in DEX
12. Move session to `needs-review`
13. Let review helper validate and close or send back changes

## Example prompts

### Start with research
- "Research this feature first. Use Context7 and Brave Search, then suggest the simplest working approach."
- "Add the `research` label and gather current docs, browser APIs, CSS techniques, and existing repo patterns before we plan."
- "Investigate this bug first. Don’t guess — inspect the repo, use Context7, and find the real root cause."

### Create and validate a plan
- "Create a short implementation plan for this feature. Keep it simple, direct, and easy to verify."
- "Run `@plan-validate` on this plan. Remove scope creep and check current syntax, APIs, and best practices."
- "Validate this plan against the existing codebase and current docs. Only keep the smallest version that works first."

### Create DEX tasks
- "Convert this validated plan into DEX tasks with `@dex-backlog`. Break it into small testable chunks."
- "Create one parent DEX task and 3-5 focused subtasks from this plan."
- "Turn this plan into a backlog, but keep each subtask small enough for one implementation subagent."

### Start implementation
- "Use `@dex-next-task`, pick the next task, and spawn an implementation subagent in Execute mode."
- "Start the next DEX task and give the subagent only the context it needs for that one task."
- "Implement the next task, but build the smallest working version first. Use Context7 if syntax or APIs matter."

### Browser/UI work
- "Spawn a browser verification subagent and use Chrome DevTools to test this UI flow."
- "Use Chrome DevTools to verify the DOM, CSS, and interaction behavior after implementation."
- "Test this browser-visible change in Chrome DevTools and report only concrete evidence."

### Review and close
- "Record the implementation result in DEX and move the session to `needs-review`."
- "Run `@dex-review` and verify the work strictly against the linked `task::<id>` scope."
- "Review this implementation, approve it if the evidence is real, otherwise request changes or create a follow-up task."

### Full orchestrator prompts
- "Research this idea, create a plan, validate it, turn it into DEX tasks, and then start the first implementation subagent."
- "Run the full DEX + Craft workflow for this bug: investigate, plan, validate, create tasks, implement one task, then send it to review."
- "Use the orchestrator workflow here: keep context small, use subagents, and keep the implementation simple."

## Best practices

- **Research first**
- **Never guess** about APIs, browser behavior, or framework syntax
- **Prefer existing repo patterns** over inventing new ones
- **Keep subagents narrow**: one job, one goal
- **Use only the sources needed** for that subagent
- **Ship the simplest working version first**
- **Do not add abstraction early**
- **Use review as validation, not as another implementation pass**

## Source selection by subagent

- **Research subagent**: `context7`, `brave-search`
- **Implementation subagent**: `dex` + docs sources if needed
- **Browser/UI test subagent**: `chrome-devtools`
- **Review subagent**: `dex` + `chrome-devtools` when needed

## One-line summary

**Craft Agents runs the workflow. DEX stores the tasks. The orchestrator thinks big. Subagents stay small.**
