// Visuals reuse (rule 30, skill visuals-library), two moments:
// - PreToolUse(Write) of a NEW component file under a reel's scenes/, the
//   client's brand/components/ or packages/visuals/src/: inject the visuals
//   index so "check INDEX.md first" happens whether or not the agent remembers.
// - PostToolUse(Edit|Write) inside packages/visuals/src/<folder>/: warn when the
//   folder has no _meta.md or no row in INDEX.md yet (storing protocol).
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {HARNESS_DIR, context, readInput} from './lib.mjs';

const input = readInput();
const event = input.hook_event_name;
const file = input.tool_input?.file_path ? resolve(String(input.tool_input.file_path)) : null;
if (!file || !/\.tsx?$/.test(file)) process.exit(0);
const rel = relative(HARNESS_DIR, file);
if (rel.startsWith('..') || rel.includes('node_modules/')) process.exit(0);

const isComponentPlace = /(^|\/)src\/reels\/[^/]+\/scenes\/[^/]+\.tsx$|(^|\/)src\/brand\/components\/[^/]+\.tsx$|^packages\/visuals\/src\/[^/]+\/[^/]+\.tsx$/.test(rel);

if (event === 'PreToolUse' && isComponentPlace && !existsSync(file)) {
	const index = join(HARNESS_DIR, 'packages/visuals/INDEX.md');
	if (!existsSync(index)) process.exit(0);
	const rows = readFileSync(index, 'utf8').split('\n').filter((l) => /^\| `/.test(l)).map((l) => {
		const c = l.split('|').map((s) => s.trim());
		return `  ${c[1]}: ${c[2]} — ${c[3]}`;
	});
	context('PreToolUse', `New component file ${rel}. Before drawing anything, match the need against @harness/visuals (rule 30 — do not rebuild a visual that exists; import it and pass client content as props):\n${rows.join('\n')}\nDetails per folder: packages/visuals/src/<folder>/_meta.md. If nothing fits, build it, verify with stills, then store it (skill visuals-library).`);
}

if (event === 'PostToolUse') {
	const m = rel.match(/^packages\/visuals\/src\/([^/]+)\/[^/]+\.tsx$/);
	if (!m) process.exit(0);
	const folder = m[1];
	const missing = [];
	if (!existsSync(join(HARNESS_DIR, 'packages/visuals/src', folder, '_meta.md'))) missing.push(`packages/visuals/src/${folder}/_meta.md (Description, Keywords, Research, Technical approach, Style adaptation, Props, Data dependencies)`);
	const index = join(HARNESS_DIR, 'packages/visuals/INDEX.md');
	if (existsSync(index) && !readFileSync(index, 'utf8').includes(`\`${folder}\``)) missing.push(`a row for \`${folder}\` in packages/visuals/INDEX.md`);
	if (!readFileSync(join(HARNESS_DIR, 'packages/visuals/src/index.ts'), 'utf8').includes(`./${folder}/`)) missing.push(`an export from packages/visuals/src/index.ts`);
	if (missing.length) context('PostToolUse', `Storing protocol (rule 30) for the visual in ${folder}/ — still missing:\n  - ${missing.join('\n  - ')}\nAlso: no client words in the meta or props (leak gate), colours via useVisualsTheme(), client text as props with neutral defaults.`);
}
process.exit(0);
