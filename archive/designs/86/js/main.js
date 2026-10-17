// Albretsen AS / design 86 "Airglow" — page behaviour.
// First paint needs none of this. Heavy pieces (scrub frames, Lottie, three.js)
// load only when the visitor gets near them or asks for them.
import { magnetic, orbitScrub, plateau } from '../assets/motion.js';
import { createFeed } from '../../_shared/feed.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Copy the MCP line ------------------------------------------- */
$$('[data-copy]').forEach(btn => {
  const label = $('[data-label]', btn);
  btn.addEventListener('click', async () => {
    const text = $(btn.dataset.copy).textContent.trim();
    try { await navigator.clipboard.writeText(text); } catch {
      const r = document.createRange(); r.selectNodeContents($(btn.dataset.copy));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    btn.classList.add('is-done'); label.textContent = 'Copied';
    setTimeout(() => { btn.classList.remove('is-done'); label.textContent = 'Copy'; }, 1800);
  });
});

/* ---------- Live pulse in the header ----------------------------------- */
const pulse = $('#pulse-text');
const feed = createFeed();
const fmt = e => {
  const tail = e.ms ? `${e.ms} ms` : e.country || e.city || (e.kb ? `${e.kb} KB` : '');
  return [e.label, e.text, tail].filter(Boolean).join(' · ');
};
let pulseTimer = 0;
function showEvent(e) {
  if (reduce) { pulse.textContent = fmt(e); return; }
  clearTimeout(pulseTimer);
  pulse.classList.add('is-out');
  pulseTimer = setTimeout(() => { pulse.textContent = fmt(e); pulse.classList.remove('is-out'); }, 380);
}
const first = feed.recent(1)[0];
if (first) pulse.textContent = fmt(first);
feed.subscribe(showEvent);

/* ---------- Lottie (lottie-web 5.12.2, light build), loaded on demand ---- */
let lottieP;
function lottie() {
  return lottieP ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js';
    s.async = true; s.onload = () => res(window.lottie); s.onerror = rej;
    document.head.appendChild(s);
  });
}

/* ---------- The roster: character select, scrubbed by scroll ------------ */
const section = $('#products');
const cast = $$('.pc', section);
const index = $$('.roster__index button', section);
const bar = $('.roster__progress', section);
const N = cast.length;
let progress = 0, active = -1, live = null, pulses = [];

function update(t) {
  progress = t;
  const x = plateau(t, N);
  const k = Math.round(x);
  cast.forEach((el, i) => {
    const o = Math.max(0, Math.min(1, 1 - Math.abs(x - i) * 2.4));
    el.style.setProperty('--o', o.toFixed(3));
  });
  if (k !== active) {
    active = k;
    cast.forEach((el, i) => { el.classList.toggle('is-on', i === k); el.inert = i !== k; });
    index.forEach((b, i) => b.setAttribute('aria-current', i === k ? 'true' : 'false'));
    pulses.forEach((a, i) => { if (!a) return; if (i === k) a.goToAndPlay(0, true); else a.stop(); });
  }
  bar?.style.setProperty('--p', t.toFixed(3));
  live?.setProgress(t);
}

function progressNow() {
  const r = section.getBoundingClientRect();
  return Math.min(Math.max(-r.top / (r.height - innerHeight), 0), 1);
}
function scrollToProduct(k) {
  const top = section.getBoundingClientRect().top + scrollY;
  const y = top + (k / (N - 1)) * (section.offsetHeight - innerHeight);
  scrollTo({ top: Math.round(y), behavior: reduce ? 'auto' : 'smooth' });
}

// Overlay follows scroll from the start, so the text is right even before frames arrive.
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { ticking = false; update(progressNow()); });
}, { passive: true });
update(progressNow());

// Deep links: #mcp-emails, #fun-libs, #toolrails, #harbor open the ring on that product.
const ids = cast.map(el => el.dataset.id);
function fromHash(behavior) {
  const k = ids.indexOf(location.hash.slice(1));
  if (k < 0) return;
  const top = section.getBoundingClientRect().top + scrollY;
  scrollTo({ top: Math.round(top + (k / (N - 1)) * (section.offsetHeight - innerHeight)), behavior });
}
fromHash('auto');
addEventListener('hashchange', () => fromHash(reduce ? 'auto' : 'smooth'));

index.forEach((b, i) => {
  b.addEventListener('click', () => { scrollToProduct(i); history.replaceState(null, '', '#' + ids[i]); });
  b.addEventListener('keydown', e => {
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const j = (i + d + N) % N;
    index[j].focus(); scrollToProduct(j);
  });
});

// Frames, Lottie and the poster start loading one screen before the section.
const near = new IntersectionObserver(entries => {
  if (!entries.some(e => e.isIntersecting)) return;
  near.disconnect();
  orbitScrub(section, { onProgress: update });
  if (!reduce) lottie().then(L => {
    pulses = $$('.ix__lottie', section).map((el, i) => {
      const a = L.loadAnimation({ container: el, renderer: 'svg', loop: true, autoplay: false, path: 'assets/lottie/select-pulse.json' });
      a.addEventListener('DOMLoaded', () => { if (i === active) a.play(); });
      return a;
    });
  }).catch(() => {});
}, { rootMargin: '100% 0px' });
near.observe(section);

/* ---------- Live 3D: the same scene the frames were baked from ---------- */
const liveBtn = $('.roster__live-btn', section);
const liveCanvas = $('.roster__live', section);
const flatCanvas = $('.roster__canvas', section);
let roster = null;
liveBtn.addEventListener('click', async () => {
  const on = liveBtn.getAttribute('aria-pressed') !== 'true';
  if (on && !roster) {
    liveBtn.setAttribute('aria-busy', 'true');
    try {
      liveCanvas.hidden = false;
      const { createRoster } = await import('../assets/roster/roster.js');
      roster = await createRoster(liveCanvas, { base: '../_shared/products/' });
      liveCanvas.addEventListener('roster:select', e => scrollToProduct(e.detail.index));
    } catch (err) {
      liveCanvas.hidden = true; liveBtn.removeAttribute('aria-busy');
      return;
    }
    liveBtn.removeAttribute('aria-busy');
  }
  liveBtn.setAttribute('aria-pressed', String(on));
  liveCanvas.hidden = !on; flatCanvas.style.visibility = on ? 'hidden' : '';
  if (on) { live = roster; roster.resize(); roster.setProgress(progress); if (!reduce) roster.start(); }
  else { roster.stop(); live = null; }
});

/* ---------- Earlier work: the limb draws itself once ------------------- */
const limbBox = $('.earlier__lottie');
const limbIo = new IntersectionObserver(entries => {
  if (!entries.some(e => e.isIntersecting)) return;
  limbIo.disconnect();
  lottie().then(L => {
    const a = L.loadAnimation({ container: limbBox, renderer: 'svg', loop: false, autoplay: !reduce, path: 'assets/lottie/limb-draw.json' });
    if (reduce) a.addEventListener('DOMLoaded', () => a.goToAndStop(a.totalFrames - 1, true));
  }).catch(() => {});
}, { rootMargin: '0px 0px -15% 0px' });
limbIo.observe(limbBox);

/* ---------- Magnetic pull on every button and link that asks for it ----- */
magnetic();
