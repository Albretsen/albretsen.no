// Kiln Light — design 35 homepage.
import { content } from '../_shared/content.js';
import { createFeed } from '../_shared/feed.js';
import { sound } from './assets/sound.js';
import { initMotion } from './assets/motion.js';
import { scrub } from './assets/sequence.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (name, size = 18) => `<svg width="${size}" height="${size}" aria-hidden="true"><use href="assets/icons/sprite.svg#k-${name}"/></svg>`;
const P = '../_shared/products/';

// ---------------------------------------------------------------- products
const ART = {
  'mcp-emails': { img: 'assets/products/product-mcp-emails', logo: P + 'mcp-emails/icon.png', alt: 'The MCP Emails logo fired on a blue glazed tile, standing on the walnut bench.' },
  'fun-libs': { img: 'assets/products/product-fun-libs', logo: P + 'fun-libs/icon.png', alt: 'The Fun Libs logo on a yellow glazed tile, half in the sun.' },
  toolrails: { img: 'assets/products/product-toolrails', logo: P + 'toolrails/icon.svg', alt: 'The Toolrails logo on a black glazed tile, resting on a travertine drum.' },
  harbor: { img: 'assets/products/product-harbor', logo: P + 'harbor/harbor-mark-filled.svg', chip: true, alt: 'The Harbor mark on a dark glazed tile, on a stone block.' },
};
const STATUS = { live: 'Live', building: 'Building', paused: 'Paused' };
const FACT_ICON = f => /tool|connector/.test(f) ? 'connector' : /provider/.test(f) ? 'mail' : /open source|self-host/.test(f) ? 'knowledge' : /17/.test(f) ? 'since' : /marketing/.test(f) ? 'revenue' : /v5/.test(f) ? 'launch' : /search/.test(f) ? 'agent' : /guard|approval/.test(f) ? 'clarity' : 'plus';
const bench = content.products.filter(p => ART[p.id]);

$('#pieces').innerHTML = bench.map((p, i) => `
  <li class="piece kiln-glow" data-id="${p.id}" data-focus-pull style="--i:${i}">
    <div class="arch">
      <img src="${ART[p.id].img}.webp" srcset="${ART[p.id].img}.webp 720w, ${ART[p.id].img}@2x.webp 1440w" sizes="(min-width: 1100px) 23vw, (min-width: 560px) 46vw, 92vw" alt="${esc(ART[p.id].alt)}" width="720" height="900" loading="lazy" decoding="async">
      <span class="status" data-s="${p.status}"><i></i>${STATUS[p.status]}</span>
    </div>
    <span class="piece-more" aria-hidden="true">${icon('plus', 18)}</span>
    <div class="piece-head">
      <img class="${ART[p.id].chip ? 'logo-chip' : ''}" src="${ART[p.id].logo}" alt="" width="36" height="36" loading="lazy">
      <h3>${esc(p.name)}</h3>
      <span class="since mono-soft">${p.since}</span>
    </div>
    <p class="piece-line">${esc(p.line)}</p>
    <p class="piece-fig"><strong>${esc(p.figure.value)}</strong><span class="mono-soft">${esc(p.figure.label)}</span></p>
    <ul class="piece-facts" role="list">${(p.facts || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    <button class="piece-open" type="button" data-niche-open="piece" data-id="${p.id}" aria-label="Open ${esc(p.name)}"></button>
  </li>`).join('');

// ---------------------------------------------------------------- archive
const TOKEN = { luma: P + 'luma/luma-monogram.svg', 'polyglot-pilot': 'assets/retired/polyglot-pilot.svg', pinpoint: 'assets/retired/pinpoint.svg', webvakt: 'assets/retired/webvakt.svg', 'joke-central': 'assets/retired/joke-central.svg', 'tryggere-hyring': 'assets/retired/tryggere-hyring.svg', 'early-apps': 'assets/retired/early-apps.svg' };
const retired = content.products.filter(p => p.status === 'retired');
$('#archive').innerHTML = retired.map(p => `
  <div data-strata-item>
    <button type="button" data-strata-trigger data-sound-hover>
      <img src="${TOKEN[p.id]}" alt="" width="52" height="52" loading="lazy" style="${p.id === 'luma' ? 'border-radius:50%' : ''}">
      <span class="t-name">${esc(p.name)}</span>
      <span class="t-year">${p.since}</span>
      <span class="k-chev">${icon('chevron', 16)}</span>
    </button>
    <div data-strata-content hidden><div><p>${esc(p.line)}${p.figure ? ` <span class="mono-soft">· ${esc(p.figure.value)} ${esc(p.figure.label)}</span>` : ''}</p></div></div>
  </div>`).join('');

