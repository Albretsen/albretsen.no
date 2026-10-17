// Design 32 — Night Shift Paper. The paper desktop.
import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import { tilt, askGyro, pointerVars, drop, tabs, accordion } from './assets/motion.js';
import { mountSunrise } from './sunrise.js';

document.documentElement.classList.add('js');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = matchMedia('(min-width: 900px)');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const P = '../_shared/products/';

/* ---------------- sound (opt-in) ---------------- */
let ac = null, soundOn = false;
function sfx(kind) {
  if (!soundOn || !ac) return;
  const t = ac.currentTime;
  if (kind === 'sun') {
    [392, 587.3].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t + i * .08); g.gain.linearRampToValueAtTime(.06, t + i * .08 + .03); g.gain.exponentialRampToValueAtTime(.0001, t + i * .08 + 1.1);
      o.connect(g).connect(ac.destination); o.start(t + i * .08); o.stop(t + 1.3); });
    return;
  }
  const len = kind === 'tick' ? .03 : .16;
  const buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** (kind === 'tick' ? 4 : 1.6);
  const src = ac.createBufferSource(); src.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = kind === 'tick' ? 3200 : 1900 + Math.random() * 900; f.Q.value = kind === 'tick' ? 4 : .8;
  const g = ac.createGain(); g.gain.value = kind === 'tick' ? .12 : .22;
  src.connect(f).connect(g).connect(ac.destination); src.start(t);
}
$('#sound').addEventListener('click', (e) => {
  soundOn = !soundOn; const b = e.currentTarget;
  if (soundOn && !ac) ac = new (window.AudioContext || window.webkitAudioContext)();
  if (ac?.state === 'suspended') ac.resume();
  b.setAttribute('aria-pressed', soundOn); b.querySelector('span').textContent = soundOn ? 'Sound on' : 'Sound off';
  sfx('paper');
});

/* ---------------- clock ---------------- */
const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' });
const tick = () => { $('#clock').textContent = fmt.format(new Date()); };
tick(); setInterval(tick, 15000);

/* ---------------- sky: shader + sunrise ---------------- */
const desk = $('#desk'), sky = $('#sky'), hint = $('#sunHint');
let sun = null, dragRise = 0.24;
function riseFromScroll() { return dragRise + Math.min(1, scrollY / (desk.offsetHeight || 1)) * 0.7; }
const startSky = () => {
  sun = mountSunrise(sky, { sunX: wide.matches ? 0.6 : 0.7, rise: dragRise });
  if (sun) requestAnimationFrame(() => requestAnimationFrame(() => sky.classList.add('on')));
};
// let the poster paint first, then compile the shader
('requestIdleCallback' in window ? requestIdleCallback : (f) => setTimeout(f, 200))(startSky, { timeout: 600 });
addEventListener('scroll', () => sun?.setRise(riseFromScroll()), { passive: true });

// pointer + device tilt drive the shader parallax and the window depth
const untilt = tilt(desk);
const deskMove = (e) => { if (!sun) return; const b = desk.getBoundingClientRect(); sun.setTilt(((e.clientX - b.left) / b.width) * 2 - 1, ((e.clientY - b.top) / b.height) * 2 - 1); };
desk.addEventListener('pointermove', deskMove);
desk.addEventListener('pointerleave', () => sun?.setTilt(0, 0));
addEventListener('deviceorientation', (e) => { if (e.gamma == null || !sun) return; sun.setTilt(Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, (e.beta - 45) / 25))); });
if (matchMedia('(pointer: coarse)').matches && typeof DeviceOrientationEvent?.requestPermission === 'function') {
  const g = $('#gyro'); g.hidden = false;
  g.addEventListener('click', async () => { const ok = await askGyro(); g.textContent = ok ? 'Tilt on' : 'Tilt blocked'; });
}

