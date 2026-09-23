// Script parsing: the screenplay markdown (script.md) and the code form
// (script.ts via defineScript) both end up as the same Script structure.
// Pure functions, no I/O — see script.test.mjs. Loading files is in load.mjs.
//
//   Script = {
//     voice: string | null,            // preset name (null = presets' default)
//     pauseBeforeMs, pauseAfterMs,
//     scenes: [{
//       id, voice: string | null,
//       text,                          // as written, markers included
//       spoken,                        // markers stripped, for the provider
//       subtitle,                       // written form shown in subtitles, markers stripped
//       segments: [{text, marked, pauseAfterMs}],  // spoken text split at [pause N]
//       emphasis: [{start, end}],      // character ranges in `subtitle`
//     }],
//   }

const FRONT_KEYS = ['voice', 'pause-before', 'pause-after'];
const ID_RE = /^[a-zA-Z0-9-]+$/;
const PAUSE_RE = /\[pause\s+(\d+(?:\.\d+)?)\s*(?:s)?\]/gi;
const DEFAULT_PAUSE_BEFORE_MS = 400;
const DEFAULT_PAUSE_AFTER_MS = 700;

export class ScriptError extends Error {
	constructor(message, line) {
		super(line ? `script.md line ${line}: ${message}` : message);
		this.line = line;
	}
}

const collapse = (s) => s.replace(/\s+/g, ' ').trim();

/** Remove *emphasis* stars only. */
export function stripEmphasis(text) {
	return text.replace(/\*([^*]+)\*/g, '$1');
}

/** Remove [pause N] markers and *emphasis* stars; collapse whitespace. */
export function stripMarkers(text) {
	return collapse(stripEmphasis(text.replace(PAUSE_RE, ' ')));
}

/**
 * Split spoken text at [pause N] markers. Each segment: `text` (stripped, for
 * providers without emphasis), `marked` (stars kept, for providers with it)
 * and `pauseAfterMs`. Empty segments fold their pause into the previous one.
 */
export function splitSegments(text) {
	const raw = [];
	let last = 0;
	const re = new RegExp(PAUSE_RE.source, 'gi');
	let m;
	while ((m = re.exec(text))) {
		raw.push({chunk: text.slice(last, m.index), pauseAfterMs: Math.round(parseFloat(m[1]) * 1000)});
		last = m.index + m[0].length;
	}
	raw.push({chunk: text.slice(last), pauseAfterMs: 0});
	const out = [];
	for (const {chunk, pauseAfterMs} of raw) {
		const spoken = stripMarkers(chunk);
		if (spoken) out.push({text: spoken, marked: collapse(chunk), pauseAfterMs});
		else if (out.length) out[out.length - 1].pauseAfterMs += pauseAfterMs;
	}
	return out;
}

/** Emphasis ranges (*…*) as character offsets in the cleaned text. */
export function extractEmphasis(text) {
	const noPause = collapse(text.replace(PAUSE_RE, ' '));
	const ranges = [];
	let clean = '';
	let i = 0;
	while (i < noPause.length) {
		const open = noPause.indexOf('*', i);
		if (open < 0) { clean += noPause.slice(i); break; }
		const close = noPause.indexOf('*', open + 1);
		if (close < 0) { clean += noPause.slice(i); break; }
		clean += noPause.slice(i, open);
		const start = clean.length;
		clean += noPause.slice(open + 1, close);
		ranges.push({start, end: clean.length});
		i = close + 1;
	}
	return {clean: collapse(clean), ranges};
}

/** Per subtitle word (split on whitespace): does it overlap an emphasis range? */
export function emphasisPerWord(subtitle, ranges) {
	const flags = [];
	let pos = 0;
	for (const word of subtitle.split(/\s+/).filter(Boolean)) {
		const start = subtitle.indexOf(word, pos);
		const end = start + word.length;
		pos = end;
		flags.push(ranges.some((r) => r.start < end && r.end > start));
	}
	return flags;
}

function buildScene(raw, line) {
	if (!raw.id || !ID_RE.test(raw.id)) throw new ScriptError(`scene id "${raw.id}" must match [a-zA-Z0-9-]+`, line);
	const text = collapse(raw.text ?? '');
	if (!text) throw new ScriptError(`scene "${raw.id}" has no spoken text`, line);
	const subtitleSource = raw.subtitle ? collapse(raw.subtitle) : text;
	const {clean: subtitle, ranges} = extractEmphasis(subtitleSource);
	return {
		id: raw.id,
		voice: raw.voice ?? null,
		text,
		spoken: stripMarkers(text),
		subtitle,
		segments: splitSegments(text),
		emphasis: ranges,
	};
}

