// Heure Bleue · Albretsen AS (design 64). Page wiring: facts, feed, stamps, copy, sound.
// The 3D sun is loaded lazily from ./sun.js after first paint.
import { content } from '../../_shared/content.js';
import { createFeed } from '../../_shared/feed.js';
import { initMotion } from '../assets/motion.js';
import { sound } from './sound.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);

initMotion();

/* ── Facts come from content.js; the HTML carries the same text so the page works without JS. */
const byId = Object.fromEntries(content.products.map((p) => [p.id, p]));
const STATUS = { live: 'Live', building: 'Being built', paused: 'Paused', retired: 'Retired' };
document.querySelectorAll('.card[data-id]').forEach((card) => {
  const p = byId[card.dataset.id];
  if (!p) return;
  const set = (sel, v) => { const el = $(sel, card); if (el && v != null) el.textContent = v; };
  set('.js-name', p.name); set('.js-line', p.line); set('.js-since', p.since); set('.js-status', STATUS[p.status]);
  $('.status', card).dataset.status = p.status;
  if (p.figure) { set('.js-value', p.figure.value); set('.js-label', p.figure.label); }
  if (p.url) { $('.card-link', card).href = p.url; set('.js-domain', new URL(p.url).hostname); }
  const facts = $('.js-facts', card);
  if (facts && p.facts) facts.replaceChildren(...p.facts.map((f) => Object.assign(document.createElement('li'), { textContent: f })));
});

/* ── Stamps: one shared caption, so the sheet stays quiet. */
const note = $('.js-note');
const defaultNote = note.innerHTML;
let noteTimer;
function showNote(html) {
  if (note.innerHTML === html) return;
  clearTimeout(noteTimer);
  if (reduce) { note.innerHTML = html; return; }
  note.classList.add('is-out');
  noteTimer = setTimeout(() => { note.innerHTML = html; note.classList.remove('is-out'); }, 180);
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
document.querySelectorAll('.stamps li').forEach((li) => {
  const p = byId[li.dataset.id];
  if (!p) return;
  const btn = $('.stamp', li);
  const html = `<b>${esc(p.name)}</b>${esc(p.since)}. ${esc(p.line)}`;
  const on = () => showNote(html);
  btn.addEventListener('pointerenter', on);
  btn.addEventListener('focus', on);
  btn.addEventListener('click', () => {
    document.querySelectorAll('.stamp[aria-pressed]').forEach((b) => b !== btn && b.removeAttribute('aria-pressed'));
    btn.setAttribute('aria-pressed', 'true'); on();
  });
});
$('#stamps').addEventListener('pointerleave', () => {
  if (!document.querySelector('.stamp[aria-pressed="true"]') && !document.activeElement?.classList.contains('stamp')) showNote(defaultNote);
});

/* ── Live feed: one line at a time, in the corner of the hero. */
const feedEl = $('#feed');
const fmt = (e) => `${e.label} · ${e.text}${e.ms ? ` · ${e.ms} ms` : ''}`;
function showEvent(e) {
  if (reduce) { feedEl.textContent = fmt(e); return; }
  feedEl.classList.add('is-out');
  setTimeout(() => { feedEl.textContent = fmt(e); feedEl.classList.remove('is-out'); }, 600);
}
try {
  const feed = createFeed();
  const first = feed.recent(1)[0];
  if (first) setTimeout(() => showEvent(first), 2600);
  let lastShown = 0;
  feed.subscribe((e) => {
    const now = performance.now();
    if (now - lastShown < 4000) return; // keep the corner calm
    lastShown = now; showEvent(e);
  });
} catch { /* the static line stays */ }

/* ── Copy the MCP line; the ticket gets postmarked. */
const copyBtn = $('#copy');
copyBtn.addEventListener('click', async () => {
  const cmd = copyBtn.dataset.cmd || content.mcpCommand;
  let ok = false;
  try { await navigator.clipboard.writeText(cmd); ok = true; } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: cmd });
    ta.style.cssText = 'position:fixed;opacity:0'; document.body.append(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch {} ta.remove();
  }
  const ticket = copyBtn.closest('.ticket');
  ticket.classList.remove('is-stamped'); void ticket.offsetWidth; ticket.classList.add('is-stamped');
  copyBtn.classList.add('is-done');
  $('.copy-label', copyBtn).textContent = ok ? 'Copied. Paste it into a terminal' : 'Select the line above';
  $('#copy-status').textContent = ok ? 'Copied to the clipboard.' : 'Copy failed. Select the line on the ticket.';
  sound.chime(0.6);
  setTimeout(() => { copyBtn.classList.remove('is-done'); $('.copy-label', copyBtn).textContent = 'Copy the line'; }, 3200);
});

/* ── Sound: off until asked. */
const soundBtn = $('#sound');
soundBtn.addEventListener('click', () => {
  const on = soundBtn.getAttribute('aria-pressed') !== 'true';
  soundBtn.setAttribute('aria-pressed', String(on));
  sound.enable(on);
});

/* ── The live scene, after first paint and only when it makes sense. */
const conn = navigator.connection;
const canLive = !new URLSearchParams(location.search).has('still') && !(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')));
if (canLive) {
  const go = () => import('./sun.js').then((m) => m.startSun({ sound })).catch(() => {});
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
  if (document.readyState === 'complete') idle(go, { timeout: 2500 });
  else addEventListener('load', () => idle(go, { timeout: 2500 }), { once: true });
}
