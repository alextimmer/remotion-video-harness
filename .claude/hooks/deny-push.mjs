// PreToolUse(Bash): nothing leaves the machine. The user publishes repositories
// whole, by hand (rule 10 "Versioning", 82-open-decisions). Denies git push,
// git remote add/set-url and gh repo create.
import {deny, readInput} from './lib.mjs';

const {tool_input: input = {}} = readInput();
const cmd = String(input.command ?? '');
if (/\bgit\s+(push|remote\s+(add|set-url))\b/.test(cmd) || /\bgh\s+repo\s+create\b/.test(cmd)) {
	deny('Blocked by .claude/hooks/deny-push.mjs: no remotes and no pushes from an agent — the user publishes each repository whole when it is declared done (rule 10, 82-open-decisions.md). Commit locally and tell the user what is ready to push.');
}
process.exit(0);
