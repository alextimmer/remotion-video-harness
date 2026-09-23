# Reusable visuals library

Production-quality animation components live in `packages/visuals/`, the
linked npm package `@harness/visuals`. Every client project imports from it;
nothing is copied. `packages/visuals/INDEX.md` is the lookup table; each folder
has a `_meta.md` with research context, key insights and adaptation notes.

## Before building any animation

1. Read `packages/visuals/INDEX.md` and match keywords.
2. Read the matching `_meta.md` for insights and adaptation notes.
3. Import the component and pass the client's texts and values as props.

Do not rebuild a visual that already exists.

## Consuming the package

```tsx
import {VisualsThemeProvider, PriceBalanceBadge} from '@harness/visuals';
```

- The dependency is `"@harness/visuals": "file:../../packages/visuals"`, which
  npm installs as a symlink — an edit in the package is live in every project
  without a reinstall. Two settings in the consuming project make that
  resolve, both already in the format templates: `"preserveSymlinks": true`
  in `tsconfig.json` and `resolve.symlinks: false` via
  `Config.overrideWebpackConfig` in `remotion.config.ts`.
- **Theme:** components take colours, fonts and springs from the theme
  contract in `packages/visuals/src/theme.ts` (roles such as `accent`,
  `foreground`, `muted`). The client fulfils it once as `visualsTheme` in
  `src/brand/theme.ts` and wraps each reel's root in
  `<VisualsThemeProvider theme={visualsTheme}>`. A component's optional
  `theme` prop overrides parts of it for one use. Without a provider the
  neutral defaults render — fine in Studio, never in a deliverable.
- **Content:** every text, price, label, route or destination a client would
  change is a prop. The client passes its own strings at the call site; the
  package defaults are neutral placeholders.

## After building a complex new visual

If a visual needed research, iteration or a specific technique (projection
math, physics, multi-step SVG animation), store it in the package:

1. New folder under `packages/visuals/src/` with a descriptive,
   **technique-based** name (`HexGrid`, not a brand motif); export it from
   `packages/visuals/src/index.ts`.
2. Colours, fonts and springs via `useVisualsTheme(theme)`; all client-specific
   text and values exposed as props with neutral defaults.
3. `_meta.md` with: Description, Keywords (technique terms only — no client,
   product, competitor or client-tied place names), Research and key prompts,
   Technical approach, Style adaptation (in theme roles), Props, Data
   dependencies.
4. Row in `packages/visuals/INDEX.md`.

The package declares peer dependencies only and deliberately has no
`node_modules` of its own; its imports are satisfied by the consuming project,
which keeps React and Remotion single-instance. See `packages/visuals/README.md`.

Geometry and other large data (coastlines, country borders) are stored as
typed `data/*.ts` modules next to the component, with source and license in
the file header. Data that was placed by hand says so plainly.

Client-only visuals (logos, seals, product-specific drawings) stay in the
client repository under `src/brand/components/`.
