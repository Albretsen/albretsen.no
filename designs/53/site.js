// Halflight / design 53 — page behaviour.
// The title sequence, the live re-lighting by the sun over Oslo, the day scrubber,
// subtitles from the live feed, posters, specimens, the archive and opt-in sound.

import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import { PHASES, solarAltitude, phaseFromSun, OSLO } from './assets/js/timeofday.js';
import { observe, splitTitle, glint, setBars } from './assets/motion.js';

const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const forced = new URLSearchParams(location.search).get('phase');
const STILL = { night: 'hero-night', dawn: 'hero-dawn', day: 'hero-dusk-scope', dusk: 'hero-dusk-scope' };

/* ------------------------------------------------------------------ time */
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: OSLO.tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function osloMinutes(d = new Date()) { const [h, m] = fmt.format(d).split(':').map(Number); return h * 60 + m; }
function osloMidnight(d = new Date()) { return new Date(d.getTime() - osloMinutes(d) * 60000 - d.getSeconds() * 1000 - d.getMilliseconds()); }
function sunAt(date) {
  const alt = solarAltitude(date);
  const rising = solarAltitude(new Date(date.getTime() + 600000)) > alt;
  return { alt, rising, time: fmt.format(date) };
}
function phaseAt(date) { return (forced && PHASES[forced] && !scrubbing.active) ? forced : phaseFromSun(sunAt(date)); }

/* ------------------------------------------------------------------ hero shader */
const hero = $('.hero');
const canvas = $('#halflight');
const still = $('#still');
let hl = null, plateName = null;
let inks = null; // current shader inks {paper, lo, hi}

const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const mixHex = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
let inkRaf = 0;
function tweenInks(target, dur = 900) {
  if (!hl) return;
  if (!inks || reduce) { inks = { ...target }; hl.setPhase({ ...target, invert: 0 }); return; }
  const from = { ...inks }, t0 = performance.now();
  cancelAnimationFrame(inkRaf);
  const step = (now) => {
    const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
    inks = { paper: mixHex(from.paper, target.paper, e), lo: mixHex(from.lo, target.lo, e), hi: mixHex(from.hi, target.hi, e) };
    hl.setPhase({ ...inks, invert: 0 });
    if (t < 1) inkRaf = requestAnimationFrame(step);
  };
  inkRaf = requestAnimationFrame(step);
}

async function startShader() {
  if (reduce) return null;
  try {
    const { createHalflight } = await import('./assets/js/halflight.js');
    const name = root.dataset.phase;
    plateName = PHASES[name].plate;
    const inst = createHalflight(canvas, { phase: name, plate: plateName, cell: innerWidth < 640 ? 6 : 8, intro: root.classList.contains('intro') });
    if (!inst) return null;
    hl = inst;
    inks = { paper: PHASES[name].paper, lo: PHASES[name].lo, hi: PHASES[name].hi };
    hero.classList.add('live');
    return inst;
  } catch (e) { return null; }
}

/* ------------------------------------------------------------------ apply a phase to the whole page */
let currentPhase = root.dataset.phase;
function relight(date) {
  const name = phaseAt(date);
  const p = PHASES[name], sun = sunAt(date);
  root.style.setProperty('--hl-paper', p.paper);
  root.style.setProperty('--hl-sun-alt', sun.alt.toFixed(1));
  $('#sunline').innerHTML = `<span class="lbl">${p.label} · </span>${sun.time}<span class="long"> · sun ${sun.alt >= 0 ? '+' : '−'}${Math.abs(sun.alt).toFixed(1)}°</span>`;
  if (name !== currentPhase) {
    currentPhase = name;
    root.dataset.phase = name;
    if (hl) {
      tweenInks({ paper: p.paper, lo: p.lo, hi: p.hi });
      if (p.plate !== plateName) { plateName = p.plate; hl.setPlate(plateName); }
    }
    const s = STILL[name];
    still.srcset = `assets/hero/${s}.webp 1440w, assets/hero/${s}@2x.webp 2880w`;
    still.src = `assets/hero/${s}.webp`;
    audio.retune();
  }
  audio.setAlt(sun.alt);
  return { name, sun };
}