// ---------------------------------------------------------------- dialog content (runs before motion.js opens it)
let lastPiece = null;
$$('[data-niche-open="piece"]').forEach(b => b.addEventListener('click', () => fillPiece(b.dataset.id)));
function fillPiece(id) {
  const p = content.products.find(x => x.id === id), a = ART[id]; lastPiece = id;
  $('#pd-img').src = a.img + '@2x.webp'; $('#pd-img').alt = a.alt;
  $('#pd-logo').src = a.logo; $('#pd-logo').className = a.chip ? 'logo-chip' : '';
  $('#pd-meta').innerHTML = `<span class="dot"${p.status === 'building' ? ' style="background:var(--ember)"' : ''}></span>${STATUS[p.status]} · since ${p.since}`;
  $('#piece-name').textContent = p.name;
  $('#pd-line').textContent = p.line;
  $('#pd-fig').textContent = p.figure.value; $('#pd-fig-l').textContent = p.figure.label;
  $('#pd-facts').innerHTML = (p.facts || []).map(f => `<li>${icon(FACT_ICON(f), 18)}<span>${esc(f)}</span></li>`).join('');
  $('#pd-url').href = p.url; $('#pd-url').firstChild.textContent = `Visit ${p.url.replace('https://', '')} `;
}
$('#pd-room').addEventListener('click', () => {
  setTimeout(() => {
    $('#room').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    selectView(lastPiece); kindle();
  }, 300);
});

// ---------------------------------------------------------------- motion primitives + sound
initMotion(document);
const sbtn = $('#sound');
sound.onChange(on => {
  sbtn.setAttribute('aria-pressed', on); $('.sound-label', sbtn).textContent = on ? 'Sound on' : 'Sound off';
  sbtn.dataset.tip = on ? 'Sound is on. Click to turn it off.' : 'Sound is off. Small clay and glass sounds, synthesised.';
});
sbtn.addEventListener('click', () => { if (sound.on) { sound.play('thum'); sound.toggle(false); } else sound.toggle(true); });

// copy the MCP command
$('#cmd-copy').addEventListener('click', async e => {
  const b = e.currentTarget;
  try { await navigator.clipboard.writeText(content.mcpCommand); } catch {
    const r = document.createRange(); r.selectNodeContents($('#cmd-text')); getSelection().removeAllRanges(); getSelection().addRange(r);
  }
  b.classList.add('done'); b.innerHTML = icon('plus', 16).replace('k-plus', 'k-install'); b.dataset.tip = 'Copied';
  setTimeout(() => { b.classList.remove('done'); b.innerHTML = icon('copy', 16); b.dataset.tip = 'Copy to clipboard'; }, 1800);
});

// ---------------------------------------------------------------- nav state
const nav = $('#nav'), hero = $('#hero');
const navState = () => {
  const r = hero.getBoundingClientRect();
  const inHero = r.bottom > 80;
  document.documentElement.classList.toggle('hero-light', inHero);
  nav.classList.toggle('solid', !inHero);
};
addEventListener('scroll', navState, { passive: true }); navState();

