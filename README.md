# project-handoff

> A Claude Code skill that generates a `HANDOFF.md` session snapshot — so you can continue work in a new session without re-reading files or re-explaining your project.

---

## The Problem

Claude Code sessions have a context window limit. When it fills up:
- Starting a new session means Claude re-reads all your files from scratch
- You waste tokens (and time) re-explaining your stack, decisions, and current state
- `--continue` and `--resume` help, but don't give you a clean structured snapshot

## The Solution

Run `/handoff` at any point. Claude writes a `HANDOFF.md` to your project root capturing:

- ✅ What was completed this session
- 🔄 What's still in progress
- ⏭ The exact next step
- 🧠 Key decisions made (and why)
- 📁 Which files were created/modified/broken
- ⚠️ Gotchas and lessons learned
- 🚀 A ready-to-paste first prompt for the new session

---

## Install

### Via npx from GitHub (no npm account needed)

```bash
npx github:BL-ack/project-handoff
```

### Via npm (once published)

```bash
npx project-handoff
```

That's it. The skill installs itself into `~/.claude/skills/project-handoff/`.

> **Requires** [Claude Code](https://claude.ai/code) to be installed first.

---

## Usage

Inside any Claude Code session:

```
/handoff
```

or say any of:
- `"save session context"`
- `"I'm starting a new session"`
- `"summarize this session"`
- `"/project-handoff"`

Claude writes `HANDOFF.md` to your project root.

### Resuming in a new session

```bash
# Option 1 — resume the same session
claude --continue

# Option 2 — fresh session, load handoff
claude
# then say: "read HANDOFF.md and continue from there"
```

---

## What HANDOFF.md looks like

See [`skill/references/HANDOFF-example.md`](skill/references/HANDOFF-example.md) for a full example.

---

## Updating

Re-run the install command to get the latest version:

```bash
npx github:BL-ack/project-handoff
```

---

## Publishing to npm (optional, for later)

If you want `npx project-handoff` to work without the `github:` prefix:

1. Create an account at [npmjs.com](https://www.npmjs.com)
2. Add your npm token to GitHub: `Settings → Secrets → NPM_TOKEN`
3. Push a version tag: `git tag v1.0.0 && git push --tags`

The included GitHub Actions workflow will publish automatically.

---

## License

MIT