/* ------------------------------------------------------------------ the day bar */
const track = $('#daytrack'), sunEl = $('#sun'), dots = $('#daydots'), label = $('#scrub-label'), nowBtn = $('#now-btn');
const scrubbing = { active: false, minutes: osloMinutes() };
const HZ = 0.62, ALT_MAX = 28, ALT_MIN = -55; // horizon as a fraction of the track's drawing height
let peak = 30;
const yFrac = (alt) => alt > 0 ? HZ - (alt / Math.max(ALT_MAX, peak)) * (HZ - 0.06) : HZ - (alt / -ALT_MIN) * (0.97 - HZ);
const svg = $('#daysvg');
function drawCurve() {
  const mid = osloMidnight();
  const r0 = track.getBoundingClientRect();
  const w = Math.max(200, Math.round(r0.width)), h = Math.max(40, Math.round(r0.height - 18));
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const hz = svg.querySelector('.horizon'); hz.setAttribute('x2', w); hz.setAttribute('y1', HZ * h); hz.setAttribute('y2', HZ * h);
  const N = Math.max(48, Math.min(144, Math.round(w / 12)));
  const alts = Array.from({ length: N + 1 }, (_, i) => solarAltitude(new Date(mid.getTime() + (i / N) * 86400000)));
  peak = Math.max(...alts);
  dots.innerHTML = alts.map((alt, i) => {
    const r = alt > 0 ? 1.6 + (alt / Math.max(ALT_MAX, peak)) * 3.6 : 1.1;
    return `<circle cx="${((i / N) * w).toFixed(1)}" cy="${(yFrac(alt) * h).toFixed(1)}" r="${r.toFixed(2)}"${alt <= 0 ? ' class="below"' : ''}/>`;
  }).join('');
}
function placeSun(minutes) {
  const mid = osloMidnight();
  const d = new Date(mid.getTime() + minutes * 60000);
  const alt = solarAltitude(d);
  const rect = track.getBoundingClientRect();
  const x = (minutes / 1440) * rect.width;
  const y = yFrac(alt) * (rect.height - 18);
  sunEl.style.transform = `translate(${x}px, ${y}px)`;
  track.setAttribute('aria-valuenow', String(Math.round(minutes)));
  track.setAttribute('aria-valuetext', `${fmt.format(d)}, ${PHASES[phaseFromSun(sunAt(d))].label}`);
  return d;
}
function setMinutes(min, { user = false } = {}) {
  min = Math.max(0, Math.min(1439, min));
  scrubbing.minutes = min;
  const d = placeSun(min);
  if (user) {
    scrubbing.active = true;
    nowBtn.hidden = false;
    label.textContent = 'Scrubbing the day · ' + fmt.format(d);
  }
  relight(d);
}
function backToNow() {
  scrubbing.active = false; nowBtn.hidden = true; label.textContent = 'Today over Oslo';
  drawCurve(); setMinutes(osloMinutes());
}
nowBtn.addEventListener('click', backToNow);
function minutesFromEvent(e) { const r = track.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 1440; }
track.addEventListener('pointerdown', (e) => {
  track.setPointerCapture(e.pointerId); track.classList.add('dragging'); setMinutes(minutesFromEvent(e), { user: true });
  audio.blip();
});
track.addEventListener('pointermove', (e) => { if (track.hasPointerCapture(e.pointerId)) setMinutes(minutesFromEvent(e), { user: true }); });
const endDrag = () => track.classList.remove('dragging');
track.addEventListener('pointerup', endDrag); track.addEventListener('pointercancel', endDrag);
track.addEventListener('keydown', (e) => {
  const step = e.shiftKey ? 60 : 15;
  const map = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: 120, PageDown: -120 };
  if (e.key in map) { e.preventDefault(); setMinutes(scrubbing.minutes + map[e.key], { user: true }); }
  if (e.key === 'Home') { e.preventDefault(); setMinutes(0, { user: true }); }
  if (e.key === 'End') { e.preventDefault(); setMinutes(1439, { user: true }); }
  if (e.key === 'Escape' && scrubbing.active) backToNow();
});
addEventListener('resize', () => { drawCurve(); placeSun(scrubbing.minutes); });
// re-light with the real sun every minute (cheap) unless the visitor is scrubbing
setInterval(() => { if (!scrubbing.active) { drawCurve(); setMinutes(osloMinutes()); } }, 60000);

