// Opt-in sound for Heure Bleue: a low sea-air hush and one glass chime when the
// sun meets the horizon (and when the ticket is postmarked). Silent until enabled.
let ctx = null, master = null, sea = null, enabled = false;

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);

  // Brown noise, low-passed, breathing slowly: distant water, not a recording.
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
  const g = ctx.createGain(); g.gain.value = 0.05;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.09;
  const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 0.025;
  lfo.connect(lfoAmt).connect(g.gain);
  src.connect(lp).connect(g).connect(master);
  src.start(); lfo.start();
  sea = g;
}

export const sound = {
  get on() { return enabled; },
  enable(on) {
    enabled = on;
    if (on && !ctx) build();
    if (!ctx) return;
    if (on) ctx.resume();
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setTargetAtTime(on ? 1 : 0, t, on ? 0.8 : 0.25);
    if (on) this.chime(0.5);
  },
  chime(level = 1) {
    if (!enabled || !ctx) return;
    const t = ctx.currentTime + 0.02;
    [[1318.5, 1], [1975.5, 0.45], [2637, 0.18]].forEach(([f, a], i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t + i * 0.012);
      g.gain.linearRampToValueAtTime(0.06 * a * level, t + i * 0.012 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.connect(g).connect(master); o.start(t); o.stop(t + 2.5);
    });
  },
  /** Brighten the hush a little as the sun climbs (0..1). */
  daylight(k) { if (sea && ctx) sea.gain.setTargetAtTime(0.04 + 0.03 * k, ctx.currentTime, 0.4); },
};
