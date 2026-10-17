// Amber Hour (design 67). One unbroken camera move: the full-bleed dusk pulls back
// into a postcard on the table, then turns over. No dependencies.
import { createFeed } from '../../_shared/feed.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cine = document.documentElement.classList.contains('cine');

/* ---------- exposure: photographs develop as they arrive ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const img = e.target, go = () => img.classList.add('is-in');
  img.complete && img.naturalWidth ? go() : img.addEventListener('load', go, { once: true });
  io.unobserve(img);
}), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
$$('.ah-expose').forEach(img => (reduce ? img.classList.add('is-in') : io.observe(img)));

/* ---------- horizon links: the sun rises where the pointer enters ---------- */
$$('.ah-link').forEach(a => a.addEventListener('pointerenter', e => {
  const r = a.getBoundingClientRect();
  a.style.setProperty('--sun-x', `${((e.clientX - r.left) / r.width) * 100}%`);
}));

/* ---------- product plates: a soft patch of light follows the pointer ---------- */
$$('.plate__frame').forEach(f => f.addEventListener('pointermove', e => {
  const r = f.getBoundingClientRect();
  f.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
  f.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
}));

/* ---------- the album of cancelled stamps: one caption line, swapped gently ---------- */
{
  const cap = $('.album__caption'), nameEl = $('.album__name'), lineEl = $('.album__line');
  let timer = 0, current = null;
  const show = btn => {
    if (current === btn) return; current = btn;
    $$('.stampbtn').forEach(b => b.classList.toggle('is-active', b === btn));
    cap.classList.add('is-swap'); clearTimeout(timer);
    timer = setTimeout(() => { nameEl.textContent = btn.dataset.name; lineEl.textContent = btn.dataset.line; cap.classList.remove('is-swap'); }, reduce ? 0 : 180);
  };
  $$('.stampbtn').forEach(b => {
    b.addEventListener('pointerenter', () => show(b));
    b.addEventListener('focus', () => show(b));
    b.addEventListener('click', () => show(b));
  });
}

/* ---------- easter egg: peel the stamp off the back of the card ---------- */
{
  const stamp = $('.stamp'), secret = $('.secret'), copy = $('.secret__copy');
  stamp.tabIndex = 0;
  stamp.setAttribute('role', 'button');
  stamp.setAttribute('aria-label', 'Stamp. Drag it away, or press Delete, to peel it off.');
  let sx = 0, sy = 0, down = false;
  const peel = () => {
    stamp.classList.add('is-gone'); secret.removeAttribute('aria-hidden');
    setTimeout(() => copy.focus({ preventScroll: true }), reduce ? 0 : 400);
  };
  stamp.addEventListener('pointerdown', e => {
    e.stopPropagation(); down = true; sx = e.clientX; sy = e.clientY;
    stamp.setPointerCapture(e.pointerId); stamp.classList.add('is-peeling');
  });
  stamp.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - sx, dy = e.clientY - sy, d = Math.hypot(dx, dy);
    stamp.style.transform = `translate(${dx * .6}px,${dy * .6}px) rotate(${Math.min(d * .25, 28)}deg) scale(${1 + Math.min(d, 80) / 900})`;
  });
  const up = e => {
    if (!down) return; down = false; stamp.classList.remove('is-peeling');
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > 70) peel(); else stamp.style.transform = '';
  };
  stamp.addEventListener('pointerup', up);
  stamp.addEventListener('pointercancel', up);
  stamp.addEventListener('click', e => e.stopPropagation());
  stamp.addEventListener('keydown', e => { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); peel(); } });
  copy.addEventListener('click', async e => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText($('code', secret).textContent); copy.textContent = 'Copied'; }
    catch { getSelection().selectAllChildren($('code', secret)); copy.textContent = 'Selected'; }
    setTimeout(() => (copy.textContent = 'Copy'), 2200);
  });
}

/* ---------- live feed: the card is franked by whatever just happened ---------- */
{
  const el = $('.back__franked'), txt = $('.franked__text');
  const fmt = e => {
    const t = e.time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `Franked ${t} · ${e.label} · ${e.text}`;
  };
  const feed = createFeed();
  const [last] = feed.recent(1);
  if (last) txt.textContent = fmt(last);
  let lastAt = 0;
  feed.subscribe(e => {
    const now = performance.now();
    if (now - lastAt < 4000) return; lastAt = now;
    txt.textContent = fmt(e);
    el.classList.remove('is-new'); void el.offsetWidth; el.classList.add('is-new');
  });
}

