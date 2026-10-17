// Q.E.D. icon system (design 82). One source of truth for every glyph.
//
// Grammar (after Oliver Byrne's 1847 Euclid, where proofs are written in shapes):
//   - 24-unit grid, live area 2..22, stroke 1.5, butt caps, mitre joins, ink only.
//   - At most ONE "sun": a filled circular sector in the single primary (dawn amber).
//     sun = [cx, cy, r, startDeg, endDeg]  (SVG angles: 0 = east, 90 = south)
//   - Where it helps, one stroke carries a "fracture": a deliberate break with a slight shear.
//   - Every glyph is strokes + sun, so any glyph can morph into any other (see ../motion.js).

export const GRID = 24;
export const STROKE = 1.5;

export const icons = {
  // ---- brand ---------------------------------------------------------------
  mark:      { name: 'Albretsen mark', group: 'brand',
               strokes: ['M3 21 L12 3 L15.5 10', 'M17.1 11.6 L21.8 21', 'M5.9 17 H18.6'],
               sun: [12, 17, 3.9, 180, 360] },
  dawn:      { name: 'Dawn', group: 'brand',
               strokes: ['M2 17 H22', 'M7 20.5 H17'], sun: [12, 17, 5, 180, 360] },
  fracture:  { name: 'Fracture', group: 'brand',
               strokes: ['M4 4 H20 V20 H4 Z', 'M11.5 4 L13.4 9.2 L10.6 13.6 L13.2 20'], sun: [16.6, 15.4, 1.5, 0, 360] },
  gravity:   { name: 'Gravity', group: 'brand',
               strokes: ['M2 10 C7 10 8 19.2 12 19.2 C16 19.2 17 10 22 10', 'M5 5.5 C9 5.5 10 9 12 9 C14 9 15 5.5 19 5.5'],
               sun: [12, 16.5, 2.6, 0, 360] },
  orbit:     { name: 'Since 2016', group: 'brand',
               strokes: ['M12 3 A9 9 0 1 1 11.99 3', 'M10.5 12 H13.5', 'M12 10.5 V13.5'], sun: [20.46, 8.92, 1.9, 0, 360] },
  qed:       { name: 'Q.E.D.', group: 'brand',
               strokes: ['M4 20 H20', 'M4 20 V4 H20 V20'], sun: [12, 20, 8, 180, 270] },

  // ---- work ----------------------------------------------------------------
  agent:     { name: 'Agent / MCP', group: 'work',
               strokes: ['M12 2.5 V8.6', 'M3.8 16.7 L9 13.7', 'M20.2 16.7 L15 13.7', 'M9.6 2.5 H14.4'],
               sun: [12, 12, 2.6, 0, 360] },
  launch:    { name: 'Launch', group: 'work',
               strokes: ['M12 18 V4', 'M6.5 9.5 L12 4 L17.5 9.5', 'M3 21 H21'], sun: [12, 21, 3.2, 180, 360] },
  code:      { name: 'Code', group: 'work',
               strokes: ['M8 6.5 L2.5 12 L8 17.5', 'M16 6.5 L21.5 12 L16 17.5'], sun: [12, 12, 1.7, 0, 360] },
  terminal:  { name: 'Terminal', group: 'work',
               strokes: ['M3 5 H21 V19 H3 Z', 'M7 9.5 L10 12 L7 14.5'], sun: [14.5, 14.5, 1.4, 0, 360] },
  layers:    { name: 'SaaS', group: 'work',
               strokes: ['M12 3.5 L21 8 L12 12.5 L3 8 Z', 'M3 12 L12 16.5 L21 12', 'M3 16 L12 20.5 L21 16'],
               sun: [12, 8, 1.6, 0, 360] },
  consult:   { name: 'Consulting', group: 'work',
               strokes: ['M3 12 A5.5 5.5 0 1 0 14 12 A5.5 5.5 0 1 0 3 12', 'M10 12 A5.5 5.5 0 1 0 21 12 A5.5 5.5 0 1 0 10 12'],
               sun: [12, 12, 1.8, 0, 360] },
  app:       { name: 'App', group: 'work',
               strokes: ['M6.5 2.5 H17.5 V21.5 H6.5 Z', 'M10.5 5.2 H13.5', 'M9 17 H15'], sun: [12, 17, 3, 180, 360] },
  knowledge: { name: 'Knowledge', group: 'work',
               strokes: ['M12 7 Q12 5 10 5 H3 V18.5 H10 Q12 18.5 12 20 Z', 'M12 7 Q12 5 14 5 H21 V18.5 H14 Q12 18.5 12 20'],
               sun: [16.5, 5, 2.8, 0, 90] },
  signal:    { name: 'Write', group: 'work',
               strokes: ['M4.5 10.5 A10.6 10.6 0 0 1 19.5 10.5', 'M7.8 13.8 A6 6 0 0 1 16.2 13.8'], sun: [12, 17.5, 1.9, 0, 360] },
  north:     { name: 'Norway', group: 'work',
               strokes: ['M12 21 V8.5', 'M7 21 H17', 'M8.5 12 L12 8.5 L15.5 12'], sun: [12, 4.4, 1.7, 0, 360] },

  // ---- retired products (stand-ins; real logos used where they exist) -------
  polyglot:  { name: 'Polyglot Pilot', group: 'retired',
               strokes: ['M12 3 A9 9 0 1 1 11.99 3', 'M12 3 L10.8 9 L13.2 15 L12 21'], sun: [12.4, 12, 5.2, -90, 90] },
  pinpoint:  { name: 'PinPoint', group: 'retired',
               strokes: ['M12 21.5 L6.2 12.92 A7 7 0 1 1 17.8 12.92 Z'], sun: [12, 9, 2.4, 0, 360] },
  webvakt:   { name: 'WebVakt', group: 'retired',
               strokes: ['M2.5 12 Q12 3 21.5 12 Q12 21 2.5 12 Z', 'M12 2 V4.6'], sun: [12, 12, 3, 0, 360] },
  jokes:     { name: 'Joke Central', group: 'retired',
               strokes: ['M4 4 H20 V16 H11 L6.5 20 V16 H4 Z'], sun: [12, 9.2, 3.6, 0, 180] },
  tryggere:  { name: 'Tryggere Hyring', group: 'retired',
               strokes: ['M12 2.5 L19.5 5.5 V11.5 C19.5 16 16.2 19.4 12 21.5 C7.8 19.4 4.5 16 4.5 11.5 V5.5 Z', 'M8.5 12 L11 14.5 L15.8 9.5'],
               sun: [19.5, 5.5, 2, 0, 360] },
  early:     { name: 'Early apps', group: 'retired',
               strokes: ['M6 18 L18 6', 'M5 7.5 A2.5 2.5 0 1 0 10 7.5 A2.5 2.5 0 1 0 5 7.5'], sun: [16.5, 16.5, 2.6, 0, 360] },

  // ---- interface -----------------------------------------------------------
  arrow:     { name: 'Arrow', group: 'ui', strokes: ['M4 12 H20', 'M14 6 L20 12 L14 18'], sun: [20, 12, 0, 0, 360] },
  external:  { name: 'External', group: 'ui', strokes: ['M10 5 H5 V19 H19 V14', 'M13 5 H19 V11', 'M19 5 L11 13'], sun: [19, 5, 0, 0, 360] },
  plus:      { name: 'Plus', group: 'ui', strokes: ['M12 5 V19', 'M5 12 H19'], sun: [12, 12, 0, 0, 360] },
  close:     { name: 'Close', group: 'ui', strokes: ['M6 6 L18 18', 'M18 6 L6 18'], sun: [12, 12, 0, 0, 360] },
  chevron:   { name: 'Chevron', group: 'ui', strokes: ['M6 9.5 L12 15.5 L18 9.5'], sun: [12, 15.5, 0, 0, 360] },
  copy:      { name: 'Copy', group: 'ui', strokes: ['M8 8 H20 V20 H8 Z', 'M16 4 H4 V16'], sun: [14, 14, 0, 0, 360] },
  check:     { name: 'Check', group: 'ui', strokes: ['M5 12.5 L10 17.5 L19.5 7'], sun: [10, 17.5, 0, 0, 360] },
  menu:      { name: 'Menu', group: 'ui', strokes: ['M4 8.5 H20', 'M4 15.5 H20'], sun: [12, 12, 0, 0, 360] },
};