/* ------------------------------------------------------------------ sound (opt-in) */
const audio = (() => {
  let ctx = null, master, filter, oscs = [], on = false;
  const btn = $('#sound');
  const chord = { night: [55, 82.4, 110], dawn: [73.4, 110, 146.8], day: [98, 146.8, 196], dusk: [65.4, 98, 130.8] };
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value = 0.7;
    filter.connect(master); master.connect(ctx.destination);
    oscs = chord[currentPhase].map((f, i) => {
      const o = ctx.createOscillator(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = [0.22, 0.12, 0.08][i];
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07 + i * 0.05;
      const lg = ctx.createGain(); lg.gain.value = 0.05; lfo.connect(lg); lg.connect(g.gain); lfo.start();
      o.connect(g); g.connect(filter); o.start(); return o;
    });
  }
  btn.addEventListener('click', () => {
    on = !on; btn.setAttribute('aria-pressed', String(on));
    if (on && !ctx) build();
    if (!ctx) return;
    ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(on ? 0.16 : 0, ctx.currentTime, on ? 0.8 : 0.25);
  });
  return {
    setAlt(alt) { if (!ctx) return; filter.frequency.setTargetAtTime(260 + Math.max(0, alt + 20) * 42, ctx.currentTime, 0.4); },
    retune() { if (!ctx) return; chord[currentPhase].forEach((f, i) => oscs[i]?.frequency.setTargetAtTime(f, ctx.currentTime, 1.2)); },
    blip() {
      if (!ctx || !on) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 1320; o.type = 'sine'; g.gain.value = 0;
      g.gain.setTargetAtTime(0.05, ctx.currentTime, 0.005); g.gain.setTargetAtTime(0, ctx.currentTime + 0.04, 0.12);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.6);
    },
  };
})();

/* ------------------------------------------------------------------ subtitles: the live feed */
function subtitles() {
  const el = $('#subtitles');
  const feed = createFeed();
  const queue = [];
  let busy = false;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const tail = (e) => e.ms ? `${e.ms} ms` : e.country || (e.city ? e.city : '') || (e.sha ? e.sha : '');
  function show(e) {
    busy = true;
    const old = el.querySelector('.line');
    if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 500); }
    const line = document.createElement('span'); line.className = 'line';
    line.innerHTML = `<b></b><span></span><small></small>`;
    line.querySelector('b').textContent = e.label;
    line.querySelector('span').textContent = cap(e.text) + '.';
    line.querySelector('small').textContent = tail(e);
    setTimeout(() => { el.append(line); }, old ? 420 : 0);
    setTimeout(() => { busy = false; if (queue.length) show(queue.shift()); }, 4200);
  }
  feed.recent(1).forEach(show);
  feed.subscribe((e) => { if (busy) { queue.push(e); if (queue.length > 3) queue.shift(); } else show(e); });
}

