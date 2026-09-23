// PreCompact: context is about to be summarised — the moment unrecorded
// knowledge is lost. Remind (non-blocking) to write the session log, decisions
// and learnings of the touched layers first (00-memory-routing.md), and list
// uncommitted rule files as a hint of what is still only in the conversation.
import {HARNESS_DIR, readInput, run} from './lib.mjs';

readInput();
const changed = run('git', ['-C', HARNESS_DIR, 'status', '--short', '--', 'agents/rules']).out.split('\n').filter(Boolean);
const hint = changed.length ? ` Uncommitted rule files right now: ${changed.map((l) => l.trim().split(/\s+/).pop()).join(', ')}.` : '';
process.stdout.write(JSON.stringify({
	systemMessage: `Context compaction ahead. Before it happens, write what this session learned or decided into the memory files of the layers you touched (harness: 80/81/90; client: 80/85/90 under projects/<client>/agents/rules) and commit locally — the summary will not carry the details.${hint}`,
}));
