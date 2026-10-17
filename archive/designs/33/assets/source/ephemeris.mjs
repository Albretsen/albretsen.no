// Generates extras/ephemeris.svg — the decade as an orbit diagram (hand-authored data art).
// Rings are years 2016–2026; each body sits on the ring of the year it began.
// Facts only from designs/_shared/content.js.  Run: node source/ephemeris.mjs
import fs from 'fs';
const S = 760, SW = 1000, C = S / 2, CXX = SW / 2;
const yr = (y) => 40 + (y - 2016) * 25;
const f = (n) => Math.round(n * 10) / 10;
const sparkle = (cx, cy, R, k) => `M${f(cx)} ${f(cy - R)}C${f(cx + k * .3)} ${f(cy - k)} ${f(cx + k)} ${f(cy - k * .3)} ${f(cx + R)} ${f(cy)}C${f(cx + k)} ${f(cy + k * .3)} ${f(cx + k * .3)} ${f(cy + k)} ${f(cx)} ${f(cy + R)}C${f(cx - k * .3)} ${f(cy + k)} ${f(cx - k)} ${f(cy + k * .3)} ${f(cx - R)} ${f(cy)}C${f(cx - k)} ${f(cy - k * .3)} ${f(cx - k * .3)} ${f(cy - k)} ${f(cx)} ${f(cy - R)}Z`;
const bodies = [
  ['Google Play developer', 2016, -140, 'milestone'],
  ['Fun Libs', 2019, -42, 'live'],
  ['Consulting', 2021, 160, 'milestone'],
  ['Early apps', 2021, 64, 'retired'],
  ['Tryggere Hyring', 2023, 210, 'retired'],
  ['WebVakt', 2024, 112, 'retired'],
  ['Joke Central', 2024, 26, 'retired'],
  ['Polyglot Pilot', 2025, 150, 'retired'],
  ['PinPoint', 2025, 238, 'retired'],
  ['Albretsen AS', 2026, -78, 'milestone'],
  ['MCP Emails', 2026, -18, 'live'],
  ['Toolrails', 2026, 30, 'building'],
  ['Harbor', 2026, 84, 'paused'],
  ['Luma', 2026, 192, 'retired'],
];
let o = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SW} ${S}" width="${SW}" height="${S}" role="img" aria-label="Ephemeris: Albretsen AS products and milestones placed on yearly orbits, 2016 to 2026">
<title>Ephemeris 2016–2026</title>
<style>
  .t{font-family:'Geist Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:1.6px;fill:#aca9ae;text-transform:uppercase}
  .n{font-family:'Instrument Serif',Georgia,serif;font-size:17px;fill:#eceaee}
  .r{font-family:'Instrument Serif',Georgia,serif;font-size:14px;fill:#737076;font-style:italic}
  .y{font-family:'Geist Mono',ui-monospace,monospace;font-size:8.5px;letter-spacing:1.2px;fill:#737076}
</style>
<g fill="none" stroke="#eceaee">
`;
for (let y = 2016; y <= 2026; y++) o += `  <circle cx="${CXX}" cy="${C}" r="${yr(y)}" stroke-width="${y % 5 === 1 ? .8 : .45}" stroke-opacity="${y % 5 === 1 ? .38 : .18}"${y % 5 === 1 ? '' : ' stroke-dasharray="1.5 4"'}/>\n`;
o += `</g>\n<g>\n`;
for (let y = 2016; y <= 2026; y++) o += `  <text class="y" x="${CXX + 4}" y="${f(C - yr(y) - 3)}">${y}</text>\n`;
o += `</g>\n<path d="${sparkle(CXX, C, 9, 1.6)}" fill="#eceaee"/>\n`;
bodies.forEach(([name, y, deg, kind]) => {
  const a = deg * Math.PI / 180, r = yr(y), x = CXX + Math.cos(a) * r, yy = C + Math.sin(a) * r;
  const out = 34 + (kind === 'retired' ? 0 : 10);
  const lx = CXX + Math.cos(a) * (r + out), ly = C + Math.sin(a) * (r + out);
  const right = Math.cos(a) >= 0;
  if (kind === 'live' || kind === 'building' || kind === 'paused') o += `<circle cx="${f(x)}" cy="${f(yy)}" r="14" fill="url(#g)"/><path d="${sparkle(x, yy, kind === 'live' ? 8 : 6, 1.3)}" fill="#eceaee"/>\n`;
  else if (kind === 'milestone') o += `<circle cx="${f(x)}" cy="${f(yy)}" r="3.4" fill="#0b090c" stroke="#eceaee" stroke-width="1"/>\n`;
  else o += `<circle cx="${f(x)}" cy="${f(yy)}" r="2.6" fill="#737076"/>\n`;
  o += `<line x1="${f(CXX + Math.cos(a) * (r + 6))}" y1="${f(C + Math.sin(a) * (r + 6))}" x2="${f(lx)}" y2="${f(ly)}" stroke="#aca9ae" stroke-width=".5" stroke-opacity=".6"/>\n`;
  const cls = kind === 'retired' ? 'r' : kind === 'milestone' ? 't' : 'n';
  o += `<text class="${cls}" x="${f(lx + (right ? 5 : -5))}" y="${f(ly + 4)}" text-anchor="${right ? 'start' : 'end'}">${name}</text>\n`;
});
o += `<defs><radialGradient id="g"><stop offset="0" stop-color="#eceaee" stop-opacity=".5"/><stop offset="1" stop-color="#eceaee" stop-opacity="0"/></radialGradient></defs>
<text class="t" x="24" y="${S - 24}">Ephemeris · one ring per year · bodies on the ring of the year they began</text>
</svg>
`;
fs.writeFileSync(new URL('../extras/ephemeris.svg', import.meta.url), o);
console.log('ephemeris.svg', o.length);
