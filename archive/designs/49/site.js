// Habit (design 49): the site talks to you, quietly, from a pen-drawn desk.
import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import { inkIn, typeTurn, lightsOut, pageTurn, inlineSvg } from './assets/motion.js';

const root = document.documentElement;
root.classList.add('ready');
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const still = root.classList.contains('static');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const theme = () => root.dataset.theme === 'dark' ? 'dark' : 'light';
const A = 'assets/';

/* ------------------------------------------------------------------ sound (opt-in) */
let audio = null;
const soundBtn = $('#sound');
soundBtn.addEventListener('click', () => {
  const on = soundBtn.getAttribute('aria-pressed') !== 'true';
  soundBtn.setAttribute('aria-pressed', String(on));
  $('.sound-state', soundBtn).textContent = on ? 'on' : 'off';
  if (on && !audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { audio = null; } }
  if (on) pencil(2);
});
// a pencil tick: two short bursts of band-passed noise
function pencil(strokes = 2) {
  if (!audio || soundBtn.getAttribute('aria-pressed') !== 'true') return;
  const t0 = audio.currentTime;
  for (let s = 0; s < strokes; s++) {
    const len = 0.035 + Math.random() * 0.03;
    const buf = audio.createBuffer(1, Math.ceil(audio.sampleRate * len), audio.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / d.length);
    const src = audio.createBufferSource(); src.buffer = buf;
    const bp = audio.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600 + Math.random() * 1400; bp.Q.value = 1.4;
    const g = audio.createGain(); g.gain.value = 0.05;
    src.connect(bp).connect(g).connect(audio.destination);
    src.start(t0 + s * 0.07);
  }
}

/* ------------------------------------------------------------------ inline drawings */
const svgCache = new Map();
const svgText = url => { if (!svgCache.has(url)) svgCache.set(url, fetch(url).then(r => r.text())); return svgCache.get(url); };
async function inlineAll(scope = document) {
  await Promise.all($$('[data-svg]', scope).map(async el => {
    el.innerHTML = await svgText(el.dataset.svg);
    const svg = $('svg', el); svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.setAttribute('aria-hidden', 'true'); el.setAttribute('data-ink', '');
    el.removeAttribute('data-svg');
  }));
}

/* ------------------------------------------------------------------ LIGHTS OUT */
let crystal = null;
const lampBtn = $('#lamp');
inlineSvg(A + 'extras/theme-lamp.svg', $('#lamp-holder'), 'lamp').then(svg => { svg.setAttribute('aria-hidden', 'true'); $('title', svg)?.remove(); }).catch(() => {});
// returns a promise so the View Transition waits until the new drawings on screen are decoded
const applyTheme = next => {
  root.dataset.theme = next;
  try { localStorage.setItem('habit-theme', next); } catch {}
  crystal?.setTheme(next);
  const onScreen = $$(`.only-${next} img, img.only-${next}`).filter(i => { i.loading = 'eager'; const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width; });
  return Promise.race([Promise.all(onScreen.map(i => i.decode().catch(() => {}))), sleep(900)]);
};
const toggleTheme = lightsOut(lampBtn, applyTheme);
lampBtn.addEventListener('click', e => { pencil(1); toggleTheme(e.detail ? e : undefined); });
// the other theme's drawings, fetched when the page is idle so the reveal never shows a blank
const idle = fn => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 1200));
addEventListener('load', () => idle(() => {
  const other = theme() === 'dark' ? 'light' : 'dark';
  $$(`.only-${other} img`).forEach(i => { i.loading = 'eager'; });
}));

/* ------------------------------------------------------------------ products */
const MAIN = content.products.filter(p => ['live', 'building', 'paused'].includes(p.status));
const LOGOS = {
  'mcp-emails': { src: '../_shared/products/mcp-emails/icon.png' },
  'fun-libs': { src: '../_shared/products/fun-libs/icon.png' },
  toolrails: { src: '../_shared/products/toolrails/icon.svg' },
  harbor: { src: '../_shared/products/harbor/harbor-mark-filled.svg', tile: true },
};
const STATUS = { live: 'live', building: 'building', paused: 'paused' };
const art = (p, cls = '', lazy = true) => ['light', 'dark'].map(t => `
  <picture class="only-${t}"><img class="${cls}" src="${A}products/${p.id}-${t}.webp" srcset="${A}products/${p.id}-${t}.webp 800w, ${A}products/${p.id}-${t}@2x.webp 1600w" sizes="(max-width: 860px) 100vw, 45vw" width="800" height="600" alt="${t === 'light' ? esc(altFor(p)) : ''}" ${lazy ? 'loading="lazy"' : ''} decoding="async"></picture>`).join('');
