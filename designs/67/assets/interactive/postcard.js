// Postcard behaviour for .ah-postcard (markup: see preview.html / postcard-demo.html).
//   import { enhancePostcard } from './postcard.js'; enhancePostcard(document.querySelector('.ah-postcard'))
// - click / Enter / Space flips the card (aria-pressed tracks the side shown)
// - pointer tilt (desktop, fine pointers only)
// - EASTER EGG: on the back, drag the stamp away (or focus it and press Delete) to peel it off.
//   Underneath, in microtype, is the one-line install for Asgeir's MCP server.
export function enhancePostcard(card) {
  const fine = matchMedia('(pointer:fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-pressed', 'false');
  const flip = () => {
    const on = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(on));
  };
  card.addEventListener('click', e => { if (!e.target.closest('.ah-postcard__stamp,.ah-postcard__secret')) flip(); });
  card.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); flip(); } });

  if (fine && !reduce) {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.classList.add('is-tilting');
      card.style.setProperty('--ry', `${x * 10}deg`); card.style.setProperty('--rx', `${-y * 8}deg`); card.style.setProperty('--lift', '18px');
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      ['--rx', '--ry', '--lift'].forEach(p => card.style.removeProperty(p));
    });
  }

  // --- the peelable stamp ---
  const stamp = card.querySelector('.ah-postcard__stamp');
  const secret = card.querySelector('.ah-postcard__secret');
  if (!stamp) return;
  stamp.tabIndex = 0; stamp.setAttribute('aria-label', 'Stamp. Drag it, or press Delete, to peel it off.');
  let sx = 0, sy = 0, down = false;
  const peelOff = () => {
    stamp.classList.add('is-gone'); secret?.removeAttribute('aria-hidden');
    secret?.querySelector('button')?.focus({ preventScroll: true });
  };
  stamp.addEventListener('pointerdown', e => { e.stopPropagation(); down = true; sx = e.clientX; sy = e.clientY; stamp.setPointerCapture(e.pointerId); stamp.classList.add('is-peeling'); });
  stamp.addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - sx, dy = e.clientY - sy, d = Math.hypot(dx, dy);
    // peel from the top-left corner: the stamp lifts, rotates and follows the finger
    stamp.style.transform = `translate(${dx * .6}px,${dy * .6}px) rotate(${Math.min(d * .25, 28)}deg) scale(${1 + Math.min(d, 80) / 900})`;
  });
  const up = e => {
    if (!down) return; down = false; stamp.classList.remove('is-peeling');
    const d = Math.hypot(e.clientX - sx, e.clientY - sy);
    if (d > 70) peelOff(); else stamp.style.transform = '';
  };
  stamp.addEventListener('pointerup', up); stamp.addEventListener('pointercancel', up);
  stamp.addEventListener('click', e => e.stopPropagation());
  stamp.addEventListener('keydown', e => { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); peelOff(); } });
  secret?.querySelector('button')?.addEventListener('click', async e => {
    e.stopPropagation();
    const cmd = secret.querySelector('code').textContent;
    try { await navigator.clipboard.writeText(cmd); e.target.textContent = 'Copied'; } catch { e.target.textContent = 'Select & copy'; }
  });
}
