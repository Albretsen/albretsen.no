// Nocturne Select · design 48 · page behaviour.
// One selection state drives everything: the 3D stage, the roster tabs, the sheet and its live wire.
import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import { initCursor } from './assets/cursor.js';
import { initMotion } from './assets/motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const A = 'assets/', P = '../_shared/products/';

// Visual dressing per product. Facts come from content.js; this is only colour and imagery.
const LOOK = {
  'mcp-emails': { c: '#588cff', tile: '#ffffff', logo: P + 'mcp-emails/logo-mark.svg', full: false, chip: 'live' },
  'fun-libs': { c: '#fbd452', tile: '#FEDF66', logo: P + 'fun-libs/icon.png', full: true, chip: 'live' },
  toolrails: { c: '#e3d612', tile: '#141413', logo: P + 'toolrails/icon.svg', full: true, chip: 'building' },
  harbor: { c: '#1fc893', tile: '#F4EFE6', logo: P + 'harbor/harbor-mark.svg', full: false, chip: 'paused' },
};
const IDS = Object.keys(LOOK);
const byId = Object.fromEntries(content.products.map(p => [p.id, p]));
const host = u => u.replace(/^https?:\/\//, '');
const CHIP = { live: ['Live', 63], building: ['Building', 100], paused: ['Paused', 81] };

// ---------- sound (off until the visitor turns it on) ----------
let ac = null, soundOn = false;
const soundBtn = $('.sound');
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  soundBtn.setAttribute('aria-pressed', soundOn);
  soundBtn.querySelector('b').textContent = soundOn ? 'on' : 'off';
  if (soundOn) { ac ||= new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); tone([660, 990], 0.05); }
});
// A soft two-note "lock": sine through a lowpass, short plastic decay.
function tone(freqs = [520, 780], gap = 0.06, vol = 0.06) {
  if (!soundOn || !ac) return;
  const t = ac.currentTime, lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; lp.connect(ac.destination);
  freqs.forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = i ? 'triangle' : 'sine'; o.frequency.value = f;
    const s = t + i * gap; g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(vol, s + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.32);
    o.connect(g).connect(lp); o.start(s); o.stop(s + 0.35);
  });
}

// ---------- live wire ----------
const feed = createFeed();
const ago = d => { const s = Math.max(1, Math.round((Date.now() - d) / 1000)); return s < 60 ? s + 's' : s < 3600 ? Math.round(s / 60) + 'm' : Math.round(s / 3600) + 'h'; };
const extra = e => e.ms ? e.ms + ' ms' : e.country || e.city || '';
function wireHTML(id, n = 3) {
  const evs = feed.recent(50).filter(e => e.product === id).slice(0, n);
  if (!evs.length) return `<li class="wire-empty">${byId[id].status === 'paused' ? 'Paused. Nothing on the wire.' : 'Quiet right now.'}</li>`;
  return evs.map(e => `<li data-t="${+e.time}"><span>${ago(e.time)}</span><b>${e.text}</b><em>${extra(e)}</em></li>`).join('');
}
function addWire(list, e) {
  list.querySelector('.wire-empty')?.remove();
  const li = document.createElement('li'); li.dataset.t = +e.time;
  li.innerHTML = `<span>${ago(e.time)}</span><b>${e.text}</b><em>${extra(e)}</em>`;
  list.prepend(li); while (list.children.length > 3) list.lastElementChild.remove();
}
setInterval(() => $$('.wire-list li[data-t]').forEach(li => li.firstElementChild.textContent = ago(+li.dataset.t)), 5000);

// ---------- selection ----------
const tabs = $$('[role="tab"]'), bar = $('.roster-bar'), ink = $('.tab-ink'), sheet = $('#sheet');
let current = 'fun-libs', stage = null;

function placeInk() {
  const t = tabs[IDS.indexOf(current)];
  ink.style.setProperty('--ix', t.offsetLeft + 'px'); ink.style.setProperty('--iy', (t.offsetTop - 6) + 'px'); ink.style.setProperty('--iw', t.offsetWidth + 'px');
}
new ResizeObserver(placeInk).observe(bar);

