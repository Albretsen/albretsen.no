// The Albretsen Dawn — front page behaviour (design 43).
// Kit modules: assets/interactive/dawn-press.js (canvas press), assets/motion.js (motions + keyboard),
// assets/interactive/orbit.js (three.js, loaded lazily).
import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import { dawnPress } from './assets/interactive/dawn-press.js';
import { pressRun, facetSheen, editionTurn, dawnBreak, sparkTrail, shortcuts } from './assets/motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const P = Object.fromEntries(content.products.map(p => [p.id, p]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

/* ---------- dateline + clock ---------- */
const now = new Date();
$('#dateNow').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
let printedAt = performance.now();
function tickClock() {
  const t = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const ed = document.documentElement.dataset.theme === 'dusk' ? 'Dusk' : 'Dawn';
  $('#clock').textContent = `Local time ${t}`;
  $('#edName').textContent = `${ed} edition`;
  const s = Math.round((performance.now() - printedAt) / 1000);
  $('#printedAgo').textContent = s < 3 ? 'printing now' : s < 60 ? `printed ${s} s ago` : `printed ${Math.round(s / 60)} min ago`;
}
tickClock(); setInterval(tickClock, 1000);

/* ---------- nameplate: inline the outlined masthead so the Dusk edition can re-ink it ---------- */
fetch('assets/identity/masthead.svg').then(r => r.text()).then(svg => {
  const h = $('.np-title');
  h.innerHTML = svg;
  const el = h.querySelector('svg');
  el.removeAttribute('width'); el.removeAttribute('height');
  el.setAttribute('aria-label', 'The Albretsen Dawn');
}).catch(() => {});

/* ---------- sound (opt-in): a soft paper tick, synthesised ---------- */
let audio = null, soundOn = false;
function tick(pitch = 1) {
  if (!soundOn) return;
  audio ||= new AudioContext();
  const len = 0.06, buf = audio.createBuffer(1, audio.sampleRate * len, audio.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
  const src = audio.createBufferSource(); src.buffer = buf;
  const f = audio.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400 * pitch; f.Q.value = 0.9;
  const g = audio.createGain(); g.gain.value = 0.22;
  src.connect(f).connect(g).connect(audio.destination); src.start();
}
$('#soundBtn').addEventListener('click', e => {
  soundOn = !soundOn;
  e.currentTarget.setAttribute('aria-pressed', soundOn);
  $('.lbl', e.currentTarget).textContent = soundOn ? 'Sound on' : 'Sound off';
  tick(1.2);
});

/* ---------- toast + copy ---------- */
let toastT = 0;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200);
}
async function copy(text, label) {
  try { await navigator.clipboard.writeText(text); toast(`${label} copied`); }
  catch { toast(text); }
  tick(1.4);
}
$('#cmdText').textContent = content.mcpCommand;
$('#cmdBtn').addEventListener('click', () => copy(content.mcpCommand, 'The MCP command'));
$('#mail').href = `mailto:${content.email}`; $('#mail').textContent = content.email;
$('#avail').textContent = content.availability;

/* ---------- the press (centrepiece) ---------- */
const canvas = $('#press');
let press = null;
function startPress(opts) {
  press?.destroy();
  canvas.classList.remove('on');
  press = dawnPress(canvas, { ...opts, onPrinted: () => { printedAt = performance.now() - 2600; } });
  press.ready.then(() => { canvas.classList.add('on'); printedAt = performance.now(); }).catch(() => {});
}
function stopPress() { press?.destroy(); press = null; canvas.classList.remove('on'); }

