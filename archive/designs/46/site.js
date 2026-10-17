// Design 46 · Say Cheese. You are holding the camera: pull focus, set exposure, press the shutter, keep the print.
import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import * as M from './assets/motion.js';
import { sound } from './assets/sound.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduce = M.reduced();
const hasGL = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();

/* ---------------- sound toggle ---------------- */
sound.bindToggle($('.sound'));

/* ---------------- nav: sliding clay pill (Radix NavigationMenu indicator idea) ---------------- */
{
  const nav = $('.nav'); const pill = document.createElement('span'); pill.className = 'nav-pill'; nav.prepend(pill);
  let anim;
  const go = a => {
    const r = a.getBoundingClientRect(), n = nav.getBoundingClientRect();
    const to = { transform: `translateX(${r.left - n.left}px)`, width: `${r.width}px`, opacity: 1 };
    anim?.commitStyles?.(); anim?.cancel();
    anim = pill.animate([{}, to], reduce ? { duration: 0, fill: 'forwards' } : { duration: M.SPRING_SOFT.duration, easing: M.SPRING_SOFT.easing, fill: 'forwards' });
  };
  $$('.nav-link').forEach(a => { a.addEventListener('pointerenter', () => go(a)); a.addEventListener('focus', () => go(a)); });
  nav.addEventListener('pointerleave', () => { anim?.commitStyles?.(); anim?.cancel(); anim = pill.animate([{}, { opacity: 0 }], { duration: 200, fill: 'forwards' }); });
}

/* ---------------- copy the MCP line (paco.me-style icon morph) ---------------- */
{
  const btn = $('.copy'), txt = $('.copy-txt');
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(content.mcpCommand); } catch {}
    btn.dataset.done = ''; txt.textContent = 'copied'; sound.play('tick'); M.squish(btn, { amount: .6 });
    clearTimeout(btn._t); btn._t = setTimeout(() => { delete btn.dataset.done; txt.textContent = 'copy'; }, 1800);
  });
}

/* ---------------- the camera: focus + exposure state ---------------- */
const vf = $('#vf'), canvas = $('#blink'), headline = $('.headline');
const ui = { focusVal: $('#focus-val'), expVal: $('#exp-val'), dist: $('#hud-dist'), shut: $('#hud-s'), needle: $('#needle'),
  ring: $('#ring'), grip: $('#ring-grip'), ev: $('#ev'), af: $('#af') };
const cam = { focus: 0.35, userEV: 0, scrollEV: 0, introEV: 0, blink: null };
const PLANES = [[0, 'name'], [0.5, 'Blink'], [1, 'dawn ∞']];
const planeName = f => PLANES.reduce((b, p) => Math.abs(p[0] - f) < Math.abs(b[0] - f) ? p : b)[1];

function applyFocus() {
  const f = cam.focus;
  // three depth planes: the headline (near), Blink (middle), the dawn photo (far)
  const nearBlur = Math.max(0, f - 0.55) * 16;              // headline softens when you focus past Blink
  const midBlur = Math.max(0, 0.25 - f) * 22;              // Blink softens when you focus on the name
  headline.style.filter = nearBlur > 0.15 ? `blur(${nearBlur.toFixed(2)}px)` : '';
  cam.midBlur = midBlur; canvas.style.filter = midBlur > 0.15 ? `blur(${midBlur.toFixed(2)}px)` : ''; paintPoster();
  cam.blink?.focus(f <= 0.5 ? 0.92 : 0.92 * (1 - (f - 0.5) * 2));   // shader bokeh on the backdrop
  ui.ring.style.setProperty('--p', f); ui.grip.style.setProperty('--x', `${-f * 240}px`);
  const name = planeName(f);
  ui.ring.setAttribute('aria-valuenow', Math.round(f * 100)); ui.ring.setAttribute('aria-valuetext', name);
  ui.focusVal.textContent = name; ui.dist.textContent = `focus · ${name}`;
}
const poster = vf.querySelector('.vf-poster');
function paintPoster() { // the baked still stands in for the live lens: same blur + exposure, in CSS
  poster.style.filter = `blur(${(cam.midBlur || 0).toFixed(2)}px) brightness(${Math.pow(2, (cam.ev || 0) * 0.55).toFixed(3)})`;
}
function applyExposure() {
  const ev = clamp(cam.userEV + cam.scrollEV + cam.introEV, -2, 2);
  cam.blink?.exposure(ev);
  cam.ev = ev; paintPoster();
  const u = cam.userEV;
  ui.expVal.textContent = `${u > 0.04 ? '+' : u < -0.04 ? '−' : '±'}${Math.abs(u).toFixed(1)} EV`;
  ui.ev.style.setProperty('--e', (u + 2) / 4);
  ui.ev.setAttribute('aria-valuenow', u.toFixed(1)); ui.ev.setAttribute('aria-valuetext', `${u.toFixed(1)} EV`);
  ui.needle.style.left = `${50 + ev * 25}%`;
  const speeds = [1000, 500, 250, 125, 60];
  ui.shut.textContent = `1/${speeds[clamp(Math.round(2 - ev), 0, 4)]}`;
}

