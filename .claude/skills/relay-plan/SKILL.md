---
name: relay-plan
description: Turn an agreed project idea into a goal card and task graph on the Relay board. Use when the humans have chosen an idea and say /relay-plan, or ask to plan the build on Relay. This skill plans only. It never starts the build.
---

# Plan the build on Relay

The humans have agreed an idea. Your job is one call to `create_tasks` that gives two agents a good plan. You write no project code. You claim nothing.

The idea is: $ARGUMENTS

## Before you plan

1. Call `relay_status`. If the board already holds tasks, stop and tell the humans. They clear it with `node scripts/new-plan.mjs --yes` in the relay folder.
2. If the idea leaves a gap that would change what gets built, ask the humans. Ask at most three questions, in one round. Make every other choice yourself.
3. Keep the scope to one flow that works end to end. Two agents have one day. Cut anything the demo does not need.

## The goal card

Pass `goal_card` to `create_tasks`. Write three or four plain sentences: what the product does, who it helps, the demo moment, and what is out of scope.

## Rules for the task graph

Build 8 to 14 tasks.

**Order**
- Task 1 is the scaffold: framework, every dependency the plan needs, and the checks. Put all dependencies here, because each later dependency change is Red and needs a human.
- Task 2 is a `contract` task. It defines the shared types, routes or schema in one file. It depends on the scaffold.
- Tasks that use the contract depend on it. They cannot start until it is accepted and frozen.
- The last task is the integration task. See below.

**Parallel work**
- Two agents should have work at the same time, as early as possible. Prefer a wide graph over a long chain.
- Add a dependency only when a task truly cannot start without the other. Every extra link slows the day.
- Each task owns its own folder or files in `owned_paths`. No two tasks may share a path, except the integration task, which owns none.
- Use repo-relative paths, such as `app/upload/`. Relay refuses `..` and absolute paths.

**Size**
- One agent should finish a task in under 45 minutes. Relay holds a task that runs over budget.
- Split anything bigger. Join anything under 10 minutes into a neighbour, because each task also costs a review.

**Done checks**
- Every task needs a `done_check`, written now, before the build.
- It must be something a reviewer can run and see pass or fail. "Run npm test" is weak. "Upload the sample pack. The results table flags one duplicate" is good.

**Signals**

Relay sets each task's signal from its paths, and you cannot change it.
- Red paths wait for a human, at the start and at the end: schema, auth, secrets, CI, `.claude/`, dependency files and production settings.
- Keep Red tasks few. Avoid auth, and keep database schema inside one task. Name folders plainly, because any path containing `auth` or `secret` turns Red.
- Paths under `lib/`, `shared/`, `core/` or `types/` are Amber, and so are tasks that depend directly on a contract. Amber adds a 5-minute wait for a human veto after review.

**Integration task**
- Add one final task, with no `owned_paths`, titled "Integrate and test the full flow".
- It depends on every task with no dependants, so it opens only when the build is finished.
- Its goal: connect the pieces, fix the joins, and run the demo path from start to finish.
- For a plan over 10 tasks, also add a halfway integration task after the first working flow.

**Task text**
- Task text is read by a fresh agent with no memory of this chat. Put everything it needs in `goal`.
- Keep secrets and client data out. Use summaries.
- Use `ref` names so that tasks can name each other in `depends_on`. Keys such as T-1 are given by Relay.

## After the call

1. If `create_tasks` refuses, fix the plan and call it once more.
2. Show the humans a short table: key, title, what it depends on, and its state.
3. Name the longest chain of tasks, because it sets the finish time.
4. List the Red tasks, because each one needs a human to click Release, then Accept.
5. Tell them both to read the cards on the board, then click Approve plan.
6. Tell them that each person then opens a fresh chat in this repo and types: Work the Relay board in this repo.
7. Stop. Do not claim a task. Do not write code.
