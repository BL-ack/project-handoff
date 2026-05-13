#!/usr/bin/env node

const fs       = require("fs");
const path     = require("path");
const os       = require("os");
const readline = require("readline");

// ── Helpers ────────────────────────────────────────────────────────────────

function print(msg)   { process.stdout.write(msg + "\n"); }
function success(msg) { print(`\x1b[32m✔\x1b[0m  ${msg}`); }
function warn(msg)    { print(`\x1b[33m⚠\x1b[0m  ${msg}`); }
function info(msg)    { print(`\x1b[36mℹ\x1b[0m  ${msg}`); }
function dim(msg)     { return `\x1b[2m${msg}\x1b[0m`; }
function bold(msg)    { return `\x1b[1m${msg}\x1b[0m`; }
function cyan(msg)    { return `\x1b[36m${msg}\x1b[0m`; }

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src,  entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function symlinkDir(src, dest) {
  if (fs.existsSync(dest)) {
    const stat = fs.lstatSync(dest);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(dest);
    } else {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  }
  fs.symlinkSync(src, dest, "junction"); // "junction" works on Windows too
}

// ── Banner ─────────────────────────────────────────────────────────────────

print("");
print(bold("  project-handoff — Claude Code Skill Installer"));
print("  ─────────────────────────────────────────────");
print("");

// ── Preflight: Claude Code installed? ─────────────────────────────────────

if (!fs.existsSync(path.join(os.homedir(), ".claude"))) {
  warn("~/.claude not found. Make sure Claude Code is installed first.");
  warn("Install Claude Code: https://claude.ai/code");
  print("");
  process.exit(1);
}

// ── Interactive prompts ────────────────────────────────────────────────────

const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
});

async function main() {

  // ── 1. Project or Global? ────────────────────────────────────────────────

  print("  Where do you want to install this skill?\n");
  print(`  ${cyan("[1]")} Global   ${dim("~/.claude/skills/")}  — available in every project`);
  print(`  ${cyan("[2]")} Project  ${dim("./.claude/skills/")}  — only this project\n`);

  let scopeAnswer;
  while (true) {
    scopeAnswer = (await ask(rl, "  Enter 1 or 2: ")).trim();
    if (scopeAnswer === "1" || scopeAnswer === "2") break;
    warn("  Please enter 1 or 2.");
  }

  const isGlobal   = scopeAnswer === "1";
  const skillsBase = isGlobal
    ? path.join(os.homedir(), ".claude", "skills")
    : path.join(process.cwd(), ".claude", "skills");
  const dest       = path.join(skillsBase, "project-handoff");
  const scopeLabel = isGlobal ? "Global" : "Project";

  print("");

  // ── 2. Copy or Symlink? ──────────────────────────────────────────────────

  print("  How do you want to install it?\n");
  print(`  ${cyan("[1]")} Copy     ${dim("— copies files into the skills folder (safe, portable)")}`);
  print(`  ${cyan("[2]")} Symlink  ${dim("— creates a pointer (updates automatically if you edit the source)")}\n`);

  let modeAnswer;
  while (true) {
    modeAnswer = (await ask(rl, "  Enter 1 or 2: ")).trim();
    if (modeAnswer === "1" || modeAnswer === "2") break;
    warn("  Please enter 1 or 2.");
  }

  const useSymlink = modeAnswer === "2";
  const modeLabel  = useSymlink ? "Symlink" : "Copy";
  const SKILL_SRC  = path.join(__dirname, "skill");

  print("");
  rl.close();

  // ── 3. Install ────────────────────────────────────────────────────────────

  const isUpdate = fs.existsSync(dest);

  try {
    fs.mkdirSync(skillsBase, { recursive: true });

    if (useSymlink) {
      symlinkDir(SKILL_SRC, dest);
    } else {
      if (isUpdate) fs.rmSync(dest, { recursive: true, force: true });
      copyDirSync(SKILL_SRC, dest);
    }
  } catch (err) {
    warn("Installation failed: " + err.message);
    if (useSymlink && process.platform === "win32") {
      warn("Symlinks on Windows may need Developer Mode enabled, or run as Administrator.");
      warn("Try again with Copy (option 1) if this keeps failing.");
    }
    print("");
    process.exit(1);
  }

  // ── 4. Summary ────────────────────────────────────────────────────────────

  print("");
  if (isUpdate) {
    success(`Skill updated  [${scopeLabel} · ${modeLabel}]`);
  } else {
    success(`Skill installed  [${scopeLabel} · ${modeLabel}]`);
  }
  info(`Location: ${dest}`);
  print("");

  // ── 5. Usage hint ─────────────────────────────────────────────────────────

  info("How to use it in Claude Code:");
  print("");
  print("  1. Open Claude Code in your project:    claude");
  print("  2. When context is getting full, say:   /handoff");
  print(`     or:                                  /project-handoff`);
  print(`     or:                                  "save session context"`);
  print("");
  print("  Claude writes HANDOFF.md to your project root.");
  print("");
  info("To resume in a new session:");
  print("");
  print(`  claude --continue`);
  print(`  # or start fresh: "read HANDOFF.md and continue from there"`);
  print("");
  success("All done! Restart Claude Code for the skill to take effect.");
  print("");
}

main().catch((err) => {
  warn("Unexpected error: " + err.message);
  process.exit(1);
});
