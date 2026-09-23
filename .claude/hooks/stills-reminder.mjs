// Stop: a scene is not done until a still of it has been looked at (rule 20).
// For every reel whose .tsx files changed in the last 24 h and are newer than
// its latest verification still, remind at the end of the turn. Non-blocking.
import {existsSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {HARNESS_DIR, readInput} from './lib.mjs';

readInput();
const projects = join(HARNESS_DIR, 'projects');
const pending = [];
const newest = (dir, filter) => {
	let t = 0;
	const walk = (d) => { for (const e of readdirSync(d, {withFileTypes: true})) { const p = join(d, e.name); if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); } else if (filter(e.name)) t = Math.max(t, statSync(p).mtimeMs); } };
	if (existsSync(dir)) walk(dir);
	return t;
};
if (existsSync(projects)) {
	for (const client of readdirSync(projects, {withFileTypes: true}).filter((d) => d.isDirectory()).map((d) => d.name)) {
		const reels = join(projects, client, 'src/reels');
		if (!existsSync(reels)) continue;
		for (const reel of readdirSync(reels, {withFileTypes: true}).filter((d) => d.isDirectory()).map((d) => d.name)) {
			const edited = newest(join(reels, reel), (n) => /\.tsx$/.test(n));
			if (!edited || Date.now() - edited > 24 * 3600_000) continue;
			const verifyDir = join(projects, client, 'out/verify');
			const still = newest(verifyDir, (n) => n.startsWith(`Reel-${reel}_`) && n.endsWith('.png'));
			if (edited > still) pending.push(`${client}/${reel} (scripts/verify.sh ${client} Reel-${reel} <frames>)`);
		}
	}
}
process.stdout.write(JSON.stringify(pending.length
	? {decision: 'approve', systemMessage: `Scenes changed without a newer still (rule 20: look at the pixels before calling a scene done): ${pending.join('; ')}.`}
	: {decision: 'approve'}));
