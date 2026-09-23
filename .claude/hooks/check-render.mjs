// PostToolUse(Bash): after scripts/render.sh, measure the MP4 with
// scripts/check-render.sh and hand the numbers to Claude — frame count, audio
// and loudness, black tail. The agent sees them without remembering to ask
// (learning 81: 42 black frames shipped for months because nobody measured).
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {HARNESS_DIR, context, readInput, run} from './lib.mjs';

const {tool_input: input = {}} = readInput();
const cmd = String(input.command ?? '');
const results = [];
const re = /scripts\/render\.sh\s+([a-z0-9][a-z0-9-]*)\s+(\S+)(?:\s+([^\s;&|]+))?/g;
let m;
while ((m = re.exec(cmd))) {
	const [, client, composition, name] = m;
	const file = join(HARNESS_DIR, 'projects', client, 'out', `${name || composition}.mp4`);
	if (!existsSync(file)) continue;
	const r = run('bash', ['scripts/check-render.sh', client, file]);
	results.push(r.out);
}
if (results.length) context('PostToolUse', `Render check (.claude/hooks/check-render.mjs → scripts/check-render.sh):\n${results.join('\n')}\nAct on any FAIL line before verifying stills; a delivery needs scripts/master.sh for anything with a voice.`);
process.exit(0);
