// Builds every hand-drawn SVG in the Habit kit. Run: node _src/build-svg.mjs (from assets/)
import { Pen, svg, stroke, smooth } from './pen.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (p, s) => { const f = join(ROOT, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); console.log('wrote', p, s.length); };
const INK = '#1c2427', CHALK = '#e6eaec', PAPER = '#f2f5f6', SLATE = '#131819', PENCIL = '#98a0a2';
const dash = (d, w, c, op = 0.55, da = '2.2 2.8') => stroke(d, w, c, ` stroke-dasharray="${da}" opacity="${op}"`);

// ---------------------------------------------------------------- mark
// An octahedron drawn the way Sowerby drew crystal habits: front edges in ink,
// the back edges dashed. Its top half is an A (apex + crossbar).
const O = { T: [31, 5], B: [33, 59], L: [7, 33], R: [57, 30], F: [26, 40], K: [41, 24] };
function mark({ color = INK, w = 1.9, hidden = true, seed = 216, passes = 1 } = {}) {
  const p = new Pen(seed, { over: 0.06, overMax: 2.4, wob: 0.22, bow: 0.01, passes });
  const vis = [['T', 'L'], ['T', 'R'], ['T', 'F'], ['B', 'L'], ['B', 'R'], ['B', 'F'], ['L', 'F'], ['F', 'R']];
  const hid = [['T', 'K'], ['B', 'K'], ['L', 'K'], ['K', 'R']];
  let s = stroke(vis.map(([a, b]) => p.line(O[a], O[b])).join(''), w, color);
  if (hidden) {
    const q = new Pen(seed + 1, { over: 0, wob: 0.15, bow: 0.006 });
    s = dash(hid.map(([a, b]) => q.line(O[a], O[b])).join(''), w * 0.62, color, 0.5, `${w * 1.1} ${w * 1.35}`) + s;
  }
  return s;
}
out('identity/mark.svg', svg(64, 64, mark(), { title: 'Albretsen AS' }));
out('identity/mark-chalk.svg', svg(64, 64, mark({ color: CHALK }), { title: 'Albretsen AS' }));
out('identity/mark-current.svg', svg(64, 64, mark({ color: 'currentColor' }), { title: 'Albretsen AS' }));
// favicon: heavier, no hidden edges, adapts to the OS theme
out('identity/favicon.svg', svg(64, 64,
  `<style>.m{stroke:${INK}}.b{fill:${PAPER}}@media (prefers-color-scheme:dark){.m{stroke:${CHALK}}.b{fill:${SLATE}}}</style>` +
  `<rect class="b" x="0" y="0" width="64" height="64" rx="14"/>` +
  `<g transform="translate(8.5 8.5) scale(.73)">${mark({ color: INK, w: 5.2, hidden: false, seed: 9 }).replace(/stroke="#1c2427"/g, 'class="m"')}</g>`,
  { title: 'Albretsen AS' }));
out('_src/favicon-180.svg', svg(180, 180,
  `<rect width="180" height="180" fill="${PAPER}"/><g transform="translate(30 28) scale(1.86)">${mark({ w: 3.2, seed: 9 })}</g>`));

// ---------------------------------------------------------------- screen bubble (baked onto the monitor in the hero)
function bubble(color) {
  const p = new Pen(41, { wob: 0.6 });
  const W = 330, H = 200;
  const pts = [[70, 52], [180, 46], [262, 52], [272, 100], [258, 134], [150, 140], [118, 140], [92, 166], [96, 138], [70, 132], [58, 92], [70, 52]];
  const b = p.curve(pts, 1.2);
  const dots = [130, 165, 200].map((x, i) => `<circle cx="${x}" cy="${94 + (i % 2 ? -1.5 : 1)}" r="${7.5 + i * 0.4}" fill="${color}" opacity="${0.9 - i * 0.22}"/>`).join('');
  return svg(W, H, stroke(b, 5, color) + dots);
}
out('hero/_screen-bubble-light.svg', bubble(INK));
out('hero/_screen-bubble-dark.svg', bubble(CHALK));

