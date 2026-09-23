# @harness/visuals

Reusable Remotion animation components, brand-neutral, shared by every client
project through an npm `file:` dependency. `INDEX.md` lists them; each folder's
`_meta.md` holds the research and adaptation notes.

## Using it

Client projects and format templates declare:

```json
"@harness/visuals": "file:../../packages/visuals"
```

`npm install` creates `node_modules/@harness/visuals` as a symlink to this
folder, so an edit here is live in every project without a reinstall.

```tsx
import {VisualsThemeProvider, StaggeredWords, PriceBalanceBadge} from '@harness/visuals';
import {visualsTheme} from '../brand/theme';

// Once at the root of each reel:
<VisualsThemeProvider theme={visualsTheme}>
	<PriceBalanceBadge startFrame={30} leftLabel="Import" rightLabel="Regional" />
</VisualsThemeProvider>
```

## Theme contract

`src/theme.ts` defines `VisualsTheme`: nine colour **roles** (`accent`,
`accentLight`, `accentDark`, `foreground`, `foregroundSoft`, `muted`, `subtle`,
`surface`, `background`), two fonts (`display`, `body`) and five spring presets
(`smooth`, `gentle`, `bouncy`, `heavy`, `stamp`). A client fulfils it once in
`src/brand/theme.ts` by mapping its own tokens onto the roles, and hands it to
`<VisualsThemeProvider>`. Every component also takes an optional partial
`theme` prop for a one-off override. Without a provider the neutral defaults
apply — a plain blue accent on dark grey, system fonts — so a component renders
sensibly in isolation but never ships unthemed by accident.

## What consumers must configure

Both settings are already in the format templates and are what makes the link
work; a project without them will not resolve imports from this package.

- `tsconfig.json`: `"preserveSymlinks": true`
- `remotion.config.ts`: `resolve.symlinks: false` via `Config.overrideWebpackConfig`

Without them, TypeScript and webpack resolve the symlink to its real path and
then look for `react`, `remotion` and every other dependency next to *this*
package instead of in the consuming project.

## Rules for components here

- Peer dependencies only. This package has no `node_modules` of its own, on
  purpose: its imports are satisfied by the consuming project, which keeps
  React and Remotion single-instance.
- No client-specific text, colours or fonts. Colours, fonts and springs come
  from `useVisualsTheme()`; every text and value a client would change is a
  prop with a neutral default.
- Technique-based names (`HexGrid`, not a brand motif). Keywords in `_meta.md`
  and `INDEX.md` name techniques, never clients, products or places tied to one.
- Export from `src/index.ts` — that is the public surface.
- Large geometry goes in a `data/` folder next to the component, with source
  and license in the file header.
