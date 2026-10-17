// Albretsen AS · design 77 "Shutterlight" · motion helpers (no dependencies).
// Pairs with motion.css. Each function is optional and safe to call once.
//
//   import { dayPass, dolly, postcards, sway, tileLay } from './motion.js';
//   dayPass(); dolly(); postcards(); sway(); tileLay();

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasScrollTimeline = CSS.supports('animation-timeline: scroll()');

// 1. DAY PASS — scroll position becomes time of day (0..1) in the --day custom property.
//    Native scroll timelines do it in CSS; this is the fallback, and also emits an event
//    so the WebGL daylight window (interactive/daylight.js) can follow the same clock.
export function dayPass({ target = document.documentElement, onChange } = {}){
  let raf = 0;
  const read = () => {
    raf = 0;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const day = Math.min(1, Math.max(0, scrollY / max));
    if (!hasScrollTimeline) target.style.setProperty('--day', day.toFixed(4));
    onChange && onChange(day);
  };
  addEventListener('scroll', () => { raf ||= requestAnimationFrame(read); }, { passive:true });
  read();
}

// 2. DOLLY — JS fallback for the layered parallax where view() timelines are missing.
export function dolly(selector = '.dolly'){
  if (reduce() || CSS.supports('animation-timeline: view()')) return;
  const scenes = [...document.querySelectorAll(selector)];
  const speeds = { dolly__far: [6, .02], dolly__mid: [-2, .10], dolly__near: [-9, .22] };
  let raf = 0;
  const tick = () => {
    raf = 0;
    for (const s of scenes){
      const r = s.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));   // 0 when the scene top meets the viewport top
      for (const el of s.children){
        const k = Object.keys(speeds).find(c => el.classList.contains(c)); if (!k) continue;
        const [ty, sc] = speeds[k];
        el.style.transform = `translateY(${(ty * p).toFixed(2)}%) scale(${(1 + sc * p).toFixed(4)})`;
      }
    }
  };
  addEventListener('scroll', () => { raf ||= requestAnimationFrame(tick); }, { passive:true });
  tick();
}

// 3. POSTCARD FLIP — click, Enter or Space turns the card over.
export function postcards(selector = '.postcard'){
  for (const card of document.querySelectorAll(selector)){
    card.setAttribute('aria-pressed', 'false');
    card.addEventListener('click', () => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(flipped));
      if (!reduce()){
        card.classList.remove('is-flipping'); void card.offsetWidth; card.classList.add('is-flipping');
        setTimeout(() => card.classList.remove('is-flipping'), 950);
      }
    });
  }
}

// 5. SIGN SWAY — a tap or keyboard focus sets the sign swinging (hover is pure CSS).
export function sway(selector = '.sway'){
  for (const el of document.querySelectorAll(selector)){
    const go = () => { el.classList.remove('is-swaying'); void el.offsetWidth; el.classList.add('is-swaying'); };
    el.addEventListener('pointerdown', go); el.addEventListener('focusin', go);
    el.addEventListener('animationend', () => el.classList.remove('is-swaying'));
  }
}

// 6. TILE LAY — tiles are laid from the centre outward when the row enters view.
export function tileLay(selector = '.tilelay'){
  const rows = document.querySelectorAll(selector);
  for (const row of rows){
    const tiles = [...row.querySelectorAll('.tilelay__tile')];
    const mid = (tiles.length - 1) / 2;
    tiles.forEach((t, i) => t.style.setProperty('--i', Math.abs(i - mid).toFixed(1)));
  }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: .35 });
  rows.forEach(r => io.observe(r));
}
