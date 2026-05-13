---
name: project-handoff
description: >
  Generates a structured session handoff snapshot so context can be carried into a
  new Claude Code session without wasting tokens re-reading files. Trigger this skill
  whenever the user says things like: "summarize this session", "save context for next
  session", "handoff", "context is getting full", "starting a new session", "run /handoff",
  "/project-handoff", "save my session", "I need to close and continue later",
  "don't want to re-explain everything", or anything about continuing work across sessions.
  Also trigger proactively when context usage appears high (many files read, long session).
---

# Project Handoff Skill

Captures the current session state into a portable `HANDOFF.md` file that a new Claude
Code session can read instantly — no re-reading source files, no re-explaining architecture.

---

## When to Run

- User types `/handoff`, `/project-handoff`, or `/save-session`
- User says they're about to start a new session
- Context window is getting long (70%+ full)
- User says "summarize this session" or similar
- Before running `/clear`

---

## What to Capture

Work through each section below. Use your knowledge from the current session —
do NOT re-read files unless a specific detail is uncertain.

### 1. Project Snapshot
- Project name and one-line purpose
- Tech stack (language, framework, database, key libraries)
- Folder structure — top-level only, annotated (what each folder is for)
- Entry points (main file, dev command, test command, build command)

### 2. Session Summary
- What was the goal of this session?
- What was actually completed? (bullet list, be specific)
- What is still in progress or blocked?
- What is the very next step to continue?

### 3. Key Decisions Made
- Architecture or design decisions taken this session
- Why certain approaches were chosen or rejected
- Any tradeoffs accepted

### 4. Active Files
- Files that were created this session
- Files that were modified this session
- Files that are currently broken or incomplete

### 5. Gotchas & Lessons Learned
- Bugs found and how they were fixed
- Things that didn't work and why
- Anything a fresh session should NOT do

### 6. Pending Tasks
- Short prioritized list of what remains
- Include any known blockers or dependencies

### 7. How to Resume
- Exact command(s) to run to get back into working state
- Any env vars, credentials, or config that needs to be set
- Suggested first prompt for the new session

---

## Output Format

Write the handoff to **`HANDOFF.md`** in the project root.

Use this exact template:

```markdown
# 🤝 Project Handoff
> Generated: {DATE_TIME}
> Session goal: {ONE_LINE_GOAL}

---

## 🗂 Project Snapshot
**Name:** {project name}
**Purpose:** {one sentence}
**Stack:** {tech stack}
**Dev command:** `{command}`
**Test command:** `{command}`

### Folder Structure
\```
{annotated top-level tree}
\```

---

## ✅ This Session: Completed
{bullet list of what was done}

## 🔄 In Progress / Incomplete
{bullet list — include file names where relevant}

## ⏭ Next Step
{single most important next action — be specific}

---

## 🧠 Key Decisions
{bullet list of decisions + brief rationale}

---

## 📁 Active Files
| File | Status | Notes |
|------|--------|-------|
| `path/to/file` | ✅ Created / ✏️ Modified / ⚠️ Broken | what it does |

---

## ⚠️ Gotchas & Lessons Learned
{bullet list — what to avoid, what was tricky, what was fixed}

---

## 📋 Pending Tasks
1. {highest priority}
2. {second}
3. {etc.}

---

## 🚀 How to Resume

\```bash
# Get back to working state
{commands}
\```

**Suggested first prompt for new session:**
> {exact prompt the user can paste to orient the new session immediately}

---
*Paste this file path at the start of your new session:*
*`cat HANDOFF.md` or just tell Claude: "read HANDOFF.md and continue from there"*
```

---

## After Writing HANDOFF.md

Tell the user:
1. The file has been saved to `HANDOFF.md` in the project root
2. How to resume: `claude --continue` if resuming same session, or start fresh and say `"read HANDOFF.md and continue from there"`
3. Optionally: they can run `/clear` now safely — the handoff is saved

Do NOT delete or overwrite an existing `HANDOFF.md` without asking. Append a timestamp
suffix instead: `HANDOFF-{YYYYMMDD-HHMM}.md`

---

## Notes

- Keep the handoff under ~200 lines — it's meant to be fast to read, not exhaustive
- Prefer specifics over vague summaries ("added POST /api/tasks route" not "worked on API")
- The "Suggested first prompt" is the most valuable part — make it precise and actionable
- This pairs well with `CLAUDE.md` — if the project has one, mention it in the handoff
