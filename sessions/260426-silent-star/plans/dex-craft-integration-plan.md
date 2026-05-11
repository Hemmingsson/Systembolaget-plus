# Plan: DEX + Craft Agents integration for backlog and automated review

## Recommendation

Use a **hybrid setup**:

- **DEX** = persistent, repo-local task backbone for engineering work
- **Craft Agents** = session UI, statuses, labels, review automation, and custom skills

### Why this is the best fit

Craft Agents already gives you:
- backlog / todo / needs-review / done session workflow
- labels, views, automations, and reusable skills
- strong review-before-execute workflow

But DEX adds one thing Craft does **not** give natively as cleanly: a **structured, persistent task store** with task context, results, hierarchy, and CLI/MCP access across sessions.

That matters for your goal of **automatically reviewing completed work**. A reviewer automation can inspect a completed DEX task and its result/context much more reliably than trying to infer everything from session metadata alone.

### When DEX is *not* worth it

If you only want a lightweight personal workflow and are happy treating Craft sessions themselves as the backlog, then we can skip DEX and build:
- a couple of Craft skills
- a label taxonomy
- one review automation

That would be simpler, but weaker for:
- multi-session task continuity
- structured handoffs
- task hierarchy
- durable task/result history in git

## Important blocker found during research

DEX currently declares:
- **Node >= 24** or
- **Bun >= 1.0**

Current machine state:
- Node: **22.20.0**
- Bun: **not installed**

I was able to run DEX through `npx`, but it emits an unsupported-engine warning. So for a reliable setup, the first implementation step should be either:
1. upgrade Node to 24+, or
2. install Bun and use that runtime for DEX

## Proposed implementation

### Phase 1 — Runtime + install

1. Upgrade runtime to a supported DEX runtime
   - preferred: **Node 24 via nvm**
   - fallback: install **Bun**
2. Install DEX cleanly
   - either global install: `npm install -g @zeeg/dex`
   - or use `npx`/`bunx` in the source command if you prefer less global state

### Phase 2 — Repo-local DEX backbone

1. Configure DEX to store tasks in this workspace, not only in a global folder
2. Use a repo-local storage path like:
   - `/.dex/tasks.jsonl`
3. Add an `AGENTS.md` at the project root telling agents when to use DEX

This keeps the backlog:
- versionable
- shareable across sessions
- inspectable by Craft via MCP

### Phase 3 — Craft source integration

Create a **local MCP source** for DEX using its stdio server:

- source slug: `dex`
- transport: `stdio`
- command: `dex`
- args: `mcp --storage-path /Users/mattias/Documents/GitHub/Systembolaget-plus/.dex`

If we avoid global install, I can instead wire it through:
- `npx -y @zeeg/dex mcp --storage-path ...`

Also add:
- `guide.md` explaining how to use DEX in this workspace
- `permissions.json` so read-only task operations work in Explore mode

### Phase 4 — Craft skills

Create a small skill set that makes DEX feel native inside Craft Agents.

Recommended skills:

1. **`dex-backlog`**
   - turn discussed work into DEX tasks/subtasks
   - require rich context and acceptance criteria

2. **`dex-next-task`**
   - pick the next actionable DEX task
   - start it, link it to the session, and guide execution

3. **`dex-review`**
   - review a completed DEX task
   - validate claimed result against code/files/tests
   - either approve or create follow-up work

4. **optional: `dex-plan-import`**
   - convert a Craft-generated plan into DEX tasks
   - mirrors DEX’s `/dex-plan` behavior in a Craft-native way

## Phase 5 — Labels and workflow conventions

Extend the current labels with a minimal, useful taxonomy.

Suggested additions:

- **`dex`** — work tracked in DEX
- **`review`**
  - `needs-review`
  - `approved`
  - `changes-requested`
- **`task-type`**
  - `feature`
  - `bugfix`
  - `refactor`
  - `research`
- **value label:** `dex-task` (string)
  - example: `dex-task::abc123`

Session usage pattern:
- status = `backlog` while planned
- status = `todo` or active session when implementing
- status = `needs-review` when ready for review
- status = `done` after review passes

### Why the `dex-task::<id>` label matters

It gives automations a durable pointer from a Craft session to the exact DEX task being implemented/reviewed.

