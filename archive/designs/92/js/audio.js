// Sound for design 92, synthesised with Web Audio. Off until the visitor turns it on.
// An engine that follows the speed, a sea-and-wind hush, a soft tick when lights
// switch, a door, a kerb scrape, a bump and a glass chime at the stops.
let ctx = null, master = null, on = false;
let eng = null, hush = null, lastTick = 0;

function init() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  // brown noise buffer, shared
  const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
  noiseBuf = buf;
  // sea hush
  const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
  const g = ctx.createGain(); g.gain.value = 0.16;
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 0.07; lfo.connect(lg).connect(g.gain); lfo.start();
  n.connect(lp).connect(g).connect(master); n.start();
  hush = { lp, g };
  // engine: two detuned saws and a sub through a lowpass
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; f.Q.value = 2;
  const eg = ctx.createGain(); eg.gain.value = 0;
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator();
  o1.type = 'sawtooth'; o2.type = 'sawtooth'; o3.type = 'sine';
  o2.detune.value = 9;
  for (const o of [o1, o2, o3]) { o.connect(f); o.start(); }
  f.connect(eg).connect(master);
  eng = { o1, o2, o3, f, eg };
}
let noiseBuf = null;

function burst({ t = 0, dur = 0.05, freq = 2400, q = 3, gain = 0.2, type = 'bandpass' } = {}) {
  if (!ctx || !on) return;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); const t0 = ctx.currentTime + t;
  g.gain.setValueAtTime(gain, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(g).connect(master); s.start(t0, Math.random() * 2); s.stop(t0 + dur + 0.05);
}
function tone(freq, { t = 0, dur = 1.6, gain = 0.06, type = 'sine' } = {}) {
  if (!ctx || !on) return;
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq;
  const t0 = ctx.currentTime + t;
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + 0.1);
}

export const audio = {
  get on() { return on; },
  enable(v) {
    on = v; if (v) init();
    if (!ctx) return;
    if (v && ctx.state === 'suspended') ctx.resume();
    master.gain.setTargetAtTime(v ? 0.8 : 0, ctx.currentTime, 0.2);
  },
  engine(speed01, throttle) {
    if (!eng || !on) return;
    const t = ctx.currentTime;
    // three loose "gears"
    const gearF = speed01 < 0.33 ? speed01 / 0.33 : speed01 < 0.66 ? (speed01 - 0.33) / 0.33 : (speed01 - 0.66) / 0.34;
    const base = 46 + gearF * 50 + speed01 * 26;
    eng.o1.frequency.setTargetAtTime(base, t, 0.08); eng.o2.frequency.setTargetAtTime(base * 1.5, t, 0.08); eng.o3.frequency.setTargetAtTime(base / 2, t, 0.08);
    eng.f.frequency.setTargetAtTime(240 + throttle * 520 + speed01 * 300, t, 0.1);
    eng.eg.gain.setTargetAtTime(speed01 > 0.001 || throttle ? 0.05 + throttle * 0.05 + speed01 * 0.04 : 0.035, t, 0.15);
    hush.lp.frequency.setTargetAtTime(520 + speed01 * 1400, t, 0.3);
  },
  idle() { if (eng && on) eng.eg.gain.setTargetAtTime(0, ctx.currentTime, 0.3); },
  tick(dist = 10, onOff = true) {
    if (!on || !ctx) return;
    const now = ctx.currentTime;
    if (now - lastTick < 0.07) return; lastTick = now;
    const g = Math.max(0.01, 0.12 / (1 + dist / 25));
    burst({ dur: 0.025, freq: onOff ? 3200 : 1900, q: 6, gain: g });
  },
  door() { burst({ dur: 0.18, freq: 180, q: 1.2, gain: 0.5, type: 'lowpass' }); burst({ t: 0.02, dur: 0.05, freq: 1400, q: 4, gain: 0.12 }); },
  scrape() { burst({ dur: 0.35, freq: 900, q: 0.8, gain: 0.12 }); },
  bump() { burst({ dur: 0.25, freq: 140, q: 1, gain: 0.7, type: 'lowpass' }); burst({ dur: 0.12, freq: 2600, q: 2, gain: 0.08 }); },
  whoosh() { burst({ dur: 2.4, freq: 500, q: 0.6, gain: 0.18 }); },
  horn() { for (const f of [392, 493.9]) tone(f, { gain: 0.035, dur: 0.42, type: 'square' }); },
  chord() { for (const [f, t] of [[659.3, 0], [830.6, 0.14], [987.8, 0.28], [1318.5, 0.42]]) tone(f, { t, gain: 0.04, dur: 2.8 }); },
  chime(k = 0.6) { for (const [f, t] of [[1318.5, 0], [1975.5, 0.09], [2637, 0.2]]) tone(f, { t, gain: 0.05 * k, dur: 2.2 }); },
};
