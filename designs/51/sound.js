// Sodium Orbit — sound. Off until the visitor turns it on. Everything is
// synthesised with the Web Audio API (no files): a lamp strike is a starter
// click, a buzzing neon flicker, then a warm 60 Hz-family hum that fades.
let ctx = null, master = null, on = false;

function ensure() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0.22;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp).connect(ctx.destination);
  return ctx;
}

function noiseBuffer(sec = 0.2) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  return b;
}

export const sound = {
  get on() { return on; },
  toggle() { on = !on; if (on) { ensure(); ctx.resume(); } return on; },

  // A sodium lamp striking: click, neon buzz (flickering), then a warm hum.
  strike(intensity = 1) {
    if (!on) return;
    const t = ctx.currentTime;
    const click = ctx.createBufferSource(); click.buffer = noiseBuffer(0.08);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
    const cg = ctx.createGain(); cg.gain.value = 0.5 * intensity;
    click.connect(hp).connect(cg).connect(master); click.start(t);

    const buzz = ctx.createOscillator(); buzz.type = 'sawtooth'; buzz.frequency.value = 120;
    const bf = ctx.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.setValueAtTime(1800, t); bf.frequency.exponentialRampToValueAtTime(420, t + 1.4); bf.Q.value = 3;
    const bg = ctx.createGain(); bg.gain.setValueAtTime(0, t);
    // flicker
    [0.02, 0.07, 0.1, 0.16, 0.22].forEach((o, i) => bg.gain.setValueAtTime(i % 2 ? 0.02 : 0.12 * intensity, t + o));
    bg.gain.linearRampToValueAtTime(0.05 * intensity, t + 0.6);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    buzz.connect(bf).connect(bg).connect(master); buzz.start(t); buzz.stop(t + 2.3);

    const hum = ctx.createOscillator(); hum.type = 'sine'; hum.frequency.setValueAtTime(220 * (0.9 + Math.random() * 0.2), t);
    const hg = ctx.createGain(); hg.gain.setValueAtTime(0, t); hg.gain.linearRampToValueAtTime(0.1 * intensity, t + 0.5); hg.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    hum.connect(hg).connect(master); hum.start(t); hum.stop(t + 2.7);
  },

  // All four lit: a soft open fifth that warms up.
  chord() {
    if (!on) return;
    const t = ctx.currentTime;
    [220, 330, 440, 660].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.4 + i * 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
      o.connect(g).connect(master); o.start(t + i * 0.08); o.stop(t + 3.5);
    });
  },

  // Feed events and UI: a tiny filtered tick.
  tick(pitch = 1) {
    if (!on) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(1600 * pitch, t); o.frequency.exponentialRampToValueAtTime(900 * pitch, t + 0.06);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.1);
  },

  // Easter egg: a meteor shower of descending glints.
  meteor() {
    if (!on) return;
    for (let k = 0; k < 14; k++) {
      const t = ctx.currentTime + k * 0.11;
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(2400 + Math.random() * 1200, t); o.frequency.exponentialRampToValueAtTime(300, t + 0.5);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.55);
    }
  },
};