function fillSheet(id) {
  const p = byId[id], L = LOOK[id], i = IDS.indexOf(id);
  sheet.style.setProperty('--c', L.c);
  $('#s-idx').textContent = String(i + 1).padStart(2, '0');
  const chip = $('#s-chip'); chip.src = `${A}extras/chip-${L.chip}.svg`; chip.alt = CHIP[L.chip][0]; chip.width = CHIP[L.chip][1];
  const logo = $('#s-logo'); logo.style.setProperty('--tile', L.tile); logo.classList.toggle('full', L.full); logo.querySelector('img').src = L.logo;
  $('#s-name').textContent = p.name;
  $('#s-line').textContent = p.line;
  $('#s-fig').textContent = p.figure.value; $('#s-lab').textContent = p.figure.label;
  $('#s-bar').style.transform = `scaleX(${((2026 - p.since + 1) / (2026 - content.history.playDeveloperSince + 1)).toFixed(3)})`;
  $('#s-bar').parentNode.setAttribute('aria-label', `Since ${p.since}`);
  $('#s-facts').innerHTML = [`since ${p.since}`, ...p.facts].map(f => `<li>${f}</li>`).join('');
  $('#s-wire').innerHTML = wireHTML(id);
  const go = $('#s-go'); go.href = p.url; go.innerHTML = `Open ${host(p.url)} <span aria-hidden="true">↗</span>`;
  sheet.setAttribute('aria-labelledby', 'tab-' + id);
}

function select(id, from) {
  if (!LOOK[id]) return;
  const changed = id !== current; current = id;
  tabs.forEach(t => { const on = t.dataset.id === id; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
  placeInk();
  if (from !== 'stage' && stage) stage.select(IDS.indexOf(id));
  if (!changed && from !== 'init') return;
  if (document.startViewTransition && !reduce && from !== 'init') document.startViewTransition(() => fillSheet(id));
  else fillSheet(id);
  if (from !== 'init') tone(from === 'stage' ? [494, 740] : [523, 784]);
}

tabs.forEach((t, i) => {
  t.addEventListener('click', () => select(t.dataset.id, 'tab'));
  t.addEventListener('keydown', e => {
    let j = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') j = 0; if (e.key === 'End') j = tabs.length - 1;
    if (j !== null) { e.preventDefault(); tabs[j].focus(); select(tabs[j].dataset.id, 'tab'); }
  });
});

// Before the 3D stage loads, the poster still answers the arrow keys.
const stageEl = $('#stage'); stageEl.tabIndex = 0;
stageEl.addEventListener('keydown', e => {
  if (stage) return;
  const i = IDS.indexOf(current);
  if (e.key === 'ArrowRight') select(IDS[(i + 1) % 4], 'tab');
  if (e.key === 'ArrowLeft') select(IDS[(i + 3) % 4], 'tab');
});

feed.subscribe(e => {
  if (e.product === current) addWire($('#s-wire'), e);
  if (dlg.open && e.product === dlg.dataset.id) addWire($('#d-wire'), e);
});

// ---------- copy the MCP line ----------
const copyBtn = $('.copy');
copyBtn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(content.mcpCommand); } catch { const r = document.createRange(); r.selectNodeContents($('#mcp')); getSelection().removeAllRanges(); getSelection().addRange(r); }
  copyBtn.classList.add('done'); copyBtn.setAttribute('aria-label', 'Copied'); tone([880, 1320], 0.05, 0.05);
  setTimeout(() => { copyBtn.classList.remove('done'); copyBtn.removeAttribute('aria-label'); }, 1800);
});