/* ------------------------------------------------------------------ the title sequence */
async function intro() {
  const title = $('#title');
  splitTitle(title);
  const play = root.classList.contains('intro');
  const shaderP = startShader();
  if (!play) { title.classList.add('is-in'); return; }

  let skipped = false;
  const credits = [...document.querySelectorAll('.credit')];
  const finish = () => {
    if (skipped) return; skipped = true;
    credits.forEach((c) => c.classList.remove('on'));
    setBars('open');
    root.classList.remove('intro');
    title.classList.add('is-in');
    try { sessionStorage.setItem('hl-seen', '1'); } catch (_) {}
    removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') finish(); };
  addEventListener('keydown', onKey);
  $('#skip-intro').addEventListener('click', finish);
  setTimeout(finish, 9000); // safety net: never leave the page shuttered

  setBars('closed');
  await wait(250); if (skipped) return;
  credits[0].classList.add('on');
  await wait(1500); if (skipped) return;
  credits[0].classList.remove('on');
  const inst = await shaderP;
  await wait(350); if (skipped) return;
  inst?.play();
  setBars('scope');
  await wait(600); if (skipped) return;
  credits[1].classList.add('on');
  await (inst ? Promise.race([inst.ready, wait(3600)]) : wait(1800));
  if (skipped) return;
  credits[1].classList.remove('on');
  await wait(300);
  finish();
}

/* ------------------------------------------------------------------ the Lottie mark (lazy) */
function lottieMark() {
  if (reduce) return;
  const host = $('#mark');
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js';
  s.async = true;
  s.onload = () => {
    const box = document.createElement('div'); box.style.cssText = 'width:40px;height:40px';
    const anim = window.lottie.loadAnimation({ container: box, renderer: 'svg', loop: false, autoplay: false, path: 'assets/motion/mark-sunrise.json' });
    anim.addEventListener('DOMLoaded', () => {
      host.replaceChildren(box);
      anim.playSegments([0, 150], true);
      anim.addEventListener('complete', () => { anim.loop = true; anim.playSegments([150, 270], true); });
    });
    $('.brand').addEventListener('mouseenter', () => { anim.loop = false; anim.playSegments([[0, 150], [150, 270]], true); });
  };
  document.head.append(s);
}

/* ------------------------------------------------------------------ products */
const ONE_SHEETS = ['mcp-emails', 'fun-libs', 'toolrails', 'harbor'];
const STATUS = { live: 'Showing now', building: 'In production', paused: 'Intermission', retired: 'Retired' };
function posters() {
  const ol = $('#posters');
  const items = content.products.filter((p) => ONE_SHEETS.includes(p.id));
  ol.innerHTML = items.map((p, i) => `
    <li class="poster${reduce ? '' : ' pre'}" style="--d:${i * 110}ms">
      <a class="poster-link" href="${p.url}" rel="noopener" aria-label="${p.name}: ${p.line} ${p.figure ? p.figure.value + ' ' + p.figure.label : ''}">
        <div class="poster-frame hl-glint">
          <img src="assets/products/one-sheet-${p.id}.webp" srcset="assets/products/one-sheet-${p.id}.webp 600w, assets/products/one-sheet-${p.id}@2x.webp 1200w"
               sizes="(max-width: 640px) 78vw, (max-width: 1080px) 46vw, 23vw" width="600" height="800" loading="lazy" decoding="async"
               alt="Film one-sheet for ${p.name} with its logo, ${p.figure ? p.figure.value + ' ' + p.figure.label : ''}">
        </div>
        <div class="poster-meta"><h3 class="poster-name">${p.name}</h3><span class="poster-url">${p.url.replace('https://', '')} <span class="arr">↗</span></span></div>
        <p class="status mono" data-s="${p.status}">${STATUS[p.status]} · since ${p.since}</p>
        <p class="poster-line">${p.line}</p>
      </a>
    </li>`).join('');

  glint(ol.querySelectorAll('.hl-glint'));
  if (!reduce && matchMedia('(hover: hover)').matches) {
    ol.querySelectorAll('.poster-link').forEach((a) => {
      const f = a.querySelector('.poster-frame');
      a.addEventListener('pointermove', (e) => {
        const r = f.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        f.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);
        f.style.setProperty('--rx', `${(0.5 - y) * 10}deg`);
        f.style.setProperty('--gx', `${x * 100}%`); f.style.setProperty('--gy', `${y * 100}%`);
      });
      a.addEventListener('pointerleave', () => { f.style.setProperty('--rx', '0deg'); f.style.setProperty('--ry', '0deg'); });
    });
  }
  if (!reduce) {
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); e.target.classList.remove('pre'); io.unobserve(e.target); }
    }), { threshold: 0.15 });
    ol.querySelectorAll('.poster').forEach((li) => io.observe(li));
  }
}

