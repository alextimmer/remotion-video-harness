// PreToolUse(Bash): deliveries/ (never versioned) and public/audio/ (committed
// clips that keep a delivered reel reproducible) are not deleted or moved by an
// agent. The user does housekeeping there (85-open-decisions).
import {deny, readInput} from './lib.mjs';

const cmd = String(readInput().tool_input?.command ?? '');
const touchesProtected = /(deliveries|public\/audio)(\/|\b)/.test(cmd);
const destructive = /(^|[;&|]\s*|\$\(|`)\s*(sudo\s+)?(rm|rmdir|mv|shred|truncate|unlink)\b/.test(cmd) || /\bgit\s+(rm|clean)\b/.test(cmd) || /\bfind\b[^|;&]*-delete/.test(cmd) || />\s*\S*(deliveries|public\/audio)\//.test(cmd);
if (touchesProtected && destructive) {
	deny('Blocked by .claude/hooks/protect-deliveries.mjs: no deleting, moving or overwriting under deliveries/ or public/audio/ by an agent. Delivered MP4s and committed voice clips are the reproducibility record; housekeeping there is the user\'s (client 85-open-decisions.md). Write new files next to the old ones instead.');
}
process.exit(0);
