// Front Light: the key rack (design 75)
// The products as keys on a precise pastel board. Each slot has a pigeonhole with the
// product's real logo tucked inside like a letter, a brass number plate, and a key on a
// hook with a tall fob. Hover or focus a slot: the pigeonhole lamp warms up, the letter
// rises into the light, the key swings on its hook and the fob turns over to show the
// numbers on its back. Tap toggles on touch. Keyboard: Tab between keys, Enter opens.
//
// Usage:
//   <div id="rack"></div>
//   <script type="module">
//     import { mountKeyRack } from './assets/interactive/keyrack.js'
//     mountKeyRack(document.getElementById('rack'))          // reads designs/_shared/content.js
//     // mountKeyRack(el, { ids: ['mcp-emails','fun-libs','toolrails','harbor'], onOpen: p => {} })
//   </script>
// Needs tokens.css (fonts + palette). No dependencies. Respects prefers-reduced-motion.

import { content } from '../../../_shared/content.js';

const P = new URL('../../../_shared/products/', import.meta.url).href;
const LOGOS = {
  'mcp-emails': P + 'mcp-emails/logo-mark.svg',
  'fun-libs': P + 'fun-libs/icon.png',
  'toolrails': P + 'toolrails/icon.svg',
  'harbor': P + 'harbor/harbor-mark.svg',
};
const STATUS = { live: 'Open', building: 'In the making', paused: 'Resting' };

const CSS = `
.kr{--kr-w:184px;display:grid;grid-template-columns:repeat(var(--kr-cols,4),var(--kr-w));gap:0;justify-content:center;
  background:var(--peach) url(${new URL('../extras/paper-linen.webp', import.meta.url).href});background-blend-mode:multiply;
  border:1px solid var(--copper);box-shadow:inset 0 0 0 6px var(--peach),inset 0 0 0 7px color-mix(in oklab,var(--copper) 60%,transparent),var(--shadow-paper);
  padding:28px 22px 34px;border-radius:2px;width:max-content;max-width:100%;margin-inline:auto}
@media (max-width:820px){.kr{--kr-cols:2;--kr-w:min(44vw,184px)}}
.kr-slot{all:unset;position:relative;display:grid;justify-items:center;gap:10px;padding:8px 10px 0;cursor:pointer;
  -webkit-tap-highlight-color:transparent;border-right:1px solid color-mix(in oklab,var(--copper) 35%,transparent)}
.kr-slot:nth-child(4n),.kr-slot:last-child{border-right:0}
@media (max-width:820px){.kr-slot:nth-child(2n){border-right:0}}
.kr-hole{position:relative;width:132px;height:92px;background:linear-gradient(#1c0e07,#3d2013);overflow:hidden;
  box-shadow:inset 0 10px 18px rgb(0 0 0/.55),inset 0 -2px 0 rgb(255 255 255/.06),0 0 0 4px var(--sand),0 0 0 5px var(--copper)}
.kr-lamp{position:absolute;inset:-30%;background:radial-gradient(closest-side at 50% 18%,rgb(255 214 150/.85),rgb(220 148 71/.35) 45%,transparent 75%);
  opacity:0;transition:opacity .7s var(--ease-breeze)}
.kr-letter{position:absolute;left:50%;bottom:-38px;width:86px;height:78px;translate:-50% 0;rotate:-3deg;background:var(--linen);
  display:grid;place-items:center;box-shadow:0 6px 12px rgb(0 0 0/.4);transition:translate .8s var(--ease-settle),filter .8s;filter:brightness(.45) sepia(.4)}
.kr-letter::before{content:"";position:absolute;inset:0;background:linear-gradient(160deg,transparent 48%,rgb(184 102 47/.18) 50%,transparent 52%)}
.kr-letter img{width:42px;height:42px;object-fit:contain;border-radius:9px}
.kr-plate{font:500 11px/1 var(--font-mono);letter-spacing:.24em;color:var(--sienna);padding:5px 8px 4px 10px;
  background:linear-gradient(180deg,#f3cf96,#d9a35c);border-radius:2px;box-shadow:0 1px 0 rgb(61 32 19/.35)}
.kr-hang{position:relative;width:110px;height:250px;transform-origin:55px 6px}
.kr-peg{position:absolute;left:49px;top:0;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#f6dcae,#b8662f 70%);box-shadow:0 2px 3px rgb(61 32 19/.45)}
.kr-ring{position:absolute;left:41px;top:6px;width:28px;height:28px;border-radius:50%;border:3px solid #c98a45;box-sizing:border-box}
.kr-key{position:absolute;left:4px;top:24px;width:40px;height:150px;rotate:14deg;transform-origin:30px 6px;filter:drop-shadow(0 4px 3px rgb(61 32 19/.35))}
.kr-fob{position:absolute;left:24px;top:30px;width:62px;height:196px;perspective:600px}
.kr-fob-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .9s var(--ease-settle)}
.kr-face{position:absolute;inset:0;backface-visibility:hidden;display:grid;justify-items:center;align-content:start;padding-top:30px;box-sizing:border-box;
  border-radius:31px 31px 16px 16px;background:var(--fob,var(--sand));border:1.5px solid var(--copper);box-shadow:var(--shadow-paper);color:var(--umber)}
.kr-face::before{content:"";position:absolute;top:9px;left:50%;width:12px;height:12px;translate:-50% 0;border-radius:50%;background:var(--peach);box-shadow:inset 0 1px 2px rgb(61 32 19/.5)}
.kr-no{font:500 10px/1 var(--font-mono);letter-spacing:.2em;color:var(--copper);margin-top:6px}
.kr-big{font:300 36px/1 var(--font-sign);letter-spacing:.02em;margin:6px 0 12px}
.kr-name{writing-mode:vertical-rl;rotate:180deg;white-space:nowrap;font:500 10px/1 var(--font-sign);letter-spacing:.26em;text-transform:uppercase}
.kr-back{transform:rotateY(180deg);background:var(--umber);color:var(--sand);border-color:var(--amber);padding-top:30px}
.kr-back .kr-val{white-space:nowrap;font:400 17px/1 var(--font-sign);letter-spacing:.04em;color:var(--apricot);writing-mode:vertical-rl;rotate:180deg;margin-bottom:8px}
.kr-back .kr-lab{white-space:nowrap;font:500 9px/1.2 var(--font-mono);letter-spacing:.2em;text-transform:uppercase;writing-mode:vertical-rl;rotate:180deg}
.kr-back .kr-st{order:-1;margin:2px 0 12px;font:500 7.5px/1.25 var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--amber);text-align:center;max-width:52px}
.kr-cap{font:italic 15px/1.3 var(--font-script);color:var(--sienna);text-align:center;max-width:150px;min-height:40px;opacity:.0;translate:0 6px;transition:opacity .6s,translate .6s var(--ease-settle)}
.kr-slot:is(:hover,:focus-visible,.is-open) .kr-lamp{opacity:1}
.kr-slot:is(:hover,:focus-visible,.is-open) .kr-letter{translate:-50% -34px;filter:none}
.kr-slot:is(:hover,:focus-visible,.is-open) .kr-hang{animation:kr-swing 2.4s var(--ease-breeze)}
.kr-slot:is(:hover,:focus-visible,.is-open) .kr-fob-in{transform:rotateY(180deg);transition-delay:.12s}
.kr-slot:is(:hover,:focus-visible,.is-open) .kr-cap{opacity:1;translate:0 0}
.kr-slot:focus-visible{outline:2px solid var(--copper);outline-offset:4px}
@keyframes kr-swing{0%{rotate:0deg}12%{rotate:7deg}30%{rotate:-4.5deg}48%{rotate:2.6deg}66%{rotate:-1.3deg}82%{rotate:.5deg}100%{rotate:0deg}}
@media (prefers-reduced-motion:reduce){.kr-slot .kr-hang{animation:none!important}.kr-fob-in,.kr-letter,.kr-lamp{transition-duration:.01s!important}}
`;

