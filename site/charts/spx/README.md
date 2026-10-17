# S&P records chart

Interactive chart for "Stop caring about all-time highs". `chart.js` (dependency-free ES module) + `chart.css` (scoped under `.spx`; needs the Josefin Sans, Instrument Serif and DM Mono font faces from the page).

**Build the data:** `node site/charts/spx/build-data.ts <outDir> [assetBase]` (Node 22+, strips TS types). It imports the arrays from `articles/stop-caring-about-all-time-highs/chart/spx.ts` and the copy from `copy.{en,nb}.json`, and writes: `spx.json` (each series as integer deltas of `round(ln v × k)`, with `k` the smallest step that keeps every record identical for every start year; ~27 KB, ~11 KB gzipped; includes both copy files), `spx-fallback.svg` (16:9) + `spx-fallback-4x3.svg` (phones ≤ 540 px): total return, log axis, record dots; and `spx-shell.{en,nb}.html`: the chart's full markup with the fallback in the plot, its `<img>` src prefixed with `assetBase`.

**Mount:** paste `spx-shell.<lang>.html` where the article says "interactive chart goes here", inside a wrapper element, then
`import { mountSpxChart } from '/charts/spx/chart.js'; mountSpxChart(wrapper, { lang: 'en', dataUrl: '/charts/spx/spx.json' })`.
The live chart re-renders the same markup in the same box (plot height comes from CSS `aspect-ratio`), so the swap causes no layout shift. Without JS (`@media (scripting: none)`) the controls, stats and hint are hidden and only the static figure remains.

**Defaults:** nominal, linear, from 1871 (matches the article: 18 % of months since 1871, 31 % since 1950, 51 % since 2016). Optional mount options: `series`, `scale`, `start`. Returns `{ set({ start, series, scale }) }`.

**Demo:** serve the repo root and open `/site/charts/spx/demo.html` (`?lang=nb`, `?shell`, `?start=1950&scale=log`, `?w=320`). Rebuild its data with `node site/charts/spx/build-data.ts site/charts/spx/demo-data demo-data/`.
