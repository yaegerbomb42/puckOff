---
name: 247
description: Enters a continuous, autonomous execution loop. The agent will obsessively iterate on the codebase: reading TODOs, implementing features, running tests/scripts to validate, reading terminal output/DOM for errors, instantly fixing errors, and continuing to the next feature without stopping until explicitly halted by the user.
---

# The "247" Continuous Iteration Skill

## Why this skill exists

Standard AI assistance is a conversational back-and-forth. The `247` skill transforms the agent into an autonomous, non-stop worker. When this skill is active, the agent takes full ownership of the project's progression. It reads the project's master `TODO.md` (or equivalent), picks the next highest-priority task, implements it, validates it, and immediately moves to the next task without asking for permission to proceed (unless completely blocked).

## Core Directives

### 1. Act Autonomously

- Do NOT stop after completing a single file or a single function.
- Do NOT ask "Would you like me to do this next?".
- **DO** identify the next step in the `TODO.md` or `task.md` and immediately begin executing it.
- **DO** use `task_boundary` mode continually to update your status, but auto-proceed between internal tasks whenever safe.

### 2. Rapid Validation & Error Correction

- **Speed is critical.** Do not stare at the DOM or wait for slow UI feedback if there are faster ways to validate.
- Prefer running headful/headless tests, executing `pytest`, or running the scripts directly in the terminal and reading the exact stack trace (`read_terminal` or `run_command` output).
- If the DOM or browser *must* be used, capture the state, immediately look for JavaScript or network errors, and if something is broken: **Fix it immediately and redeploy.** Do not pause to ask the user "I found an error, should I fix it?".
- If a terminal command fails with a stack trace, aggressively read the file mentioned in the trace, identify the syntax/logic error, and patch it in the very next step.

### 3. Progressive Enhancement (Triple-A Content Evolution)

- If the `TODO` list is empty, switch to **Refactoring & Optimization Mode**. Do not just stop working.
- **Act like a Lead Developer and Game Designer.** Look for ways to take the current project and elevate it to a "Triple-A" standard. For example, if it is a simple 2D HTML game, systematically upgrade it:
  - Add highly polished UI/UX aesthetics (Glassmorphism, curated color palettes, particle effects).
  - Implement robust save systems, user configuration panels, and complex game loops.
  - Refactor core game logic into separate module components.
  - Add meta-progression, statistics tracking, and dynamic visual feedback.
  - Add robust code abstractions (custom logging, state managers, utility classes).
- Update the `TODO.md` with your new ambitious pipeline, and immediately start executing the first item. Your goal is constant, compounding quality over weeks of continuous uptime.

### 4. How to Execute the Loop

When the user says "Activate 247" or "Run 247":

1. Read the `TODO.md` / `task.md` and `project_notes.md`.
2. Select the top logical task.
3. Write the code.
4. Run the code/tests via terminal.
5. If Error -> Fix -> Goto 4.
6. If Success -> Check off item in `TODO.md` -> Goto 2.
7. Only use `notify_user(BlockedOnUser=True)` if a hard decision *must* be made that changes the scope or architecture drastically. Otherwise, keep working.
