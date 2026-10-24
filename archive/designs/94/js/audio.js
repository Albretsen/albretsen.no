// Evening post: sound, synthesised with Web Audio. Silent until the visitor turns it on.
// Air over paper, a glass chime per letter (a pentatonic run that climbs with the combo),
// a soft shimmer through each ring, a rubber-stamp thud for a product, a chord at the end.
export function createAudio() {
  let ctx = null, master = null, wind = null, windGain = null, windFilter = null, on = false;
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.0; master.connect(ctx.destination);
    // brown-ish noise for the air
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    wind = ctx.createBufferSource(); wind.buffer = buf; wind.loop = true;
    windFilter = ctx.createBiquadFilter(); windFilter.type = 'bandpass'; windFilter.frequency.value = 500; windFilter.Q.value = 0.7;
    windGain = ctx.createGain(); windGain.gain.value = 0.0;
    wind.connect(windFilter).connect(windGain).connect(master);
    wind.start();
  }
  function tone(freq, t0, dur, gain, type = 'sine', dest = master) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(dest); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function bell(midi, t0, gain = 0.12) {
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    tone(f, t0, 1.6, gain); tone(f * 2.76, t0, 0.7, gain * 0.35); tone(f * 5.4, t0, 0.3, gain * 0.12);
  }
  const api = {
    get on() { return on; },
    async toggle(v = !on) {
      init(); on = v;
      if (ctx.state === 'suspended') await ctx.resume();
      master.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.15);
      return on;
    },
    flight(speed, active) {
      if (!ctx || !on) return;
      const k = active ? Math.min(1, Math.max(0, (speed - 8) / 16)) : 0;
      windGain.gain.setTargetAtTime(0.05 + 0.16 * k * (active ? 1 : 0), ctx.currentTime, 0.2);
      windFilter.frequency.setTargetAtTime(320 + 900 * k, ctx.currentTime, 0.2);
    },
    chime(n) { if (!ctx || !on) return; const t = ctx.currentTime; bell(76 + PENTA[(n - 1) % PENTA.length], t, 0.11); },
    ring(combo) { if (!ctx || !on) return; const t = ctx.currentTime; const m = 64 + PENTA[Math.min(combo, PENTA.length - 1)]; tone(440 * Math.pow(2, (m - 69) / 12), t, 0.5, 0.05, 'triangle'); tone(440 * Math.pow(2, (m + 7 - 69) / 12), t + 0.04, 0.5, 0.03, 'sine'); },
    whoosh() {
      if (!ctx || !on) return;
      const t = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = wind.buffer;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(3000, t + 0.35);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.05); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      src.connect(f).connect(g).connect(master); src.start(t, Math.random()); src.stop(t + 0.45);
    },
    stamp() { if (!ctx || !on) return; const t = ctx.currentTime; tone(90, t, 0.18, 0.4, 'sine'); tone(180, t, 0.08, 0.15, 'square'); [64, 68, 71, 76].forEach((m, i) => bell(m, t + 0.12 + i * 0.07, 0.07)); },
    bump() { if (!ctx || !on) return; const t = ctx.currentTime; tone(140, t, 0.12, 0.12, 'triangle'); },
    finale() { if (!ctx || !on) return; const t = ctx.currentTime; [52, 59, 64, 68, 71, 76].forEach((m, i) => bell(m, t + i * 0.11, 0.08)); },
  };
  return api;
}
