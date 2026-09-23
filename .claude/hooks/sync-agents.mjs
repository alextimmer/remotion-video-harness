// PostToolUse(Edit|Write): a rule file changed, so the generated AGENTS.md of
// its layer is regenerated at once (rule 00: "after editing any
// agents/rules/*.md, run scripts/sync-agents.sh"). The gate fails on a stale
// AGENTS.md, and a forgotten sync was the most common gate failure.
import {relative, resolve} from 'node:path';
import {HARNESS_DIR, context, readInput, run, tail} from './lib.mjs';

const {tool_input: input = {}} = readInput();
const file = input.file_path ? resolve(String(input.file_path)) : null;
if (!file) process.exit(0);
const rel = relative(HARNESS_DIR, file);
if (rel.startsWith('..') || !/agents\/rules\/.*\.md$/.test(rel)) process.exit(0);

const client = rel.match(/^projects\/([^/]+)\//)?.[1];
const args = client ? ['scripts/sync-agents.sh', '--client', `projects/${client}`] : ['scripts/sync-agents.sh'];
const r = run('bash', args);
const layer = client ? `client ${client}` : 'harness';
context('PostToolUse', r.status === 0
	? `AGENTS.md regenerated for the ${layer} (.claude/hooks/sync-agents.mjs) after ${rel} changed. Remember the session log of that layer (00-memory-routing.md).`
	: `sync-agents.sh failed for the ${layer} after ${rel} changed:\n${tail(r.out, 10)}`);