/* ------------------------------------------------------------------ archive: Radix-style tabs */
function archive() {
  const retired = content.products.filter((p) => p.status === 'retired');
  const host = $('#moons'), panel = $('#moon-panel');
  host.innerHTML = retired.map((p, i) => {
    const art = p.id === 'luma'
      ? `<svg viewBox="0 0 240 300" aria-hidden="true"><circle cx="120" cy="120" r="96" fill="#f6eedd"/><image href="../_shared/products/luma/logo.png" x="52" y="101" width="136" height="38" preserveAspectRatio="xMidYMid meet"/><text x="120" y="268" text-anchor="middle" fill="#deac37" font-family="Geist Mono, monospace" font-size="15" letter-spacing="2">${p.since}</text></svg>`
      : `<img src="assets/retired/${p.id}.svg" alt="" width="240" height="300" loading="lazy">`;
    return `<button class="moon${p.id === 'luma' ? ' luma' : ''}" role="tab" id="tab-${p.id}" aria-controls="moon-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}">
      ${art}<span class="sr">${p.name}</span></button>`;
  }).join('');
  const style = document.createElement('style');
  style.textContent = '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}';
  document.head.append(style);
  const tabs = [...host.querySelectorAll('.moon')];
  function select(i, focus) {
    tabs.forEach((t, j) => { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; });
    if (focus) tabs[i].focus();
    panel.setAttribute('aria-labelledby', tabs[i].id);
    const p = retired[i];
    const old = panel.querySelector('.p');
    if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 250); }
    const d = document.createElement('div'); d.className = 'p';
    d.innerHTML = `<span class="yr"></span><h4 class="nm"></h4><p class="ln"></p><p class="fig mono"></p>`;
    d.querySelector('.yr').textContent = p.since;
    d.querySelector('.nm').textContent = p.name;
    d.querySelector('.ln').textContent = p.line;
    d.querySelector('.fig').textContent = p.figure ? `${p.figure.value} ${p.figure.label} · retired` : 'Retired';
    panel.append(d);
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('mouseenter', () => { if (t.getAttribute('aria-selected') !== 'true') select(i); });
    t.addEventListener('keydown', (e) => {
      const n = tabs.length;
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (k) { e.preventDefault(); select((i + k + n) % n, true); }
      if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      if (e.key === 'End') { e.preventDefault(); select(n - 1, true); }
    });
  });
  select(0);
}

/* ------------------------------------------------------------------ specimens: drag to spin, with inertia */
function specimens() {
  document.querySelectorAll('.diatom').forEach((img, k) => {
    let angle = k * 40, vel = reduce ? 0 : 0.04 * (k % 2 ? -1 : 1), dragging = false, last = 0, lastT = 0, raf = 0;
    const idle = vel;
    const centre = () => { const r = img.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    const ang = (e) => { const [cx, cy] = centre(); return Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI; };
    const render = () => { img.style.transform = `rotate(${angle}deg)`; };
    const tick = () => {
      if (!dragging) { angle += vel; vel += (idle - vel) * 0.02; }
      render();
      raf = requestAnimationFrame(tick);
    };
    render();
    if (!reduce) {
      const io = new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting) raf = requestAnimationFrame(tick); });
      io.observe(img);
    }
    img.addEventListener('pointerdown', (e) => {
      e.preventDefault(); img.setPointerCapture(e.pointerId); dragging = true; last = ang(e); lastT = performance.now(); vel = 0;
    });
    img.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const a = ang(e); let d = a - last; if (d > 180) d -= 360; if (d < -180) d += 360;
      const now = performance.now(); angle += d;
      vel = d / Math.max(1, (now - lastT) / 16.7); last = a; lastT = now;
      if (reduce) render();
    });
    const up = () => { dragging = false; vel = Math.max(-30, Math.min(30, vel)); };
    img.addEventListener('pointerup', up); img.addEventListener('pointercancel', up);
    img.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault(); const s = e.key === 'ArrowLeft' ? -1 : 1;
        if (reduce) { angle += 30 * s; render(); } else vel = 14 * s;
      }
    });
  });
}

/* ------------------------------------------------------------------ micro-interactions */
function magnetic() {
  if (reduce || !matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}
function copy() {
  const b = $('#copy');
  b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(content.mcpCommand); } catch (_) {
      const r = document.createRange(); r.selectNodeContents($('#mcp-cmd')); getSelection().removeAllRanges(); getSelection().addRange(r);
    }
    b.classList.add('done'); b.setAttribute('aria-label', 'Copied');
    setTimeout(() => { b.classList.remove('done'); b.setAttribute('aria-label', 'Copy the MCP command'); }, 1800);
  });
}

/* ------------------------------------------------------------------ boot */
$('#mcp-cmd').textContent = content.mcpCommand;
$('#mail').textContent = content.email; $('#mail').href = `mailto:${content.email}`;
drawCurve();
setMinutes(osloMinutes());
intro().then(() => { lottieMark(); });
subtitles();
posters();
archive();
specimens();
magnetic();
copy();
glint(document.querySelectorAll('.mail, .plate'));
observe();

// DEVELOP: observe the band, not the clipped frame (its slit is too thin to cross an IO threshold)
{
  const frame = $('.band-frame');
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { frame.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.2 });
  io.observe($('.band'));
}