// ---------------------------------------------------------------- theme lamp (the toggle)
// groups: #shade, #cord (pull it), #rays (dashed light; hidden when dark)
{
  const p = new Pen(7, { wob: 0.3, over: 0.05, overMax: 2.5 });
  const shade = p.poly([[18, 18], [46, 18], [54, 40], [10, 40]], true);
  const stem = p.line([32, 40], [32, 72]) + p.line([31.5, 40], [31.8, 72], { passes: 1 });
  const base = p.curve([[16, 80], [32, 72.5], [48, 80]], 0.3) + p.line([14, 80], [50, 80]);
  const cord = p.line([44, 40], [44.6, 54]);
  const knob = `<circle cx="44.6" cy="56.4" r="2.4" stroke="currentColor" stroke-width="1.6"/>`;
  const q = new Pen(12, { wob: 0.2, over: 0 });
  const rays = [[[14, 46], [6, 60]], [[24, 47], [21, 64]], [[40, 47], [43, 64]], [[50, 46], [58, 60]]].map(([a, b]) => q.line(a, b)).join('');
  out('extras/theme-lamp.svg', svg(64, 88,
    `<g id="rays">${stroke(rays, 1.4, 'currentColor', ' stroke-dasharray="2.5 3" opacity=".7"')}</g>` +
    `<g id="lamp">${stroke(shade + stem + base, 1.9)}</g>` +
    `<g id="cord">${stroke(cord, 1.4)}${knob}</g>`, { title: 'Lights' }));
}

// ---------------------------------------------------------------- annotation stickers
{
  const A = (name, w, h, body) => out(`extras/annotations/${name}.svg`, svg(w, h, body));
  let p = new Pen(3, { wob: 0.5 });
  A('arrow-curve', 160, 90, stroke(p.curve([[8, 70], [40, 30], [92, 18], [140, 34]], 1) + p.curve([[124, 20], [141, 34], [126, 50]], 0.4), 2));
  p = new Pen(5, { wob: 0.5 });
  A('underline', 240, 24, stroke(p.curve([[6, 14], [60, 10], [120, 12], [180, 9], [234, 11]], 0.8) + p.curve([[30, 18], [110, 16], [200, 17]], 0.6), 2));
  p = new Pen(8, { wob: 0.5 });
  A('circle-scribble', 220, 110, stroke(p.ellipse(110, 55, 98, 42, { a0: 2.2, sweep: Math.PI * 2.25, rot: -0.05, drift: 0.05 }), 2));
  p = new Pen(10, { wob: 0.3 });
  A('bracket', 30, 160, stroke(p.curve([[24, 6], [12, 10], [12, 70], [4, 80], [12, 90], [12, 150], [24, 154]], 0.3), 2));
  p = new Pen(13, { wob: 0.3, over: 0.12 });
  A('spark', 48, 48, stroke(p.line([24, 4], [24, 44]) + p.line([4, 24], [44, 24]) + p.line([10, 10], [38, 38]) + p.line([38, 10], [10, 38]), 1.8));
  p = new Pen(14, { wob: 0.4 });
  A('tick', 56, 48, stroke(p.curve([[6, 26], [16, 38], [22, 42], [36, 22], [50, 6]], 0.5), 2.4));
  p = new Pen(15, { wob: 0.4 });
  A('strike', 200, 20, stroke(p.curve([[4, 12], [70, 8], [130, 11], [196, 7]], 0.5), 2));
  p = new Pen(16, { wob: 0.3, over: 0.08 });
  // dimension line: |<---->| like a drafting measure
  A('dimension', 240, 30, stroke(p.line([10, 6], [10, 26]) + p.line([230, 6], [230, 26]) + p.line([12, 16], [228, 16], { over: 0 }) +
    p.poly([[22, 10], [12, 16], [22, 22]]) + p.poly([[218, 10], [228, 16], [218, 22]]), 1.4));
}

// ---------------------------------------------------------------- patterns (tileable)
{
  // registration crosses, 48px tile
  const p = new Pen(21, { wob: 0.15, over: 0 });
  out('extras/pattern-crosses.svg', svg(48, 48, stroke(p.line([24, 20], [24, 28]) + p.line([20, 24], [28, 24]), 1, PENCIL)));
  // pen hatch, 24px tile, 45° — period divides the tile so it repeats seamlessly
  out('extras/pattern-hatch.svg', svg(24, 24, stroke('M-6 6L6 -6M-6 30L30 -6M18 30L30 18', 0.9, PENCIL)));
}

