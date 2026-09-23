// PreToolUse(Bash): reel work needs a READY client (rule 40). When a command
// runs one of the client-facing scripts, scripts/check-client.sh runs first
// and a NOT READY result blocks the call with the gate's findings.
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {HARNESS_DIR, deny, readInput, run, tail} from './lib.mjs';

const {tool_input: input = {}} = readInput();
const cmd = String(input.command ?? '');
const m = cmd.match(/scripts\/(render|verify|voiceover|new-reel|master|start-studio)\.sh\s+([a-z0-9][a-z0-9-]*)\b/);
if (!m) process.exit(0);
const [, script, client] = m;
if (!existsSync(join(HARNESS_DIR, 'projects', client))) process.exit(0); // the script itself reports a missing project
if (script === 'voiceover' && /--list-voices/.test(cmd)) process.exit(0);

const r = run('bash', ['scripts/check-client.sh', client]);
if (r.status !== 0) {
	const findings = r.out.split('\n').filter((l) => /^(FAIL|NOT READY)/.test(l)).join('\n');
	deny(`Blocked by .claude/hooks/client-gate.mjs: scripts/${script}.sh needs a READY client (rule 40). scripts/check-client.sh ${client}:\n${findings || tail(r.out, 12)}\n\nRun the onboarding-clients skill first; brand-independent work may continue meanwhile.`);
}
process.exit(0);
