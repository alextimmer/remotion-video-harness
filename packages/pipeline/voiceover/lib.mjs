// Shared helpers for the voiceover pipeline: paths, .env, hashing, ffmpeg,
// whisper transcription and caption paging. Plain ESM, Node 22, no build.
import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {
	downloadWhisperModel,
	installWhisperCpp,
	toCaptions,
	transcribe,
} from '@remotion/install-whisper-cpp';

export const HARNESS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const WHISPER_DIR = join(HARNESS_DIR, 'packages/pipeline/.whisper');
export const WHISPER_VERSION = '1.5.5';

/** Minimal .env loader (KEY=value, # comments). Existing env wins. */
export function loadEnv(file = join(HARNESS_DIR, '.env')) {
	if (!existsSync(file)) return {};
	const out = {};
	for (const line of readFileSync(file, 'utf8').split('\n')) {
		const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
		if (!m || line.trim().startsWith('#')) continue;
		out[m[1]] = m[2].replace(/^["']|["']$/g, '');
		if (process.env[m[1]] === undefined) process.env[m[1]] = out[m[1]];
	}
	return out;
}

export const sha1 = (s) => createHash('sha1').update(s).digest('hex');

export function run(cmd, args, opts = {}) {
	const r = spawnSync(cmd, args, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts});
	if (r.status !== 0) {
		throw new Error(`${cmd} ${args.join(' ')}\n${(r.stderr || r.stdout || '').trim()}`);
	}
	return r.stdout;
}

/** Duration of an audio file in milliseconds (ffprobe). */
export function durationMs(file) {
	const out = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
	return Math.round(parseFloat(out) * 1000);
}

/**
 * Normalise a raw TTS clip for the reel: single-pass loudnorm to a speech
 * level (-18 LUFS, -2 dBTP), trim leading/trailing silence, 48 kHz mono 16-bit.
 */
export function normaliseClip(input, output) {
	mkdirSync(dirname(output), {recursive: true});
	run('ffmpeg', [
		'-hide_banner', '-loglevel', 'error', '-y', '-i', input,
		'-af', [
			'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05',
			'areverse',
			'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05',
			'areverse',
			'loudnorm=I=-18:TP=-2:LRA=7',
			'aformat=sample_rates=48000:channel_layouts=mono',
		].join(','),
		'-c:a', 'pcm_s16le', output,
	]);
	return output;
}

/**
 * Join normalised clips (48 kHz mono s16) with exact silences between them:
 * files[i] is followed by gapsMs[i] milliseconds of silence (0 = none). A
 * trailing gap is kept as silence at the end. Used for `[pause N]` markers, so
 * pauses are provider-independent.
 */
export function concatWithSilence(files, gapsMs, output) {
	if (files.length === 1 && !(gapsMs[0] > 0)) {
		copyFileSync(files[0], output);
		return output;
	}
	const args = ['-hide_banner', '-loglevel', 'error', '-y'];
	const labels = [];
	let n = 0;
	files.forEach((f, i) => {
		args.push('-i', f);
		labels.push(`[${n++}:a]`);
		const gap = gapsMs[i] ?? 0;
		if (gap > 0) {
			args.push('-f', 'lavfi', '-t', (gap / 1000).toFixed(3), '-i', 'anullsrc=r=48000:cl=mono');
			labels.push(`[${n++}:a]`);
		}
	});
	args.push('-filter_complex', `${labels.join('')}concat=n=${labels.length}:v=0:a=1[out]`, '-map', '[out]', '-c:a', 'pcm_s16le', output);
	run('ffmpeg', args);
	return output;
}

/** whisper.cpp only accepts 16 kHz mono 16-bit WAV. */
export function toWhisperInput(input, output) {
	run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', output]);
	return output;
}

export async function ensureWhisper(model, log = console.log) {
	// installWhisperCpp() treats an existing target folder as "already
	// installed" and returns without cloning or building — so never create the
	// folder beforehand, and install before downloading the model into it.
	const exe = join(WHISPER_DIR, 'main');
	if (!existsSync(exe)) {
		if (existsSync(WHISPER_DIR)) {
			throw new Error(WHISPER_DIR + ' exists but has no whisper.cpp build (no "main"). Move any ggml-*.bin model out, delete the folder, and run again.');
		}
		log('  whisper: cloning and building whisper.cpp ' + WHISPER_VERSION + ' (minutes, once)...');
		await installWhisperCpp({to: WHISPER_DIR, version: WHISPER_VERSION, printOutput: true});
	}
	await downloadWhisperModel({model, folder: WHISPER_DIR, printOutput: false, onProgress: (p) => {
		if (p.downloadedBytes === p.totalBytes) log('  whisper model "' + model + '" ready');
	}});
}

/** Word-level captions for a clip: [{text, startMs, endMs}] with clip-relative times. */
export async function transcribeWords(wav16k, {model, language}) {
	const json = await transcribe({
		inputPath: wav16k,
		whisperPath: WHISPER_DIR,
		whisperCppVersion: WHISPER_VERSION,
		model,
		modelFolder: WHISPER_DIR,
		tokenLevelTimestamps: true,
		language,
		printOutput: false,
	});
	const {captions} = toCaptions({whisperCppOutput: json});
	// toCaptions yields one entry per token; merge tokens that do not start with
	// a space into the previous word, drop empties and bracketed markers.
	const words = [];
	for (const c of captions) {
		const raw = c.text ?? '';
		if (!raw.trim() || /^\s*\[.*\]\s*$/.test(raw)) continue;
		const startsWord = /^\s/.test(raw) || words.length === 0;
		if (startsWord) words.push({text: raw.trim(), startMs: c.startMs, endMs: c.endMs});
		else {
			const w = words[words.length - 1];
			w.text += raw.trim();
			w.endMs = c.endMs;
		}
	}
	return words;
}

/**
 * Captions must show the approved script, not what the recogniser heard
 * ("GeoX Indikator-Test-Stipchen"). Keep whisper's timings, replace the words:
 * script words are mapped onto the transcribed timeline by cumulative
 * character position, so counts need not match.
 */
export function alignToScript(heard, scriptText) {
	const script = scriptText.split(/\s+/).filter(Boolean);
	if (!heard.length || !script.length) return heard;
	const total = heard[heard.length - 1].endMs;
	const start = heard[0].startMs;
	// cumulative char offsets of the heard words -> time
	const heardChars = heard.reduce((a, w) => a + w.text.length, 0) || 1;
	let acc = 0;
	const heardTimeline = heard.map((w) => {
		const from = acc / heardChars;
		acc += w.text.length;
		return {from, to: acc / heardChars, startMs: w.startMs, endMs: w.endMs};
	});
	const timeAt = (frac) => {
		const seg = heardTimeline.find((h) => frac >= h.from && frac <= h.to) ?? heardTimeline[heardTimeline.length - 1];
		const local = seg.to === seg.from ? 0 : (frac - seg.from) / (seg.to - seg.from);
		return seg.startMs + local * (seg.endMs - seg.startMs);
	};
	const scriptChars = script.reduce((a, w) => a + w.length, 0) || 1;
	let sacc = 0;
	return script.map((text) => {
		const from = sacc / scriptChars;
		sacc += text.length;
		const to = sacc / scriptChars;
		const startMs = Math.round(Math.max(start, timeAt(from)));
		const endMs = Math.round(Math.min(total, Math.max(startMs + 60, timeAt(to))));
		return {text, startMs, endMs};
	});
}

/**
 * Page words into caption cards: ≤ maxChars (≈ two 30-character lines at
 * 44 px in 860 px), break on long gaps and after sentence ends. Each page: {text, startMs, endMs, words}.
 */
export function pageCaptions(words, {maxChars = 60, gapMs = 700, lingerMs = 250} = {}) {
	const pages = [];
	let cur = null;
	const flush = () => { if (cur && cur.words.length) pages.push(cur); cur = null; };
	for (const w of words) {
		const prev = cur?.words[cur.words.length - 1];
		const candidate = cur ? `${cur.text} ${w.text}` : w.text;
		const longGap = prev && w.startMs - prev.endMs > gapMs;
		const sentenceEnd = prev && /[.!?]$/.test(prev.text) && cur.text.length >= 12;
		if (!cur || candidate.length > maxChars || longGap || sentenceEnd) {
			// Never end a page on a bare number or unit prefix ("15" | "min"): carry
			// the dangling token over so "15 min" stays together.
			if (cur && cur.words.length > 1 && /^[\d½¼¾.,]+$/.test(prev.text)) {
				const carried = cur.words.pop();
				cur.text = cur.words.map((x) => x.text).join(' ');
				cur.endMs = cur.words[cur.words.length - 1].endMs;
				flush();
				cur = {text: `${carried.text} ${w.text}`, startMs: carried.startMs, endMs: w.endMs, words: [carried, w]};
				continue;
			}
			flush();
			cur = {text: w.text, startMs: w.startMs, endMs: w.endMs, words: [w]};
		} else {
			cur.text = candidate;
			cur.endMs = w.endMs;
			cur.words.push(w);
		}
	}
	flush();
	for (let i = 0; i < pages.length; i++) {
		const next = pages[i + 1];
		pages[i].endMs = next ? Math.min(pages[i].endMs + lingerMs, next.startMs) : pages[i].endMs + lingerMs;
	}
	return pages;
}

/**
 * Write the generated voice index (`voice/generated.ts`) a reel imports. Data
 * only: the type lives in @harness/visuals, the behaviour in <Voice> and
 * deriveVoiceTiming(). `source` names the script file it came from.
 */
export function writeVoiceIndex(file, index, source = 'script.md') {
	mkdirSync(dirname(file), {recursive: true});
	const body = JSON.stringify(index, null, '\t');
	writeFileSync(file, `// GENERATED by scripts/voiceover.sh — do not edit; edit ../${source} and re-run.
// Clip files live in public/audio/<reelId>/; times are milliseconds.
// Use: <VoiceProvider index={VOICE}> in Reel.tsx, <Voice scene="…"/> per scene,
// deriveVoiceTiming(VOICE, …) in timing.ts — all from @harness/visuals.
import type {VoiceIndex} from '@harness/visuals';

export const VOICE = ${body} satisfies VoiceIndex;
`);
}

/** Read the data back out of a generated index (for reusing caption pages). */
export function readVoiceIndex(file) {
	if (!existsSync(file)) return null;
	const m = readFileSync(file, 'utf8').match(/VOICE = ([\s\S]*?) satisfies VoiceIndex;/);
	try { return m ? JSON.parse(m[1]) : null; } catch { return null; }
}
