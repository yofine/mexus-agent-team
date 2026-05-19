---
name: board
description: Use when showing a Web board for a Markdown-only Agent Team Mission without a Mexus server.
argument-hint: "[--host <host>] [--public-host <host-or-ip>] [--port <port>]"
---

# `/mexus-team:board`

Use this skill when the user invokes `/mexus-team:board`.

The board is read-only. It reads the current project's `agent-team/` directory and does not require Mexus, A2A, pane state, or a server beyond the board process. By default it binds to `0.0.0.0` so it can be opened from another device on the same network.

## Steps

1. Verify `agent-team/` exists in the current project. If not, ask the user to run `/mexus-team:mission "<request>"` first.
2. Start the board:

   ```bash
   node <plugin-root>/scripts/start-board.mjs --root "$PWD" --host 0.0.0.0
   ```

3. Print the externally reachable board URL.

If the printed IP is not reachable, rerun with an explicit public host:

```bash
node <plugin-root>/scripts/start-board.mjs --root "$PWD" --host 0.0.0.0 --public-host <host-or-ip>
```

The script reuses a board that is already running for this project: if `.mexus-agent-team/board.json` points at a live process it prints that board's URL instead of starting a second one.

## Rules

- Read the caller project's `agent-team/`, not plugin reference files.
- Do not mutate Mission files from the board.
- Use `--host 127.0.0.1` only when the user explicitly wants local-only access.
- Use `/mexus-team:status` for a terminal summary.
- The board is a foreground process; the user stops it with `Ctrl+C`.
