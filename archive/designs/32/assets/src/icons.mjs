// Generates the paper cut-out SVG icon family: retired-product stand-ins,
// desktop/system icons, stickers, tape and torn-edge dividers.
// Usage: node icons.mjs <assets-dir>
import fs from 'fs';
const OUT = process.argv[2];
const C = { ink: '#050d1c', night: '#0a1936', deep: '#122a52', dusk: '#1f4274', twilight: '#406c9b', haze: '#7fa3c2', sodium: '#f68c26', ember: '#d55c13', glow: '#f9cc87', aurora: '#9ada5e', auroraDeep: '#298646', paper: '#f5eede', shade: '#dccfbc' };

// deterministic wobble so every edge looks hand-cut
let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const wob = (pts, a = 0.6) => 'M' + pts.map(([x, y]) => `${(x + (r() - 0.5) * a).toFixed(1)} ${(y + (r() - 0.5) * a).toFixed(1)}`).join(' L') + ' Z';
const circ = (cx, cy, rad, n = 40, a = 0.5) => wob(Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.2832) * rad, cy + Math.sin(i / n * 6.2832) * rad]), a);
const rrect = (x, y, w, h, rad, a = 0.5) => { const p = []; const c = (cx, cy, a0) => { for (let i = 0; i <= 6; i++) { const t = a0 + i / 6 * Math.PI / 2; p.push([cx + Math.cos(t) * rad, cy + Math.sin(t) * rad]); } };
  c(x + w - rad, y + rad, -Math.PI / 2); c(x + w - rad, y + h - rad, 0); c(x + rad, y + h - rad, Math.PI / 2); c(x + rad, y + rad, Math.PI); return wob(p, a); };

const DEFS = `<defs>
  <filter id="cut" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feDropShadow dx="1" dy="2.2" stdDeviation="1.4" flood-color="${C.ink}" flood-opacity=".55"/></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .09 0" result="g"/><feComposite in="g" in2="SourceGraphic" operator="in" result="gi"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="gi"/></feMerge></filter>
</defs>`;
const icon = (name, body, label, vb = '0 0 96 96') => fs.writeFileSync(`${OUT}/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${vb}" role="img" aria-label="${label}">${DEFS}<g filter="url(#grain)">${body}</g></svg>\n`);
const P = (d, fill, f = true, extra = '') => `<path d="${d}" fill="${fill}"${f ? ' filter="url(#cut)"' : ''}${extra}/>`;
const tile = (fill) => P(rrect(6, 6, 84, 84, 20), fill);

// ---------- retired product stand-ins (respectful, not logos) ----------
fs.mkdirSync(`${OUT}/products/retired`, { recursive: true });
const R = (n, b, l) => icon(`products/retired/${n}`, b, l);
R('polyglot-pilot', tile(C.deep) +
  P(rrect(16, 20, 44, 32, 8), C.paper) + P(wob([[24, 50], [22, 62], [34, 51]]), C.paper) +
  `<text x="38" y="43" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="20" fill="${C.ink}">Aa</text>` +
  P(rrect(40, 42, 42, 30, 8), C.sodium) + P(wob([[70, 70], [74, 80], [62, 71]]), C.sodium) +
  `<text x="61" y="64" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="19" fill="${C.ink}">æø</text>`, 'Polyglot Pilot stand-in');
R('pinpoint', tile(C.dusk) +
  `<g transform="rotate(-7 48 50)">${P(wob([[18, 18], [76, 18], [76, 80], [18, 80]]), C.paper)}${P(wob([[23, 23], [71, 23], [71, 64], [23, 64]]), C.twilight, false)}${P(wob([[23, 64], [36, 46], [47, 56], [58, 40], [71, 58], [71, 64]]), C.night, false)}${P(circ(60, 31, 4.5, 16), C.glow, false)}</g>` +
  P('M48 30 C38 30 33 37 33 44 C33 54 48 66 48 66 C48 66 63 54 63 44 C63 37 58 30 48 30 Z', C.sodium) + P(circ(48, 44, 5.5, 20), C.paper, false), 'PinPoint stand-in');
R('webvakt', tile(C.night) +
  P(rrect(14, 22, 68, 52, 7), C.paper) + P(wob([[14, 22], [82, 22], [82, 33], [14, 33]], 0.3), C.haze, false) +
  P('M26 54 C34 43 62 43 70 54 C62 65 34 65 26 54 Z', C.ink, false) + P(circ(48, 54, 7.5, 24), C.aurora, false) + P(circ(48, 54, 3, 12), C.ink, false), 'WebVakt stand-in');
R('joke-central', tile(C.sodium) +
  P(circ(48, 46, 27, 48), C.glow) + P(circ(38, 40, 3.6, 14), C.ink, false) + P(circ(58, 40, 3.6, 14), C.ink, false) +
  P('M33 52 C38 66 58 66 63 52 Z', C.ink, false) + P('M38 58 C44 62 52 62 58 58 L56 61 C50 65 46 65 40 61 Z', C.ember, false) +
  P(wob([[60, 70], [80, 64], [78, 76]]), C.paper), 'Daily Jokes / Joke Central stand-in');