const KEY_SVG = `<svg class="kr-key" viewBox="0 0 40 150" aria-hidden="true"><defs><linearGradient id="krb" x1="0" x2="1">
<stop offset="0" stop-color="#f3cf96"/><stop offset=".45" stop-color="#dc9447"/><stop offset="1" stop-color="#9a5226"/></linearGradient></defs>
<g fill="url(#krb)" stroke="#7a3d1f" stroke-width=".8"><path d="M20 4a15 15 0 1 1 0 30a15 15 0 1 1 0-30zm0 8a7 7 0 1 0 0 14a7 7 0 1 0 0-14z" fill-rule="evenodd"/>
<rect x="16.5" y="33" width="7" height="104" rx="2"/><path d="M23 108h9v6h-5v5h6v6h-10z"/><path d="M23 128h7v9h-7z"/></g>
<path d="M12 40h16M13 44h14" stroke="#7a3d1f" stroke-width="1.2" opacity=".6"/></svg>`;

const FOBS = ['var(--sand)', 'var(--peach)', 'var(--apricot)', '#efd9c0'];

export function mountKeyRack(el, opts = {}) {
  if (!document.getElementById('kr-css')) {
    const s = document.createElement('style'); s.id = 'kr-css'; s.textContent = CSS; document.head.append(s);
  }
  const ids = opts.ids || ['mcp-emails', 'fun-libs', 'toolrails', 'harbor'];
  const items = ids.map(id => content.products.find(p => p.id === id)).filter(Boolean);
  const rack = document.createElement('div'); rack.className = 'kr'; rack.setAttribute('role', 'list');
  items.forEach((p, i) => {
    const no = String(i + 1).padStart(2, '0');
    const b = document.createElement('button');
    b.className = 'kr-slot'; b.type = 'button'; b.setAttribute('role', 'listitem');
    b.setAttribute('aria-label', `${p.name}: ${p.line} ${p.figure ? p.figure.value + ' ' + p.figure.label : ''}`);
    b.style.setProperty('--fob', FOBS[i % FOBS.length]);
    b.innerHTML = `
      <span class="kr-hole"><span class="kr-lamp"></span><span class="kr-letter"><img src="${LOGOS[p.id]}" alt="" width="42" height="42" loading="lazy"></span></span>
      <span class="kr-plate">Nº ${no}</span>
      <span class="kr-hang">
        ${KEY_SVG}
        <span class="kr-ring"></span>
        <span class="kr-fob"><span class="kr-fob-in">
          <span class="kr-face kr-front"><span class="kr-no">Nº</span><span class="kr-big">${no}</span><span class="kr-name">${p.name}</span></span>
          <span class="kr-face kr-back"><span class="kr-val">${p.figure ? p.figure.value : p.since}</span><span class="kr-lab">${p.figure ? p.figure.label : 'since'}</span><span class="kr-st">${STATUS[p.status] || p.status}</span></span>
        </span></span>
        <span class="kr-peg"></span>
      </span>
      <span class="kr-cap">${p.line}</span>`;
    b.addEventListener('click', () => {
      const open = !b.classList.contains('is-open');
      rack.querySelectorAll('.is-open').forEach(x => x.classList.remove('is-open'));
      if (open) { b.classList.add('is-open'); opts.onOpen?.(p); }
    });
    rack.append(b);
  });
  el.replaceChildren(rack);
  return rack;
}