/* ---------- editions (J / K): the lead story turns like a page ---------- */
const fun = P['fun-libs'], mcp = P['mcp-emails'];
const editions = [
  {
    kicker: 'The front page from the future',
    headline: `${content.person} builds software that <em>pays for itself.</em>`,
    deck: `Apps, SaaS and the plumbing AI agents run on. One developer and one company, ${content.company}, publishing on Google Play since ${content.history.playDeveloperSince}.`,
    caption: '<b>Plate 1.</b> A dawn printed live by the press, one triangle at a time. Move over it to catch the light; the object above is yours to turn.',
    plate: 'press', press: { seed: 11, orbits: true }, object: 'crystal',
  },
  {
    kicker: `Apps · since ${content.history.playDeveloperSince}`,
    headline: `A word game built at 17 now has <em>${fun.figure.value} ${fun.figure.label}.</em>`,
    deck: `${fun.name}: ${fun.line.charAt(0).toLowerCase() + fun.line.slice(1)} No marketing. Version five shipped in 2026.`,
    caption: '<b>Plate 2.</b> A mountain dawn (Nathan Anderson, CC0) re-printed by the press in facets. Press <kbd>P</kbd> for another impression.',
    plate: 'press', press: { image: 'assets/hero/source-peaks.webp', seed: 5, grade: 'dawn', gamma: 0.75, memory: 0.3 }, object: null,
  },
  {
    kicker: `Agents · ${mcp.since}`,
    headline: `Email for AI agents now earns <em>${mcp.figure.value} a month.</em>`,
    deck: `${mcp.name} gives an agent ${mcp.facts[0]} across ${mcp.facts[1]}, ${mcp.facts[2]}. The paper itself is an MCP server too.`,
    caption: '<b>Plate 3.</b> An orbital sunrise from the International Space Station (NASA, public domain), in lagoon ink. The planet carries a paper plane.',
    plate: 'photo', photo: 'assets/extras/plate-orbital-sunrise@2x.webp', object: 'planet',
  },
];
let ed = 0;
function renderEdition(i) {
  const e = editions[i];
  $('#edKicker').textContent = e.kicker;
  $('#edCount').textContent = `Edition ${i + 1} of ${editions.length}`;
  const h = $('#edHeadline'); h.innerHTML = e.headline; delete h.dataset.pressed;
  $('#edDeck').textContent = e.deck;
  $('#edCaption').innerHTML = e.caption;
  $$('#edDots i').forEach((d, j) => d.classList.toggle('on', j === i));
  const photo = $('#platePhoto');
  if (e.plate === 'photo') { stopPress(); photo.src = e.photo; photo.hidden = false; printedAt = performance.now() - 3000; }
  else { photo.hidden = true; startPress(e.press); }
  setObject(e.object);
}
function turn(dir) {
  ed = (ed + (dir === 'next' ? 1 : -1) + editions.length) % editions.length;
  tick(dir === 'next' ? 1 : 0.8);
  editionTurn(() => renderEdition(ed), dir);
}
$('#edNext').addEventListener('click', () => turn('next'));
$('#edPrev').addEventListener('click', () => turn('prev'));
function reprint() {
  if (editions[ed].plate !== 'press' || !press) { toast('This plate is a photograph. Turn to plate 1 or 2.'); return; }
  const s = press.reprint(); printedAt = performance.now(); tick(0.7);
  toast(`Reprinted · seed ${s}`);
}
$('#reprint').addEventListener('click', reprint);

/* ---------- the 3D object: lazy three.js, a still image until it arrives ---------- */
const crystalEl = $('#crystal');
let orbit = null, subject = 'crystal', mounting = null, threeWanted = false;
const seg = $('#seg');
function setSeg(v) {
  seg.dataset.v = v;
  $$('button', seg).forEach(b => b.setAttribute('aria-checked', b.dataset.subject === v));
}
async function mount(sub) {
  subject = sub;
  const still = $('.crystal-still', crystalEl);
  still.src = sub === 'planet' ? 'assets/extras/planet@2x.webp' : 'assets/extras/crystal-a@2x.webp';
  if (!threeWanted) return;
  const job = (async () => {
    await mounting;
    try {
      const { mountOrbit } = await import('./assets/interactive/orbit.js');
      orbit?.destroy(); orbit = null; crystalEl.classList.remove('live');
      if (subject !== sub) return;
      orbit = await mountOrbit(crystalEl, { subject: sub });
      crystalEl.classList.add('live');
    } catch { crystalEl.classList.remove('live'); }
  })();
  mounting = job; return job;
}
function setObject(sub) {
  seg.hidden = !sub;
  crystalEl.classList.toggle('away', !sub);
  if (!sub) return;
  setSeg(sub);
  if (sub !== subject || !orbit) mount(sub);
}
$$('button', seg).forEach(b => b.addEventListener('click', () => { setSeg(b.dataset.subject); mount(b.dataset.subject); tick(1.1); }));
seg.addEventListener('keydown', e => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const v = seg.dataset.v === 'crystal' ? 'planet' : 'crystal';
  setSeg(v); mount(v); $(`[data-subject="${v}"]`, seg).focus();
});
setSeg('crystal');
// forward the pointer through the 3D layer so the press facets still catch the light
crystalEl.addEventListener('pointermove', e => canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: e.clientX, clientY: e.clientY })));
crystalEl.addEventListener('pointerleave', () => canvas.dispatchEvent(new PointerEvent('pointerleave')));
const wake3d = () => { if (threeWanted) return; threeWanted = true; if (!crystalEl.classList.contains('away')) mount(subject); };
addEventListener('load', () => (window.requestIdleCallback || setTimeout)(wake3d, { timeout: 1500 }));

