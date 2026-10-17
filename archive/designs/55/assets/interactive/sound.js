// Plate Nocturne: opt-in sound. Everything is synthesised with Web Audio, no audio files.
// Off by default. Nothing is created until the visitor turns sound on with a click.
//
//   import { sound, bindSoundToggle } from './sound.js'
//   bindSoundToggle(document.querySelector('[data-sound-toggle]'))
//   sound.tink()   // glass touched: a pane picked up, a card hovered
//   sound.spark()  // a discharge: the hero bolt, a primary click
//   sound.slide()  // a pane moving over another: section change
//
// Voices
//   tink  - four inharmonic sine partials (1, 2.76, 5.40, 8.93 x f0), like a struck glass plate. 20-60 ms attack-free decay.
//   spark - band-passed white noise swept 6k -> 900 Hz plus a few random crackle impulses. ~280 ms.
//   slide - very soft filtered noise "breath" of one pane sliding on another. ~400 ms.
//   hum   - the nocturne: two detuned low sines (55 / 82.6 Hz) under a 300 Hz low-pass, LFO-breathing at -38 dB. Only while sound is on.

const KEY = 'albretsen.sound';
let ctx = null, master = null, humNodes = null, enabled = false;
const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function store(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} }
function stored() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.55;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 3;
  master.connect(comp).connect(ctx.destination);
  return ctx;
}

function noiseBuffer(seconds) {
  const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function tink(pitch = 1) {
  if (!enabled || !ensure()) return;
  const t = ctx.currentTime;
  const f0 = (1650 + Math.random() * 180) * pitch;
  [[1, 0.22, 0.9], [2.76, 0.12, 0.45], [5.4, 0.06, 0.22], [8.93, 0.03, 0.12]].forEach(([r, g, dec]) => {
    const o = ctx.createOscillator(), a = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f0 * r;
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + 0.004);
    a.gain.exponentialRampToValueAtTime(0.0001, t + dec * 0.5);
    o.connect(a).connect(master); o.start(t); o.stop(t + dec);
  });
}

function spark() {
  if (!enabled || !ensure()) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.4);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(6000, t); bp.frequency.exponentialRampToValueAtTime(900, t + 0.28);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  src.connect(bp).connect(g).connect(master); src.start(t); src.stop(t + 0.4);
  // crackle: a handful of tiny clicks
  for (let i = 0; i < 6; i++) {
    const ct = t + Math.random() * 0.22;
    const c = ctx.createBufferSource(); c.buffer = noiseBuffer(0.012);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
    const cg = ctx.createGain(); cg.gain.value = 0.18 * Math.random();
    c.connect(hp).connect(cg).connect(master); c.start(ct);
  }
}

function slide() {
  if (!enabled || !ensure()) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.5);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
  lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1800, t + 0.2); lp.frequency.linearRampToValueAtTime(400, t + 0.45);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 0.12); g.gain.linearRampToValueAtTime(0.0001, t + 0.45);
  src.connect(lp).connect(g).connect(master); src.start(t); src.stop(t + 0.5);
}

function hum(on) {
  if (!ensure()) return;
  const t = ctx.currentTime;
  if (on && !humNodes && !reduce) {
    const out = ctx.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.012, t + 2.5);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 0.07; lfoG.gain.value = 0.006; lfo.connect(lfoG).connect(out.gain);
    const oscs = [55, 82.6, 110.4].map((f, i) => { const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.connect(lp); o.start(); return o; });
    lp.connect(out).connect(master); lfo.start();
    humNodes = { out, oscs, lfo };
  } else if (!on && humNodes) {
    const n = humNodes; humNodes = null;
    n.out.gain.cancelScheduledValues(t); n.out.gain.setValueAtTime(n.out.gain.value, t);
    n.out.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    setTimeout(() => { n.oscs.forEach(o => o.stop()); n.lfo.stop(); }, 900);
  }
}

function setEnabled(v) {
  enabled = !!v; store(enabled);
  if (enabled) { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); hum(true); tink(1.2); }
  else hum(false);
  document.documentElement.dataset.sound = enabled ? 'on' : 'off';
}

export const sound = { tink, spark, slide, setEnabled, get enabled() { return enabled; } };

// Wire a button. Shows the previous choice but never starts audio before a click (autoplay rules).
export function bindSoundToggle(btn) {
  if (!btn) return;
  const remembered = stored();
  const render = () => { btn.setAttribute('aria-pressed', String(enabled)); btn.dataset.state = enabled ? 'on' : 'off';
    const l = btn.querySelector('[data-label]'); if (l) l.textContent = enabled ? 'Sound on' : (remembered && !enabled ? 'Sound (tap to resume)' : 'Sound off'); };
  btn.addEventListener('click', () => { setEnabled(!enabled); render(); });
  render();
}