## Phase 6 — Automation for completed-task review

Add a Craft automation that creates a **review session** when work is ready.

Recommended trigger:
- **`SessionStatusChange`** → when status becomes `needs-review`

Recommended convention:
- implementation session must have:
  - label `dex`
  - label `dex-task::<taskId>`

Automation prompt should:
- read the event payload
- extract the DEX task ID from labels
- open the DEX task through the DEX source
- review the claimed result against repo changes/tests
- either:
  - mark the review session `done`, or
  - create follow-up DEX tasks / request changes

This is the key integration point where Craft becomes the **review orchestrator** and DEX remains the **task system of record**.

## Phase 7 — Validation and dry run

After setup, test this exact flow:

1. Create a DEX parent task + subtasks
2. Start one task from Craft
3. Complete implementation and record result in DEX
4. Mark session `needs-review`
5. Confirm automation spawns a review session
6. Review session reads DEX task and produces approve/request-changes outcome

Then validate:
- source config
- labels config
- skill definitions
- automations config

## Simpler alternative: no DEX

If you want maximum simplicity, I can instead implement a **Craft-only workflow**:

- sessions = backlog items
- labels = task metadata
- skills = planning / next-task / review behavior
- automations = review on `needs-review`

### Pros
- less setup
- no extra runtime dependency
- no external task store

### Cons
- weaker persistence of structured task context
- harder to do rigorous automated reviews from task records
- more custom behavior to maintain in skills/prompts

## Final recommendation

I recommend:

1. **Use DEX as the task backbone**
2. **Use Craft Agents for planning, execution, labels, statuses, and review automations**
3. Keep the setup minimal: one DEX source, 3 focused skills, one review automation, and a small label extension

This gives you a simple workflow without re-implementing DEX inside Craft.

## What I would implement next after approval

1. upgrade/install supported DEX runtime
2. install/configure DEX
3. create the Craft `dex` source
4. add `AGENTS.md`
5. create the 3 Craft skills
6. extend labels
7. add review automation
8. validate everything and run one end-to-end test


## Plan validation (review)

### Existing patterns found
- This workspace already has a useful status flow: `backlog` → `todo` → `needs-review` → `done`.
- Labels already distinguish development/content/priority/project, so the DEX integration only needs a small extension instead of a new taxonomy.
- Craft Agents already supports skills, sources, and automations natively, so the plan should reuse those features rather than re-implementing a task system from scratch.

### Simplicity review
- **Keep DEX**: it adds durable task context, hierarchy, and results without requiring us to recreate a full persistent backlog in custom Craft skills.
- **Use one local MCP source** instead of multiple adapters.
- **Use one review automation** triggered by `needs-review`; avoid adding extra workflow states.
- **Use 4 focused skills** instead of one large workflow skill so each step stays understandable and reusable.

### Best-practice review
- DEX already provides a native `plan` command and stdio MCP server, so the plan should rely on those instead of building a custom parser or task store.
- Repo-local DEX storage in `.dex/` is the simplest shared setup for a git-backed project.
- Craft session labels should only carry lightweight routing metadata, with DEX remaining the source of truth for structured task data.

### Dependency order validation
1. Install and verify DEX runtime/CLI
2. Configure repo-local storage and project guidance
3. Add the Craft DEX source
4. Add skills for validation, backlog creation, next-task selection, and review
5. Extend labels minimally
6. Add the review automation
7. Validate and test the end-to-end flow

This order is correct because the source and skills depend on DEX being available, and the automation depends on both labels and the review skill.

### Verification method review
- **DEX installation**: verify local CLI runs and `dex --help` succeeds.
- **Source integration**: validate with Craft `source_test`.
- **Skills**: validate each `SKILL.md` with `skill_validate`.
- **Labels and automation**: validate with Craft config validation.
- **Backlog flow**: verify a plan can be converted into a parent DEX task with subtasks.
- **Review flow**: verify moving a DEX-linked session to `needs-review` creates the expected review session.

### Scope corrections
- Do **not** add extra workflow states.
- Do **not** replace DEX with a fully custom Craft-only clone.
- Do **not** add sync targets like GitHub/Shortcut yet; keep v1 focused on local DEX + Craft automation.
