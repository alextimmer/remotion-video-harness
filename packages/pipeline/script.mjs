// `@harness/pipeline/script` — the code form of a voiceover script, for reels
// whose text is assembled programmatically. Prefer src/reels/<id>/script.md;
// use this only where prose is not enough. Imports nothing from React or
// Remotion so a script.ts stays loadable in plain Node. Types: script.d.ts.
export function defineScript(script) {
	return script;
}
