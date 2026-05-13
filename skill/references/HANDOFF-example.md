# 🤝 Project Handoff
> Generated: 2026-05-13 14:32
> Session goal: Build NoSQL task schema and clean up file structure

---

## 🗂 Project Snapshot
**Name:** TaskFlow
**Purpose:** Collaborative task/project management system with shared subtasks
**Stack:** Node.js, Express, MongoDB (Mongoose), React, Tailwind
**Dev command:** `npm run dev`
**Test command:** `npm test`

### Folder Structure
```
taskflow/
├── src/
│   ├── features/        # Domain-grouped feature modules
│   │   ├── tasks/       # Task CRUD, subtask logic, assignment
│   │   ├── users/       # Auth, profile, preferences
│   │   └── projects/    # Project grouping and membership
│   ├── shared/          # Shared utilities, middleware, types
│   └── config/          # DB connection, env config
├── client/              # React frontend
├── tests/               # Jest test suites
├── HANDOFF.md           # ← this file
└── CLAUDE.md            # Project instructions for Claude Code
```

---

## ✅ This Session: Completed
- Designed MongoDB schema for shared tasks (single document, no per-user duplication)
- Added `assignees[]` array with embedded per-user progress tracking
- Separated `sharedSubtasks[]` vs `userSubtasks{}` map in task document
- Reorganized file structure from type-based to feature-based grouping
- Removed 3 duplicate route files (`routes/task-old.js`, `routes/v1/tasks.js`, `utils/taskHelper.js`)
- Created `features/tasks/task.model.js` with new Mongoose schema

## 🔄 In Progress / Incomplete
- `features/tasks/task.service.js` — business logic stubbed, not fully implemented
- No tests written yet for the new schema
- Frontend components still reference old API shape (`/api/v1/tasks` → needs updating to `/api/tasks`)

## ⏭ Next Step
Implement `task.service.js` — specifically the `assignTask(taskId, userId)` and
`completeSubtask(taskId, subtaskId, userId)` functions that update per-user progress
without touching other assignees' state.

---

## 🧠 Key Decisions
- **Single document per task** — moved away from MySQL-style per-user row duplication; MongoDB embedding handles per-user state cleanly
- **`userSubtasks` as a Map keyed by userId** — allows O(1) lookup per user without scanning arrays
- **Shared subtasks use completion array** — `completedBy: [userId]` so partial completion is trackable
- **Feature-based folder structure** — rejected type-based (`/routes`, `/models`, `/controllers`) in favour of `/features/tasks/` containing all task-related files

---

## 📁 Active Files
| File | Status | Notes |
|------|--------|-------|
| `src/features/tasks/task.model.js` | ✅ Created | New Mongoose schema, replaces old `models/Task.js` |
| `src/features/tasks/task.service.js` | ⚠️ Incomplete | Stubbed — needs `assignTask` and `completeSubtask` |
| `src/features/tasks/task.routes.js` | ✏️ Modified | Updated to use new service, old v1 routes removed |
| `src/config/db.js` | ✅ Keep | Unchanged, Mongoose connection config |

---

## ⚠️ Gotchas & Lessons Learned
- Old `models/Task.js` is deleted — do not recreate it; the new model is in `features/tasks/`
- `npm test` currently fails on 2 tests that reference the old schema shape — expected, fix after service layer is done
- Mongoose `Map` type requires `type: Map, of: SchemaType` syntax — not a plain object
- The `assignees` field uses refs to User, but subtask progress is embedded (not referenced) for query performance

---

## 📋 Pending Tasks
1. Implement `task.service.js` — `assignTask()` and `completeSubtask()`
2. Update frontend API calls from `/api/v1/tasks` → `/api/tasks`
3. Write tests for new schema (shared subtask partial completion edge case)
4. Add index on `assignees` field for "tasks by user" query performance
5. Update API docs / Postman collection

---

## 🚀 How to Resume

```bash
cd taskflow
npm run dev       # start dev server on :3000
npm test          # expect 2 failures (known, schema migration)
```

**Suggested first prompt for new session:**
> "Read HANDOFF.md. Continue from where we left off — implement `assignTask(taskId, userId)` and `completeSubtask(taskId, subtaskId, userId)` in `src/features/tasks/task.service.js`. The schema is already done in `task.model.js`. Make sure completing a shared subtask only marks it done for that user, not all assignees."

---
*To load this in a new session: `cat HANDOFF.md` or tell Claude: "read HANDOFF.md and continue from there"*
