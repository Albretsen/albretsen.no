// Generates the identity SVGs for design 46 ("Say Cheese").
// node designs/46/assets/src/make-identity.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'identity');

const C = { butter: '#FFE97E', apricot: '#FC9E47', tangerine: '#ED6E12', gum: '#FF99C2', mint: '#8DEFC5', lilac: '#B6ADF3',
  sky: '#93D5F5', cream: '#FFF6E4', paper: '#FBE8CE', ink: '#381A13', cocoa: '#6D3F2F', cherry: '#ED3F4B', white: '#FFFDF7' };

// ---------- the mark: Blink's face. A clay camera pebble whose lens holds a three-blade aperture = the letter A
const triangle = (cx, cy, r) => {
  const p = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 3; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  return p.map(v => v.map(n => n.toFixed(2)).join(',')).join(' ');
};
const markBody = (flat) => `
  ${flat ? '' : `<defs>
    <radialGradient id="mBody" cx="0.32" cy="0.26" r="0.9">
      <stop offset="0" stop-color="#FFF8C8"/><stop offset="0.45" stop-color="${C.butter}"/><stop offset="1" stop-color="#F7C455"/>
    </radialGradient>
    <radialGradient id="mHump" cx="0.3" cy="0.2" r="1"><stop offset="0" stop-color="#C9FBE4"/><stop offset="1" stop-color="#5FD8A6"/></radialGradient>
    <radialGradient id="mRing" cx="0.35" cy="0.25" r="0.85"><stop offset="0" stop-color="#FFD3E5"/><stop offset="0.6" stop-color="${C.gum}"/><stop offset="1" stop-color="#F27AAB"/></radialGradient>
    <radialGradient id="mGlass" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stop-color="#5A3A66"/><stop offset="0.55" stop-color="#2A1530"/><stop offset="1" stop-color="#140910"/></radialGradient>
    <linearGradient id="mA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4B8"/><stop offset="1" stop-color="${C.apricot}"/></linearGradient>
    <filter id="mSoft" x="-20%" y="-20%" width="140%" height="150%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dy="4" result="b"/>
      <feFlood flood-color="${C.cocoa}" flood-opacity="0.28"/><feComposite in2="b" operator="in"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`}
  <g ${flat ? '' : 'filter="url(#mSoft)"'}>
    <rect x="22" y="14" width="34" height="20" rx="9" fill="${flat ? C.mint : 'url(#mHump)'}"/>
    <rect x="80" y="17" width="20" height="14" rx="6" fill="${C.cherry}"/>
    <rect x="10" y="26" width="108" height="90" rx="36" fill="${flat ? C.butter : 'url(#mBody)'}"/>
    <circle cx="64" cy="71" r="35" fill="${flat ? C.gum : 'url(#mRing)'}"/>
    <circle cx="64" cy="71" r="25" fill="${flat ? C.ink : 'url(#mGlass)'}"/>
    <polygon points="${triangle(64, 74, 17)}" fill="${flat ? C.butter : 'url(#mA)'}" stroke="${flat ? C.butter : '#FFE48A'}" stroke-width="4" stroke-linejoin="round"/>
    <polygon points="${triangle(64, 79, 5.2)}" fill="${flat ? C.ink : '#2A1530'}" stroke="${flat ? C.ink : '#2A1530'}" stroke-width="2" stroke-linejoin="round"/>
    ${flat ? '' : `<ellipse cx="53" cy="58" rx="6" ry="4" fill="#fff" opacity="0.85" transform="rotate(-30 53 58)"/>
    <ellipse cx="34" cy="38" rx="12" ry="5" fill="#fff" opacity="0.45" transform="rotate(-12 34 38)"/>`}
    <ellipse cx="24" cy="86" rx="7" ry="4.5" fill="${C.gum}" opacity="${flat ? 1 : 0.8}"/>
    <ellipse cx="104" cy="86" rx="7" ry="4.5" fill="${C.gum}" opacity="${flat ? 1 : 0.8}"/>
  </g>`;