// drag the sun up (or click it)
let sunDrag = null, hintTimer = 0, touchedSun = false;
const onBackground = (t) => t === sky || t === desk || t.closest('.wall') || t === hint || t.classList?.contains('windows');
const nearSun = (e) => { if (!sun) return false; const b = desk.getBoundingClientRect(), s = sun.sunAt(); return Math.hypot(e.clientX - b.left - s.x, e.clientY - b.top - s.y) < s.r * 1.25; };
desk.addEventListener('pointerdown', (e) => {
  if (!wide.matches || !onBackground(e.target) || !nearSun(e)) return;
  sunDrag = { y: e.clientY, r: dragRise, moved: false }; desk.setPointerCapture(e.pointerId); desk.classList.add('dragging-sun');
  touchedSun = true; hint.classList.remove('show');
});
desk.addEventListener('pointermove', (e) => {
  if (!sunDrag) { desk.style.cursor = wide.matches && onBackground(e.target) && nearSun(e) ? 'grab' : ''; return; }
  const d = (sunDrag.y - e.clientY) / (desk.offsetHeight * 0.5);
  if (Math.abs(d) > 0.01) sunDrag.moved = true;
  dragRise = Math.max(0, Math.min(1, sunDrag.r + d)); sun.setRise(riseFromScroll());
});
const endSun = () => { if (!sunDrag) return; if (!sunDrag.moved) { sun.pop(); sfx('sun'); } else sfx('paper'); sunDrag = null; desk.classList.remove('dragging-sun'); };
desk.addEventListener('pointerup', endSun); desk.addEventListener('pointercancel', endSun);
if (!reduce) hintTimer = setTimeout(() => {
  if (touchedSun || !sun || !wide.matches || scrollY > 50) return;
  const s = sun.sunAt(); hint.style.left = s.x + 'px'; hint.style.top = s.y + 'px'; hint.classList.add('show');
  setTimeout(() => hint.classList.remove('show'), 4200);
}, 3200);

/* ---------------- windows: drag, flutter, focus, close ---------------- */
const wins = $$('.win');
let zTop = 10;
const depths = { about: .5, term: 1, log: .8, mark: 1.3 };
wins.forEach((w, i) => {
  w.style.setProperty('--depth', depths[w.dataset.win] ?? .6);
  if (!reduce) { w.style.setProperty('--i', i); w.classList.add('enter'); requestAnimationFrame(() => w.classList.add('entered')); w.addEventListener('animationend', () => w.classList.remove('enter', 'entered'), { once: true }); }
  const st = { dx: 0, dy: 0, vx: 0, fl: 0, raf: 0 };
  const apply = () => { w.style.setProperty('--dx', st.dx + 'px'); w.style.setProperty('--dy', st.dy + 'px'); w.style.setProperty('--flutter', st.fl.toFixed(2) + 'deg'); };
  const settle = () => { st.fl += (0 - st.fl) * .14; st.vx *= .8; apply(); st.raf = Math.abs(st.fl) > .02 ? requestAnimationFrame(settle) : 0; };
  const front = () => { w.style.setProperty('--z', ++zTop); };
  w.addEventListener('pointerdown', front);
  const bar = $('.win-bar', w);
  let drag = null;
  bar.addEventListener('pointerdown', (e) => {
    if (!wide.matches || e.target.closest('button')) return;
    e.preventDefault(); bar.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, dx: st.dx, dy: st.dy, lx: e.clientX, lt: performance.now() };
    w.classList.add('dragging'); cancelAnimationFrame(st.raf); sfx('tick');
  });
  bar.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const now = performance.now(), dt = Math.max(1, now - drag.lt);
    const b = desk.getBoundingClientRect(), r = w.getBoundingClientRect();
    let nx = drag.dx + e.clientX - drag.x, ny = drag.dy + e.clientY - drag.y;
    // keep the title bar on the desk
    const minY = drag.dy - (r.top - b.top - 40), maxY = drag.dy + (b.bottom - r.top - 60);
    ny = Math.max(minY, Math.min(maxY, ny));
    st.vx = (e.clientX - drag.lx) / dt; drag.lx = e.clientX; drag.lt = now;
    st.fl = Math.max(-9, Math.min(9, st.fl * .7 + st.vx * 2.2)); // paper swings against the motion
    st.dx = nx; st.dy = ny; apply();
  });
  const end = () => { if (!drag) return; drag = null; w.classList.remove('dragging'); sfx('paper'); if (!reduce) st.raf = requestAnimationFrame(settle); else { st.fl = 0; apply(); } };
  bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
  bar.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!k || !wide.matches) return; e.preventDefault(); const s = e.shiftKey ? 64 : 16;
    st.dx += k[0] * s; st.dy += k[1] * s; st.fl = k[0] * 3; front(); apply(); if (!reduce) { cancelAnimationFrame(st.raf); st.raf = requestAnimationFrame(settle); }
  });
  $('.dot.close', w).addEventListener('click', () => closeWin(w));
});
function closeWin(w) {
  sfx('paper');
  const done = () => { w.hidden = true; w.removeAttribute('data-state'); };
  w.dataset.state = 'closed';
  if (reduce) done(); else w.addEventListener('animationend', done, { once: true });
  const li = document.createElement('li');
  li.innerHTML = `<button class="folder" type="button"><img src="assets/extras/icons/${w.dataset.icon}.svg" alt="" width="64" height="64"><span>${esc(w.dataset.title)}</span></button>`;
  const btn = $('button', li);
  btn.addEventListener('click', () => {
    li.remove(); w.hidden = false; w.classList.add('reopen'); w.style.setProperty('--z', ++zTop); sfx('paper');
    w.addEventListener('animationend', () => w.classList.remove('reopen'), { once: true });
    $('.win-bar', w).focus({ preventScroll: true });
  });
  $('#minimised').append(li); btn.focus({ preventScroll: true });
}

