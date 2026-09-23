#!/usr/bin/env bash
# Readiness gate for a client project. Exit 0 = onboarding complete, reels may
# be built. Exit 1 = placeholders or unconfirmed brand facts remain; run the
# onboarding-clients skill first (.agents/skills/onboarding-clients/SKILL.md).
#   scripts/check-client.sh <client-name | path>
set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARG="${1:?client name (folder under projects/) or path}"
if [ -d "$ARG" ]; then CLIENT_DIR="$(cd "$ARG" && pwd)"; else CLIENT_DIR="$HARNESS_DIR/projects/$ARG"; fi
[ -d "$CLIENT_DIR" ] || { echo "no client project at $CLIENT_DIR" >&2; exit 2; }
R="$CLIENT_DIR/agents/rules"
fail=0
ok()   { printf 'PASS  %s\n' "$1"; }
bad()  { printf 'FAIL  %s\n' "$1"; fail=1; }
warn() { printf 'WARN  %s\n' "$1"; }

# 1. Required files
for f in "$R/00-client-profile.md" "$R/10-brand.md" "$R/20-legal.md" "$CLIENT_DIR/src/brand/theme.ts" "$CLIENT_DIR/CLAUDE.md" "$CLIENT_DIR/AGENTS.md"; do
  [ -f "$f" ] && ok "exists  ${f#$CLIENT_DIR/}" || bad "missing ${f#$CLIENT_DIR/}"
done

# 2. Each core rule file must be confirmed by the user (line "Status: confirmed ...")
for f in 00-client-profile.md 10-brand.md 20-legal.md; do
  [ -f "$R/$f" ] || continue
  if grep -qiE '^Status: *confirmed' "$R/$f"; then ok "confirmed $f"; else bad "not confirmed by user: $f (needs a line 'Status: confirmed by <who> on <date>')"; fi
done

# 3. Template placeholders and open markers
if grep -rqs 'CLIENT_NAME' "$R"; then bad "template placeholder CLIENT_NAME still present in agents/rules"; else ok "no CLIENT_NAME placeholder"; fi
for f in 00-client-profile.md 10-brand.md 20-legal.md; do
  [ -f "$R/$f" ] || continue
  if grep -q '<!--' "$R/$f"; then bad "template comment placeholders (<!-- -->) left in $f"; fi
done
if grep -rqsE 'OPEN:' "$R" "$CLIENT_DIR/src/brand/theme.ts" 2>/dev/null; then
  bad "OPEN: markers remain (unanswered questions):"; grep -rnsE 'OPEN:' "$R" "$CLIENT_DIR/src/brand/theme.ts" | sed 's/^/        /'
else ok "no OPEN: markers"; fi

# 4. Theme must be customised, sourced and free of TODOs
T="$CLIENT_DIR/src/brand/theme.ts"
if [ -f "$T" ]; then
  if cmp -s "$T" "$HARNESS_DIR/templates/client-repo/src/brand/theme.ts"; then bad "src/brand/theme.ts is still the template (no brand values)"; else ok "theme.ts customised"; fi
  grep -q 'TODO' "$T" && bad "TODO left in theme.ts"
  grep -qiE 'Source:' "$T" && ok "theme.ts states its source" || bad "theme.ts has no 'Source:' comment (where do the values come from?)"
fi

# 4b. Theme must fulfil the @harness/visuals contract, and every reel must use it.
#     Without the provider the package renders its neutral defaults — a blue
#     accent on grey — and nothing else warns about it.
if [ -f "$T" ]; then
  grep -qE 'export const visualsTheme' "$T" && ok "theme.ts exports visualsTheme (visuals contract)" || bad "theme.ts does not export visualsTheme — map the brand tokens onto the @harness/visuals roles"
fi
reels=$(ls "$CLIENT_DIR"/src/reels/*/Reel.tsx 2>/dev/null)
if [ -n "$reels" ]; then
  missing=""
  for r in $reels; do grep -q 'VisualsThemeProvider' "$r" || missing="$missing ${r#$CLIENT_DIR/}"; done
  [ -z "$missing" ] && ok "every Reel.tsx wraps <VisualsThemeProvider>" || bad "Reel.tsx without <VisualsThemeProvider theme={visualsTheme}>:$missing"
fi

# 4c. Forbidden phrases must not appear in any live reel. Phrases are the
#     quoted strings on "Forbidden:" lines of 20-legal.md. Historical versions
#     may legitimately contain them (kept renderable, marked "not for
#     re-delivery" in their reel notes), so this warns and names the reels
#     rather than failing the gate.
L="$R/20-legal.md"
if [ -f "$L" ] && [ -d "$CLIENT_DIR/src/reels" ]; then
  hits=""
  while IFS= read -r phrase; do
    [ -n "$phrase" ] || continue
    found=$(grep -rilF -- "$phrase" "$CLIENT_DIR"/src/reels/*/scenes 2>/dev/null | sed -E 's#.*/src/reels/([^/]+)/.*#\1#' | sort -u | tr '\n' ' ')
    [ -n "$found" ] && hits="$hits
        \"$phrase\" in: $found"
  done < <(grep -iE '^- \*?\*?Forbidden' "$L" | grep -oE '"[^"]+"' | tr -d '"' | sed -E 's/ *(and any variant|or any claim.*)$//')
  if [ -n "$hits" ]; then warn "forbidden phrases (20-legal.md) in live reels — not for re-delivery:$hits"; else ok "no forbidden phrase in any live reel"; fi
fi

# 4d. Voice configuration: presets (src/brand/voices.json) and every reel's
#     script.md must parse and name only known presets and providers; the
#     retired voice.json / voice/index.ts must be gone. Implemented in the
#     pipeline so the gate and the CLI agree on what is valid.
if [ -d "$HARNESS_DIR/packages/pipeline/node_modules" ]; then
  while IFS= read -r line; do
    case "$line" in
      PASS*) ok "${line#PASS  }";;
      WARN*) warn "${line#WARN  }";;
      FAIL*) bad "${line#FAIL  }";;
      *) [ -n "$line" ] && printf '      %s\n' "$line";;
    esac
  done < <(node "$HARNESS_DIR/packages/pipeline/voiceover/check.mjs" "$CLIENT_DIR" 2>&1)
else
  warn "voice configuration not checked (packages/pipeline has no node_modules; run scripts/voiceover.sh once)"
fi

# 5. Generated instructions current
if bash "$HARNESS_DIR/scripts/sync-agents.sh" --check --client "$CLIENT_DIR" >/dev/null 2>&1; then ok "AGENTS.md up to date"; else bad "AGENTS.md out of date (run scripts/sync-agents.sh --client ${CLIENT_DIR#$HARNESS_DIR/})"; fi

# 6. Informational
n=$(ls "$R/reels/"*.md 2>/dev/null | wc -l)
[ "$n" -gt 0 ] && ok "$n reel note(s) in agents/rules/reels" || warn "no reel notes yet (agents/rules/reels/<id>.md is created with the first reel)"

echo
if [ $fail -eq 0 ]; then echo "READY: $(basename "$CLIENT_DIR") — onboarding complete, reels may be built."; exit 0
else echo "NOT READY: $(basename "$CLIENT_DIR") — run the onboarding-clients skill (.agents/skills/onboarding-clients/SKILL.md) before building reels."; exit 1; fi
