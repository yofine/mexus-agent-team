# Mexus Agent Team

<img width="1919" height="934" alt="image" src="https://github.com/user-attachments/assets/0cddab1a-ce12-4a5b-a914-eb2c6f0e3553" />

Standalone Markdown-only Agent Team plugin for Claude Code and Codex.
Coordination happens through ordinary Markdown files in the current project:

```text
agent-team/
├── mission-workflow.md
├── agents.md
└── missions/<mission-name>/
    ├── mission.md
    ├── agents.md
    ├── kanban.md
    ├── roundtable.md
    └── squad-lead.md
```

## Commands

Claude Code plugin skills are always namespaced by the plugin name. This plugin uses the `mexus-team` namespace.

```text
/mexus-team:mission "<request>"    Create a new Markdown-backed Agent Team Mission and start executing it.
/mexus-team:continue               Resume the active Mission in a later session.
/mexus-team:roundtable "<topic>"   Open a RoundTable proposal for a shared decision.
/mexus-team:board                  Start a local read-only Web board for agent-team/.
/mexus-team:status                 Print a concise Mission summary.
```

`/mexus-team:mission` creates a Mission, then immediately plans the squad, starts the board, and dispatches the first background Agents. `/mexus-team:continue` is only for picking a Mission back up after the original session has ended — within one `mission` session Squad Lead dispatches follow-up work on its own.

## Claude Code Session-Only Usage

Use this when you only want to load the local plugin for the current Claude Code session.

From any project directory:

```bash
claude --plugin-dir /absolute/path/to/mexus-agent-team
```

Then run:

```text
/mexus-team:mission "Build a small demo feature"
/mexus-team:continue
/mexus-team:roundtable "Decide the API boundary"
/mexus-team:board
/mexus-team:status
```

`--plugin-dir` loads a session-only plugin. It may not appear as an installed plugin in `/plugin list`; use `/help` or invoke `/mexus-team:mission` to verify the loaded skills.

If `/mexus-team:mission` is not found:

```bash
claude plugin validate /absolute/path/to/mexus-agent-team
claude --plugin-dir /absolute/path/to/mexus-agent-team --debug-file /tmp/mexus-team-debug.log
```

The debug log should contain:

```text
Loaded inline plugin from path: mexus-team
Loaded skills from plugin mexus-team default directory
```

Do not pass `--disable-slash-commands`.

## Claude Code Local Marketplace Install

Use this when you want Claude Code to install the local plugin through a local marketplace entry. The marketplace file is inside this plugin directory at `.claude-plugin/marketplace.json`, so add the plugin directory itself as the marketplace path:

```bash
claude plugin marketplace add /absolute/path/to/mexus-agent-team
claude plugin install mexus-team@mexus-team
claude plugin list
```

Then start Claude Code normally from any project directory and invoke:

```text
/mexus-team:mission "Build a small demo feature"
```

If installation cannot find the marketplace file, make sure the path points at:

```text
/absolute/path/to/mexus-agent-team/.claude-plugin/marketplace.json
```

Do not pass the parent `plugins/` directory unless that parent contains its own `.claude-plugin/marketplace.json`.

To update after editing this local plugin, reinstall or remove/install it again:

```bash
claude plugin uninstall mexus-team
claude plugin install mexus-team@mexus-team
```

## Claude Code Marketplace Shape

This directory also carries `.claude-plugin/marketplace.json`, following the Waza-style layout:

- bundle entry `mexus-team`, source `./`, registers every skill under `/mexus-team:*`;
- per-skill entries such as `mexus-team-mission`, source `./skills/mission`, for future single-skill installs.

For local development, keep using `--plugin-dir` against this directory. For distribution, publish this directory or its future standalone repository as a Claude Code marketplace and install the bundle entry.

## Typical Workflow

