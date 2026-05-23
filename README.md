<div align="center">
  <h1>Mexus Agent Team</h1>
  <p><b>A Markdown-only agent team workflow for Claude Code and Codex.</b></p>
</div>

<br/>

<img width="1919" height="934" alt="Mexus Agent Team board" src="https://github.com/user-attachments/assets/0cddab1a-ce12-4a5b-a914-eb2c6f0e3553" />

## Why

A **Mission** is a bounded objective. A **Squad Lead** decomposes it, names a squad, and publishes tasks to a kanban. Background Agents claim tasks, do the work, and write results back. Every handoff is a Markdown edit you can open, diff, and review.

The kanban file *is* the coordination protocol. If you can read `kanban.md`, you know what every agent is doing and why.

This is a standalone plugin for **Claude Code** and **Codex**. It does not require a Mexus server, panes, a Mission Inbox, or external A2A messaging — coordination happens entirely through the `agent-team/` Markdown files.

## How It Works

Coordination lives entirely in one directory of your project:

```text
agent-team/
├── mission-workflow.md          the reusable collaboration rules
├── agents.md                    repository-level reusable agent roster
└── missions/<mission-name>/
    ├── mission.md               goal, lifecycle, constraints
    ├── agents.md                this Mission's squad and prompts
    ├── kanban.md                task source of truth — the protocol
    ├── roundtable.md            shared decisions
    └── squad-lead.md            Squad Lead coordination log
```

- **Squad Lead** is a fixed coordination role — it plans, dispatches, sequences, and accepts. It never writes another agent's results.
- **Mission Agents** are background workers, named at random from the 72 spirits of the Ars Goetia. Each claims one scoped task, self-tests it, and fills in its own kanban block.
- **Publisher acceptance**: whoever publishes a task (`From`) reviews and accepts it. Squad Lead does mission-level acceptance on top.

Starting a new Mission archives the previous active one. Agents communicate only through the kanban file.

## Commands

Plugin skills are namespaced by the plugin. This plugin uses the `mexus-team` namespace.

| Command | When | What it does |
| :--- | :--- | :--- |
| [`/mexus-team:mission`](skills/mission/SKILL.md) `"<request>"` | Starting a new piece of work | Creates a Mission, archives the old one, plans the squad and kanban, starts the board, and dispatches the first background Agents. |
| [`/mexus-team:continue`](skills/continue/SKILL.md) | Resuming a Mission in a later session | Reads the existing kanban and restarts outstanding tasks. No re-planning, no archiving. |
| [`/mexus-team:roundtable`](skills/roundtable/SKILL.md) `"<topic>"` | A decision affects multiple agents | Opens a RoundTable proposal for a shared decision. |
| [`/mexus-team:board`](skills/board/SKILL.md) | Watching a Mission run | Starts a local read-only Web board over `agent-team/`. |
| [`/mexus-team:status`](skills/status/SKILL.md) | A quick terminal check | Prints a concise Mission and task summary. |

Within one `/mexus-team:mission` session, Squad Lead dispatches follow-up tasks on its own — you do not run a command for that. `/mexus-team:continue` exists only to pick a Mission back up after the original session has ended.

## Install

In Claude Code, add the marketplace from the GitHub repo and install the bundle:

```text
/plugin marketplace add yofine/mexus-agent-team
/plugin install mexus-team@mexus-team
/reload-plugins
```

`mexus-team@mexus-team` is `<plugin-name>@<marketplace-name>`. Both are defined in `.claude-plugin/marketplace.json`; the GitHub repo slug (`mexus-agent-team`) is not the install handle.

The bundle registers all five commands under the `mexus-team:` namespace. The marketplace also carries per-skill entries such as `mexus-team-mission@mexus-team` for future single-skill installs; install the bundle for now.

To update after the upstream changes:

```text
/plugin uninstall mexus-team
/plugin install mexus-team@mexus-team
/reload-plugins
```

## Workflow

A typical Mission, start to finish:

1. **Create and run** — `/mexus-team:mission "Implement the feature or fix"`. This plans the squad, publishes kanban tasks, starts the board, and dispatches the first Agents. Squad Lead keeps coordinating follow-up work in the same session.
2. **Watch** — open the board separately with `/mexus-team:board` if you want a live view. It shows Mission Plan, Kanban, Agents, Squad Lead Log, and RoundTable.
3. **Decide** — `/mexus-team:roundtable "Choose the API boundary"` when a choice spans multiple agents or shared interfaces.
4. **Check** — `/mexus-team:status` for a quick terminal summary.
5. **Resume** — `/mexus-team:continue` in a new session to keep an unfinished Mission moving.

## Board

The board command starts a local Vite app and an API server. By default it binds to `0.0.0.0`, so it can be opened from another device on your network. If a board is already running for the project, it is reused and its URL reprinted instead of starting a second one.

```text
/mexus-team:board --host 0.0.0.0
/mexus-team:board --host 0.0.0.0 --public-host <lan-ip-or-hostname>
```

The board is read-only and runs in the foreground — stop it with `Ctrl+C` in its terminal.

## Roster Maintenance

`agent-team/agents.md` is the repository-level roster of reusable Agents. It is updated from accepted Mission work, not edited as scratch space — the active Mission's `agents.md` and accepted `kanban.md` tasks are the source for durable module ownership, known strengths, and work history.

## Design Notes

- The whole protocol is Markdown in the repo. Coordination is a file edit, review is a diff, and the history is in `git log`.
- `Squad Lead` is the single fixed coordination role; execution Agents are named at random from the Ars Goetia set, so a name is a handle and not a task label.
- Commands have non-overlapping jobs: `mission` only creates, `continue` only resumes, the rest only observe.

## Verify Locally

```bash
node tests/standalone-smoke.test.mjs
```

Try it against a temp project:

```bash
mkdir -p /tmp/mexus-agent-team-demo
cd /tmp/mexus-agent-team-demo

node /absolute/path/to/mexus-agent-team/scripts/start-mission.mjs \
  --root "$PWD" --name demo-mission --request "Build a small demo feature"

node /absolute/path/to/mexus-agent-team/scripts/status.mjs --root "$PWD" --name demo-mission
node /absolute/path/to/mexus-agent-team/scripts/start-board.mjs --root "$PWD" --host 0.0.0.0
```

## License

Apache-2.0. Use it and contribute back.
