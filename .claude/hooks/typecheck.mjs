// PostToolUse(Edit|Write) of a .ts/.tsx file, run async: type-check the
// project that owns the file and wake Claude (exit 2 + stderr) only when it
// fails. Package edits (packages/visuals) are checked through the insta-reel
// template, which links the package like every client does. A lock per
// project skips overlapping runs while a batch of edits lands.
import {existsSync, mkdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {dirname, join, relative, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {HARNESS_DIR, readInput} from './lib.mjs';

const input = readInput();
const file = input.tool_input?.file_path ? resolve(String(input.tool_input.file_path)) : null;
if (!file || !/\.tsx?$/.test(file) || /\.d\.ts$/.test(file)) process.exit(0);
const rel = relative(HARNESS_DIR, file);
if (rel.startsWith('..') || rel.includes('node_modules/')) process.exit(0);

let root = null;
if (rel.startsWith('packages/')) {
	root = join(HARNESS_DIR, 'templates/insta-reel');
} else {
	let dir = dirname(file);
	while (dir.startsWith(HARNESS_DIR) && dir !== HARNESS_DIR) {
		if (existsSync(join(dir, 'tsconfig.json')) && existsSync(join(dir, 'package.json'))) { root = dir; break; }
		dir = dirname(dir);
	}
}
if (!root || !existsSync(join(root, 'node_modules/typescript'))) process.exit(0);

const lockDir = join(input.scratchpad_dir || tmpdir(), 'harness-tsc');
mkdirSync(lockDir, {recursive: true});
const lock = join(lockDir, createHash('sha1').update(root).digest('hex').slice(0, 12));
if (existsSync(lock) && Date.now() - statSync(lock).mtimeMs < 90_000) process.exit(0); // a run for this project is in flight
writeFileSync(lock, String(process.pid));
try {
	const r = spawnSync('npx', ['tsc', '--noEmit', '-p', root], {cwd: root, encoding: 'utf8', timeout: 180_000});
	if (r.status !== 0) {
		const lines = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').filter(Boolean);
		process.stderr.write(`Type check failed in ${relative(HARNESS_DIR, root)} after ${rel} changed (.claude/hooks/typecheck.mjs):\n${lines.slice(0, 15).join('\n')}${lines.length > 15 ? `\n… ${lines.length - 15} more` : ''}\n`);
		process.exit(2);
	}
} finally {
	rmSync(lock, {force: true});
}
process.exit(0);