// Which glyph stands for which product (real logos live in designs/_shared/products).
export const productGlyph = {
  'mcp-emails': 'signal', 'fun-libs': 'app', 'toolrails': 'agent', 'harbor': 'knowledge',
  'luma': null /* real monogram exists */, 'polyglot-pilot': 'polyglot', 'pinpoint': 'pinpoint',
  'webvakt': 'webvakt', 'joke-central': 'jokes', 'tryggere-hyring': 'tryggere', 'early-apps': 'early',
};

// Filled sector as a path (used for the sun).
export function sectorPath([cx, cy, r, a0, a1]) {
  if (r <= 0.001) return '';
  const span = a1 - a0;
  const rad = (a) => (a * Math.PI) / 180;
  const pt = (a) => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))].map((v) => +v.toFixed(3));
  if (span >= 359.9) return `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
  const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
  return `M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
}

// Static SVG string for a glyph. ink/sun colours are overridable; defaults follow currentColor.
export function iconSVG(id, { size = 24, ink = 'currentColor', sun = 'var(--qed-dawn, #fea91e)', stroke = STROKE, title = true } = {}) {
  const g = icons[id];
  const lines = g.strokes.map((d) => `<path d="${d}"/>`).join('');
  const s = sectorPath(g.sun);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"${title ? ` role="img" aria-label="${g.name}"` : ' aria-hidden="true"'}>` +
    (s ? `<path d="${s}" fill="${sun}"/>` : '') +
    `<g stroke="${ink}" stroke-width="${stroke}" stroke-linecap="butt" stroke-linejoin="miter">${lines}</g></svg>`;
}