/* ---------------- terminal copy (PEEL tooltip) ---------------- */
const copyBtn = $('#copy'), copyTip = $('#copy-tip');
const peel = (tip, on) => {
  if (on) { tip.hidden = false; tip.dataset.state = 'delayed-open'; return; }
  tip.dataset.state = 'closed';
  if (reduce) tip.hidden = true; else tip.addEventListener('animationend', () => { if (tip.dataset.state === 'closed') tip.hidden = true; }, { once: true });
};
let tipTo;
copyBtn.addEventListener('pointerenter', () => { clearTimeout(tipTo); tipTo = setTimeout(() => peel(copyTip, true), 300); });
copyBtn.addEventListener('pointerleave', () => { clearTimeout(tipTo); if (!copyTip.hidden) peel(copyTip, false); });
copyBtn.addEventListener('focus', () => peel(copyTip, true));
copyBtn.addEventListener('blur', () => { if (!copyTip.hidden) peel(copyTip, false); });
copyBtn.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(content.mcpCommand); } catch {}
  copyBtn.textContent = 'Copied'; copyBtn.classList.add('done'); copyTip.textContent = 'On your clipboard. Paste into Claude Code.';
  peel(copyTip, true); sfx('tick');
  setTimeout(() => { copyBtn.textContent = 'Copy command'; copyBtn.classList.remove('done'); copyTip.textContent = 'Paste it into Claude Code'; }, 2200);
});

/* ---------------- night.log feed + SHUFFLE tabs ---------------- */
const ICON = { 'mcp-emails': P + 'mcp-emails/icon.png', 'fun-libs': P + 'fun-libs/icon.png', toolrails: P + 'toolrails/icon.svg', 'albretsen.no': 'assets/identity/favicon.svg' };
const tfmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Oslo' });
const extra = (e) => e.country ? ` <small>· ${esc(e.country)}</small>` : e.city ? ` <small>· ${esc(e.city)}</small>` : e.ms ? ` <small>· ${e.ms} ms</small>` : e.sha ? ` <small>· ${esc(e.sha)}</small>` : '';
const row = (e) => `<span class="fx"><img src="${ICON[e.product]}" alt="${esc(e.label)}" width="14" height="14"></span><span class="what">${esc(e.text)}${extra(e)}</span><time datetime="${e.time.toISOString()}">${tfmt.format(e.time)}</time>`;
const feed = createFeed();
const panels = $$('.log-panel').map((p) => ({ el: $('ol', p), filter: $(`[aria-controls="${p.id}"]`).dataset.filter }));
const pool = feed.recent(40);
panels.forEach(({ el, filter }) => {
  const items = pool.filter((e) => !filter || e.product === filter).slice(0, 7);
  el.innerHTML = items.length ? items.map((e) => `<li>${row(e)}</li>`).join('') : '<li class="empty">quiet for now</li>';
});
feed.subscribe((e) => {
  panels.forEach(({ el, filter }) => {
    if (filter && e.product !== filter) return;
    $('.empty', el)?.parentElement === el && $('.empty', el).remove();
    const li = document.createElement('li'); li.className = 'new'; li.innerHTML = row(e); el.prepend(li);
    while (el.children.length > 8) el.lastElementChild.remove();
  });
});
document.fonts?.ready.then(() => tabs($('#logTabs'))) ?? tabs($('#logTabs'));
$$('#logTabs [role=tab]').forEach((t) => t.addEventListener('click', () => sfx('tick')));