/* ---------- the wire (live feed) ---------- */
const ICON = {
  'mcp-emails': '../_shared/products/mcp-emails/icon.png',
  'fun-libs': '../_shared/products/fun-libs/icon.png',
  toolrails: '../_shared/products/toolrails/icon.svg',
  'albretsen.no': 'assets/identity/favicon.svg',
};
const feed = createFeed();
const wire = $('#wire');
function wireItem(e) {
  const li = document.createElement('li');
  const tail = e.ms ? `${e.ms} ms` : e.country || (e.sha ? `${e.sha} · ${e.kb} KB` : e.city ? `${e.city} · ${e.kb} KB` : '');
  li.innerHTML = `<time datetime="${e.time.toISOString()}">${e.time.toTimeString().slice(0, 8)}</time>
    <span class="prod"><img src="${ICON[e.product]}" alt="" width="14" height="14" loading="lazy">${e.label}</span>
    <span>${e.text}${tail ? ` <span class="tail">· ${tail}</span>` : ''}</span>`;
  return li;
}
feed.recent(8).forEach(e => wire.append(wireItem(e)));
feed.subscribe(e => {
  const li = wireItem(e); if (!reduce) li.classList.add('fresh');
  wire.prepend(li);
  while (wire.children.length > 9) wire.lastElementChild.remove();
});

/* ---------- fact strip ---------- */
const facts = [
  { icon: 'assets/extras/ear-sunrise.svg', n: fun.figure.value, l: `${fun.name} ${fun.figure.label}, ${fun.facts[1]}` },
  { icon: 'assets/extras/ear-orbit.svg', n: mcp.figure.value, l: `${mcp.name} ${mcp.figure.label}` },
  { icon: 'assets/extras/ear-spark.svg', n: content.history.playDeveloperSince, l: 'On Google Play since' },
  { icon: 'assets/identity/mark.svg', n: content.history.companySince, l: `${content.company}, founded` },
];
$('#facts').innerHTML = facts.map(f => `<li><img src="${f.icon}" alt="" width="40" height="40" loading="lazy"><span class="n">${f.n}</span><span class="l">${f.l}</span></li>`).join('');

