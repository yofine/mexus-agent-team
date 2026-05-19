---
name: continue
description: Use when resuming an existing active Markdown-backed Agent Team Mission in a later Claude Code or Codex session.
argument-hint: "[--name <mission-name>] [--limit <count>]"
---

# `/mexus-team:continue`

Use this skill when the user invokes `/mexus-team:continue`.

This skill **only continues an existing active Mission**. It does not create a Mission, does not archive anything, and does not re-plan the roster or kanban. To create a new Mission, use `/mexus-team:mission "<request>"` instead.

Use this when a Mission was started in an earlier session and the user returns to keep it moving. Within a single `/mexus-team:mission` session, Squad Lead already dispatches follow-up work automatically, so `/mexus-team:continue` is not needed there.

## Steps

1. Locate the active mission under `agent-team/missions/`, or use `--name <mission-name>` if provided. If no active lifecycle marker exists, fall back to the newest mission. If no Mission exists at all, tell the user to run `/mexus-team:mission "<request>"` first.
2. Read:
   - `agent-team/mission-workflow.md`
   - `agent-team/agents.md`
   - `agent-team/missions/<mission-name>/mission.md`
   - `agent-team/missions/<mission-name>/agents.md`
   - `agent-team/missions/<mission-name>/kanban.md`
   - `agent-team/missions/<mission-name>/roundtable.md`
   - `agent-team/missions/<mission-name>/squad-lead.md`
3. Act as Squad Lead for the existing plan. Do not re-decompose the Mission and do not rewrite the existing roster. Take the kanban as the source of truth.
4. Select the outstanding actionable tasks: unclaimed tasks under `To Claim`, and any `In Progress` task that has been abandoned by a finished session.
5. Use the Agent tool to start Claude Code or Codex background Agents in parallel for the selected batch. Respect `--limit <count>` when present; otherwise dispatch a small safe batch.
6. Require every background Agent to claim, update, and complete its own task block in `kanban.md` before reporting back.
7. Keep coordinating in this session: as Agents finish or new actionable tasks appear, dispatch the next background Agents.
8. Review completed tasks only when the task publisher is Squad Lead. Perform mission-level acceptance after publisher reviews. If the overall result is below expectation, publish new focused tasks to the responsible Agents.

## Background Agent Prompt Requirements

Every background Agent prompt must include:

- Mission name.
- Agent name and responsibility from mission `agents.md`. Reuse the existing Mission Agents; do not invent new names when a suitable one already exists.
- Exact current task block from `kanban.md`.
- A clear statement that this is the first/current assigned task, not all future work.
- Requirement to read the mission files before editing.
- Requirement to claim the task by moving the full task block to `In Progress`.
- Requirement to write `Result`, `Files`, `Verification`, and `Updated` in its own task block.
- Requirement to move the task to `Done` only after verification.
- Requirement to leave `Review` for the publishing Agent named in `From`.
- Instruction to prioritize kanban-assigned work.
- If the task is outside its responsibility and the correct owner is clear, reassign it in `kanban.md` with a brief reason in `Updated`.
- If ownership is unclear, publish a clarification task assigned to the Squad Lead.
- No Mexus server, pane dispatch, Mission Inbox, or external A2A dependency.

## Rules

- Kanban is the source of truth.
- `Squad Lead` is a fixed coordination role name and is not an execution Agent name.
- Kanban task `From` must be Squad Lead or an executing Agent, never `User`.
- Every work item follows publisher acceptance: publisher creates task, executor completes and self-tests, publisher fills `Review`.
- Squad Lead owns mission-level acceptance and publishes new tasks for gaps instead of rewriting another Agent's task result.
- If new execution Agents are genuinely required for outstanding work, name them at random from the Ars Goetia / Lesser Key of Solomon set, with no repeat of an existing Mission Agent or `agent-team/agents.md` entry.
- After meaningful completed work is accepted, update the repository-level `agent-team/agents.md` roster with the Agent's durable module ownership, known strengths, and Work history. Do not put mission-specific prompts in the repository roster.
- By default, continue only the current active Mission. Archived Missions are historical unless the user explicitly passes `--name`.
- The executing background Agent updates the kanban task it owns. The Squad Lead does not fill execution results for that Agent.
- Do not re-dispatch tasks that are actively `In Progress` in a live session unless the user explicitly asks for recovery.
- Do not mutate board process state.
- Publish follow-up tasks instead of crossing scope boundaries.
- Use `roundtable.md` for decisions that affect multiple Agents, shared interfaces, mission scope, product direction, sequencing, acceptance criteria, or major risk trade-offs.

## Publisher Review

When no assigned `To Claim` task remains:

1. Check `Done` for tasks where `From` is the current Agent and `Review` has no accepted marker.
2. Review only those tasks.
3. If accepted, fill `Review`.
4. If rejected, publish a focused fix task under `To Claim`.

## Output

After dispatching or executing work, report:

- Mission name.
- Tasks selected to resume.
- Background Agents dispatched.
- Any tasks reassigned or clarification tasks created.
- Verification status for completed tasks.