const mark = (flat) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="Albretsen AS mark: Blink, a clay camera whose aperture forms an A">${markBody(flat)}
</svg>
`;

// ---------- wordmark: "albretsen" rolled from clay coils (round monoline strokes with a highlight pass)
const B = 80, X = 40, T = 16, R = 20; // baseline, x-height top, ascender, bowl radius
const glyphs = [];
let x = 10;
const add = (d, w) => { glyphs.push(d); };
// a
add(`M ${x + 40} ${B - 20} A ${R} ${R} 0 1 1 ${x + 40 - 0.01} ${B - 20.5} M ${x + 40} ${X} V ${B}`); x = 70;
add(`M ${x} ${T} V ${B}`); x = 92;                                   // l
add(`M ${x} ${T} V ${B} M ${x} ${B - 20} A ${R} ${R} 0 1 0 ${x} ${B - 20.01}`); x = 152;       // b (bowl drawn from stem)
add(`M ${x} ${X} V ${B} M ${x} ${X + 20} Q ${x} ${X} ${x + 22} ${X}`); x = 202;            // r
add(`M ${x - 20} ${B - 20} H ${x + 20} A ${R} ${R} 0 1 0 ${x + 13} ${B - 5.5}`); x = 244;   // e
add(`M ${x} ${T + 8} V ${B - 10} Q ${x} ${B} ${x + 11} ${B} M ${x - 11} ${X} H ${x + 13}`); x = 285; // t
add(`M ${x + 16} ${X + 7} C ${x + 10} ${X - 2} ${x - 17} ${X - 2} ${x - 17} ${X + 10} C ${x - 17} ${X + 22} ${x + 17} ${X + 17} ${x + 17} ${X + 30} C ${x + 17} ${B + 4} ${x - 11} ${B + 4} ${x - 18} ${B - 7}`); x = 336; // s
add(`M ${x - 20} ${B - 20} H ${x + 20} A ${R} ${R} 0 1 0 ${x + 13} ${B - 5.5}`); x = 376;   // e
add(`M ${x} ${X} V ${B} M ${x} ${B} V ${X + 18} A 18 18 0 0 1 ${x + 36} ${X + 18} V ${B}`);  // n
const WM_W = 428, WM_H = 96;
const wordmark = (palette) => {
  const cols = palette === 'candy' ? [C.tangerine, C.gum, C.mint, C.lilac, C.apricot, C.sky, C.cherry, C.mint, C.lilac] : null;
  const strokeFor = i => cols ? cols[i] : C.ink;
  const hiFor = i => cols ? '#ffffff' : '#9C6B57';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WM_W} ${WM_H}" width="${WM_W}" height="${WM_H}" role="img" aria-label="albretsen">
  <defs><filter id="wSoft" x="-5%" y="-10%" width="110%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="2.2"/><feOffset dy="3.5" result="b"/><feFlood flood-color="${C.cocoa}" flood-opacity="0.22"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#wSoft)">
${glyphs.map((d, i) => `    <path d="${d}" stroke="${strokeFor(i)}" stroke-width="14"/>`).join('\n')}
  </g>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${cols ? 0.55 : 0.45}" transform="translate(-1.6 -2.6)">
${glyphs.map((d, i) => `    <path d="${d}" stroke="${hiFor(i)}" stroke-width="3.2"/>`).join('\n')}
  </g>
</svg>
`;
};

// ---------- lockup: mark + wordmark + "AS" pill
const lockup = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 140" width="640" height="140" role="img" aria-label="Albretsen AS">
  <svg x="0" y="6" width="128" height="128" viewBox="0 0 128 128">${markBody(false)}</svg>
  <svg x="148" y="20" width="${WM_W}" height="${WM_H}" viewBox="0 0 ${WM_W} ${WM_H}">${wordmark('ink').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</svg>
  <g transform="translate(580 70)">
    <rect x="0" y="0" width="54" height="30" rx="15" fill="${C.ink}"/>
    <text x="27" y="21" text-anchor="middle" font-family="'DM Mono', ui-monospace, monospace" font-size="15" font-weight="500" fill="${C.butter}" letter-spacing="1">AS</text>
  </g>
</svg>
`;

// ---------- favicon: flat, bold, survives 16px
const favicon = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect x="2" y="8" width="60" height="52" rx="20" fill="${C.butter}"/>
  <rect x="9" y="3" width="18" height="10" rx="5" fill="${C.mint}"/>
  <circle cx="32" cy="35" r="20" fill="${C.gum}"/>
  <circle cx="32" cy="35" r="14" fill="${C.ink}"/>
  <polygon points="${triangle(32, 37, 9.5)}" fill="${C.butter}" stroke="${C.butter}" stroke-width="3" stroke-linejoin="round"/>
</svg>
`;

writeFileSync(join(OUT, 'logo-mark.svg'), mark(false));
writeFileSync(join(OUT, 'logo-mark-flat.svg'), mark(true));
writeFileSync(join(OUT, 'wordmark.svg'), wordmark('ink'));
writeFileSync(join(OUT, 'wordmark-candy.svg'), wordmark('candy'));
writeFileSync(join(OUT, 'lockup.svg'), lockup());
writeFileSync(join(OUT, 'favicon.svg'), favicon());
console.log('identity written to', OUT);