/* lens ring: drag, wheel, keys; ticks on detents */
function sliderDrag(el, get, set, { step = 0.05, min = 0, max = 1, detents = [] } = {}) {
  let sx = 0, sv = 0, w = 1, lastDet = null;
  const tickIfDetent = v => { const d = detents.find(p => Math.abs(p - v) < 0.03); if (d !== undefined && d !== lastDet) { sound.play('tick'); lastDet = d; } if (d === undefined) lastDet = null; };
  el.addEventListener('pointerdown', e => { sx = e.clientX; sv = get(); w = el.getBoundingClientRect().width; el.setPointerCapture(e.pointerId); el.dataset.drag = ''; });
  el.addEventListener('pointermove', e => { if (!('drag' in el.dataset)) return; const v = clamp(sv + (e.clientX - sx) / w * (max - min), min, max); set(v); tickIfDetent((v - min) / (max - min)); });
  const up = () => { delete el.dataset.drag; };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('keydown', e => {
    const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (k) { e.preventDefault(); set(clamp(get() + k * step * (max - min), min, max)); sound.play('tick'); }
    if (e.key === 'Home') { e.preventDefault(); set(min); } if (e.key === 'End') { e.preventDefault(); set(max); }
  });
}
sliderDrag(ui.ring, () => cam.focus, v => { cam.focus = v; applyFocus(); }, { detents: [0, 0.5, 1] });
sliderDrag(ui.ev, () => cam.userEV, v => { cam.userEV = Math.round(v * 10) / 10; applyExposure(); }, { min: -2, max: 2, step: 0.05, detents: [0.5] });

/* scroll = light leaking in: the frame over-exposes as the hero leaves */
addEventListener('scroll', () => {
  const h = $('.hero').offsetHeight; cam.scrollEV = clamp(scrollY / h, 0, 1) * 0.9; applyExposure();
}, { passive: true });

/* ---------------- autofocus intro: dawn rises, focus hunts, locks ---------------- */
function autofocus() {
  if (reduce) { cam.focus = 0.35; cam.introEV = 0; applyFocus(); applyExposure(); ui.af.dataset.lock = ''; return; }
  const t0 = performance.now(), D = 1700;
  // focus path: far (headline soft) -> overshoot -> hunt -> lock on Blink
  const keys = [[0, 1], [0.45, 0.12], [0.7, 0.48], [0.85, 0.3], [1, 0.35]];
  const at = p => { for (let i = 1; i < keys.length; i++) if (p <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; const k = (p - a) / (b - a); return va + (vb - va) * (k * k * (3 - 2 * k)); } return 0.35; };
  cam.focus = 1; cam.introEV = -1.4; applyFocus(); applyExposure();
  const tick = now => {
    const p = clamp((now - t0) / D, 0, 1);
    cam.focus = at(p); cam.introEV = -1.4 * Math.pow(1 - p, 2); applyFocus(); applyExposure();
    if (p < 1) requestAnimationFrame(tick);
    else { ui.af.dataset.lock = ''; sound.play('focus'); ui.af.animate([{ scale: 1.15 }, { scale: .94 }, { scale: 1 }], { duration: 420, easing: 'ease-out' }); }
  };
  requestAnimationFrame(tick);
}

/* ---------------- live Blink (raw WebGL2 raymarcher) ---------------- */
async function goLive() {
  if (cam.blink || !hasGL) return;
  $('#live-btn').hidden = true;
  try {
    const { mountBlink } = await import('./assets/3d/blink-live.js');
    const small = innerWidth < 700;
    cam.blink = await mountBlink(canvas, { scene: 'viewfinder', scale: small ? 0.5 : 0.62 });
    applyFocus(); applyExposure();
    requestAnimationFrame(() => vf.classList.add('is-live'));
  } catch (err) { console.warn('live lens unavailable', err); }
}
const wantsAutoLive = hasGL && innerWidth >= 700 && !reduce && !(navigator.connection && navigator.connection.saveData);
if (wantsAutoLive) (window.requestIdleCallback || (f => setTimeout(f, 200)))(() => goLive(), { timeout: 900 });
else if (hasGL) { const b = $('#live-btn'); b.hidden = false; b.addEventListener('click', goLive); }
autofocus();