/* ---------- the long take ---------- */
if (cine) {
  const hero = $('.hero'), stage = $('.stage'), front = $('.front'), back = $('.back');
  const shadow = $('.shadow'), turn = $('.turn');
  let W = 0, H = 0, g = null, sky = null, skyOn = false;
  let pc = +(new URLSearchParams(location.search).get('p') || 0), manual = 0, mcur = 0, raf = 0;

  const layout = () => {
    W = stage.clientWidth; H = stage.clientHeight;
    const portrait = W <= 700, aspect = portrait ? 2 / 3 : 3 / 2;
    const cw = portrait ? Math.min(W * .86, H * .68 * aspect) : Math.min(W * .56, 1180, H * .62 * aspect);
    const ch = cw / aspect, dy = -H * .03;
    const k = Math.max(cw / W, ch / H);
    g = { cw, ch, dy, k, ix: (W - cw / k) / 2, iy: (H - ch / k) / 2, bw: (portrait ? 9 : 13) / k, P: Math.max(1400, W * 1.4) };
    stage.style.setProperty('--cw', `${cw}px`); stage.style.setProperty('--ch', `${ch}px`);
    stage.style.setProperty('--cl', `${(W - cw) / 2}px`); stage.style.setProperty('--ct', `${(H - ch) / 2 + dy}px`);
  };

  const forced = new URLSearchParams(location.search).get('p'); // ?p=0..1 pins the take (for stills)
  const progress = () => {
    if (forced !== null) return clamp(+forced);
    const r = hero.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - H));
  };

  let shownBack = false;
  const frame = () => {
    const p = progress();
    pc += (p - pc) * .09;                       // about a second of smoothing: a camera on a rig
    mcur += (manual - mcur) * .075;
    if (Math.abs(p - pc) < .0004) pc = p;
    if (Math.abs(manual - mcur) < .05) mcur = manual;

    const e = ease(clamp((pc - .05) / .45));    // pull back
    const f = ease(clamp((pc - .56) / .28));    // turn over
    const a = f * 180 + mcur;
    const frac = (a % 180) / 180, lift = Math.sin(Math.PI * frac) * 70;
    const s = 1 + (g.k - 1) * e;

    front.style.setProperty('--ix', `${g.ix * e}px`);
    front.style.setProperty('--iy', `${g.iy * e}px`);
    front.style.setProperty('--bw', `${g.bw * e}px`);
    front.style.setProperty('--r', `${(3 / g.k) * e}px`);
    front.style.transform = `translateY(${g.dy * e}px) perspective(${g.P}px) translateZ(${lift}px) rotateY(${a}deg) scale(${s})`;
    back.style.transform = `perspective(${g.P}px) translateZ(${lift}px) rotateY(${a + 180}deg)`;
    const c = Math.abs(Math.cos(a * Math.PI / 180));
    shadow.style.opacity = clamp(e * 1.4 - .3);
    shadow.style.transform = `scaleX(${.12 + .88 * c}) scale(${1 + lift / 900})`;

    stage.style.setProperty('--e', e.toFixed(4));
    const t = clamp((e - .85) / .15);
    stage.style.setProperty('--t', t.toFixed(3));
    stage.classList.toggle('is-card', e > .98);
    turn.style.pointerEvents = t > .5 ? 'auto' : 'none';
    turn.tabIndex = t > .5 ? 0 : -1;
    const isBack = ((a % 360) + 360) % 360 > 90 && ((a % 360) + 360) % 360 < 270;
    if (isBack !== shownBack || !frame.once) {
      frame.once = true; shownBack = isBack; turn.setAttribute('aria-pressed', String(isBack));
      front.style.opacity = isBack ? 0 : 1; front.style.pointerEvents = isBack ? 'none' : '';
      back.style.opacity = isBack ? 1 : 0; back.style.pointerEvents = isBack ? 'auto' : 'none';
    }

    if (sky && skyOn) { sky.setHour(.6 + .32 * e); sky.setSun(.47, .70 + .07 * e); }

    raf = (pc !== p || mcur !== manual) ? requestAnimationFrame(frame) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  const flip = () => { manual = manual ? 0 : 180; kick(); };
  turn.addEventListener('click', flip);
  front.addEventListener('click', () => { if (stage.classList.contains('is-card')) flip(); });
  back.addEventListener('click', e => { if (!e.target.closest('a,button,.stamp,.secret') && stage.classList.contains('is-card')) flip(); });
  // keyboard users tabbing into the written side: bring it into view, face up
  back.addEventListener('focusin', () => {
    if (shownBack) return;
    if (pc < .9) { scrollTo(0, hero.offsetTop + (hero.offsetHeight - H) * .92); pc = .92; manual = 0; mcur = 0; }
    else flip();
    kick();
  });

  layout(); frame();
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { layout(); kick(); });

  /* after first paint: the live sky behind the transparent towers (wide screens only) */
  const upgrade = async () => {
    if (W <= 700) return;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const cut = new Image();
    cut.className = 'cutout'; cut.alt = ''; cut.decoding = 'async';
    cut.sizes = 'max(100vw, 178svh)';
    const avif = document.createElement('picture');
    avif.innerHTML = `<source type="image/avif" srcset="assets/extras/spires-cutout-1024.avif 1024w, assets/extras/spires-cutout-1600.avif 1600w, assets/extras/spires-cutout-2400.avif 2400w" sizes="max(100vw, 178svh)">`;
    cut.srcset = 'assets/extras/spires-cutout-1024.webp 1024w, assets/extras/spires-cutout-1600.webp 1600w, assets/extras/spires-cutout-2400.webp 2400w';
    cut.width = 1600; cut.height = 648;
    avif.appendChild(cut);
    const scene = $('.scene');
    scene.append(canvas, avif);
    try { await cut.decode(); } catch { return; }
    const { mountSky } = await import('../assets/interactive/amber-sky.js');
    sky = mountSky(canvas, { hour: .6, sun: [.47, .70] });
    // the baked plate and the live sky agree at the start; only after the cross-fade
    // does the sun begin to follow the camera, so two suns are never seen
    canvas.addEventListener('transitionend', () => { skyOn = true; kick(); }, { once: true });
    requestAnimationFrame(() => requestAnimationFrame(() => canvas.classList.add('is-on')));
  };
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 600));
  addEventListener('load', () => idle(upgrade, { timeout: 2000 }), { once: true });
}