// ---------------------------------------------------------------- hero: a day in the room
const chapters = $$('.chapter');
const arc = $('#arc'), lit = $('#arc-lit'), sun = $('#sun'), hi = $('#sun-hi');
const L = arc.getTotalLength();
lit.style.strokeDasharray = `${L} ${L}`;
const stops = $$('[data-stop]');
let dusk = false, phaseNow = '';
function setDay(p) {
  const pt = arc.getPointAtLength(p * L);
  sun.setAttribute('cx', pt.x); sun.setAttribute('cy', pt.y); hi.setAttribute('cx', pt.x - 1.5); hi.setAttribute('cy', pt.y - 1.5);
  lit.style.strokeDashoffset = L - p * L;
  const mins = 6 * 60 + 40 + Math.round(p * (13 * 60 + 10)); // 06:40 -> 19:50
  $('#clock').textContent = `${String(mins / 60 | 0).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  const phase = p < 0.24 ? 'Morning' : p < 0.5 ? 'Noon' : p < 0.78 ? 'Afternoon' : 'Dusk';
  if (phase !== phaseNow) {
    phaseNow = phase; $('#phase').textContent = phase;
    chapters.forEach(c => { const on = p >= +c.dataset.from && p < +c.dataset.to; c.toggleAttribute('data-active', on); c.inert = !on; });
    stops.forEach((b, i) => b.setAttribute('aria-current', i === ['Morning', 'Noon', 'Afternoon', 'Dusk'].indexOf(phase)));
  }
  $('.stage').style.setProperty('--scrim', `${72 - p * 10}%`);
  if (p > 0.92 && !dusk) { dusk = true; sound.play('crackle'); } else if (p < 0.85) dusk = false;
}
setDay(0);
stops.forEach(b => b.addEventListener('click', () => {
  const total = hero.offsetHeight - innerHeight;
  scrollTo({ top: hero.offsetTop + total * +b.dataset.stop, behavior: reduce ? 'auto' : 'smooth' });
}));

if (!reduce) {
  const canvas = $('#seq');
  const go = () => scrub(canvas, {
    src: i => `assets/sequence/room-${String(i).padStart(3, '0')}.webp`, count: 64, track: hero,
    onFrame: (i, p) => { canvas.classList.add('ready'); setDay(p); },
  });
  if (document.readyState === 'complete') requestIdleCallback?.(go) ?? go(); else addEventListener('load', () => (window.requestIdleCallback || setTimeout)(go), { once: true });
  // scroll hint fades after first move
} else {
  chapters.forEach((c, i) => { c.toggleAttribute('data-active', i === 0); c.inert = i !== 0; });
}

// ---------------------------------------------------------------- live feed
const GLYPH = { 'mcp-emails': 'mail', 'fun-libs': 'app', toolrails: 'connector', 'albretsen.no': 'mark' };
const feed = createFeed();
const ol = $('#feed');
const tail = e => e.ms ? `${e.ms} ms` : e.country || e.city || (e.sha ? e.sha : '');
const ago = d => { const s = Math.max(1, Math.round((Date.now() - d) / 1000)); return s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`; };
const row = e => `<li data-t="${+e.time}">${icon(GLYPH[e.product] || 'mark', 20)}<span><b>${esc(e.label)}</b>${esc(e.text)}${tail(e) ? ` · ${esc(tail(e))}` : ''}</span><time>${ago(e.time)}</time></li>`;
ol.innerHTML = feed.recent(3).map(row).join('');
feed.subscribe(e => {
  ol.insertAdjacentHTML('afterbegin', row(e)); ol.firstElementChild.classList.add('new');
  while (ol.children.length > 3) ol.lastElementChild.remove();
});
setInterval(() => $$('li', ol).forEach(li => { li.querySelector('time').textContent = ago(+li.dataset.t); }), 5000);

// ---------------------------------------------------------------- micro-interactions
if (fine && !reduce) {
  // magnetic pull, eased back with a spring-ish transition
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transition = 'translate .25s cubic-bezier(.16,1,.3,1)';
      el.style.setProperty('--tx', ((e.clientX - r.left) / r.width - 0.5) * 14 + 'px');
      el.style.setProperty('--ty', ((e.clientY - r.top) / r.height - 0.5) * 12 + 'px');
    });
    el.addEventListener('pointerleave', () => { el.style.transition = 'translate .9s cubic-bezier(.34,1.04,.64,1)'; el.style.setProperty('--tx', '0px'); el.style.setProperty('--ty', '0px'); });
  });
  // pieces tilt toward the light (the pointer), very slightly
  $$('.piece').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 6 + 'deg');
      el.style.setProperty('--rx', ((e.clientY - r.top) / r.height - 0.5) * -5 + 'deg');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    el.dataset.soundHover = 'tok';
  });
}

// ---------------------------------------------------------------- the live room
const rc = $('#room-canvas'), tag = $('#room-tag'), status = $('#room-status'), kbtn = $('#kindle');
const LABEL = { 'mcp-emails': 'MCP Emails', 'fun-libs': 'Fun Libs', toolrails: 'Toolrails', harbor: 'Harbor', glass: 'Glass · clarity', archive: 'The archive' };
let roomApi = null, loading = null, wantedView = 'approach';
function selectView(id) {
  const b = $(`[data-view="${id}"]`); if (b) b.click();
}
$$('[data-view]').forEach(b => {
  new MutationObserver(() => { if (b.dataset.state === 'active') { wantedView = b.dataset.view; roomApi?.setView(wantedView); } })
    .observe(b, { attributes: true, attributeFilter: ['data-state'] });
});
$('#sun-range').addEventListener('input', e => roomApi?.setTime(+e.target.value));
function kindle() {
  if (loading) return loading;
  kbtn.hidden = true; status.textContent = 'Lighting the room…';
  loading = import('./room-live.js').then(m => m.mountRoom(rc, {
    view: wantedView, time: +$('#sun-range').value, reduce,
    onHover(id, x, y) {
      if (!id) { tag.hidden = true; return; }
      if (tag.hidden || tag.dataset.id !== id) { tag.textContent = LABEL[id] || id; tag.dataset.id = id; tag.hidden = false; sound.play('tok'); }
      if (x != null) { const r = rc.getBoundingClientRect(); tag.style.transform = `translate(${x * r.width + 14}px, ${y * r.height - 40}px)`; }
    },
    onSelect(id) {
      if (ART[id]) { const b = $(`.piece-open[data-id="${id}"]`); b?.click(); }
      else if (id === 'archive') { $('#archive').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }
      else selectView(id);
    },
  })).then(api => {
    roomApi = api; rc.classList.add('on'); status.textContent = 'Drag to turn · click a piece';
    setTimeout(() => { status.textContent = ''; }, 6000);
    return api;
  }).catch(err => { status.textContent = 'The live room needs WebGL. The still stays.'; kbtn.hidden = true; console.warn(err); });
  return loading;
}
kbtn.addEventListener('click', kindle);
const saveData = navigator.connection?.saveData;
if (!reduce && !saveData && innerWidth >= 900) {
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { io.disconnect(); kindle(); } }, { rootMargin: '300px' }).observe($('#room-frame'));
}