/* ---------------- shutter -> instant print ---------------- */
const facts = (() => {
  const by = id => content.products.find(p => p.id === id);
  const m = by('mcp-emails'), f = by('fun-libs'), t = by('toolrails'), h = by('harbor');
  return [
    [`${f.figure.value} ${f.figure.label}`, `${f.name} · ${f.facts[1]}`],
    [`${m.figure.value} ${m.figure.label}`, `${m.name} · since ${m.since}`],
    [m.facts[0], `${m.name} · ${m.facts[2]}`],
    [`On Google Play since ${content.history.playDeveloperSince}`, content.person],
    [`${h.figure.value} ${h.figure.label}`, `${h.name} · ${h.facts[0]}`],
    [`${t.figure.value} ${t.figure.label}`, `${t.name} · ${t.status}`],
    [`${f.facts[0][0].toUpperCase()}${f.facts[0].slice(1)}`, `${f.name} · ${f.facts[2]}`],
    [m.facts[1], `${m.name} · ${m.line}`],
  ];
})();
let shot = 0;
const tray = $('#tray');
function snapshot() {
  const c = document.createElement('canvas'); c.width = c.height = 360; const g = c.getContext('2d');
  const src = cam.blink ? canvas : vf.querySelector('.vf-poster');
  if (cam.blink) cam.blink.clay.frame(performance.now() / 1000);  // render now so the buffer is readable in this task
  const sw = src.width || src.naturalWidth, sh = src.height || src.naturalHeight, s = Math.min(sw, sh) * 0.92;
  g.filter = `brightness(${Math.pow(2, clamp(cam.userEV, -2, 2) * 0.55)})`;
  try { g.drawImage(src, (sw - s) / 2, (sh - s) / 2 - sh * 0.02, s, s, 0, 0, 360, 360); } catch {}
  return c;
}
function takePrint(x, y) {
  const fact = facts[shot++ % facts.length];
  M.shutterFlash({ x, y }); sound.play('shutter');
  const card = document.createElement('figure'); card.className = 'print';
  const pic = snapshot(); pic.setAttribute('role', 'img'); pic.setAttribute('aria-label', 'Your photo of Blink');
  const cap = document.createElement('p'); cap.innerHTML = `${fact[0]}<small>${fact[1]} · frame ${String(shot).padStart(2, '0')}</small>`;
  card.append(pic, cap); tray.append(card);
  const prints = $$('.print', tray); if (prints.length > 5) prints[0].remove();
  // land somewhere on the table around the camera
  const hr = $('.hero').getBoundingClientRect(), vr = vf.getBoundingClientRect();
  const w = card.offsetWidth, hgt = card.offsetHeight;
  const wide = innerWidth >= 1000;
  const fan = (shot % 5) - 2;
  const lx = wide ? clamp(vr.left - hr.left - w * 0.42 + fan * 22, 8, hr.width - w - 8) : clamp((hr.width - w) / 2 + fan * hr.width * 0.12, 8, hr.width - w - 8);
  const ly = wide ? clamp(vr.bottom - hr.top - hgt * 0.98 + Math.abs(fan) * 12, 8, hr.height - hgt - 8) : clamp(vr.bottom - hr.top - hgt * 0.35 + fan * 6, 8, hr.height - hgt);
  const rot = fan * 6 + (Math.random() - .5) * 6;
  card.style.left = `${lx}px`; card.style.top = `${ly}px`; card.style.rotate = `${rot}deg`;
  const fromX = vr.left + vr.width / 2 - (hr.left + lx + w / 2), fromY = vr.top + vr.height * 0.4 - (hr.top + ly + hgt / 2);
  if (!reduce) {
    card.animate([
      { transform: `translate(${fromX}px, ${fromY}px) scale(.25) rotate(${-rot}deg)`, opacity: 0 },
      { transform: `translate(${fromX * .1}px, ${fromY * .1 - 40}px) scale(1.06)`, opacity: 1, offset: .6 },
      { transform: 'none', opacity: 1 },
    ], { duration: 900, easing: 'cubic-bezier(.2,.8,.25,1)' });
    // develops like an instant print: blown out and soft, then the colours come in
    pic.animate([{ filter: 'brightness(2.4) sepia(.7) blur(6px) saturate(.3)' }, { filter: 'brightness(1.3) sepia(.3) blur(1px)', offset: .5 }, { filter: 'none' }], { duration: 2600, easing: 'ease-out' });
  }
  makeDraggable(card);
}
vf.addEventListener('blink:shutter', e => { const r = canvas.getBoundingClientRect(); takePrint(r.left + r.width / 2, r.top + r.height / 2); });
$('#shutter').addEventListener('click', e => {
  M.squish($('.shutter-cap'), { amount: 1.2 });
  if (cam.blink) cam.blink.shutter();   // dispatches blink:shutter on the canvas -> print
  else { const r = e.currentTarget.getBoundingClientRect(); takePrint(r.left + r.width / 2, r.top + r.height / 2); }
});
addEventListener('keydown', e => {
  if (e.code !== 'Space' || e.repeat) return;
  const t = e.target; if (t !== document.body && !t.closest?.('.vf')) return;
  const r = vf.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
  e.preventDefault(); $('#shutter').click();
});

