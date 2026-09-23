// Shared helpers for the Claude Code hooks in this folder. Hooks are Claude
// adapters (like .claude/agents/): each one only calls a script under scripts/
// that any agent could run by hand, and turns the result into a hook decision.
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const HARNESS_DIR = process.env.CLAUDE_PROJECT_DIR || resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Hook input (JSON on stdin). Never throws: a hook that crashes must not block work. */
export function readInput() {
	try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}

/** Run a harness script; returns {status, out} with stdout+stderr merged. */
export function run(cmd, args = [], opts = {}) {
	const r = spawnSync(cmd, args, {cwd: HARNESS_DIR, encoding: 'utf8', timeout: 120_000, ...opts});
	return {status: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim()};
}

export const emit = (obj) => { process.stdout.write(JSON.stringify(obj)); };

/** PreToolUse: refuse the call. */
export function deny(reason) {
	emit({hookSpecificOutput: {hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason}});
	process.exit(0);
}

/** PreToolUse / PostToolUse: let it pass but tell Claude something. */
export function context(event, text) {
	emit({hookSpecificOutput: {hookEventName: event, additionalContext: text}});
	process.exit(0);
}

/** Trim long script output for a hook message. */
export const tail = (s, n = 25) => s.split('\n').slice(-n).join('\n');