// ---------- character sheet dialog with a shared-element view transition ----------
const dlg = $('#dlg');
function fillDialog(id) {
  const p = byId[id], L = LOOK[id];
  dlg.dataset.id = id; dlg.style.setProperty('--c', L.c);
  const img = $('#d-img'); img.src = `${A}products/${id}.webp`; img.srcset = `${A}products/${id}.webp 800w, ${A}products/${id}@2x.webp 1600w`; img.sizes = '(min-width: 720px) 440px, 100vw'; img.alt = `${p.name}: its real logo inlaid in a glossy tile on a lit plinth.`;
  const chip = $('#d-chip'); chip.src = `${A}extras/chip-${L.chip}.svg`; chip.alt = CHIP[L.chip][0]; chip.width = CHIP[L.chip][1];
  $('#d-since').textContent = `Since ${p.since}`;
  const logo = $('#d-logo'); logo.style.setProperty('--tile', L.tile); logo.classList.toggle('full', L.full); logo.querySelector('img').src = L.logo;
  $('#d-name').textContent = p.name; $('#d-line').textContent = p.line;
  $('#d-fig').textContent = p.figure.value; $('#d-lab').textContent = p.figure.label;
  $('#d-facts').innerHTML = p.facts.map(f => `<li>${f}</li>`).join('');
  $('#d-wire').innerHTML = wireHTML(id, 4);
  const go = $('#d-go'); go.href = p.url; go.innerHTML = `Open ${host(p.url)} <span aria-hidden="true">↗</span>`;
}
let opener = null;
function vt(fn) { return document.startViewTransition && !reduce ? document.startViewTransition(fn) : (fn(), null); }
function openCard(card) {
  const id = card.dataset.id, img = card.querySelector('.card-img img'); opener = card;
  img.style.viewTransitionName = 'portrait';
  tone([392, 587, 784], 0.05);
  vt(() => { img.style.viewTransitionName = ''; fillDialog(id); $('#d-img').style.viewTransitionName = 'portrait'; dlg.showModal(); });
  select(id, 'card');
}
function closeDialog() {
  if (!dlg.open) return;
  const img = opener?.querySelector('.card-img img');
  const t = vt(() => { $('#d-img').style.viewTransitionName = ''; if (img) img.style.viewTransitionName = 'portrait'; dlg.close(); });
  const done = () => { if (img) img.style.viewTransitionName = ''; opener?.focus({ preventScroll: true }); };
  t ? t.finished.finally(done) : done();
}
$$('.card').forEach(c => c.addEventListener('click', () => openCard(c)));
$('#dlg-x').addEventListener('click', closeDialog);
dlg.addEventListener('cancel', e => { e.preventDefault(); closeDialog(); });
dlg.addEventListener('click', e => { if (e.target === dlg) closeDialog(); });

// ---------- boot ----------
select('fun-libs', 'init');
initCursor();
initMotion({ lenis: true }).then(m => { window.__motion = m; });

const hasGL2 = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();
const idle = fn => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 400));
const whenNear = (el, fn, margin = '300px') => { const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: margin }); io.observe(el); };
const status = $('#stage-status');

// 3D stage: after first paint, crossfades over the poster.
addEventListener('load', () => idle(async () => {
  if (!hasGL2) { status.textContent = 'Poster · no WebGL'; return; }
  try {
    status.textContent = 'Loading stage';
    const { mountSelect } = await import('./assets/3d/select-stage.js');
    stage = await mountSelect(stageEl, { selected: IDS.indexOf(current), dpr: 1.5, onSelect: id => select(id, 'stage') });
    stage.select(IDS.indexOf(current));
    requestAnimationFrame(() => requestAnimationFrame(() => { stageEl.classList.add('live'); status.textContent = reduce ? 'Live · still' : 'Live · three.js'; }));
  } catch (err) { status.textContent = 'Poster'; console.warn(err); }
}), { once: true });

// Toybox: loads matter.js when it nears the viewport.
const toyEl = $('#toybox');
let box = null;
whenNear(toyEl, async () => {
  try {
    const { mountToybox } = await import('./assets/physics/toybox.js');
    box = await mountToybox(toyEl, { count: innerWidth < 720 ? 12 : 20 });
    toyEl.classList.add('live');
  } catch (err) { console.warn(err); }
});
$('#drop').addEventListener('click', () => { if (!box) return; box.spawn('mark'); tone([330, 660], 0.04, 0.05); });
$('#shake').addEventListener('click', () => { if (!box) return; box.shake(); tone([220, 330, 440], 0.03, 0.04); });

// Footer: the raymarched mark leans toward the pointer.
const foot = $('.foot-mark');
whenNear(foot, async () => {
  if (!hasGL2) return;
  try {
    const { mountMark } = await import('./assets/3d/mark-sdf.js');
    mountMark($('#mark-sdf'), { scene: 'solo', dpr: Math.min(devicePixelRatio, 1.25) });
    requestAnimationFrame(() => requestAnimationFrame(() => foot.classList.add('live')));
  } catch (err) { console.warn(err); }
}, '100px');
