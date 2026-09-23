// PreToolUse(Edit|Write): client words never enter harness files (rule 00).
// Checks the text about to be written against .leakwords via
// scripts/leak-gate.sh --stdin. Files under projects/ (Layer B) and the
// git-ignored Layer C files are exempt.
import {relative, resolve} from 'node:path';
import {HARNESS_DIR, deny, readInput, run} from './lib.mjs';

const {tool_input: input = {}} = readInput();
const file = input.file_path ? resolve(String(input.file_path)) : null;
if (!file) process.exit(0);
const rel = relative(HARNESS_DIR, file);
if (rel.startsWith('..') || /^(projects\/|out\/|node_modules\/|docs\/local\/|\.leakwords$|CLAUDE\.local\.md$|projects\.yaml$)/.test(rel)) process.exit(0);

const text = input.content ?? input.new_string ?? '';
if (!text) process.exit(0);
const r = run('bash', ['scripts/leak-gate.sh', '--stdin', rel], {input: text});
if (r.status === 1) {
	deny(`${r.out}\n\nThe target is a harness file (Layer A). Reword without the client term, or put the information into the client repository under projects/<client>/ (00-memory-routing.md).`);
}
process.exit(0);