/* ---------------- dock: magnify + PEEL tooltips ---------------- */
const dock = $('#dock'), dockTip = $('#dockTip'), icons = $$('.dock-i', dock);
let tipFor = null;
const showDockTip = (el) => {
  if (tipFor === el) return; tipFor = el;
  dockTip.textContent = el.dataset.tip;
  const wr = dock.parentElement.getBoundingClientRect(), r = el.getBoundingClientRect();
  dockTip.hidden = false;
  dockTip.style.left = (r.left - wr.left + r.width / 2 - dockTip.offsetWidth / 2) + 'px';
  dockTip.dataset.state = 'closed'; void dockTip.offsetWidth; dockTip.dataset.state = 'delayed-open';
};
const hideDockTip = () => { tipFor = null; if (!dockTip.hidden) peel(dockTip, false); };
dock.addEventListener('pointermove', (e) => {
  if (!wide.matches || reduce) return;
  icons.forEach((el) => { const r = el.getBoundingClientRect(); const d = Math.abs(e.clientX - (r.left + r.width / 2)); el.style.setProperty('--s', (1 + .55 * Math.max(0, 1 - d / 130) ** 2).toFixed(3)); });
});
dock.addEventListener('pointerleave', () => { icons.forEach((el) => el.style.setProperty('--s', 1)); hideDockTip(); });
icons.forEach((el) => {
  el.addEventListener('pointerenter', () => { showDockTip(el); sfx('tick'); });
  el.addEventListener('focus', () => showDockTip(el));
  el.addEventListener('blur', hideDockTip);
});

/* ---------------- dialogs (UNFOLD) ---------------- */
const ov = $('#ov'), dlg = $('#dlg'), dlgBody = $('#dlg-body'), dlgTitle = $('#dlg-title');
let opener = null;
const STAND_IN = { 'polyglot-pilot': 'polyglot-pilot', pinpoint: 'pinpoint', webvakt: 'webvakt', 'joke-central': 'joke-central', 'tryggere-hyring': 'tryggere-hyring', 'early-apps': 'early-apps' };
const retiredImg = (p) => p.id === 'luma' ? `<img class="luma" src="${P}luma/logo.png" alt="Luma logo" width="56" height="56" loading="lazy">`
  : `<img src="assets/products/retired/${STAND_IN[p.id]}.svg" alt="" width="56" height="56" loading="lazy">`;
