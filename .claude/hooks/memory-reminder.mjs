// Stop: when the turn talked about fixes or discoveries, remind Claude to
// write them into the memory files of the right layer (00-memory-routing.md).
// Non-blocking; the reminder arrives as a system message. Ported from the
// inline bash version that lived in settings.json.
import {readInput} from './lib.mjs';

const input = readInput();
const text = String(input.last_assistant_message ?? JSON.stringify(input));
const strong = /fixed|workaround|gotcha|that.s wrong|check again|we already|should have|discovered|realized|turns out|learning/i;
const weak = /error|bug|issue|problem|fail/i;
let msg = null;
if (strong.test(text)) msg = 'This turn involved fixes or discoveries. Record them per agents/rules/00-memory-routing.md (harness learnings/decisions or the client memory files); the sync hook regenerates AGENTS.md when you edit a rule file.';
else if (weak.test(text)) msg = 'If you learned something non-obvious this turn, record it per agents/rules/00-memory-routing.md.';
process.stdout.write(JSON.stringify(msg ? {decision: 'approve', systemMessage: msg} : {decision: 'approve'}));