function seconds(v, key, line) {
	if (v === undefined || v === null) return undefined;
	const n = typeof v === 'number' ? v : parseFloat(String(v));
	if (!Number.isFinite(n) || n < 0 || (typeof v === 'string' && !/^\s*\d+(\.\d+)?\s*s?\s*$/.test(v))) {
		throw new ScriptError(`${key} must be a non-negative number of seconds, got "${v}"`, line);
	}
	return Math.round(n * 1000);
}

/**
 * Shared validation for both sources. `raw` follows the defineScript() shape:
 * {voice?, pauseBefore?, pauseAfter?, scenes: {id: string | {text, subtitle?, voice?}} | [{id, …}]}
 */
export function normaliseScript(raw, source = 'script') {
	if (!raw || typeof raw !== 'object') throw new ScriptError(`${source}: not an object`);
	const scenesIn = raw.scenes;
	const empty = !scenesIn || (Array.isArray(scenesIn) ? scenesIn.length === 0 : Object.keys(scenesIn).length === 0);
	if (empty) throw new ScriptError(`${source}: no scenes`);
	const list = Array.isArray(scenesIn)
		? scenesIn
		: Object.entries(scenesIn).map(([id, v]) => (typeof v === 'string' ? {id, text: v} : {id, ...v}));
	const seen = new Set();
	const scenes = list.map((s) => {
		if (seen.has(s.id)) throw new ScriptError(`duplicate scene id "${s.id}"`, s.line);
		seen.add(s.id);
		return buildScene(s, s.line);
	});
	if (raw.voice !== undefined && raw.voice !== null && (typeof raw.voice !== 'string' || !raw.voice.trim())) {
		throw new ScriptError(`${source}: voice must be a preset name`);
	}
	return {
		voice: raw.voice ?? null,
		pauseBeforeMs: seconds(raw.pauseBefore, 'pause-before', raw.pauseBeforeLine) ?? DEFAULT_PAUSE_BEFORE_MS,
		pauseAfterMs: seconds(raw.pauseAfter, 'pause-after', raw.pauseAfterLine) ?? DEFAULT_PAUSE_AFTER_MS,
		scenes,
	};
}

/** Parse screenplay markdown into a Script. */
export function parseScript(markdown) {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const raw = {scenes: []};
	let cur = null;
	let inFront = true;
	lines.forEach((rawLine, i) => {
		const line = rawLine.trimEnd();
		const no = i + 1;
		const t = line.trim();
		if (!t) return;
		if (t.startsWith('#') && !/^##\s/.test(t)) return; // comment ("# …", "### …")
		const heading = t.match(/^##\s+(.+?)\s*$/);
		if (heading) {
			inFront = false;
			cur = {id: heading[1].trim(), text: '', subtitle: '', voice: null, line: no, bodyStarted: false};
			raw.scenes.push(cur);
			return;
		}
		if (inFront) {
			const kv = t.match(/^([a-z-]+)\s*:\s*(.+)$/i);
			if (!kv) throw new ScriptError(`expected "key: value" before the first "## scene" heading, got "${t}"`, no);
			const key = kv[1].toLowerCase();
			if (!FRONT_KEYS.includes(key)) {
				throw new ScriptError(`unknown key "${key}". Allowed: voice, pause-before, pause-after. Provider settings belong in voices.json, not in the script.`, no);
			}
			if (key === 'voice') raw.voice = kv[2].trim();
			else if (key === 'pause-before') { raw.pauseBefore = kv[2].trim(); raw.pauseBeforeLine = no; }
			else { raw.pauseAfter = kv[2].trim(); raw.pauseAfterLine = no; }
			return;
		}
		const cap = t.match(/^>\s*subtitle:\s*(.*)$/i);
		if (cap) { cur.subtitle = cur.subtitle ? `${cur.subtitle} ${cap[1].trim()}` : cap[1].trim(); return; }
		if (/^>\s*caption:/i.test(t)) throw new ScriptError('"> caption:" was renamed to "> subtitle:" — the written form shown as a burnt-in subtitle; the scene\'s on-screen copy lives in its .tsx file', no);
		if (t.startsWith('>')) throw new ScriptError(`only "> subtitle: …" is allowed as a block quote, got "${t}"`, no);
		const voice = t.match(/^voice\s*:\s*(\S+)\s*$/i);
		if (voice) {
			if (cur.bodyStarted) throw new ScriptError(`"voice:" must be the first line of the scene, before the spoken text`, no);
			cur.voice = voice[1];
			return;
		}
		cur.bodyStarted = true;
		cur.text = cur.text ? `${cur.text} ${t}` : t;
	});
	if (raw.scenes.length === 0) throw new ScriptError('no "## scene" heading found — the script needs one heading per scene');
	return normaliseScript(raw, 'script.md');
}
