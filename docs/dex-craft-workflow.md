# Agent workflow

Follow [AGENTS.md](../AGENTS.md) and the reusable guidance in `skills/` when making changes.

Craft sessions, source credentials, automation logs, and DEX task state are local workspace files. They are ignored by git and are not part of the extension.

DEX is optional agent tooling. Supply a compatible `dex` executable on `PATH` separately; `npm ci` installs only the extension's build and test dependencies. The wrapper uses the executable on `PATH` and does not depend on a particular user directory or Node installation.

```sh
npm run dex:list
npm run dex -- create "Task name" --description "Why, what, how, and verification"
```

Store plans and task results in the local `.dex/` directory. If DEX is unavailable, record the plan locally and report that task tracking could not run. Product verification remains `npm run build`, `npm test`, and `npm audit`.
