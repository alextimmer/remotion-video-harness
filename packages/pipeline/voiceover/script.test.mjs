// node --test packages/pipeline/voiceover/script.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emphasisPerWord, extractEmphasis, normaliseScript, parseScript, splitSegments, stripMarkers} from './script.mjs';

const SCRIPT = `# a comment line
voice: narrator
pause-before: 0.4
pause-after: 0.7

## hook
Where does it come from?

## far
Twelve thousand kilometres [pause 0.4] halfway around the globe.
> subtitle: 12,000 km – halfway around the globe.

## region
voice: warm
From the region. *About fifty* kilometres.
Short ways,
fresher product.
`;

test('front matter, scenes, per-scene voice, multi-line prose', () => {
	const s = parseScript(SCRIPT);
	assert.equal(s.voice, 'narrator');
	assert.equal(s.pauseBeforeMs, 400);
	assert.equal(s.pauseAfterMs, 700);
	assert.deepEqual(s.scenes.map((x) => x.id), ['hook', 'far', 'region']);
	assert.equal(s.scenes[0].voice, null);
	assert.equal(s.scenes[2].voice, 'warm');
	assert.equal(s.scenes[2].spoken, 'From the region. About fifty kilometres. Short ways, fresher product.');
});

test('subtitle override and default subtitle', () => {
	const s = parseScript(SCRIPT);
	assert.equal(s.scenes[1].subtitle, '12,000 km – halfway around the globe.');
	assert.equal(s.scenes[0].subtitle, 'Where does it come from?');
	// default subtitle strips markers
	assert.equal(s.scenes[2].subtitle, 'From the region. About fifty kilometres. Short ways, fresher product.');
});

test('pause splitting', () => {
	const s = parseScript(SCRIPT);
	assert.deepEqual(s.scenes[1].segments, [
		{text: 'Twelve thousand kilometres', marked: 'Twelve thousand kilometres', pauseAfterMs: 400},
		{text: 'halfway around the globe.', marked: 'halfway around the globe.', pauseAfterMs: 0},
	]);
	assert.equal(s.scenes[1].spoken, 'Twelve thousand kilometres halfway around the globe.');
	assert.deepEqual(splitSegments('One. [pause 1] [pause 0.5] Two. [pause 2]'), [
		{text: 'One.', marked: 'One.', pauseAfterMs: 1500},
		{text: 'Two.', marked: 'Two.', pauseAfterMs: 2000},
	]);
	assert.deepEqual(splitSegments('[pause 1s] Late start.'), [{text: 'Late start.', marked: 'Late start.', pauseAfterMs: 0}]);
});

test('emphasis ranges and per-word flags', () => {
	const {clean, ranges} = extractEmphasis('From the region. *About fifty* kilometres.');
	assert.equal(clean, 'From the region. About fifty kilometres.');
	assert.deepEqual(ranges, [{start: 17, end: 28}]);
	assert.deepEqual(emphasisPerWord(clean, ranges), [false, false, false, true, true, false]);
	const s = parseScript(SCRIPT);
	assert.deepEqual(s.scenes[2].emphasis, [{start: 17, end: 28}]);
	// stars stay in `marked`, leave `text`
	assert.equal(s.scenes[2].segments[0].marked, 'From the region. *About fifty* kilometres. Short ways, fresher product.');
	assert.equal(stripMarkers('*a* [pause 2] b'), 'a b');
});

test('errors name the line', () => {
	assert.throws(() => parseScript('voice: x\n## a\nA.\n## a\nB.\n'), /line 4: duplicate scene id "a"/);
	assert.throws(() => parseScript('provider: piper\n## a\nA.\n'), /line 1: unknown key "provider".*voices\.json/);
	assert.throws(() => parseScript('voice: x\nJust prose.\n'), /line 2: expected "key: value"/);
	assert.throws(() => parseScript('voice: x\n'), /no "## scene" heading/);
	assert.throws(() => parseScript('## a\n'), /line 1: scene "a" has no spoken text/);
	assert.throws(() => parseScript('## a b\nText.\n'), /scene id "a b" must match/);
	assert.throws(() => parseScript('pause-before: fast\n## a\nText.\n'), /line 1: pause-before must be a non-negative number/);
	assert.throws(() => parseScript('## a\nText.\nvoice: late\n'), /line 3: "voice:" must be the first line/);
	assert.throws(() => parseScript('## a\n> note: x\nText.\n'), /line 2: only "> subtitle:/);
});

test('normaliseScript accepts the defineScript shape', () => {
	const s = normaliseScript({
		voice: 'narrator',
		pauseBefore: 0.5,
		scenes: {
			hook: 'Plain string scene.',
			far: {text: 'A [pause 0.3] B', subtitle: 'A – *B*', voice: 'warm'},
		},
	});
	assert.equal(s.pauseBeforeMs, 500);
	assert.equal(s.pauseAfterMs, 700);
	assert.equal(s.scenes[0].spoken, 'Plain string scene.');
	assert.equal(s.scenes[1].voice, 'warm');
	assert.equal(s.scenes[1].subtitle, 'A – B');
	assert.deepEqual(s.scenes[1].emphasis, [{start: 4, end: 5}]);
	assert.equal(s.scenes[1].segments.length, 2);
	assert.throws(() => normaliseScript({scenes: {}}), /no scenes/);
	assert.throws(() => normaliseScript({scenes: {'bad id': 'x'}}), /must match/);
});

test('the old "> caption:" marker points at "> subtitle:"', () => {
	assert.throws(() => parseScript('## a\nText.\n> caption: T.\n'), /line 3: "> caption:" was renamed to "> subtitle:"/);
});
