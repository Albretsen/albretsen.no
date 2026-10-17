// Generates extras/lamp-map.svg: every product as a lamp on a 2016-2026 timeline,
// lit (live), striking (building), dimmed (paused) or out (retired). Facts from content.js.
import { writeFileSync } from 'node:fs';
import { content } from '../../../_shared/content.js';

const W = 1200, H = 440, x0 = 70, x1 = 1050;
const X = (y) => x0 + ((y - 2016) / 10) * (x1 - x0);
let rnd = 544; const r = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
// hand-placed so labels never collide: [dx from the year tick, y]
const PLACE = {
  'fun-libs': [0, 150], 'early-apps': [0, 230], 'tryggere-hyring': [0, 250], 'webvakt': [-30, 200], 'joke-central': [-20, 305],
  'polyglot-pilot': [-40, 150], 'pinpoint': [10, 280], 'luma': [60, 310], 'harbor': [-20, 228],
  'mcp-emails': [-10, 95], 'toolrails': [50, 160],
};
const stars = content.products.map((p) => ({ ...p, x: X(p.since) + PLACE[p.id][0], y: PLACE[p.id][1] }));
stars.sort((a, b) => a.since - b.since || a.x - b.x);
const esc = (s) => s.replace(/&/g, '&amp;');
let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Lamp map: Albretsen AS products from 2016 to 2026">
  <defs>
    <radialGradient id="lit"><stop offset="0" stop-color="#fb942a" stop-opacity=".75"/><stop offset="1" stop-color="#fb942a" stop-opacity="0"/></radialGradient>
    <radialGradient id="cold"><stop offset="0" stop-color="#52b5f4" stop-opacity=".35"/><stop offset="1" stop-color="#52b5f4" stop-opacity="0"/></radialGradient>
    <radialGradient id="neon"><stop offset="0" stop-color="#e63281" stop-opacity=".7"/><stop offset="1" stop-color="#e63281" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#020513"/>
  <g font-family="JetBrains Mono, ui-monospace, monospace" font-size="11" font-weight="500" letter-spacing="1.6">\n`;
for (let i = 0; i < 160; i++) out += `    <circle class="twinkle" style="--i:${i}" cx="${(r() * W).toFixed(1)}" cy="${(r() * 330).toFixed(1)}" r="${(r() * 0.9 + 0.3).toFixed(2)}" fill="#bed4eb" opacity="${(r() * 0.5).toFixed(2)}"/>\n`;
// axis
out += `    <path d="M${x0} 360 H${W - 40}" stroke="#bed4eb" stroke-opacity=".25"/>\n`;
for (let y = 2016; y <= 2026; y++) out += `    <path d="M${X(y)} 354 V366" stroke="#bed4eb" stroke-opacity=".4"/><text x="${X(y)}" y="390" text-anchor="middle" fill="#bed4eb" fill-opacity="${y % 2 ? 0.35 : 0.7}">${y}</text>\n`;
// first Play Store release marker (history.playDeveloperSince)
out += `    <circle cx="${X(2016)}" cy="300" r="22" fill="url(#neon)"/><circle cx="${X(2016)}" cy="300" r="3" fill="#e63281"/><text x="${X(2016) + 14}" y="304" fill="#e63281">FIRST APP ON GOOGLE PLAY</text>\n`;
// constellation line in time order
out += `    <path d="M${X(2016)} 300 ${stars.map((s) => `L${s.x.toFixed(1)} ${s.y.toFixed(1)}`).join(' ')}" fill="none" stroke="#bed4eb" stroke-opacity=".18" stroke-dasharray="1 5" stroke-linecap="round"/>\n`;
for (const s of stars) {
  const live = s.status === 'live', building = s.status === 'building', paused = s.status === 'paused';
  const name = esc(s.name.split(' / ')[0].split(',')[0]);
  if (live) out += `    <circle cx="${s.x}" cy="${s.y}" r="34" fill="url(#lit)"/><circle cx="${s.x}" cy="${s.y}" r="5" fill="#ffe196"/>\n`;
  else if (building) out += `    <circle cx="${s.x}" cy="${s.y}" r="26" fill="url(#neon)"/><circle cx="${s.x}" cy="${s.y}" r="4" fill="#fb942a"/>\n`;
  else out += `    <circle cx="${s.x}" cy="${s.y}" r="${paused ? 18 : 12}" fill="url(#cold)"/><circle cx="${s.x}" cy="${s.y}" r="7" fill="none" stroke="#bed4eb" stroke-opacity=".45" stroke-dasharray="1.5 3"/><circle cx="${s.x}" cy="${s.y}" r="2" fill="#bed4eb" opacity=".7"/>\n`;
  out += `    <text x="${s.x + 12}" y="${s.y - 10}" fill="${live ? '#f1f6fa' : building ? '#fb942a' : '#bed4eb'}" fill-opacity="${live || building ? 1 : 0.55}">${name.toUpperCase()}</text>\n`;
}
// legend
const L = [['#ffe196', 'LIT · LIVE'], ['#fb942a', 'STRIKING · BUILDING'], ['#bed4eb', 'OUT · PAUSED OR RETIRED']];
L.forEach(([c, t], i) => { out += `    <circle cx="${x0 + i * 230}" cy="420" r="3.5" fill="${c}"/><text x="${x0 + 12 + i * 230}" y="424" fill="#bed4eb" fill-opacity=".7">${t}</text>\n`; });
out += `  </g>\n</svg>\n`;
writeFileSync(new URL('../extras/lamp-map.svg', import.meta.url), out);
console.log('ok', stars.length);