// ---------------------------------------------------------------- stickers: die-cut glaze, draggable with a little physics
(async () => {
  const host = $('#stickers');
  let txt; try { txt = await (await fetch('assets/extras/stickers.svg')).text(); } catch { return; }
  const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
  const defs = doc.querySelector('defs');
  const groups = [...doc.documentElement.children].filter(n => n.tagName === 'g');
  const shared = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  shared.setAttribute('width', 0); shared.setAttribute('height', 0); shared.style.position = 'absolute';
  if (defs) shared.append(document.importNode(defs, true)); host.append(shared);
  const W = () => host.clientWidth, H = () => host.clientHeight;
  const layout = [[.62, .18], [.78, .1], [.9, .3], [.7, .42], [.86, .55], [.56, .06], [.94, .08], [.76, .7], [.64, .62]];
  const narrow = innerWidth < 760;
  const items = groups.slice(0, narrow ? 4 : 9).map((g, i) => {
    const el = document.createElement('div'); el.className = 'sticker'; el.tabIndex = 0;
    el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'Sticker');
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '-108 -108 216 222');
    const clone = document.importNode(g, true); clone.setAttribute('transform', `rotate(${(g.getAttribute('transform').match(/rotate\(([-\d.]+)/) || [0, 0])[1]})`);
    s.append(clone); el.append(s); host.append(el);
    const [fx, fy] = narrow ? [[.58, .06], [.8, .12], [.68, .22], [.88, .28]][i] : layout[i];
    return { el, x: fx * W(), y: fy * H(), vx: 0, vy: 0, r: (i * 37 % 24) - 12, vr: 0, drag: false };
  });
  const draw = it => { it.el.style.transform = `translate(${it.x}px, ${it.y}px) rotate(${it.r}deg)`; };
  items.forEach(draw);
  let raf = 0;
  const step = () => {
    let moving = false;
    for (const it of items) {
      if (it.drag) { moving = true; continue; }
      it.x += it.vx; it.y += it.vy; it.r += it.vr; it.vx *= 0.93; it.vy *= 0.93; it.vr *= 0.9;
      const w = it.el.offsetWidth, mx = W() - w, my = H() - w;
      if (it.x < 0) { it.x = 0; it.vx *= -0.5; } if (it.x > mx) { it.x = mx; it.vx *= -0.5; }
      if (it.y < 0) { it.y = 0; it.vy *= -0.5; } if (it.y > my) { it.y = my; it.vy *= -0.5; }
      if (Math.abs(it.vx) + Math.abs(it.vy) + Math.abs(it.vr) > 0.05) moving = true;
      draw(it);
    }
    raf = moving ? requestAnimationFrame(step) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
  items.forEach(it => {
    let lx, ly, lt;
    it.el.addEventListener('pointerdown', e => {
      it.drag = true; it.el.classList.add('dragging'); it.el.setPointerCapture(e.pointerId);
      lx = e.clientX; ly = e.clientY; lt = performance.now(); it.vx = it.vy = 0; sound.play('tok'); host.append(it.el); kick();
    });
    it.el.addEventListener('pointermove', e => {
      if (!it.drag) return;
      const dx = e.clientX - lx, dy = e.clientY - ly, dt = Math.max(8, performance.now() - lt);
      it.x += dx; it.y += dy; it.vx = dx / dt * 16; it.vy = dy / dt * 16; it.r += dx * 0.15; it.vr = dx * 0.05;
      lx = e.clientX; ly = e.clientY; lt = performance.now(); draw(it);
    });
    const up = () => { if (!it.drag) return; it.drag = false; it.el.classList.remove('dragging'); if (reduce) { it.vx = it.vy = it.vr = 0; } kick(); };
    it.el.addEventListener('pointerup', up); it.el.addEventListener('pointercancel', up);
    it.el.addEventListener('keydown', e => {
      const k = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }[e.key];
      if (k) { e.preventDefault(); it.vx = k[0] / 2; it.vy = k[1] / 2; it.vr = k[0] / 8; kick(); }
    });
  });
  addEventListener('resize', kick);
})();