/* ---------- products ---------- */
const ART = { 'mcp-emails': 'mcp', 'fun-libs': 'funlibs', toolrails: 'toolrails', harbor: 'harbor' };
const LOGO = { 'mcp-emails': ICON['mcp-emails'], 'fun-libs': ICON['fun-libs'], toolrails: ICON.toolrails, harbor: '../_shared/products/harbor/harbor-mark.svg' };
const ALT = {
  'mcp-emails': 'The MCP Emails icon on a low-poly slab, paper planes flying a dashed arc around it.',
  'fun-libs': 'The Fun Libs icon on a low-poly slab among word-game letter tiles.',
  toolrails: 'The Toolrails icon on a low-poly slab inside a ring of eleven tool gems.',
  harbor: 'The Harbor mark on a low-poly slab between two crystal hills.',
};
const live = content.products.filter(p => p.status !== 'retired');
const retired = content.products.filter(p => p.status === 'retired');
const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
$('#prodH').innerHTML = `${cap(words[live.length] || live.length)} in orbit, <em>${words[retired.length] || retired.length} in the archive.</em>`;
$('#stories').innerHTML = live.map((p, i) => {
  const host = p.url ? new URL(p.url).host : '';
  return `<article class="story${i === 0 ? ' lead-story' : ''}" id="p-${p.id}">
    <div class="art facet-sheen">
      <img src="assets/products/${ART[p.id]}.webp" srcset="assets/products/${ART[p.id]}.webp 1x, assets/products/${ART[p.id]}@2x.webp 2x" alt="${ALT[p.id]}" width="800" height="600" loading="lazy" decoding="async">
      ${i === 0 ? '<img class="sticker" src="assets/extras/sticker-late-edition.svg" alt="" width="150" height="50">' : ''}
    </div>
    <div class="story-body">
      <div class="meta"><img class="logo" src="${LOGO[p.id]}" alt="${p.name} logo" width="28" height="28" loading="lazy"><span class="status" data-s="${p.status}">${p.status}</span><span class="since">since ${p.since}</span></div>
      <h3>${p.name}</h3>
      <p class="line">${p.line}</p>
      ${p.figure ? `<p class="figure"><span class="v">${p.figure.value}</span><span class="k">${p.figure.label}</span></p>` : ''}
      ${p.facts ? `<ul class="fx">${p.facts.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}
      ${host ? `<a class="go" href="${p.url}" rel="noopener">${host} <span aria-hidden="true">→</span></a>` : ''}
    </div>
    <kbd class="key-n" aria-hidden="true">${i + 1}</kbd>
  </article>`;
}).join('');
// Harbor's mark is dark line art: give it its own light tile so it reads in both editions
$$('.logo').forEach(l => { if (l.src.includes('harbor')) Object.assign(l.style, { background: '#F0EDE8', padding: '4px' }); });

const SPEC = { luma: 'luma', 'polyglot-pilot': 'polyglot', pinpoint: 'pinpoint', webvakt: 'webvakt', 'joke-central': 'jokes', 'tryggere-hyring': 'tryggere', 'early-apps': 'early' };
$('#specimens').innerHTML = retired.map(p => `<li><button data-id="${p.id}" aria-describedby="hovercard">
  <img src="assets/retired/${SPEC[p.id]}.webp" srcset="assets/retired/${SPEC[p.id]}.webp 1x, assets/retired/${SPEC[p.id]}@2x.webp 2x" alt="${p.name}" width="600" height="600" loading="lazy">
  </button><span>${p.since}</span></li>`).join('');

/* Radix-style hover card (origin-aware, side-aware, open/close states) */
const hc = $('#hovercard');
let hcT = 0, hcFor = null;
function openCard(btn) {
  clearTimeout(hcT);
  const p = content.products.find(x => x.id === btn.dataset.id);
  hc.innerHTML = `<span class="y">Retired · since ${p.since}</span><h4>${p.name}</h4><p>${p.line}</p>${p.figure ? `<p class="y" style="margin-top:8px">${p.figure.value} ${p.figure.label}</p>` : ''}`;
  hc.hidden = false;
  const r = btn.getBoundingClientRect(), w = hc.offsetWidth, h = hc.offsetHeight;
  const side = r.top - h - 12 < 8 ? 'bottom' : 'top';
  let x = r.left + r.width / 2 - w / 2; x = Math.max(12, Math.min(innerWidth - w - 12, x));
  const y = side === 'top' ? r.top - h - 10 : r.bottom + 10;
  hc.style.left = x + 'px'; hc.style.top = y + 'px';
  hc.style.setProperty('--hc-origin', `${r.left + r.width / 2 - x}px ${side === 'top' ? h : 0}px`);
  hc.dataset.side = side;
  if (hcFor !== btn || hc.dataset.state !== 'open') { hc.dataset.state = 'closed'; void hc.offsetWidth; hc.dataset.state = 'open'; }
  hcFor = btn;
}
function closeCard() {
  hcT = setTimeout(() => { hc.dataset.state = 'closed'; hcT = setTimeout(() => { hc.hidden = true; hcFor = null; }, 170); }, 90);
}
$$('#specimens button').forEach(b => {
  b.addEventListener('pointerenter', () => openCard(b));
  b.addEventListener('focus', () => openCard(b));
  b.addEventListener('pointerleave', closeCard);
  b.addEventListener('blur', closeCard);
  b.addEventListener('click', () => openCard(b));
});
addEventListener('scroll', () => { if (!hc.hidden) { hc.dataset.state = 'closed'; hc.hidden = true; hcFor = null; } }, { passive: true });

/* ---------- theme: the Dusk edition, through a view transition ---------- */
function setTheme(t, animate = true) {
  const apply = () => {
    document.documentElement.dataset.theme = t;
    $('#themeBtn').setAttribute('aria-pressed', t === 'dusk');
    $('#themeBtn').textContent = t === 'dusk' ? 'Dawn' : 'Dusk';
    $('meta[name="theme-color"]').content = t === 'dusk' ? '#17242c' : '#f6fbfc';
    store.set('dawn43-theme', t); tickClock();
  };
  if (!animate || !document.startViewTransition || reduce) { apply(); return; }
  document.documentElement.dataset.vt = 'theme';
  const vt = document.startViewTransition(apply);
  vt.finished.finally(() => delete document.documentElement.dataset.vt);
}
$('#themeBtn').addEventListener('click', () => { setTheme(document.documentElement.dataset.theme === 'dusk' ? 'dawn' : 'dusk'); tick(0.6); });
if (store.get('dawn43-theme') === 'dusk') setTheme('dusk', false);

/* ---------- keyboard: the signature delight ---------- */
function jump(i) {
  const el = $(`#p-${live[i].id}`); if (!el) return;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  tick(1 + i * 0.1);
}
const keys = [
  { key: 'j', label: 'Next edition', run: () => turn('next') },
  { key: 'k', label: 'Previous edition', run: () => turn('prev') },
  { key: 'p', label: 'Reprint the plate', run: reprint },
  { key: 't', label: 'Dawn or Dusk edition', run: () => $('#themeBtn').click() },
  ...live.slice(0, 4).map((p, i) => ({ key: String(i + 1), label: p.name, run: () => jump(i) })),
  { key: 'e', label: 'Copy the email', run: () => copy(content.email, 'Email address') },
  { key: 'm', label: 'Copy the MCP command', run: () => copy(content.mcpCommand, 'The MCP command') },
  { key: 'g h', label: 'Back to the front page', run: () => { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); tick(); } },
];
$('#sheetList').innerHTML = keys.map(k => `<li data-key="${k.key}"><span>${k.label}</span><i class="lead-dots"></i><span class="ks">${k.key.split(' ').map(x => `<kbd>${x.toUpperCase()}</kbd>`).join('')}</span></li>`).join('')
  + '<li><span>This index</span><i class="lead-dots"></i><span class="ks"><kbd>?</kbd></span></li>';
shortcuts({ sheet: $('#sheet'), trigger: $('#sheetKey'), keys });
if (location.hash === '#shortcuts') $('#sheet').showModal();

/* ---------- magnetic hovers (fine pointers only) ---------- */
if (fine && !reduce) $$('.magnet').forEach(el => {
  el.style.transition = 'translate .45s cubic-bezier(.16,1,.3,1)';
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.translate = `${((e.clientX - r.left) / r.width - 0.5) * 8}px ${((e.clientY - r.top) / r.height - 0.5) * 6}px`;
  });
  el.addEventListener('pointerleave', () => { el.style.translate = ''; });
});

/* ---------- motions ---------- */
// deep links: ?ed=2 opens an edition, ?theme=dusk opens the Dusk edition
const qs = new URLSearchParams(location.search);
ed = Math.max(0, Math.min(editions.length - 1, (parseInt(qs.get('ed'), 10) || 1) - 1));
if (qs.get('theme') === 'dusk') setTheme('dusk', false);
renderEdition(ed);
pressRun($('#edHeadline'));
facetSheen();
dawnBreak();
sparkTrail();
