// Opt-in sound design, design 46. Every sound is synthesised live with Web Audio: no audio files, ~0 KB.
// Muted by default. Nothing makes a sound until the visitor presses the sound toggle (a user gesture).
//
//   import { sound } from './sound.js'
//   sound.toggle()          // or sound.enable() / sound.disable(); remembered per browser
//   sound.play('shutter' | 'focus' | 'squish' | 'slap' | 'tick')
//   sound.bindToggle(button) // wires aria-pressed + label

const KEY = 'albretsen46.sound';
let ctx = null, master = null, on = false;
try { on = localStorage.getItem(KEY) === 'on'; } catch { on = false; }

function ensure() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.32;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function noise(dur) {
  const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate); const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(); s.buffer = b; return s;
}
function env(g, t, a, peak, dcy) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy); }
function blip(freq, t, dur, type = 'sine', peak = 0.5, bendTo = null) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t);
  if (bendTo) o.frequency.exponentialRampToValueAtTime(bendTo, t + dur);
  env(g, t, 0.004, peak, dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function click(t, freq = 3200, q = 6, peak = 0.9, dur = 0.03) {
  const n = noise(dur + 0.02), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; env(g, t, 0.001, peak, dur);
  n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t + dur + 0.05);
}

const SOUNDS = {
  // mechanical-free "shutter": two soft plastic clicks (curtain open/close) + a puff of air
  shutter(t) { click(t, 2600, 4, 0.9, 0.025); click(t + 0.07, 1800, 3, 0.7, 0.04); blip(180, t, 0.08, 'sine', 0.25, 90);
    const n = noise(0.18), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'highpass'; f.frequency.value = 5000;
    env(g, t + 0.01, 0.005, 0.12, 0.16); n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t + 0.25); },
  // autofocus confirm: the classic double beep, pitched friendly
  focus(t) { blip(2093, t, 0.06, 'sine', 0.22); blip(2637, t + 0.09, 0.08, 'sine', 0.22); },
  // clay squish: a short downward boing with a soft wobble
  squish(t) { blip(520, t, 0.16, 'triangle', 0.35, 210); blip(260, t + 0.02, 0.12, 'sine', 0.2, 180); },
  // sticker slap: low thump + paper tick
  slap(t) { blip(140, t, 0.09, 'sine', 0.6, 60); click(t, 1200, 1.5, 0.35, 0.02); },
  // UI tick for toggles / sliders (aperture detents)
  tick(t) { click(t, 4200, 8, 0.4, 0.012); },
};

export const sound = {
  get enabled() { return on; },
  enable() { on = true; try { localStorage.setItem(KEY, 'on'); } catch {} ensure(); this.play('focus'); this._sync(); },
  disable() { on = false; try { localStorage.setItem(KEY, 'off'); } catch {} this._sync(); },
  toggle() { on ? this.disable() : this.enable(); },
  play(name) { if (!on || !SOUNDS[name]) return; ensure(); SOUNDS[name](ctx.currentTime + 0.005); },
  _btns: new Set(),
  bindToggle(btn) {
    this._btns.add(btn); btn.addEventListener('click', () => this.toggle()); this._sync();
  },
  _sync() { for (const b of this._btns) { b.setAttribute('aria-pressed', String(on)); b.dataset.on = on ? '1' : '0';
    const l = b.querySelector('[data-label]'); if (l) l.textContent = on ? 'sound on' : 'sound off'; } },
};
