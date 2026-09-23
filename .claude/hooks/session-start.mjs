// SessionStart: the state a fresh session needs before reading twelve files —
// branch and uncommitted changes of the harness and every client, the last
// session-log entry, and the open-decision registers (the rows agents must
// not resolve). Plain text on stdout reaches Claude at SessionStart.
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {HARNESS_DIR, run} from './lib.mjs';

const lines = [];
const git = (dir, args) => run('git', ['-C', dir, ...args]).out;
const repoLine = (label, dir) => {
	const branch = git(dir, ['branch', '--show-current']) || '(no branch)';
	const dirty = git(dir, ['status', '--short']).split('\n').filter(Boolean);
	const last = git(dir, ['log', '-1', '--format=%h %s']);
	lines.push(`${label}: branch ${branch}, ${dirty.length ? `${dirty.length} uncommitted change(s)` : 'clean'}, last commit ${last}`);
};
const decisions = (file, label) => {
	if (!existsSync(file)) return;
	const rows = readFileSync(file, 'utf8').split('\n').filter((l) => /^\| \d{4}-\d{2}/.test(l) || /^\| 2026-0\d/.test(l));
	if (!rows.length) return;
	lines.push(`Open decisions (${label}, ${rows.length}) — agents never resolve these:`);
	for (const r of rows) {
		const c = r.split('|').map((s) => s.trim());
		lines.push(`  - ${c[2]}  [needed by: ${c[5] || '?'}]`);
	}
};

lines.push('== Harness state (.claude/hooks/session-start.mjs) ==');
repoLine('harness', HARNESS_DIR);
const log = join(HARNESS_DIR, 'agents/rules/90-harness-sessions.md');
if (existsSync(log)) {
	const heads = readFileSync(log, 'utf8').split('\n').filter((l) => l.startsWith('## '));
	if (heads.length) lines.push(`Last harness session entry: ${heads[heads.length - 1].replace(/^## /, '')}`);
}
decisions(join(HARNESS_DIR, 'agents/rules/82-open-decisions.md'), 'harness');

const projects = join(HARNESS_DIR, 'projects');
if (existsSync(projects)) {
	for (const name of readdirSync(projects, {withFileTypes: true}).filter((d) => d.isDirectory()).map((d) => d.name)) {
		const dir = join(projects, name);
		if (!existsSync(join(dir, '.git'))) continue;
		lines.push('');
		repoLine(`client ${name}`, dir);
		const gate = run('bash', ['scripts/check-client.sh', name]).out.split('\n').filter((l) => /^(READY|NOT READY)/.test(l))[0];
		if (gate) lines.push(`  gate: ${gate}`);
		decisions(join(dir, 'agents/rules/85-open-decisions.md'), name);
	}
}
lines.push('', 'Commands and workflow: README.md ("When to run what"), skills onboarding-clients / video-production / visuals-library. Never push (hook-enforced).');
process.stdout.write(lines.join('\n') + '\n');