1. Start Claude Code in your project.
2. Create a Mission and start executing it:

   ```text
   /mexus-team:mission "Implement the feature or fix"
   ```

   This plans the squad, publishes kanban tasks, starts (or reuses) the board, and dispatches the first background Agents. Squad Lead keeps coordinating follow-up tasks within the same session.

3. Open the board if you want to watch separately:

   ```text
   /mexus-team:board
   ```

   The board is read-only. It shows Mission Plan, Kanban, Agents, Squad Lead Log, and RoundTable.

4. Open a RoundTable proposal when a shared decision is needed:

   ```text
   /mexus-team:roundtable "Choose the API boundary"
   ```

5. Check status:

   ```text
   /mexus-team:status
   ```

6. Resume the Mission later, in a new session:

   ```text
   /mexus-team:continue
   ```

## Board Access

The board command starts a local Vite board and an API server. By default it binds to `0.0.0.0` so it can be opened from another machine if your network allows it. If a board is already running for the project it is reused and its URL is reprinted instead of starting a second one.

Useful options:

```text
/mexus-team:board --host 0.0.0.0
/mexus-team:board --host 0.0.0.0 --public-host <lan-ip-or-hostname>
```

The board is a foreground process. Stop it with `Ctrl+C` in the terminal where it runs.

## Execution Model

`Squad Lead` is a fixed coordination role name and is not part of the execution Agent naming pool. `/mexus-team:mission` creates the Mission, then Squad Lead plans execution Agents and actionable kanban tasks, starts the board, and dispatches the first background Agents. Squad Lead's decomposition work is not itself a kanban task.

Squad Lead starts Claude Code or Codex background Agents to execute kanban tasks. Background Agents must use names from the `agent-team-mission-workflow` convention — short names drawn at random from the Ars Goetia / Lesser Key of Solomon set, never sequential placeholders. They read the Mission files, claim tasks in `kanban.md`, write their own task results back to `kanban.md`, and publish follow-up or clarification tasks when needed. Squad Lead does not fill execution results for another Agent.

Every kanban work item follows publisher acceptance: the task publisher creates the task, the executor completes and self-tests it, then the publisher fills `Review`. Squad Lead also performs overall Mission acceptance; when the Mission is still below expectation, Squad Lead publishes new focused tasks to the responsible Agents. If an executor finds a task outside its responsibility, it reassigns the task when the correct owner is clear, or publishes a clarification task to Squad Lead when ownership is unclear.

Within a single `/mexus-team:mission` session, Squad Lead selects new `To Claim` tasks and dispatches the next background Agents itself as work progresses — the user does not run a command for in-session follow-up. `/mexus-team:continue` exists only to resume a Mission whose original session has ended; it reads the existing kanban and restarts outstanding tasks without re-planning the Mission.

Starting a new Mission archives the previous active Mission. `/mexus-team:continue` uses the current active Mission by default; archived Missions are historical unless explicitly selected by name.

This plugin does not require a Mexus server, panes, or a Mission Inbox, and uses no external A2A layer. The kanban file is the communication protocol.

## Roster Maintenance

`agent-team/agents.md` is the repository-level reusable Agent roster. It should be updated from accepted Mission work, not edited as ad-hoc scratch space. The active Mission's `agents.md` and accepted `kanban.md` tasks are the source for durable module ownership, known strengths, and work history.

## Verify Locally

```bash
node tests/standalone-smoke.test.mjs
```

To try it in a temp project:

```bash
mkdir -p /tmp/mexus-agent-team-demo
cd /tmp/mexus-agent-team-demo

node /absolute/path/to/mexus-agent-team/scripts/start-mission.mjs \
  --root "$PWD" \
  --name demo-mission \
  --request "Build a small demo feature"

node /absolute/path/to/mexus-agent-team/scripts/status.mjs --root "$PWD" --name demo-mission
node /absolute/path/to/mexus-agent-team/scripts/start-board.mjs --root "$PWD" --host 0.0.0.0
```
