// Synthesised sound, off until the visitor turns it on. No samples.
// A low evening hush, a wooden "thunk + pop" when a building rises, a light-switch click,
// a soft tick per year and a glass chime when a product opens.
export function createSound() {
  let ctx = null, master = null, hush = null, hushGain = null, on = false;
  const ensure = () => {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    // brown noise hush
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    hush = ctx.createBufferSource(); hush.buffer = buf; hush.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    hushGain = ctx.createGain(); hushGain.gain.value = 0.28;
    hush.connect(lp).connect(hushGain).connect(master); hush.start();
  };
  const env = (g, t, a, peak, decay) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay); };
  const tone = (type, f, t, peak, decay, f2) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + decay);
    env(g, t, 0.004, peak, decay); o.connect(g).connect(master); o.start(t); o.stop(t + decay + 0.05);
  };
  const noise = (t, peak, decay, freq) => {
    const n = ctx.createBufferSource(), b = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
    const g = ctx.createGain(); env(g, t, 0.003, peak, decay); n.connect(f).connect(g).connect(master); n.start(t); n.stop(t + 0.3);
  };
  const PENTA = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3];
  let lastBuild = 0;
  return {
    get on() { return on; },
    toggle() {
      ensure(); on = !on;
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(on ? 0.8 : 0, ctx.currentTime, 0.25);
      return on;
    },
    build(row = 0) {
      if (!on) return; const t = ctx.currentTime;
      if (t - lastBuild < 0.06) return; lastBuild = t;
      tone('sine', 120, t, 0.35, 0.22, 60);
      noise(t, 0.12, 0.12, 900);
      tone('triangle', PENTA[(row * 2 + Math.floor(Math.random() * 3)) % PENTA.length] * 2, t + 0.07, 0.09, 0.5);
    },
    click(onState) { if (!on) return; const t = ctx.currentTime; noise(t, 0.2, 0.025, onState ? 3200 : 2200); tone('square', onState ? 1800 : 1300, t, 0.03, 0.02); },
    tick() { if (!on) return; const t = ctx.currentTime; tone('sine', 1400, t, 0.03, 0.05); },
    chime() { if (!on) return; const t = ctx.currentTime; [784, 1175, 1568].forEach((f, i) => tone('sine', f, t + i * 0.05, 0.08 / (i + 1), 1.4)); },
    evening(night) { if (hushGain && on) hushGain.gain.setTargetAtTime(0.18 + 0.16 * night, ctx.currentTime, 0.5); },
  };
}