/* ---------------- drag: stickers and prints (pointer events + spring settle) ---------------- */
function makeDraggable(el) {
  let sx, sy, ox = 0, oy = 0, moved = false;
  const base = () => el.style.translate || '0px 0px';
  el.addEventListener('pointerdown', e => {
    if (e.button) return; e.preventDefault();
    const [tx, ty] = base().split(' ').map(parseFloat); ox = tx || 0; oy = ty || 0; sx = e.clientX; sy = e.clientY; moved = false;
    el.setPointerCapture(e.pointerId); el.style.zIndex = 20; el.dataset.drag = '';
    if (!reduce) el._lift = el.animate([{ scale: 1 }, { scale: 1.08 }], { duration: 160, fill: 'forwards', easing: 'ease-out' });
  });
  el.addEventListener('pointermove', e => {
    if (!('drag' in el.dataset)) return; moved = true;
    el.style.translate = `${ox + e.clientX - sx}px ${oy + e.clientY - sy}px`;
  });
  const up = () => {
    if (!('drag' in el.dataset)) return; delete el.dataset.drag; el.style.zIndex = '';
    el._lift?.cancel();
    if (!reduce) el.animate([{ scale: 1.08 }, { scale: 1 }], { duration: M.SPRING_BOUNCY.duration, easing: M.SPRING_BOUNCY.easing });
    if (moved) sound.play('slap');
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}
$$('.drag').forEach(makeDraggable);

/* ---------------- props drift with the pointer (parallax) ---------------- */
if (!reduce && matchMedia('(pointer: fine)').matches) {
  const props = $$('.prop'); let px = 0, py = 0, tx = 0, ty = 0, raf = 0;
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
  function loop() { px += (tx - px) * .08; py += (ty - py) * .08; props.forEach(p => { const d = +p.dataset.depth; p.style.translate = `${px * d * -60}px ${py * d * -40}px`; });
    raf = Math.abs(tx - px) + Math.abs(ty - py) > .001 ? requestAnimationFrame(loop) : 0; }
}

/* ---------------- live feed = things the camera "detects" in the frame ---------------- */
{
  const feed = createFeed(), line = $('#feed-line'), tags = $('#tags');
  const say = e => `${e.label} · ${e.text}${e.country ? ' · ' + e.country : e.ms ? ' · ' + e.ms + ' ms' : e.city ? ' · ' + e.city : ''}`;
  const first = feed.recent(1)[0]; if (first) line.textContent = say(first);
  const spots = [[12, 22], [70, 20], [14, 58], [72, 56], [60, 70], [20, 34]];
  let si = 0;
  feed.subscribe(e => {
    line.textContent = say(e);
    if (!reduce) line.animate([{ opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 380 });
    if (reduce || tags.children.length > 2) return;
    const [x, y] = spots[si++ % spots.length];
    const t = document.createElement('span'); t.className = 'tag'; t.dataset.p = e.product;
    t.style.left = `${x}%`; t.style.top = `${y}%`;
    t.innerHTML = `<span class="tag-box"></span><span class="tag-label"></span>`; t.lastChild.textContent = `${e.label} · ${e.text}`;
    tags.append(t);
    const a = t.animate([{ opacity: 0, scale: 1.5 }, { opacity: 1, scale: .95, offset: .5 }, { opacity: 1, scale: 1, offset: .62 }, { opacity: 1, scale: 1, offset: .9 }, { opacity: 0, scale: .9 }], { duration: 3200, easing: 'ease-out' });
    a.finished.then(() => t.remove(), () => t.remove());
  });
}

/* ---------------- contact strip: a WAAPI animation scrubbed by scroll ---------------- */
{
  const track = $('#strip-track'), strip = $('.strip'); let anim;
  const build = () => {
    anim?.cancel();
    const dist = Math.max(0, track.scrollWidth - innerWidth * 0.6);
    anim = track.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-dist}px)` }], { duration: 1000, fill: 'both', easing: 'linear' });
    anim.pause(); scrub();
  };
  const scrub = () => { const r = strip.getBoundingClientRect(); const p = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1); if (anim) anim.currentTime = p * 1000; };
  if (!reduce) { build(); addEventListener('scroll', scrub, { passive: true }); addEventListener('resize', build); }
}

/* ---------------- products: the roll ---------------- */
{
  const LOGO = {
    'mcp-emails': ['../_shared/products/mcp-emails/icon.png', false],
    'fun-libs': ['../_shared/products/fun-libs/icon.png', false],
    'toolrails': ['../_shared/products/toolrails/icon.svg', false],
    'harbor': ['../_shared/products/harbor/harbor-mark-filled.svg', true],
  };
  const live = content.products.filter(p => p.status !== 'retired');
  const wrap = $('#cards');
  wrap.innerHTML = live.map((p, i) => `
    <a class="card" data-id="${p.id}" href="${p.url}" target="_blank" rel="noopener">
      <div class="card-media">
        <img src="assets/products/${p.id}.webp" srcset="assets/products/${p.id}.webp 800w, assets/products/${p.id}@2x.webp 1600w"
          sizes="(min-width: 760px) ${i === 0 || i === 3 ? 58 : 42}vw, 100vw" width="800" height="600" loading="lazy"
          alt="Blink, the clay camera, holding up the ${p.name} logo" data-m="focus" data-delay="${(i % 2) * 120}">
        <span class="card-logo${LOGO[p.id][1] ? ' pad' : ''}"><img src="${LOGO[p.id][0]}" alt="${p.name} logo" width="56" height="56" loading="lazy"></span>
        <span class="card-status mono" data-s="${p.status}"><i></i>${p.status} · since ${p.since}</span>
      </div>
      <div class="card-body">
        <div><h3>${p.name}</h3><p class="card-line">${p.line}</p></div>
        ${p.figure ? `<div class="card-fig"><b>${p.figure.value}</b><span class="mono">${p.figure.label}</span></div>` : ''}
        <ul class="chips">${(p.facts || []).map(f => `<li>${f}</li>`).join('')}</ul>
      </div>
    </a>`).join('');
  // magnetic tilt + squish on press
  if (!reduce && matchMedia('(pointer: fine)').matches) $$('.card', wrap).forEach(c => {
    c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(1100px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`; });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    c.addEventListener('pointerenter', () => sound.play('squish'));
  });

  // the shoebox: retired products as clay coins that flip
  const COIN = { luma: 'assets/products/retired/luma.webp' };
  const retired = content.products.filter(p => p.status === 'retired');
  $('#coins').innerHTML = retired.map(p => `
    <li class="coin"><button class="coin-btn" type="button" aria-pressed="false" aria-label="${p.name}, ${p.since}. ${p.line}">
      <span class="coin-face coin-front"${p.id === 'luma' ? ' data-wide' : ''}><img src="${COIN[p.id] || `assets/products/retired/${p.id}.webp`}" alt="" width="480" height="480" loading="lazy"><span>${p.name.split(' / ')[0].split(',')[0]}</span></span>
      <span class="coin-face coin-back"><small>${p.since}${p.figure ? ` · ${p.figure.value} ${p.figure.label}` : ''}</small><b>${p.name}</b><p>${p.line}</p></span>
    </button></li>`).join('');
  $$('.coin-btn').forEach(b => {
    b.addEventListener('click', () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); sound.play('squish'); });
    b.addEventListener('pointerenter', () => sound.play('tick'));
  });
}

/* ---------------- the clay camera toy (three.js, lazy) ---------------- */
{
  const toy = $('#toy');
  if (hasGL) {
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      try { const { mountClayCamera } = await import('./assets/3d/clay-camera.js'); await mountClayCamera(toy); toy.classList.add('is-live'); }
      catch (err) { console.warn('toy unavailable', err); }
    }, { rootMargin: '300px' });
    io.observe(toy);
  }
  toy.addEventListener('blink:shutter', () => { const r = toy.getBoundingClientRect(); M.shutterFlash({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); sound.play('shutter'); });
}

/* ---------------- signature motion wiring ---------------- */
M.autoWire(document);
document.addEventListener('pointerdown', e => { if (e.target.closest('.sticker')) sound.play('squish'); });
