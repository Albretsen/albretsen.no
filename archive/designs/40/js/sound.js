// Specimen Atlas — sound. Off until the visitor turns it on.
// Everything is synthesised: paper (filtered noise), brass (two damped partials).
let ctx = null, on = false;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function noise(c, dur, freq, q, gain) {
  const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.2);
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = gain;
  src.connect(f).connect(g).connect(c.destination); src.start();
}
function bell(c, freq, dur, gain) {
  const t = c.currentTime;
  [[1, 1], [2.76, .35], [5.4, .12]].forEach(([m, a]) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = freq * m;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur / m);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur);
  });
}
const SOUNDS = {
  tick: c => bell(c, 1760, .18, .05),
  paper: c => noise(c, .16, 2600, .8, .35),
  flip: c => noise(c, .09, 4200, 1.2, .22),
  lift: c => noise(c, .05, 1400, 1.5, .18),
  set: c => { noise(c, .06, 900, 2, .2); },
  focus: c => { bell(c, 880, .9, .04); setTimeout(() => bell(c, 1318.5, .9, .03), 90); },
};
export const sound = {
  enable(v) { on = v; if (v) ac(); },
  play(name) { if (!on) return; try { SOUNDS[name] && SOUNDS[name](ac()); } catch { /* audio is a nicety */ } },
};
