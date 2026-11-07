#!/usr/bin/env node
// Relay hook for Claude Code. One small script with no dependencies.
// Usage: node relay-hook.mjs <session-start|prompt|pre-write|post-tool|stop|session-end>
// If Relay cannot be reached, this fails open and prints a warning, so agents keep working.
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";

const URL_BASE = process.env.RELAY_URL || "https://relay-blue-beta.vercel.app";
const TOKEN = process.env.RELAY_TOKEN || "";
const TIMEOUT_MS = 4000;
const HEARTBEAT_MS = 60000;

const mode = process.argv[2];

function readInput() {
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

function emit(value) {
  process.stdout.write(JSON.stringify(value));
}

function failOpen(why) {
  emit({ systemMessage: `Relay unreachable (${why}). Working without it. Use BOARD.md and talk.` });
  process.exit(0);
}

async function post(body) {
  if (!TOKEN) failOpen("RELAY_TOKEN is not set");
  try {
    const res = await fetch(`${URL_BASE}/api/hook`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await res.json();
    if (!res.ok) failOpen(data.code || `status ${res.status}`);
    return data;
  } catch (error) {
    failOpen(error.name === "TimeoutError" ? "timed out" : "no connection");
  }
}

const context = (hookEventName, additionalContext) => {
  if (additionalContext) emit({ hookSpecificOutput: { hookEventName, additionalContext } });
};

// The path relative to the repo, with forward slashes. Null if it is outside the repo.
function repoPath(file, input) {
  if (!file) return null;
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const full = isAbsolute(file) ? file : resolve(input.cwd || root, file);
  const rel = relative(root, full).replaceAll("\\", "/");
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) return null;
  return rel;
}

// At most one heartbeat a minute per session.
function heartbeatDue(session) {
  const stamp = join(tmpdir(), `relay-heartbeat-${session.replace(/[^\w-]/g, "")}`);
  if (existsSync(stamp) && Date.now() - statSync(stamp).mtimeMs < HEARTBEAT_MS) return false;
  writeFileSync(stamp, "");
  return true;
}

const input = readInput();
const session = input.session_id || "";

switch (mode) {
  case "session-start": {
    const r = await post({ event: "session_start", session_id: session, client: "claude-code" });
    context("SessionStart", r.context);
    break;
  }
  case "prompt": {
    const r = await post({ event: "prompt", session_id: session });
    context("UserPromptSubmit", r.context);
    break;
  }
  case "pre-write": {
    const path = repoPath(input.tool_input?.file_path ?? input.tool_input?.notebook_path, input);
    if (!path) break;
    const r = await post({ event: "pre_write", session_id: session, path });
    if (r.allow === false) {
      emit({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: r.reason,
        },
      });
    }
    break;
  }
  case "post-tool": {
    if (!heartbeatDue(session)) break;
    const r = await post({ event: "heartbeat", session_id: session });
    if (r.warnings?.length) context("PostToolUse", r.warnings.join("\n"));
    break;
  }
  case "stop": {
    const r = await post({ event: "stop", session_id: session });
    if (r.decision === "block") emit({ decision: "block", reason: r.reason });
    break;
  }
  case "session-end": {
    await post({ event: "session_end", session_id: session, reason: input.reason });
    break;
  }
  default:
    process.stderr.write(`Unknown mode: ${mode}\n`);
}
process.exitCode = 0;