const retired = content.products.filter((p) => p.status === 'retired');
const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const FOLDERS = {
  writing: { title: '~/writing', html: () => `<h2 id="dlg-h">Writing</h2><p class="note">Notes from the desk, newest first.</p><ul>${content.posts.map((p) => `<li><time datetime="${p.date}">${longDate.format(new Date(p.date))}</time><span>${esc(p.title)}</span></li>`).join('')}</ul>` },
  dayjob: { title: '~/day-job', html: () => `<img class="spot" src="assets/extras/spot-sunrise.webp" alt="A paper sun rising behind torn hills" width="1280" height="560" loading="lazy"><h2 id="dlg-h">The day job</h2><p class="note">A software developer by day. Consulting since ${content.history.consultingSince}, company since ${content.history.companySince}.</p><ul>${content.dayJob.map((d) => `<li><span>→</span><span>${esc(d)}</span></li>`).join('')}</ul>` },
  archive: { title: '~/archive', html: () => `<h2 id="dlg-h">Archive</h2><p class="note">Retired products, kept on file.</p><ul>${retired.map((p) => `<li>${retiredImg(p)}<span><b>${esc(p.name)}</b> <small>· ${p.since}</small><br><small>${esc(p.line)}</small></span></li>`).join('')}</ul>` },
};
const setState = (el, open) => {
  el.dataset.state = open ? 'open' : 'closed';
  if (open) { el.hidden = false; return; }
  if (reduce) { el.hidden = true; return; }
  el.addEventListener('animationend', () => { if (el.dataset.state === 'closed') el.hidden = true; }, { once: true });
};
function openFolder(key, from) {
  const f = FOLDERS[key]; if (!f) return;
  opener = from; dlgTitle.textContent = f.title; dlgBody.innerHTML = f.html();
  setState(ov, true); setState(dlg, true); sfx('paper');
  $('[data-close]', dlg).focus();
}
function closeFolder() { if (dlg.dataset.state !== 'open') return; setState(ov, false); setState(dlg, false); opener?.focus({ preventScroll: true }); }
$$('[data-open]').forEach((b) => b.addEventListener('click', () => openFolder(b.dataset.open, b)));
ov.addEventListener('click', closeFolder);
$('[data-close]', dlg).addEventListener('click', closeFolder);
addEventListener('keydown', (e) => {
  if (dlg.dataset.state !== 'open') return;
  if (e.key === 'Escape') closeFolder();
  if (e.key === 'Tab') { const f = $$('button, a[href]', dlg); const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
});

/* ---------------- product cards ---------------- */
const DIORAMA = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor'];
const LOGO = { 'mcp-emails': [P + 'mcp-emails/icon.png', ''], 'fun-libs': [P + 'fun-libs/icon.png', ''], toolrails: [P + 'toolrails/icon.svg', ''], harbor: [P + 'harbor/harbor-mark-filled.svg', 'white'] };
const PREVIEW = {
  'mcp-emails': [P + 'mcp-emails/logo-wordmark.svg', 'The wordmark. Agents get an inbox, a send queue and 17 tools.'],
  'fun-libs': [P + 'fun-libs/icon-preview.png', 'The v5 icon, next to the one it replaced.'],
  toolrails: [P + 'toolrails/icon.svg', 'One URL. The agent searches for the tool it needs.'],
  harbor: [P + 'harbor/banner.png', 'Self-hostable. AI edits wait for a human.'],
};
const ROT = ['-1.2deg', '.9deg', '.7deg', '-.8deg'];
const tpl = $('#tpl-card');
content.products.filter((p) => DIORAMA.includes(p.id)).forEach((p, i) => {
  const n = tpl.content.firstElementChild.cloneNode(true);
  n.id = 'p-' + p.id; n.style.setProperty('--r', ROT[i]); n.style.setProperty('--i', i);
  $('.win-title', n).textContent = p.url ? p.url.replace('https://', '') : p.name;
  const s = $('.status', n); s.textContent = p.status; s.dataset.s = p.status;
  $('source', n).srcset = `assets/products/${p.id}.webp 800w, assets/products/${p.id}@2x.webp 1600w`;
  $('source', n).sizes = '(max-width: 899px) 100vw, 50vw';
  const img = $('.diorama img', n); img.src = `assets/products/${p.id}.webp`; img.alt = `${p.name}, cut from paper: the real ${p.name} logo in a paper diorama under the night sky`;
  const lg = $('.logo', n); lg.src = LOGO[p.id][0]; lg.alt = `${p.name} logo`; if (LOGO[p.id][1]) lg.classList.add(LOGO[p.id][1]);
  $('h3', n).textContent = p.name; $('.line', n).textContent = p.line;
  $('.facts', n).innerHTML = (p.facts || []).map((f, j) => `<li style="--fr:${j % 2 ? .8 : -.6}deg">${esc(f)}</li>`).join('');
  const a = $('.visit', n); a.href = p.url; a.textContent = p.url.replace('https://', '') + ' ↗';
  $('.since', n).textContent = `since ${p.since}`;
  $('.fig-sticker b', n).textContent = p.figure.value; $('.fig-sticker span', n).textContent = p.figure.label;
  // hover card: a second sheet slides out from under the link
  const hc = document.createElement('div'); hc.className = 'sheet-card'; hc.hidden = true; hc.dataset.side = 'top'; hc.setAttribute('role', 'tooltip'); hc.id = 'hc-' + p.id;
  hc.innerHTML = `<img src="${PREVIEW[p.id][0]}" alt="" loading="lazy"><p>${esc(PREVIEW[p.id][1])}</p>`;
  a.setAttribute('aria-describedby', hc.id);
  $('.card-foot', n).append(hc);
  let to; const on = () => { clearTimeout(to); to = setTimeout(() => setState(hc, true), 280); }, off = () => { clearTimeout(to); to = setTimeout(() => { if (!hc.hidden) setState(hc, false); }, 180); };
  [a, hc].forEach((x) => { x.addEventListener('pointerenter', on); x.addEventListener('pointerleave', off); });
  a.addEventListener('focus', on); a.addEventListener('blur', off);
  $('#cards').append(n);
  pointerVars(n);
});

/* ---------------- archive (TEAR accordion) ---------------- */
$('#retired').innerHTML = retired.map((p) => `<li>${retiredImg(p)}<div><b>${esc(p.name)}</b><small>${p.since}${p.figure ? ` · ${esc(p.figure.value)} ${esc(p.figure.label)}` : ''}</small><p>${esc(p.line)}</p></div></li>`).join('');
accordion($('#archiveAcc'));
$('#acc-btn').addEventListener('click', () => sfx('paper'));

drop(document);
$$('.card[data-drop]').forEach((c) => c.addEventListener('animationend', (e) => { if (e.target === c) c.removeAttribute('data-drop'); }, { once: false }));

/* ---------------- the mark, live in 3D (lazy) ---------------- */
const markEl = $('#mark3d');
if (!reduce) {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || getComputedStyle(markEl.closest('.win')).display === 'none') return;
    io.disconnect();
    const go = () => import('./assets/live/mark-3d.js')
      .then((m) => m.mountMark3D(markEl, { glb: new URL('./assets/live/albretsen-mark.glb', import.meta.url).href }))
      .then(() => markEl.classList.add('live'))
      .catch(() => {});
    ('requestIdleCallback' in window ? requestIdleCallback : (f) => setTimeout(f, 800))(go, { timeout: 2500 });
  });
  io.observe(markEl);
}

addEventListener('pagehide', () => { untilt?.(); sun?.destroy(); });