R('tryggere-hyring', tile(C.deep) +
  P('M48 16 L74 26 L74 46 C74 62 62 74 48 80 C34 74 22 62 22 46 L22 26 Z', C.paper) +
  P('M48 24 L67 31 L67 46 C67 58 58 67 48 72 Z', C.shade, false) +
  P(wob([[35, 48], [43, 56], [61, 37], [65, 41], [43, 64], [31, 52]], 0.4), C.auroraDeep), 'Tryggere Hyring stand-in');
R('early-apps', tile(C.twilight) +
  P(rrect(24, 14, 48, 68, 8), C.ink) + P(rrect(30, 20, 36, 16, 3), C.aurora, false) +
  `<text x="62" y="33" text-anchor="end" font-family="ui-monospace,monospace" font-weight="700" font-size="11" fill="${C.ink}">%</text>` +
  [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => P(rrect(30 + col * 13, 42 + row * 12, 10, 9, 2, 0.3), (row === 2 && col === 2) ? C.sodium : C.paper, false))).join(''), 'Early apps stand-in');

// ---------- desktop / system icons ----------
fs.mkdirSync(`${OUT}/extras/icons`, { recursive: true });
const I = (n, b, l) => icon(`extras/icons/${n}`, b, l);
I('folder', P(wob([[10, 26], [38, 26], [44, 18], [10, 18]]), C.ember) + P(wob([[10, 24], [86, 24], [86, 76], [10, 76]]), C.ember) +
  P(wob([[16, 30], [80, 28], [82, 60], [14, 62]]), C.paper) + P(wob([[8, 36], [88, 36], [84, 80], [12, 80]]), C.sodium), 'Folder');
I('document', P(wob([[22, 10], [62, 10], [76, 24], [76, 86], [22, 86]]), C.paper) + P(wob([[62, 10], [62, 24], [76, 24]]), C.shade) +
  [0, 1, 2, 3, 4].map((i) => P(wob([[30, 36 + i * 9], [i === 4 ? 52 : 68, 36 + i * 9], [i === 4 ? 52 : 68, 40 + i * 9], [30, 40 + i * 9]], 0.3), i ? C.haze : C.sodium, false)).join(''), 'Document');
I('terminal', P(rrect(8, 16, 80, 64, 9), C.ink) + P(wob([[8, 16], [88, 16], [88, 28], [8, 28]], 0.3), C.glow) +
  P(wob([[20, 42], [34, 50], [20, 58], [20, 53], [27, 50], [20, 47]], 0.3), C.aurora, false) + P(wob([[40, 56], [60, 56], [60, 61], [40, 61]], 0.3), C.sodium, false), 'Terminal');
I('bin', P(wob([[22, 28], [74, 28], [68, 86], [28, 86]]), C.haze) + P(wob([[16, 20], [80, 20], [80, 30], [16, 30]]), C.twilight) + P(wob([[38, 12], [58, 12], [58, 20], [38, 20]]), C.twilight) +
  [0, 1, 2].map((i) => P(wob([[36 + i * 10, 40], [40 + i * 10, 40], [40 + i * 10, 76], [36 + i * 10, 76]], 0.3), C.dusk, false)).join('') +
  P(wob([[30, 24], [52, 8], [60, 18], [40, 30]]), C.paper), 'Bin (with a crumpled draft)');
I('mail', P(wob([[10, 24], [86, 24], [86, 74], [10, 74]]), C.paper) + P(wob([[10, 24], [48, 54], [86, 24]]), C.shade) + P(circ(78, 26, 9, 24), C.sodium), 'Mail');
I('globe', P(circ(48, 48, 36, 60), C.dusk) + P('M24 30 C30 22 42 24 44 32 C46 40 34 42 34 50 C34 58 26 60 20 56 C16 48 18 38 24 30 Z', C.aurora, false) +
  P('M56 18 C66 20 76 28 80 40 C72 44 64 38 60 44 C54 52 62 62 56 70 C50 66 50 54 48 46 C46 34 50 24 56 18 Z', C.aurora, false) + P(circ(48, 48, 36, 60), 'none', false, ` stroke="${C.paper}" stroke-width="3"`), 'Globe');
I('cursor', P(wob([[22, 10], [22, 78], [38, 62], [50, 88], [62, 82], [50, 58], [72, 58]], 0.5), C.ink) + P(wob([[26, 18], [26, 68], [39, 55], [51, 80], [56, 77], [44, 53], [62, 53]], 0.4), C.paper, false), 'Paper cursor');
I('hand', P('M36 86 C24 74 18 62 22 54 C26 48 32 52 34 56 L34 22 C34 14 44 14 44 22 L44 46 L44 16 C44 8 54 8 54 16 L54 46 L54 22 C54 14 64 14 64 22 L64 48 L64 32 C64 26 74 26 74 32 L74 62 C74 74 68 82 64 86 Z', C.paper) +
  P('M44 46 L44 30 M54 46 L54 26 M64 48 L64 36', 'none', false, ` stroke="${C.shade}" stroke-width="1.5"`), 'Paper hand cursor');

