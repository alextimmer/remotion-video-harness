// PostToolUse(Bash) after scripts/voiceover.sh: lift the pronunciation report
// ("heard: …" lines) and the pipeline's notes out of the scrolled output and
// hand them to Claude as context, so they are read, not skipped.
import {context, readInput} from './lib.mjs';

const input = readInput();
const cmd = String(input.tool_input?.command ?? '');
if (!/scripts\/voiceover\.sh\s+[a-z0-9-]+\s+\S+/.test(cmd) || /--list-voices/.test(cmd)) process.exit(0);
const raw = input.tool_response ?? input.tool_result ?? '';
const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
const lines = text.split(/\\n|\n/);
const heard = lines.filter((l) => /heard:/.test(l)).map((l) => l.trim());
const notes = lines.filter((l) => /^\s*note:/.test(l)).map((l) => l.trim());
const done = lines.find((l) => /^done in/.test(l.trim()));
if (!heard.length && !notes.length && !done) process.exit(0);
context('PostToolUse', [
	'Voiceover report (.claude/hooks/heard-report.mjs):',
	done ? `  ${done.trim()}` : null,
	heard.length ? `  Pronunciation — the recogniser heard these scenes differently from the script (22-craft-audio.md: pronunciation is the client\'s decision; fix wording in script.md only for the voice that ships, and record the list in the client register):\n    ${heard.join('\n    ')}` : '  Pronunciation: every scene was heard as written.',
	...notes.map((n) => `  ${n}`),
].filter(Boolean).join('\n'));
