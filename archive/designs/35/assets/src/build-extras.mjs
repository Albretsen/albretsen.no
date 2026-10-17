// node designs/35/assets/src/build-extras.mjs  -> extras/*.svg (rasterised by build-extras.sh)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { icons } from '../icons/icons.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const X = f => path.join(root, 'extras', f);
fs.mkdirSync(path.join(root, 'extras'), { recursive: true });

// deterministic rng (salt eac65c)
let seed = 0xeac65c; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// 1. Pressed-clay icon tiles: the icon system made physical, for section heads
const tiles = [
  ['app', '#d9b79b'], ['saas', '#cfae94'], ['agent', '#c98a66'], ['knowledge', '#dcc3a8'],
  ['molten', '#bf6d4c'], ['fracture', '#b9a184'], ['clarity', '#e2cdb6'], ['norway', '#c7ad92'],
];
for (const [name, clay] of tiles) {
  const body = icons[name];
  const strokes = body.replace(/<[^>]*class="g"[^>]*\/>/g, '');
  const glaze = (body.match(/<[^>]*class="g"[^>]*\/>/g) || []).join('').replace(/var\(--glaze, #357e9c\)/g, 'url(#gl)');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <filter id="clay" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="${Math.floor(rnd() * 99)}" result="n"/>
      <feDiffuseLighting in="n" surfaceScale="1.4" lighting-color="#fff" result="l"><feDistantLight azimuth="235" elevation="55"/></feDiffuseLighting>
      <feComposite in="l" in2="SourceGraphic" operator="arithmetic" k1="0.62" k2="0" k3="0.42" k4="0" result="lit"/>
    </filter>
    <filter id="press" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur in="SourceAlpha" stdDeviation=".22" result="b"/>
      <feOffset in="b" dx="-.3" dy="-.3" result="hi"/><feOffset in="b" dx=".3" dy=".3" result="lo"/>
      <feFlood flood-color="#fff6ea" flood-opacity=".7"/><feComposite in2="lo" operator="in" result="hiC"/>
      <feFlood flood-color="#2c1c10" flood-opacity=".55"/><feComposite in2="hi" operator="in" result="loC"/>
      <feMerge><feMergeNode in="hiC"/><feMergeNode in="loC"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="gl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#8fc3d9"/><stop offset=".45" stop-color="#357e9c"/><stop offset="1" stop-color="#124356"/></radialGradient>
    <radialGradient id="sheen" cx="30%" cy="22%" r="85%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#3a2414" stop-opacity=".28"/></radialGradient>
    <filter id="drop" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="10"/><feOffset dy="14"/><feComponentTransfer><feFuncA type="linear" slope=".28"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <g filter="url(#drop)">
    <rect x="40" y="36" width="320" height="320" rx="64" fill="${clay}" filter="url(#clay)"/>
    <rect x="40" y="36" width="320" height="320" rx="64" fill="url(#sheen)"/>
    <rect x="41" y="37" width="318" height="318" rx="63" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
  </g>
  <g transform="translate(92 88) scale(9)" fill="none" stroke="${clay}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" filter="url(#press)">${strokes}</g>
  <g transform="translate(92 88) scale(9)">${glaze}</g>
</svg>
`;
  fs.writeFileSync(X(`tile-${name}.svg`), svg);
}

// 2. Fracture field: crackle-glaze Voronoi network, one seam running molten
{
  const W = 1600, H = 900; const pts = [];
  // jittered grid -> even, calm cells
  for (let y = -1; y < 9; y++) for (let x = -1; x < 15; x++) pts.push([(x + 0.5 + (rnd() - .5) * .8) * 115, (y + 0.5 + (rnd() - .5) * .8) * 112]);
  const clip = (poly, a, b) => { // keep side of bisector closer to a
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = b[0] - a[0], ny = b[1] - a[1];
    const f = p => (p[0] - mx) * nx + (p[1] - my) * ny; const out = [];
    for (let i = 0; i < poly.length; i++) { const P = poly[i], Q = poly[(i + 1) % poly.length], fp = f(P), fq = f(Q);
      if (fp <= 0) out.push(P); if ((fp < 0) !== (fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); } }
    return out; };
  const edges = new Map();
  for (const a of pts) {
    let poly = [[-200, -200], [W + 200, -200], [W + 200, H + 200], [-200, H + 200]];
    for (const b of pts) if (b !== a && Math.hypot(b[0] - a[0], b[1] - a[1]) < 400) poly = clip(poly, a, b);
    for (let i = 0; i < poly.length; i++) { const P = poly[i], Q = poly[(i + 1) % poly.length];
      const k = [P, Q].map(p => p.map(v => Math.round(v)).join(',')).sort().join('|'); edges.set(k, [P, Q]); }
  }
  const segs = [], hot = [];
  // seam: a gentle diagonal
  const lx0 = 180, ly0 = 820, lx1 = 1420, ly1 = 120; const ld = Math.hypot(lx1 - lx0, ly1 - ly0);
  for (const [P, Q] of edges.values()) {
    const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2;
    if (mx < -20 || my < -20 || mx > W + 20 || my > H + 20) continue;
    // hand-drawn wobble: split each edge once with a small offset
    const ox = (rnd() - .5) * 5, oy = (rnd() - .5) * 5;
    const d = `M${P[0].toFixed(1)} ${P[1].toFixed(1)}Q${(mx + ox).toFixed(1)} ${(my + oy).toFixed(1)} ${Q[0].toFixed(1)} ${Q[1].toFixed(1)}`;
    const dist = Math.abs((ly1 - ly0) * mx - (lx1 - lx0) * my + lx1 * ly0 - ly1 * lx0) / ld;
    const t = ((mx - lx0) * (lx1 - lx0) + (my - ly0) * (ly1 - ly0)) / (ld * ld);
    (dist < 34 && t > .08 && t < .92 ? hot : segs).push([d, 0.12 + rnd() * 0.22]);
  }
  fs.writeFileSync(X('fracture-field.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">
  <defs><filter id="glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <g fill="none" stroke="#614735" stroke-width="1.2" stroke-linecap="round">${segs.map(([d, o]) => `<path d="${d}" stroke-opacity="${o.toFixed(2)}"/>`).join('')}</g>
  <g fill="none" stroke="#e18344" stroke-width="2.2" stroke-linecap="round" filter="url(#glow)">${hot.map(([d]) => `<path d="${d}"/>`).join('')}</g>
</svg>
`);
}

// 3. Window light gobo (two arches of light, soft) for overlays
fs.writeFileSync(X('window-light.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000">
  <defs><filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>
  <linearGradient id="warm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd8a8"/><stop offset="1" stop-color="#ffb67a"/></linearGradient></defs>
  <g filter="url(#soft)" fill="url(#warm)" transform="skewX(-18) translate(260 0)">
    <path d="M520 940V430a170 170 0 0 1 340 0v510Z" opacity=".9"/>
    <path d="M940 940V500a120 120 0 0 1 240 0v440Z" opacity=".55"/>
  </g>
</svg>
`);

// 4. Sticker sheet: die-cut glazed stickers from the icon system
{
  const pick = ['mark', 'agent', 'app', 'saas', 'molten', 'fracture', 'clarity', 'norway', 'launch'];
  const cols = ['#f6f0e8', '#bf6d4c', '#e8dac9', '#124356', '#e18344', '#d4b8a1', '#cddee6', '#614735', '#f6f0e8'];
  const ink = ['#282019', '#f6f0e8', '#282019', '#f6f0e8', '#282019', '#282019', '#124356', '#f6f0e8', '#282019'];
  let g = '';
  pick.forEach((n, i) => {
    const x = 120 + (i % 3) * 230, y = 120 + Math.floor(i / 3) * 230, rot = (rnd() - .5) * 14;
    const body = icons[n].replace(/var\(--glaze, #357e9c\)/g, cols[i] === '#124356' ? '#8fc3d9' : '#357e9c');
    const shape = i % 2 ? `<circle r="88"/>` : `<rect x="-86" y="-86" width="172" height="172" rx="44"/>`;
    g += `<g transform="translate(${x} ${y}) rotate(${rot.toFixed(1)})">
      <g filter="url(#sh)" fill="#fffaf3">${shape.replace(/r="88"/, 'r="96"').replace('x="-86" y="-86" width="172" height="172" rx="44"', 'x="-94" y="-94" width="188" height="188" rx="50"')}</g>
      <g fill="${cols[i]}">${shape}</g>
      <g transform="translate(-60 -60) scale(5)" fill="none" stroke="${ink[i]}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</g>
      <path d="M-70 -60 Q -20 -90 50 -70" stroke="#fff" stroke-opacity=".35" stroke-width="6" fill="none" stroke-linecap="round"/>
    </g>`;
  });
  fs.writeFileSync(X('stickers.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700" width="700" height="700">
  <defs><filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="6"/><feOffset dy="6"/><feComponentTransfer><feFuncA type="linear" slope=".22"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  ${g}
</svg>
`);
}
console.log('extras done');
