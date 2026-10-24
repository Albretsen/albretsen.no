// Synthesised sound for Lamplighter. Silent until the visitor turns it on.
// Ignition: a soft gas "whoomp" plus a glass chime that climbs a pentatonic scale
// as a district fills. Windows: tiny ticks. A district: a warm chord. The finale: a bell.

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

export function createAudio() {
  let ctx = null, master = null, amb = null, on = false, cricketTimer = 0;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    // ambience: brown noise through a lowpass, like a far sea
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    amb = ctx.createGain(); amb.gain.value = 0.16;
    src.connect(lp).connect(amb).connect(master); src.start();
    amb._lp = lp;
    return ctx;
  }

  function env(g, t, a, peak, dcy) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy);
  }

  function chime(semi, { gain = 0.16, base = 784, t0 = 0, decay = 1.8 } = {}) {
    if (!on || !ctx) return;
    const t = ctx.currentTime + t0;
    const f = base * Math.pow(2, semi / 12);
    for (const [mul, g] of [[1, 1], [2.76, 0.32], [5.4, 0.12]]) {
      const o = ctx.createOscillator(), e = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * mul;
      env(e, t, 0.006, gain * g, decay / mul ** 0.4);
      o.connect(e).connect(master); o.start(t); o.stop(t + decay + 0.1);
    }
  }

  function whoomp(t0 = 0) {
    if (!on || !ctx) return;
    const t = ctx.currentTime + t0;
    const len = Math.floor(ctx.sampleRate * 0.5), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(220, t); bp.frequency.exponentialRampToValueAtTime(1100, t + 0.18);
    const g = ctx.createGain(); env(g, t, 0.03, 0.32, 0.45);
    s.connect(bp).connect(g).connect(master); s.start(t);
  }

  function tick(t0 = 0) {
    if (!on || !ctx) return;
    const t = ctx.currentTime + t0;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = 2400 + Math.random() * 900;
    env(g, t, 0.002, 0.025, 0.05);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.1);
  }

  function cricket() {
    if (!on || !ctx) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 4300 + Math.random() * 300;
      env(g, t + i * 0.07, 0.004, 0.012, 0.04);
      o.connect(g).connect(master); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.08);
    }
  }

  return {
    get on() { return on; },
    async set(v) {
      on = v;
      if (v) { if (!ensure()) return; await ctx.resume(); master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4); }
      else if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    },
    ignite(step = 0) { whoomp(); chime(PENTA[step % PENTA.length], { t0: 0.05 }); },
    window(t0 = 0) { tick(t0); },
    district(step = 0) {
      [0, 4, 7, 12].forEach((s, i) => chime(s + (step % 3) * 2, { base: 392, gain: 0.1, t0: i * 0.09, decay: 2.6 }));
    },
    bell() {
      chime(-12, { base: 523, gain: 0.22, decay: 5 });
      chime(-5, { base: 523, gain: 0.09, decay: 4, t0: 0.02 });
      chime(0, { base: 523, gain: 0.06, decay: 3.5, t0: 0.04 });
    },
    /** Called every frame with the night amount, keeps the ambience in step with the sky. */
    update(dt, night) {
      if (!ctx || !on) return;
      amb._lp.frequency.setTargetAtTime(520 - night * 260, ctx.currentTime, 0.5);
      cricketTimer -= dt;
      if (night > 0.45 && cricketTimer <= 0) { cricketTimer = 0.9 + Math.random() * 2.4; cricket(); }
    },
  };
}
