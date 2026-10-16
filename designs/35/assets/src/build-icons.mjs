// node designs/35/assets/src/build-icons.mjs
// Writes one SVG per glyph (icons/svg/*.svg), a <symbol> sprite (icons/sprite.svg)
// and the six retired-product stand-in tokens (retired/*.svg).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { icons, svg } from '../icons/icons.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
fs.mkdirSync(path.join(root, 'icons/svg'), { recursive: true });

for (const name of Object.keys(icons)) {
  const s = svg(name).replace('var(--glaze, #357e9c)', '#357e9c').replace(/currentColor/g, '#282019');
  fs.writeFileSync(path.join(root, 'icons/svg', name + '.svg'), s + '\n');
}

const symbols = Object.entries(icons).map(([n, b]) =>
  `  <symbol id="k-${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${b}</symbol>`).join('\n');
fs.writeFileSync(path.join(root, 'icons/sprite.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols}\n</svg>\n`);

// Retired stand-ins: a fired clay token, glyph pressed into it.
const retired = [
  ['polyglot', 'polyglot-pilot', 'Polyglot Pilot', '#c98a66'],
  ['pinpoint', 'pinpoint', 'PinPoint', '#b9a184'],
  ['webvakt', 'webvakt', 'WebVakt', '#a99787'],
  ['jokes', 'joke-central', 'Joke Central', '#d39e74'],
  ['hiring', 'tryggere-hyring', 'Tryggere Hyring', '#9f8b78'],
  ['calculator', 'early-apps', 'Early apps', '#c7ad92'],
];
for (const [icon, id, label, clay] of retired) {
  const body = icons[icon].replace(/var\(--glaze, #357e9c\)/g, '#2f6f8a');
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" role="img" aria-label="${label} (retired)">
  <defs>
    <radialGradient id="c" cx="38%" cy="30%" r="80%">
      <stop offset="0" stop-color="#fff" stop-opacity=".55"/>
      <stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#3a2a1d" stop-opacity=".35"/>
    </radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${id.length}"/>
      <feColorMatrix values="0 0 0 0 .2  0 0 0 0 .14  0 0 0 0 .09  0 0 0 .22 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <filter id="press" x="-20%" y="-20%" width="140%" height="140%">
      <feOffset dx="0" dy="1.2" in="SourceAlpha" result="o"/>
      <feGaussianBlur in="o" stdDeviation=".6" result="b"/>
      <feFlood flood-color="#fff" flood-opacity=".55"/><feComposite in2="b" operator="in" result="hl"/>
      <feMerge><feMergeNode in="hl"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <ellipse cx="80" cy="146" rx="52" ry="7" fill="#3a2a1d" opacity=".16"/>
  <circle cx="80" cy="78" r="64" fill="${clay}"/>
  <circle cx="80" cy="78" r="64" fill="url(#c)"/>
  <circle cx="80" cy="78" r="64" fill="${clay}" filter="url(#grain)"/>
  <circle cx="80" cy="78" r="52" fill="none" stroke="#3a2a1d" stroke-opacity=".18" stroke-width="1"/>
  <g transform="translate(45.2 43.2) scale(2.9)" fill="none" stroke="#3b2c20" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#press)">${body}</g>
</svg>
`;
  fs.writeFileSync(path.join(root, 'retired', id + '.svg'), out);
}
console.log('icons:', Object.keys(icons).length);
