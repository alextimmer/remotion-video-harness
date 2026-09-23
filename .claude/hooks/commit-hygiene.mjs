// PreToolUse(Bash) on `git commit`: the repository being committed must have a
// current AGENTS.md; in the harness the staged diff must also pass the leak
// gate (scripts/leak-gate.sh --staged). The write hook covers new text; this
// covers moves, renames and edits made outside the Edit/Write tools.
import {existsSync} from 'node:fs';
import {isAbsolute, join, relative, resolve} from 'node:path';
import {HARNESS_DIR, deny, readInput, run, tail} from './lib.mjs';

const input = readInput();
const cmd = String(input.tool_input?.command ?? '');
if (!/\bgit\b[^|;&]*\bcommit\b/.test(cmd)) process.exit(0);

// Which repository? `git -C <dir>`, a leading `cd <dir>`, else the shell's cwd.
let dir = input.cwd || HARNESS_DIR;
const c = cmd.match(/\bgit\s+-C\s+(\S+)/) || cmd.match(/(?:^|&&|;)\s*cd\s+(\S+)/);
if (c) dir = isAbsolute(c[1]) ? c[1] : resolve(input.cwd || HARNESS_DIR, c[1]);
dir = resolve(dir);
const rel = relative(HARNESS_DIR, dir);
const client = rel.match(/^projects\/([^/]+)/)?.[1];

const problems = [];
if (client) {
	const r = run('bash', ['scripts/sync-agents.sh', '--check', '--client', `projects/${client}`]);
	if (r.status !== 0) problems.push(`AGENTS.md of projects/${client} is out of date — run scripts/sync-agents.sh --client projects/${client} and stage it.`);
} else if (!rel.startsWith('..')) {
	const g = run('bash', ['scripts/leak-gate.sh', '--staged']);
	if (g.status === 1) problems.push(`Staged harness changes contain client words:\n${tail(g.out, 15)}`);
	const s = run('bash', ['scripts/sync-agents.sh', '--check']);
	if (s.status !== 0) problems.push('Harness AGENTS.md is out of date — run scripts/sync-agents.sh and stage it.');
	if (existsSync(join(HARNESS_DIR, 'projects'))) {
		// a harness rule edit also changes every client's embedded block
		for (const p of run('ls', ['projects']).out.split('\n').filter(Boolean)) {
			if (!existsSync(join(HARNESS_DIR, 'projects', p, 'AGENTS.md'))) continue;
			const cr = run('bash', ['scripts/sync-agents.sh', '--check', '--client', `projects/${p}`]);
			if (cr.status !== 0) problems.push(`Client projects/${p} has a stale AGENTS.md (the harness block changed) — run scripts/sync-agents.sh --client projects/${p} and commit there too.`);
		}
	}
}
if (problems.length) deny(`Blocked by .claude/hooks/commit-hygiene.mjs:\n- ${problems.join('\n- ')}`);
process.exit(0);