// ---------------------------------------------------------------- orbit diagram (spot illustration)
{
  const p = new Pen(30, { wob: 0.5 });
  const W = 520, H = 360, cx = 260, cy = 180;
  let back = '', front = '';
  const orbits = [[236, 64, -0.14, 0.5, 6, 0], [176, 48, -0.14, 2.5, 8, 1], [118, 33, -0.14, 0.9, 5, 0]];
  const at = (rx, ry, rot, t) => [cx + rx * Math.cos(t) * Math.cos(rot) - ry * Math.sin(t) * Math.sin(rot), cy + rx * Math.cos(t) * Math.sin(rot) + ry * Math.sin(t) * Math.cos(rot)];
  let bodies = '';
  for (const [rx, ry, rot, t, r, filled] of orbits) {
    back += dash(p.ellipse(cx, cy, rx, ry, { a0: Math.PI - 0.04, sweep: Math.PI + 0.08, rot, drift: 0.015 }), 1.2, INK, 0.45, '3 5');
    front += stroke(p.ellipse(cx, cy, rx, ry, { a0: -0.06, sweep: Math.PI + 0.12, rot, drift: 0.015 }), 1.5, INK);
    const [x, y] = at(rx, ry, rot, t);
    bodies += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" ${filled ? `fill="${INK}"` : `fill="${PAPER}" stroke="${INK}" stroke-width="1.6"`}/>`;
  }
  const crystal = `<g transform="translate(${cx - 58} ${cy - 60}) scale(1.8)">${mark({ w: 1.4, seed: 77 })}</g>`;
  out('extras/orbit-diagram.svg', svg(W, H, back + crystal + front + bodies));
}

// ---------------------------------------------------------------- retired-product stand-ins (96×96 line drawings)
{
  const R = (name, body) => out(`products/retired/${name}.svg`, svg(96, 96, stroke(body, 2, INK), { title: name }));
  let p;
  p = new Pen(101, { wob: 0.4 });
  R('polyglot-pilot',
    p.curve([[14, 20], [52, 16], [58, 30], [54, 46], [30, 48], [22, 58], [22, 47], [12, 44], [10, 30], [14, 20]], 0.6) +
    p.line([20, 28], [46, 27]) + p.line([20, 37], [38, 36]) +
    p.curve([[44, 54], [82, 50], [88, 62], [84, 78], [74, 80], [76, 90], [64, 80], [46, 80], [40, 66], [44, 54]], 0.6) +
    p.curve([[52, 66], [58, 60], [62, 70], [68, 62], [74, 68]], 0.3));
  p = new Pen(102, { wob: 0.4 });
  R('pinpoint',
    p.poly([[10, 34], [64, 26], [70, 74], [16, 82]], true) + p.curve([[16, 70], [30, 52], [40, 62], [52, 44], [68, 60]], 0.4) +
    p.curve([[74, 40], [64, 30], [64, 14], [74, 8], [84, 14], [84, 30], [74, 40]], 0.3) + `M74 18.5a3.4 3.4 0 1 0 .01 0`);
  p = new Pen(103, { wob: 0.4 });
  R('webvakt',
    p.poly([[10, 18], [86, 16], [88, 78], [12, 80]], true) + p.line([11, 30], [87, 28]) +
    'M16 23h.1M22 23h.1M28 23h.1' +
    p.curve([[24, 54], [48, 38], [72, 54], [48, 68], [24, 54]], 0.4) + p.ellipse(48, 53, 7, 7, { drift: 0.01 }));
  p = new Pen(104, { wob: 0.4 });
  R('joke-central',
    p.curve([[16, 20], [70, 14], [84, 30], [80, 56], [52, 60], [34, 78], [36, 60], [16, 56], [10, 36], [16, 20]], 0.6) +
    p.curve([[30, 34], [34, 30], [38, 34]], 0.2) + p.curve([[54, 33], [58, 29], [62, 33]], 0.2) + p.curve([[32, 44], [46, 52], [62, 43]], 0.3));
  p = new Pen(105, { wob: 0.4 });
  R('tryggere-hyring',
    p.poly([[8, 24], [72, 20], [74, 70], [10, 74]], true) + p.ellipse(28, 42, 9, 10, { drift: 0.02 }) + p.curve([[16, 64], [28, 54], [40, 64]], 0.3) +
    p.line([46, 36], [64, 35]) + p.line([46, 46], [60, 45]) +
    p.curve([[62, 50], [75, 45], [88, 50], [87, 66], [75, 82], [63, 66], [62, 50]], 0.2) + p.curve([[68, 63], [73, 69], [82, 56]], 0.15));
  p = new Pen(106, { wob: 0.4 });
  R('early-apps',
    p.poly([[22, 8], [72, 10], [74, 88], [20, 86]], true) + p.poly([[28, 16], [66, 17], [66, 32], [28, 31]], true) +
    [0, 1, 2].flatMap(r => [0, 1, 2].map(c => `M${33 + c * 14} ${44 + r * 13}h4`)).join('') +
    p.line([52, 82], [62, 72]) + 'M52 73h.1M62 82h.1');
}