// ---------- stickers ----------
const S = (n, b, l, vb) => icon(`extras/${n}`, b, l, vb);
const starPts = (cx, cy, R1, R2, n = 5, rot = -Math.PI / 2) => Array.from({ length: n * 2 }, (_, i) => { const a = rot + i * Math.PI / n, rr = i % 2 ? R2 : R1; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });
S('sticker-shipped', P(circ(80, 80, 70, 90, 0.8), C.paper) + P(circ(80, 80, 62, 90, 0.6), C.sodium, false) +
  `<path id="arc" d="M30 80 A50 50 0 0 1 130 80" fill="none"/><text font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="13" letter-spacing="3" fill="${C.ink}"><textPath href="#arc" xlink:href="#arc" startOffset="50%" text-anchor="middle">ALBRETSEN AS</textPath></text>` +
  `<text x="80" y="92" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="25" fill="${C.ink}" transform="rotate(-8 80 86)">SHIPPED</text>` +
  `<text x="80" y="124" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="11" letter-spacing="2" fill="${C.ink}">SINCE 2016</text>`, 'Shipped sticker', '0 0 160 160');
S('sticker-star', P(wob(starPts(60, 62, 52, 22, 4, -Math.PI / 2), 0.8), C.glow) + P(wob(starPts(60, 62, 30, 12, 4, -Math.PI / 4), 0.6), C.sodium, false), 'Paper star', '0 0 120 120');
S('sticker-sun', P(circ(70, 70, 62, 70, 0.8), C.ember) + P(circ(70, 70, 50, 60, 0.6), '#f2a64a', false) + P(circ(70, 70, 38, 50, 0.6), C.sodium, false) + P(circ(70, 70, 26, 40, 0.5), C.glow, false), 'Sodium sun sticker', '0 0 140 140');
S('sticker-plane', P('M8 70 L150 14 L70 92 Z', C.paper) + P('M70 92 L150 14 L86 120 Z', C.shade) + P('M70 92 L86 120 L74 104 Z', C.haze, false) +
  `<path d="M8 120 C30 110 40 128 62 112" fill="none" stroke="${C.paper}" stroke-width="3" stroke-dasharray="8 7" stroke-linecap="round"/>`, 'Paper airplane', '0 0 160 140');
function ribbon(y0, amp, w, ph, s) { seed = s; const top = [], bot = [];
  for (let x = 4; x <= 156; x += 2) { const y = y0 + Math.sin(x * 0.045 + ph) * amp + Math.sin(x * 0.11 + ph * 2) * amp * 0.25, ww = w * (0.6 + 0.4 * Math.sin(x * 0.03 + ph) ** 2);
    top.push([x, y - ww / 2 + (r() - 0.5) * 1.4]); bot.unshift([x, y + ww / 2 + (r() - 0.5) * 1.4]); }
  return 'M' + [...top, ...bot].map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L') + ' Z'; }
S('sticker-aurora', P(ribbon(36, 14, 16, 0.4, 31), '#1d6a52') + P(ribbon(54, 12, 10, 1.6, 32), '#58b26a') + P(ribbon(26, 10, 6, 2.4, 33), C.aurora), 'Aurora ribbon', '0 0 160 90');
S('tape', P(wob([[4, 6], [10, 16], [4, 28], [116, 30], [110, 18], [116, 4]], 0.8), 'rgba(255,241,207,.62)', false), 'Translucent tape', '0 0 120 34');

// ---------- torn-edge dividers (tile horizontally, 1440 wide) ----------
function torn(w, h, base, amp, freq, s) { seed = s; const pts = [[0, h]]; for (let x = 0; x <= w; x += 4) { const y = base + Math.sin(x * freq) * amp + Math.sin(x * freq * 3.7 + 1) * amp * 0.35 + (r() - 0.5) * 3.2; pts.push([x, y]); } pts.push([w, h]); return 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L') + ' Z'; }
fs.writeFileSync(`${OUT}/extras/torn-edge-night.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path d="${torn(1440, 80, 30, 9, 0.006, 11)}" fill="${C.paper}"/><path d="${torn(1440, 80, 36, 9, 0.006, 12)}" fill="${C.night}"/></svg>\n`);
fs.writeFileSync(`${OUT}/extras/torn-edge-paper.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true"><path d="${torn(1440, 80, 30, 7, 0.009, 21)}" fill="#ffffff" opacity=".85"/><path d="${torn(1440, 80, 35, 7, 0.009, 22)}" fill="${C.paper}"/></svg>\n`);
console.log('icons ok');
