// Generates the vector extras for design 82 from the canonical content.
// Run: node designs/82/assets/src/build-extras.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { content } from '../../../_shared/content.js';
import { icons, sectorPath } from '../icons/icons.js';

const A = join(dirname(fileURLToPath(import.meta.url)), '..');
const INK = '#0a0907', PAPER = '#f9f6f2', DAWN = '#fea91e', DEEP = '#b97500', MID = '#777471', LINE = '#dad7d3';
const MONO = `font-family="Geist Mono, ui-monospace, SF Mono, monospace"`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---- 1. Proposition: the company as an orbit diagram (Byrne notation) --------
{
  const S = 960, c = S / 2;
  const years = [2016, 2019, 2021, 2023, 2024, 2025, 2026];
  const ringR = (y) => 120 + (2026 - y) * 33; // newest closest to the centre
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="Albretsen AS products as orbits, newest closest to the centre">`;
  svg += `<rect width="${S}" height="${S}" fill="${PAPER}"/>`;
  for (const y of years) {
    const r = ringR(y);
    svg += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${y === 2026 ? DAWN : INK}" stroke-width="${y === 2026 ? 1.6 : 0.8}" ${y === 2026 ? '' : 'stroke-dasharray="1.5 5"'} opacity="${y === 2026 ? 1 : 0.55}"/>`;
    svg += `<text x="${c + 6}" y="${c - r - 6}" ${MONO} font-size="11" letter-spacing="1.2" fill="${MID}">${y}</text>`;
  }
  // centre mass
  svg += `<circle cx="${c}" cy="${c}" r="58" fill="${INK}"/>`;
  svg += `<g transform="translate(${c - 24} ${c - 26}) scale(2)"><path d="${sectorPath(icons.mark.sun)}" fill="${DAWN}"/><g stroke="${PAPER}" stroke-width="1.6" fill="none">${icons.mark.strokes.map((d) => `<path d="${d}"/>`).join('')}</g></g>`;
  // bodies
  const byYear = {};
  content.products.forEach((p) => { (byYear[p.since] ||= []).push(p); });
  const start = { 2026: -150, 2025: 20, 2024: 115, 2023: 200, 2021: 250, 2019: -40, 2016: 0 };
  for (const [y, list] of Object.entries(byYear)) {
    const r = ringR(+y);
    list.forEach((p, i) => {
      const a = ((start[y] ?? 0) + i * 44) * Math.PI / 180;
      const x = c + r * Math.cos(a), yy = c + r * Math.sin(a);
      const live = p.status === 'live', building = p.status === 'building', paused = p.status === 'paused';
      const rad = live ? 15 : building || paused ? 11 : 6.5;
      if (live) svg += `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${rad}" fill="${DAWN}"/>`;
      else if (building) svg += `<path d="${sectorPath([x, yy, rad, 180, 360])}" fill="${DAWN}"/><circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${rad}" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
      else if (paused) svg += `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${rad}" fill="${PAPER}" stroke="${INK}" stroke-width="1.4"/>`;
      else svg += `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="${rad}" fill="${INK}"/>`;
      const right = Math.cos(a) >= 0;
      const name = p.name.length > 26 ? p.name.split(',')[0] + ' …' : p.name;
      svg += `<text x="${(x + (right ? rad + 8 : -rad - 8)).toFixed(1)}" y="${(yy + 4).toFixed(1)}" ${MONO} font-size="12" fill="${INK}" text-anchor="${right ? 'start' : 'end'}">${esc(name)}</text>`;
    });
  }
  // legend
  const L = [[DAWN, 'live', 'full'], [DAWN, 'building', 'half'], [PAPER, 'paused', 'ring'], [INK, 'retired', 'dot']];
  L.forEach(([col, label, kind], i) => {
    const x = 40 + i * 120, y = S - 40;
    if (kind === 'full') svg += `<circle cx="${x}" cy="${y}" r="7" fill="${col}"/>`;
    if (kind === 'half') svg += `<path d="${sectorPath([x, y, 7, 180, 360])}" fill="${DAWN}"/><circle cx="${x}" cy="${y}" r="7" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
    if (kind === 'ring') svg += `<circle cx="${x}" cy="${y}" r="7" fill="${PAPER}" stroke="${INK}" stroke-width="1.2"/>`;
    if (kind === 'dot') svg += `<circle cx="${x}" cy="${y}" r="4.5" fill="${INK}"/>`;
    svg += `<text x="${x + 14}" y="${y + 4}" ${MONO} font-size="11" letter-spacing="1.2" fill="${MID}">${label.toUpperCase()}</text>`;
  });
  svg += `<text x="${S - 40}" y="${S - 36}" ${MONO} font-size="11" letter-spacing="1.2" fill="${MID}" text-anchor="end">PROP. I — EVERYTHING ORBITS ONE COMPANY</text>`;
  svg += `</svg>\n`;
  writeFileSync(join(A, 'extras/proposition.svg'), svg);
}

// ---- 2. Drop tag: the release label for "Drop 00", the company itself -------
{
  const live = content.products.filter((p) => p.status === 'live').length;
  const building = content.products.filter((p) => p.status === 'building').length;
  const rows = [
    ['ISSUER', content.company.toUpperCase()],
    ['ORIGIN', content.location.toUpperCase()],
    ['ON GOOGLE PLAY SINCE', String(content.history.playDeveloperSince)],
    ['COMPANY SINCE', String(content.history.companySince)],
    ['LIVE', content.products.filter((p) => p.status === 'live').map((p) => p.name.toUpperCase()).join(', ')],
    ['BUILDING', content.products.filter((p) => p.status === 'building').map((p) => p.name.toUpperCase()).join(', ')],
  ];
  const W = 420, H = 300;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Drop 00 release label">`;
  s += `<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="10" fill="${PAPER}" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<circle cx="${W - 26}" cy="26" r="7" fill="none" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<text x="24" y="44" font-family="Geist, system-ui, sans-serif" font-weight="600" font-size="30" letter-spacing="-0.6" fill="${INK}">DROP 00</text>`;
  s += `<text x="24" y="64" ${MONO} font-size="10.5" letter-spacing="1.6" fill="${MID}">THE COMPANY, NOT A PRODUCT</text>`;
  s += `<path d="M24 80 H${W - 24}" stroke="${INK}" stroke-width="1.5"/>`;
  rows.forEach(([k, v], i) => {
    const y = 104 + i * 24;
    s += `<text x="24" y="${y}" ${MONO} font-size="10.5" letter-spacing="1.2" fill="${MID}">${esc(k)}</text>`;
    s += `<text x="${W - 24}" y="${y}" ${MONO} font-size="10.5" letter-spacing="1.2" fill="${INK}" text-anchor="end">${esc(v)}</text>`;
    s += `<path d="M24 ${y + 8} H${W - 24}" stroke="${LINE}" stroke-width="1"/>`;
  });
  // icon "barcode": every glyph's strokes, tiny, in a row
  const ids = ['mark', 'agent', 'signal', 'app', 'knowledge', 'launch', 'orbit', 'gravity', 'qed'];
  ids.forEach((id, i) => {
    const g = icons[id];
    s += `<g transform="translate(${24 + i * 22} ${H - 38}) scale(0.75)"><path d="${sectorPath(g.sun)}" fill="${DAWN}"/><g stroke="${INK}" stroke-width="1.8" fill="none">${g.strokes.map((d) => `<path d="${d}"/>`).join('')}</g></g>`;
  });
  s += `<text x="${W - 24}" y="${H - 22}" ${MONO} font-size="10.5" letter-spacing="1.6" fill="${DEEP}" text-anchor="end">Q.E.D.</text>`;
  s += `</svg>\n`;
  writeFileSync(join(A, 'extras/drop-tag.svg'), s);
}

// ---- 3. Fracture divider: a hairline with one jagged break of light ---------
{
  const W = 1440, H = 40, mid = H / 2;
  const pts = [[690, mid], [700, mid - 9], [708, mid + 6], [716, mid - 4], [722, mid + 11], [732, mid - 2], [740, mid]];
  const poly = pts.map((p) => p.join(',')).join(' ');
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="none" aria-hidden="true">`;
  s += `<defs><filter id="glow" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="4"/></filter></defs>`;
  s += `<path d="M0 ${mid} H690" stroke="${INK}" stroke-width="1"/><path d="M740 ${mid + 1.2} H${W}" stroke="${INK}" stroke-width="1"/>`;
  s += `<polyline points="${poly}" fill="none" stroke="${DAWN}" stroke-width="5" filter="url(#glow)" opacity=".8"/>`;
  s += `<polyline points="${poly}" fill="none" stroke="${DAWN}" stroke-width="1.4" stroke-linejoin="miter"/>`;
  s += `</svg>\n`;
  writeFileSync(join(A, 'extras/fracture-divider.svg'), s);
}

// ---- 4. Graph paper pattern (matches the grid on hero/gravity) --------------
writeFileSync(join(A, 'extras/graph-paper.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><path d="M0 0.5 H48 M0.5 0 V48" stroke="${INK}" stroke-opacity=".09" stroke-width="1"/><path d="M24 0 V48 M0 24 H48" stroke="${INK}" stroke-opacity=".04" stroke-width="1"/></svg>\n`);

// ---- 5. Sun stickers: the five sector shapes the system allows -------------
{
  const shapes = [[0, 360, 'FULL'], [180, 360, 'RISING'], [0, 180, 'SET'], [180, 270, 'QUARTER'], [-90, 90, 'HALF']];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 150" width="600" height="150" role="img" aria-label="The five sun shapes">`;
  shapes.forEach(([a0, a1, label], i) => {
    const cx = 60 + i * 120, cy = 70;
    s += `<path d="${sectorPath([cx, cy, 34, a0, a1])}" fill="${DAWN}"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="34" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="1.5 4" opacity=".5"/>`;
    s += `<text x="${cx}" y="134" ${MONO} font-size="10" letter-spacing="1.6" fill="${MID}" text-anchor="middle">${label}</text>`;
  });
  s += `</svg>\n`;
  writeFileSync(join(A, 'extras/sun-shapes.svg'), s);
}
console.log('extras written');

// ---- 6. Retired product stand-ins: ink coins carrying the glyph -------------
import { mkdirSync } from 'node:fs';
mkdirSync(join(A, 'products/retired'), { recursive: true });
for (const [pid, gid] of [['polyglot-pilot', 'polyglot'], ['pinpoint', 'pinpoint'], ['webvakt', 'webvakt'], ['joke-central', 'jokes'], ['tryggere-hyring', 'tryggere'], ['early-apps', 'early']]) {
  const g = icons[gid], p = content.products.find((x) => x.id === pid);
  writeFileSync(join(A, `products/retired/${pid}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="${esc(p.name)} (retired, ${p.since})">` +
    `<rect width="160" height="160" rx="36" fill="${INK}"/>` +
    `<g transform="translate(32 26) scale(4)"><path d="${sectorPath(g.sun)}" fill="${DAWN}"/><g stroke="${PAPER}" stroke-width="1.35" fill="none" stroke-linejoin="miter">${g.strokes.map((d) => `<path d="${d}"/>`).join('')}</g></g>` +
    `<text x="80" y="146" ${MONO} font-size="9.5" letter-spacing="1.4" fill="${MID}" text-anchor="middle">${p.since} — RETIRED</text></svg>\n`);
}
console.log('retired stand-ins written');