function altFor(p) {
  return {
    'mcp-emails': 'The real MCP Emails app icon on the screen of a pen-drawn laptop, with a green 1804 specimen beside it.',
    'fun-libs': 'The real Fun Libs icon on a drawn phone leaning on books, with an amber specimen.',
    toolrails: 'The real Toolrails icon on a drawn monitor with keyboard and mouse.',
    harbor: 'The real Harbor banner framed on a drawn bookcase, beside a plant.',
  }[p.id] || p.name;
}
function spec(p) {
  const rows = [['id', p.id], ['status', p.status], ['since', p.since], p.figure && [p.figure.label.toLowerCase(), p.figure.value], ['line', p.line], p.facts && ['facts', p.facts.join('; ')], p.url && ['url', p.url]].filter(Boolean);
  return rows.map(([k, v]) => `<span class="k">${k.padEnd(10, ' ')}</span>${esc(v)}`).join('\n');
}
const platesEl = $('#plates');
platesEl.innerHTML = MAIN.map((p, i) => `
  <li class="plate" style="view-transition-name: plate-${p.id}">
    <button class="plate-open" type="button" data-id="${p.id}" aria-label="Ask about ${esc(p.name)}">
      <div class="plate-art">
        <span class="fig-no">Fig. ${i + 2}</span>
        <span class="plate-status" data-s="${p.status}">${STATUS[p.status]}</span>
        ${art(p, 'plate-img')}
      </div>
      <div class="plate-body">
        <span class="plate-name"><img class="${LOGOS[p.id].tile ? 'logo-tile' : ''}" src="${LOGOS[p.id].src}" alt="" width="28" height="28" style="view-transition-name: logo-${p.id}"> ${esc(p.name)} <span class="vh">, ${p.status}</span></span>
        <span class="plate-line">${esc(p.line)}</span>
        ${p.figure ? `<span class="plate-fig-val"><b>${esc(p.figure.value)}<span class="scribble" data-svg="${A}extras/annotations/circle-scribble.svg"></span></b><span>${esc(p.figure.label)}</span></span>` : ''}
        ${p.facts ? `<ul class="plate-facts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
        <span class="plate-ask"><span class="typing" aria-hidden="true"><i></i><i></i><i></i></span><span class="pencil">ask about it</span></span>
      </div>
      <pre class="spec">${spec(p)}</pre>
    </button>
  </li>`).join('');
// the scribbles are decoration only; they draw on hover via CSS, so strip the ink-in hook
inlineAll(platesEl).then(() => $$('.scribble', platesEl).forEach(s => { s.removeAttribute('data-ink'); $$('path', s).forEach(p => p.setAttribute('pathLength', '1')); }));

// retired: Luma keeps its real monogram; the rest are pen-drawn stand-ins
const RETIRED = content.products.filter(p => p.status === 'retired');
$('#retired').innerHTML = RETIRED.map((p, i) => {
  const img = p.id === 'luma'
    ? `<img src="../_shared/products/luma/luma-monogram.svg" alt="Luma monogram" width="64" height="64" loading="lazy">`
    : `<img class="drawn" src="${A}products/retired/${p.id}.svg" alt="" width="64" height="64" loading="lazy">`;
  return `<li style="--i:${i}">${img}<div><b>${esc(p.name)}</b><small>${p.since}${p.figure ? ` · ${esc(p.figure.value)} ${esc(p.figure.label)}` : ''}</small><p>${esc(p.line)}</p></div></li>`;
}).join('');
$('.drawer-title').innerHTML = `${['', '', '', '', '', '', 'Seven', 'Seven', 'Eight'][RETIRED.length] || RETIRED.length} retired specimens, <i>kept for reference.</i>`;

/* view toggle: drawn plates or plain specs (a PAGE TURN) */
const productsEl = $('#products');
const toggle = $('.view-toggle');
function placeThumb() {
  const on = $('[aria-pressed="true"]', toggle);
  toggle.style.setProperty('--tx', on.offsetLeft + 'px');
  toggle.style.setProperty('--tw', on.offsetWidth + 'px');
}
function setView(v) {
  if (productsEl.dataset.view === v) return Promise.resolve();
  return pageTurn(() => {
    productsEl.dataset.view = v;
    $$('button', toggle).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
    placeThumb();
  });
}
toggle.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { pencil(1); setView(b.dataset.view); } });
placeThumb(); document.fonts?.ready.then(placeThumb); addEventListener('resize', placeThumb);

/* ------------------------------------------------------------------ the conversation */
const log = $('#log');
const whoState = $('#who-state');
let queue = Promise.resolve();
const scrollLog = (l = log) => {
  const behavior = reduce ? 'auto' : 'smooth';
  if (l.scrollHeight > l.clientHeight + 2) l.scrollTo({ top: l.scrollHeight, behavior });
  else if (l === log && log.children.length > 3) $('#reply').scrollIntoView({ block: 'nearest', behavior });
};
async function say(turns, l = log) {
  for (const t of turns) {
    const site = (t.from || 'site') !== 'you';
    if (site && l === log) { whoState.textContent = 'typing'; whoState.classList.add('is-typing'); }
    const p = typeTurn(l, [t], { gap: 260 });
    const el = l.lastElementChild; if (t.cls) el.classList.add(...t.cls.split(' '));
    scrollLog(l);
    await p;
    if (site) pencil(2);
    scrollLog(l);
    whoState.textContent = 'online'; whoState.classList.remove('is-typing');
    if (t.after) t.after(el);
  }
}
const ask = (q, label) => { queue = queue.then(() => answer(q, label)).catch(() => {}); return queue; };

const cmdHtml = () => `<span class="cmd"><code>${esc(content.mcpCommand)}</code><button type="button" class="copy" data-copy-text="${esc(content.mcpCommand)}">copy</button></span>`;
const narrow = () => innerWidth <= 860;
const ANSWERS = {
  live: () => [
    { html: 'Four, right now.' },
    { html: `<a class="pencil" href="#products">MCP Emails</a> is email for AI agents, at $782 MRR. Fun Libs, a word game, has 113,000+ installs.` },
    { html: 'Toolrails is being built. Harbor is paused. <i>The drawings are just below.</i>' },
  ],
  agent: () => [
    { html: 'Then plain text will suit you better.' },
    { from: 'aside', html: cmdHtml() },
    { html: '<i>The products below are specs now, not drawings.</i>', after: () => setView('plain') },
  ],
  crystal: () => [
    { html: 'Habit is a mineralogist’s word: <i>the shape a crystal keeps growing into.</i>' },
    { html: 'Mine is shipping software that pays for itself, again and again.' },
    { html: `<i>It’s live, ${narrow() ? 'above the lamp' : 'top right'}. Drag to turn it, tap to redraw it.</i>`, after: () => crystal?.next() },
  ],
  day: () => [
    { html: 'Yes, a day job too.' },
    { html: 'I built and led an MCP server for an accounting platform, <i>and ran a developer hackathon around it.</i>' },
    { html: 'Also AI chat with invoice, VAT and OCR tools, and a React Native app.' },
  ],
  reach: () => [
    { html: `<a class="pencil" href="mailto:${content.email}">${content.email}</a>` },
    { html: `<i>I take one outside engagement at a time.</i>` },
  ],
  hello: () => [{ html: 'Hello. <i>Ask about what’s live, the crystal, or the day job.</i>' }],
  thanks: () => [{ html: 'Any time.' }],
  unknown: () => [
    { html: 'I keep the answers short.' },
    { html: `<i>Try one of the pencilled replies, or write to</i> <a class="pencil" href="mailto:${content.email}">${content.email}</a>.` },
  ],
};
const LABELS = { live: 'What’s live?', agent: 'I’m an agent.', crystal: 'Why the crystal?', day: 'Day job?', reach: 'Where do I write?' };

function classify(text) {
  const t = text.toLowerCase();
  const prod = MAIN.find(p => t.includes(p.name.toLowerCase()) || t.includes(p.id.replace('-', ' ')));
  if (prod) return { product: prod };
  if (/\b(agent|mcp|claude|llm|bot|api)\b/.test(t)) return { q: 'agent' };
  if (/crystal|habit|shape|octahedr|3d/.test(t)) return { q: 'crystal' };
  if (/(day ?job|employ|accounting|hackathon|work for)/.test(t)) return { q: 'day' };
  if (/(email|mail|contact|reach|write|consult|engage|available|freelance)/.test(t)) return { q: 'reach' };
  if (/(live|product|app|make|build|ship|saas|what do you)/.test(t)) return { q: 'live' };
  if (/^(hi|hey|hello|hei|hallo)\b/.test(t)) return { q: 'hello' };
  if (/(thank|takk|cheers)/.test(t)) return { q: 'thanks' };
  return { q: 'unknown' };
}

async function answer(q, label) {
  await say([{ from: 'you', html: esc(label || LABELS[q]) }]);
  await sleep(reduce ? 0 : 220);
  await say(ANSWERS[q]());
}

$('#chips').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c || c.disabled) return;
  c.disabled = true; c.setAttribute('aria-disabled', 'true');
  ask(c.dataset.q);
});
$('#ask').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#ask-input'); const v = input.value.trim(); if (!v) return;
  input.value = '';
  const r = classify(v);
  if (r.product) {
    queue = queue.then(async () => {
      await say([{ from: 'you', html: esc(v) }]);
      await say([{ html: `${esc(r.product.name)}. <i>Opening it for you.</i>` }]);
      await sleep(300); openProduct(r.product.id);
    }).catch(() => {});
  } else ask(r.q, v);
});

// copy buttons (footer and in-conversation)
document.addEventListener('click', async e => {
  const b = e.target.closest('.copy'); if (!b) return;
  const text = b.dataset.copyText || $(b.dataset.copy)?.textContent || '';
  try { await navigator.clipboard.writeText(text); b.textContent = 'copied'; } catch { b.textContent = 'select it'; }
  b.classList.add('done'); pencil(1);
  setTimeout(() => { b.textContent = 'copy'; b.classList.remove('done'); }, 1800);
});

// magnetic chips: a few pixels toward the pointer, no more
if (!reduce && matchMedia('(hover: hover)').matches) {
  $$('.chip').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / r.width, dy = (e.clientY - r.top - r.height / 2) / r.height;
      c.style.setProperty('--mx', (dx * 6).toFixed(1) + 'px'); c.style.setProperty('--my', (dy * 4).toFixed(1) + 'px');
    });
    c.addEventListener('pointerleave', () => { c.style.removeProperty('--mx'); c.style.removeProperty('--my'); });
  });
}

// the opening: the turns already in the HTML are typed in place (no layout shift)
async function opening() {
  const pre = $$('.turn.pre', log);
  if (still) { pre.forEach(t => t.classList.add('played')); return; }
  for (const t of pre) {
    if (!$('.typing', t)) t.insertAdjacentHTML('afterbegin', '<span class="typing" aria-hidden="true"><i></i><i></i><i></i></span>');
    t.dataset.state = 'typing'; whoState.textContent = 'typing'; whoState.classList.add('is-typing');
    const len = $('.turn-text', t).textContent.length;
    await sleep(Math.max(420, Math.min(1300, len / 40 * 1000)));
    t.dataset.state = 'open'; t.classList.add('played'); pencil(2);
    await sleep(300);
  }
  whoState.textContent = 'online'; whoState.classList.remove('is-typing');
}
queue = opening();

/* ------------------------------------------------------------------ overheard (live feed) */
const feed = createFeed();
const ov = $('#overheard'), ovText = $('#ov-text');
const line = e => [e.label, e.text, e.country || e.city, e.ms ? `${e.ms} ms` : null].filter(Boolean).join(' · ');
ovText.textContent = line(feed.recent(1)[0]);
let lastOv = 0, pending = null;
function showOv(e) {
  const now = performance.now();
  if (now - lastOv < 4200) { pending = e; return; }
  lastOv = now; pending = null;
  if (reduce) { ovText.textContent = line(e); return; }
  ovText.classList.add('out');
  setTimeout(() => { ovText.textContent = line(e); ovText.classList.remove('out'); ov.classList.remove('tick'); void ov.offsetWidth; ov.classList.add('tick'); }, 350);
}
feed.subscribe(showOv);
setInterval(() => { if (pending) showOv(pending); }, 1500);

/* ------------------------------------------------------------------ product conversation (PAGE TURN + morph) */
const dlg = $('#talkback'), tbArt = $('#tb-art'), tbLog = $('#tb-log');
let opener = null, openerImg = null;
const statusLine = p => ({ live: `Live since ${p.since}.`, building: `Being built. Started ${p.since}.`, paused: `Paused, for now. Started ${p.since}.` }[p.status]);
const vt = fn => {
  if (!document.startViewTransition || reduce) { fn(); return null; }
  const t = document.startViewTransition(fn);
  t.ready.catch(() => {}); t.finished.catch(() => {});
  return t;
};

let gen = 0;
const plateImgFor = id => productsEl.dataset.view === 'drawn'
  ? $$(`.plate-open[data-id="${id}"] .plate-img`).find(i => i.offsetParent) : null;
function fillProduct(p) {
  tbArt.innerHTML = art(p, 'tb-img', false);
  $('#tb-title').textContent = p.name;
  $('#tb-logo').src = LOGOS[p.id].src; $('#tb-logo').className = LOGOS[p.id].tile ? 'logo-tile' : '';
  tbLog.innerHTML = '';
  $('#tb-more').innerHTML = MAIN.filter(x => x.id !== p.id).map(x =>
    `<button class="chip" type="button" data-id="${x.id}">${esc(x.name)}</button>`).join('');
}
async function talkAbout(p) {
  const my = ++gen;
  const turns = [
    { html: esc(p.line) },
    p.figure && { html: `${esc(p.figure.value)} ${esc(p.figure.label)}. <i>${statusLine(p)}</i>` },
    p.facts && { from: 'aside', html: p.facts.map(esc).join(' · ') },
    p.url && { html: `<a class="pencil tb-link" href="${p.url}" rel="noopener">${p.url.replace('https://', '')}</a>` },
  ].filter(Boolean);
  for (const t of turns) { if (my !== gen || !dlg.open) return; await say([t], tbLog); }
}
const newImg = () => $$('.tb-img', tbArt).find(i => i.closest('picture').classList.contains('only-' + theme()));
function openProduct(id, btn) {
  const p = MAIN.find(x => x.id === id); if (!p || dlg.open) return;
  opener = btn || document.activeElement;
  openerImg = plateImgFor(id);
  fillProduct(p);
  if (openerImg) openerImg.style.viewTransitionName = 'pick';
  const t = vt(() => {
    if (openerImg) { openerImg.style.viewTransitionName = ''; newImg().style.viewTransitionName = 'pick'; }
    dlg.showModal();
  });
  const done = () => { const n = newImg(); if (n) n.style.viewTransitionName = ''; talkAbout(p); };
  t ? t.finished.then(done, done) : done();
}
// another product from inside the conversation: a PAGE TURN
$('#tb-more').addEventListener('click', e => {
  const b = e.target.closest('[data-id]'); if (!b) return;
  const p = MAIN.find(x => x.id === b.dataset.id); pencil(1); gen++;
  openerImg = plateImgFor(p.id);
  opener = $(`.plate-open[data-id="${p.id}"]`) || opener;
  $('.tb-in').style.viewTransitionName = 'page';
  const t = vt(() => fillProduct(p));
  const done = () => { $('.tb-in').style.viewTransitionName = ''; $('#tb-close').focus({ preventScroll: true }); talkAbout(p); };
  t ? t.finished.then(done, done) : done();
});
function closeProduct() {
  if (!dlg.open) return;
  const cur = $$('.tb-img', tbArt).find(i => i.offsetParent);
  if (cur && openerImg) cur.style.viewTransitionName = 'pick';
  const t = vt(() => {
    if (cur) cur.style.viewTransitionName = '';
    if (openerImg) openerImg.style.viewTransitionName = 'pick';
    dlg.close();
  });
  const after = () => { if (openerImg) openerImg.style.viewTransitionName = ''; opener?.focus?.({ preventScroll: true }); };
  t ? t.finished.then(after, after) : after();
}
platesEl.addEventListener('click', e => { const b = e.target.closest('.plate-open'); if (b) { pencil(1); openProduct(b.dataset.id, b); } });
$('#tb-close').addEventListener('click', closeProduct);
dlg.addEventListener('cancel', e => { e.preventDefault(); closeProduct(); });
dlg.addEventListener('click', e => { if (e.target === dlg) closeProduct(); });

/* ------------------------------------------------------------------ the crystal (three.js, lazy) */
const stage = $('#crystal-stage');
const habitName = $('#habit-name'), habitFacts = $('#habit-facts');
let crystalStarted = false;
function startCrystal() {
  if (crystalStarted) return; crystalStarted = true;
  import('./assets/three/crystal.js').then(async ({ mountCrystal }) => {
    crystal = await mountCrystal(stage, {
      theme: theme(), width: 1.4,
      onHabit: h => { habitName.textContent = h.label; habitFacts.textContent = `${h.faces} faces, ${h.edges} edges`; },
    });
    $('#crystal').classList.add('live');
    stage.querySelector('canvas')?.addEventListener('pointerdown', () => pencil(1));
  }).catch(err => { console.warn('crystal stays drawn on paper:', err); });
}
const cio = new IntersectionObserver(([en]) => { if (en.isIntersecting) { cio.disconnect(); idle(startCrystal); } });
if (document.readyState === 'complete') cio.observe(stage); else addEventListener('load', () => cio.observe(stage));

/* ------------------------------------------------------------------ ink */
inlineAll($(".hero")).then(() => inkIn());
