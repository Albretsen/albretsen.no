// Kiln Light — opt-in sound design. Off by default; nothing is created until
// the visitor turns it on (and the choice is remembered). All sounds are
// synthesised with Web Audio — no files — and tuned to one family:
// fired clay and glass, fundamental A5 (880 Hz), soft attack, short tails.
//
//   import { sound } from './sound.js'
//   sound.toggle()           // from a button with aria-pressed
//   sound.play('tok')        // tok | ting | glide | thum | crackle
//   sound.bind(document)     // auto: [data-sound="tok"] on pointerenter/click

const KEY = 'kiln-sound';
let ctx = null, master = null;
let on = false;
try { on = localStorage.getItem(KEY) === 'on'; } catch {}

function ensure() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0.22;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18;
  // a tiny room: feedback delay as a cheap, warm reverb
  const d = ctx.createDelay(); d.delayTime.value = 0.083; const fb = ctx.createGain(); fb.gain.value = 0.28;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
  master.connect(comp); master.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(comp);
  comp.connect(ctx.destination);
  return ctx;
}

function partial(f, t0, dur, gain, type = 'sine') {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  return o;
}
function noise(t0, dur, gain, freq, q = 1.2) {
  const len = Math.ceil(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const s = ctx.createBufferSource(); s.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
  const g = ctx.createGain(); g.gain.value = gain;
  s.connect(bp); bp.connect(g); g.connect(master); s.start(t0);
}

const SOUNDS = {
  // hover / small press: a fingertip on a glazed tile
  tok: t => { partial(880, t, 0.09, 0.35); partial(1760 * 1.01, t, 0.05, 0.08); noise(t, 0.03, 0.25, 3200, 2); },
  // open (dialog, accordion): a glass sphere touched with a spoon
  ting: t => { partial(1318.5, t, 1.2, 0.18); partial(1318.5 * 2.76, t, 0.5, 0.05); partial(880, t + 0.01, 0.8, 0.08); },
  // tab change: two notes, a fifth apart
  glide: t => { partial(880, t, 0.16, 0.18, 'triangle'); partial(1318.5, t + 0.07, 0.22, 0.14, 'triangle'); },
  // close: low clay thump
  thum: t => { const o = partial(220, t, 0.22, 0.4); o.frequency.exponentialRampToValueAtTime(140, t + 0.18); noise(t, 0.05, 0.2, 500, 0.8); },
  // the molten seam (scroll reaches dusk): soft embers
  crackle: t => { for (let i = 0; i < 9; i++) noise(t + Math.random() * 0.9, 0.02 + Math.random() * 0.03, 0.12 + Math.random() * 0.1, 1800 + Math.random() * 3000, 3); },
};

const listeners = new Set();
export const sound = {
  get on() { return on; },
  toggle(force) {
    on = force ?? !on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
    if (on) { ensure(); ctx.resume(); this.play('ting'); }
    listeners.forEach(f => f(on));
    return on;
  },
  onChange(f) { listeners.add(f); f(on); return () => listeners.delete(f); },
  play(name) {
    if (!on) return;
    ensure(); if (ctx.state === 'suspended') ctx.resume();
    SOUNDS[name]?.(ctx.currentTime + 0.005);
  },
  bind(root = document) {
    let last = 0;
    root.addEventListener('pointerover', e => {
      const el = e.target.closest?.('[data-sound-hover]'); if (!el || el.contains(e.relatedTarget)) return;
      const now = performance.now(); if (now - last < 70) return; last = now; this.play(el.dataset.soundHover || 'tok');
    });
    root.addEventListener('click', e => { const el = e.target.closest?.('[data-sound]'); if (el) this.play(el.dataset.sound); });
  },
};
