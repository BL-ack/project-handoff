#!/usr/bin/env node

const fs   = require("fs");
const path = require("path");
const os   = require("os");

// ── Helpers ────────────────────────────────────────────────────────────────

const write = (msg) => process.stdout.write(msg);
const print = (msg = "") => process.stdout.write(msg + "\n");
const success = (msg) => print(`\x1b[32m✔\x1b[0m  ${msg}`);
const warn    = (msg) => print(`\x1b[33m⚠\x1b[0m  ${msg}`);
const info    = (msg) => print(`\x1b[36mℹ\x1b[0m  ${msg}`);
const dim     = (msg) => `\x1b[2m${msg}\x1b[0m`;
const bold    = (msg) => `\x1b[1m${msg}\x1b[0m`;
const cyan    = (msg) => `\x1b[96m${msg}\x1b[0m`;
const green   = (msg) => `\x1b[32m${msg}\x1b[0m`;

// ── Arrow-key selector ─────────────────────────────────────────────────────

function select(question, options) {
  return new Promise((resolve) => {
    let idx = 0;

    const render = () => {
      // Move cursor up to re-draw from the question line
      if (render.drawn) {
        write(`\x1b[${options.length + 1}A`); // move up N+1 lines
      }
      render.drawn = true;

      print(`  ${bold(question)}`);
      options.forEach((opt, i) => {
        const cursor = i === idx ? green("❯") : " ";
        const label  = i === idx ? cyan(bold(opt.label)) : opt.label;
        const note   = dim(opt.note || "");
        print(`  ${cursor} ${label}  ${note}`);
      });
    };

    render.drawn = false;
    render();

    // Put stdin in raw mode so we get keystrokes immediately
    const { stdin } = process;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    stdin.on("data", function handler(key) {
      if (key === "\u0003") { print(); process.exit(); } // Ctrl+C

      if (key === "\u001b[A" || key === "\u001b[D") {    // up / left
        idx = (idx - 1 + options.length) % options.length;
        render();
      } else if (key === "\u001b[B" || key === "\u001b[C") { // down / right
        idx = (idx + 1) % options.length;
        render();
      } else if (key === "\r" || key === "\n" || key === " ") { // enter / space
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", handler);
        print();
        resolve(options[idx].value);
      }
    });
  });
}

// ── File helpers ───────────────────────────────────────────────────────────

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src,  entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDirSync(s, d) : fs.copyFileSync(s, d);
  }
}

function symlinkDir(src, dest) {
  if (fs.existsSync(dest)) {
    const stat = fs.lstatSync(dest);
    stat.isSymbolicLink()
      ? fs.unlinkSync(dest)
      : fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.symlinkSync(src, dest, "junction"); // "junction" works on Windows
}

// ── Banner ─────────────────────────────────────────────────────────────────

print();
print(bold("  project-handoff — Claude Code Skill Installer"));
print("  ─────────────────────────────────────────────");
print();

// ── Preflight ─────────────────────────────────────────────────────────────

if (!fs.existsSync(path.join(os.homedir(), ".claude"))) {
  warn("~/.claude not found. Make sure Claude Code is installed first.");
  warn("Install Claude Code: https://claude.ai/code");
  print();
  process.exit(1);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {

  // ── 1. Scope ──────────────────────────────────────────────────────────────

  const scope = await select("Where do you want to install?", [
    { label: "Global",  note: "~/.claude/skills/  — available in every project", value: "global"  },
    { label: "Project", note: "./.claude/skills/  — only this project",          value: "project" },
  ]);

  print();

  // ── 2. Mode ───────────────────────────────────────────────────────────────

  const mode = await select("How do you want to install it?", [
    { label: "Copy",    note: "copies files into the skills folder (safe, portable)",          value: "copy"    },
    { label: "Symlink", note: "creates a pointer (updates automatically if you edit source)", value: "symlink" },
  ]);

  print();

  // ── 3. Resolve destination ────────────────────────────────────────────────

  const skillsBase = scope === "global"
    ? path.join(os.homedir(), ".claude", "skills")
    : path.join(process.cwd(), ".claude", "skills");

  const dest      = path.join(skillsBase, "project-handoff");
  const SKILL_SRC = path.join(__dirname, "skill");
  const isUpdate  = fs.existsSync(dest);

  // ── 4. Install ────────────────────────────────────────────────────────────

  try {
    fs.mkdirSync(skillsBase, { recursive: true });

    if (mode === "symlink") {
      symlinkDir(SKILL_SRC, dest);
    } else {
      if (isUpdate) fs.rmSync(dest, { recursive: true, force: true });
      copyDirSync(SKILL_SRC, dest);
    }
  } catch (err) {
    warn("Installation failed: " + err.message);
    if (mode === "symlink" && process.platform === "win32") {
      warn("Symlinks on Windows need Developer Mode enabled, or run as Administrator.");
      warn("Try again and choose Copy instead.");
    }
    print();
    process.exit(1);
  }

  // ── 5. Summary ────────────────────────────────────────────────────────────

  const scopeLabel = scope === "global" ? "Global" : "Project";
  const modeLabel  = mode  === "copy"   ? "Copy"   : "Symlink";

  isUpdate
    ? success(`Skill updated  [${scopeLabel} · ${modeLabel}]`)
    : success(`Skill installed  [${scopeLabel} · ${modeLabel}]`);

  info(`Location: ${dest}`);
  print();

  // ── 6. Usage ──────────────────────────────────────────────────────────────

  info("How to use it in Claude Code:");
  print();
  print("  1. Open Claude Code in your project:   claude");
  print("  2. When context is getting full, say:  /handoff");
  print(`     or:                                 /project-handoff`);
  print(`     or:                                 "save session context"`);
  print();
  print("  Claude writes HANDOFF.md to your project root.");
  print();
  info("To resume in a new session:");
  print();
  print(`  claude --continue`);
  print(`  # or start fresh: "read HANDOFF.md and continue from there"`);
  print();
  success("All done! Restart Claude Code for the skill to take effect.");
  print();
}

main().catch((err) => {
  warn("Unexpected error: " + err.message);
  process.exit(1);
});