// Living Town sound: nature recipes (sea, wind, birds, insects, water, night).
// All synthesised from seeded noise and oscillators. Loops are periodic by
// construction: events wrap round the loop, slow envelopes use whole cycles,
// and filters run twice round the buffer, so there is no seam to hide.

const TAU = Math.PI * 2;

// Small seeded PRNG (mulberry32)
function rng(seed) {
  let s = (seed * 2654435761) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Biquad (RBJ). State lives on an object (much faster than closure variables).
class Biquad {
  constructor(sr) { this.sr = sr; this.b0 = 1; this.b1 = this.b2 = this.a1 = this.a2 = this.x1 = this.x2 = this.y1 = this.y2 = 0; }
  set(type, fc, q = 0.707) {
    const w = TAU * Math.min(fc, this.sr * 0.45) / this.sr, c = Math.cos(w), al = Math.sin(w) / (2 * q), n = 1 + al;
    if (type === 'lp') { this.b0 = this.b2 = (1 - c) / 2 / n; this.b1 = (1 - c) / n; }
    else if (type === 'hp') { this.b0 = this.b2 = (1 + c) / 2 / n; this.b1 = -(1 + c) / n; }
    else { this.b0 = al / n; this.b1 = 0; this.b2 = -this.b0; } // band-pass, 0 dB peak
    this.a1 = -2 * c / n; this.a2 = (1 - al) / n;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}
// f(x) runs a sample, f.set(type, hz, q) retunes it
function bq(sr, type, fc, q) {
  const o = new Biquad(sr), f = (x) => o.run(x);
  f.set = (t, c, qq) => { o.set(t, c, qq); return f; };
  return type ? f.set(type, fc, q) : f;
}

// Small Freeverb-style room: 4 damped combs into 2 all-passes
function verb(sr, size = 1, fb = 0.8, damp = 0.35) {
  const mk = (d) => ({ b: new Float32Array(Math.round(d * size * sr / 44100)), i: 0, z: 0 });
  const cs = [1116, 1277, 1422, 1557].map(mk), as = [556, 341].map(mk);
  return (x) => {
    let o = 0;
    for (const c of cs) {
      const y = c.b[c.i];
      c.z = y * (1 - damp) + c.z * damp;
      c.b[c.i] = x + c.z * fb;
      if (++c.i >= c.b.length) c.i = 0;
      o += y;
    }
    o *= 0.25;
    for (const a of as) {
      const y = a.b[a.i];
      a.b[a.i] = o + y * 0.5;
      if (++a.i >= a.b.length) a.i = 0;
      o = y - o;
    }
    return o;
  };
}

// Run fn round a loop: warm the filter state on the tail, then one pass, so it wraps
function circ(a, fn, warm = 8192) {
  const n = a.length;
  for (let i = Math.max(0, n - warm); i < n; i++) fn(a[i], i);
  for (let i = 0; i < n; i++) a[i] = fn(a[i], i);
  return a;
}
// Process a one-shot straight through
function lin(a, fn) { for (let i = 0; i < a.length; i++) a[i] = fn(a[i], i); return a; }

// White noise from a fast LCG seeded by r (its top bits are plenty for audio)
function noise(n, r) {
  const a = new Float32Array(n);
  let s = (r() * 4294967296) | 0;
  for (let i = 0; i < n; i++) { s = (Math.imul(s, 1664525) + 1013904223) | 0; a[i] = s / 2147483648; }
  return a;
}

// Add wet reverb to a buffer (loop: wraps round; shot: straight)
function wet(a, sr, amt, size, fb, damp, loop) {
  const v = verb(sr, size, fb, damp), w = Float32Array.from(a);
  loop ? circ(w, v, sr * 3) : lin(w, v);
  for (let i = 0; i < a.length; i++) a[i] += w[i] * amt;
  return a;
}

// Periodic smooth wobble (0..1) built from whole cycles over the loop
function wob(nk, r, cycles) {
  const out = new Float32Array(nk), ps = cycles.map(() => r() * TAU);
  let lo = Infinity, hi = -Infinity;
  for (let k = 0; k < nk; k++) {
    let v = 0;
    cycles.forEach((c, j) => { v += Math.sin(TAU * c * k / nk + ps[j]) / Math.sqrt(c); });
    out[k] = v; lo = Math.min(lo, v); hi = Math.max(hi, v);
  }
  for (let k = 0; k < nk; k++) out[k] = (out[k] - lo) / (hi - lo);
  return out;
}

// Tone with gliding pitch written into o (wrapping when loop), env(u) and f(u) in Hz
function tone(o, at, len, sr, f, env, h2 = 0, wrap = true) {
  const n = o.length;
  let ph = 0;
  for (let j = 0; j < len; j++) {
    const u = j / len;
    ph += f(u) / sr;
    ph -= Math.floor(ph);
    const i = wrap ? (at + j) % n : at + j;
    if (i < n) o[i] += (Math.sin(TAU * ph) + h2 * Math.sin(2 * TAU * ph)) * env(u);
  }
}

// Fast attack, smooth release envelope; a = attack fraction
const ar = (a, p = 2) => (u) => Math.pow(u < a ? Math.sin(Math.PI / 2 * u / a) : Math.cos(Math.PI / 2 * (u - a) / (1 - a)), p);

// Level, DC, fades, and hand back an AudioBuffer
function done(OAC, sr, chans, loop) {
  const n = chans[0].length;
  let pk = 0, ss = 0;
  for (const c of chans) {
    if (loop) { let m = 0; for (let i = 0; i < n; i++) m += c[i]; m /= n; for (let i = 0; i < n; i++) c[i] -= m; }
    else { const f = Math.round(sr * 0.01), t = Math.round(sr * 0.05); for (let i = 0; i < f; i++) c[i] *= i / f; for (let i = 0; i < t; i++) c[n - 1 - i] *= i / t; }
    for (let i = 0; i < n; i++) { const v = Math.abs(c[i]); if (v > pk) pk = v; ss += v * v; }
  }
  const rms = Math.sqrt(ss / (n * chans.length));
  const g = loop ? Math.min(0.063 / rms, 0.5 / pk) : 0.5 / pk; // -24 dBFS RMS, peaks under -6 dBFS
  const buf = new OAC(chans.length, n, sr).createBuffer(chans.length, n, sr);
  chans.forEach((c, k) => { for (let i = 0; i < n; i++) c[i] *= g; buf.copyToChannel(c, k); });
  return buf;
}

// ---------------------------------------------------------------------------

// Sea lapping a stone wall: slow swells, a dark wash, fizz and gurgles as it drains, soft slaps
function sea({ OfflineAudioContext: OAC, seed }) {
  const sr = 24000, L = 16, n = L * sr, K = 32, nk = n / K, r = rng(seed * 977 + 1);
  const t1 = r() * L, gap = 6.5 + r() * 3;
  // shared low body (mono is fine down there)
  const body = noise(n, r), lo = bq(sr, 'lp', 170, 0.6), lo2 = bq(sr, 'lp', 170, 0.6);
  circ(body, (x) => lo2(lo(x)));
  const ev = [[t1, 1], [t1 + gap, 0.7 + r() * 0.25], [t1 + gap * 0.5, 0.3], [t1 + gap + (L - gap) * 0.5, 0.35]]
    .map(([t, a]) => ({ t: t % L, a, R: 1.6 + r() * 1.4, D: 4 + r() * 2.5, T: 0.9 + r() * 0.6, p: r() - 0.5 }));
  return done(OAC, sr, [0, 1].map((side) => {
    const W = new Float32Array(nk).fill(0.12), F = new Float32Array(nk), o = new Float32Array(n), slap = new Float32Array(n);
    for (const e of ev) {
      const g = Math.sqrt(0.5 + (side ? e.p : -e.p)), sh = (side ? 1 : -1) * e.p * 0.15;
      for (let k = 0; k < nk; k++) {
        const dt = (((k * K / sr - e.t - sh) % L) + L) % L;
        if (dt < e.R) W[k] += g * e.a * Math.sin(Math.PI / 2 * dt / e.R) ** 2;
        else if (dt < e.R + e.D) W[k] += g * e.a * (1 - (dt - e.R) / e.D) ** 3;
        const x = (dt - e.R * 0.85) / e.T;
        if (x > 0 && dt < L - 0.5) F[k] += g * e.a * x * x * Math.exp(2 - 2 * x) * Math.min(1, (L - 0.5 - dt) / 3);
      }
      // soft slaps against the wall at the crest
      if (e.a > 0.5) for (let s = 0; s < 2 + (r() * 2 | 0); s++) {
        const at = Math.round((e.t + sh + e.R * (0.85 + s * 0.22 + r() * 0.1)) * sr), amp = g * e.a * (0.5 + r() * 0.5) / (1 + s);
        for (let j = 0; j < sr * 0.2; j++) slap[(at + j) % n] += (r() * 2 - 1) * amp * Math.exp(-j / (sr * 0.04)) * Math.min(1, j / 60);
      }
    }
    // gurgles: low bubbles while the water drains back
    for (let k = 0; k < nk; k += 8) if (r() < F[k] * 0.12) {
      const f0 = 160 + r() * 520, tau = sr * (0.012 + r() * 0.025), a = 0.5 + r();
      let ph = 0;
      for (let j = 0; j < tau * 3; j++) { ph += f0 * (1 + 0.3 * j / tau) / sr; o[(k * K + j) % n] += Math.sin(TAU * ph) * a * Math.exp(-j / tau) * Math.min(1, j / 30); }
    }
    const ns = noise(n, r), ns2 = noise(n, r), ns3 = noise(n, r), gr = new Float32Array(n);
    for (let k = 0; k < nk; k++) if (r() < F[k] * 0.03 * K) gr[k * K + (r() * K | 0)] = (r() * 2 - 1) * (0.3 + r());
    const wl = bq(sr), wh = bq(sr, 'hp', 140),
      fz = bq(sr, 'hp', 1800), fl = bq(sr, 'lp', 5500), sp = bq(sr, 'bp', 3800, 0.9), sl = bq(sr, 'lp', 450, 0.9), sl2 = bq(sr, 'hp', 60), gl = bq(sr, 'lp', 1200);
    return circ(o, (x, i) => {
      const k = i / K | 0, w = W[k];
      if (i % K === 0) { const c = 240 + 1100 * Math.min(1, w) ** 1.6; wl.set('lp', c, 0.6); }
      return body[i] * 1.7 * (0.55 + 0.45 * w) + wh(wl(ns2[i])) * w * 1.5
        + (fl(fz(ns3[i])) * 0.1 + sp(gr[i]) * 0.35) * F[k] + sl2(sl(slap[i])) * 1.6 + gl(x) * 0.12;
    });
  }), true);
}

// Warm breeze: soft dark air with slow gusts and a little leaf rustle
function breeze({ OfflineAudioContext: OAC, seed }) {
  const sr = 16000, n = 14 * sr, K = 64, r = rng(seed * 977 + 2);
  const G = wob(n / K, r, [1, 2, 3, 5, 7]), Rs = wob(n / K, r, [9, 13, 17, 23, 31]);
  const ns = noise(n, r), ns2 = noise(n, r), ns3 = noise(n, r);
  const b = bq(sr), bl = bq(sr), lo = bq(sr, 'lp', 140, 0.6), lh = bq(sr, 'hp', 2000), ll = bq(sr, 'lp', 5500), lb = bq(sr, 'hp', 40);
  return done(OAC, sr, [circ(new Float32Array(n), (_, i) => {
    const k = i / K | 0, g = 0.2 + 0.8 * G[k] ** 1.5;
    if (i % K === 0) { b.set('bp', 220 + 480 * g, 0.6); bl.set('lp', 700 + 900 * g, 0.6); }
    return lb(bl(b(ns[i])) * g + lo(ns2[i]) * 2.2 * g + ll(lh(ns3[i])) * 0.05 * g * g * (0.15 + Rs[k] ** 3));
  })], true);
}

// Town birds: sparse sparrow cheeps and now and then a distant blackbird phrase
function birds({ OfflineAudioContext: OAC, seed }) {
  const sr = 24000, L = 20, n = L * sr, r = rng(seed * 977 + 3), o = new Float32Array(n);
  const sparrows = [[3700, 1], [4200, 0.55], [3400, 0.3]];
  const groups = 5 + (r() * 3 | 0);
  for (let gI = 0; gI < groups; gI++) {
    const [base, amp] = sparrows[r() * 3 | 0];
    let t = (gI + r() * 0.6) * L / groups;
    for (let c = 0, m = 1 + (r() * 4 | 0); c < m; c++) {
      const f0 = base * (0.93 + r() * 0.1), up = 500 + r() * 700, end = -200 - r() * 500, len = Math.round(sr * (0.05 + r() * 0.05));
      const a = amp * (0.7 + r() * 0.3);
      tone(o, Math.round(t * sr), len, sr, (u) => f0 + up * Math.sin(Math.PI * u) + end * u, (u) => a * ar(0.25, 1.5)(u), 0.12);
      t += 0.14 + r() * 0.18;
    }
  }
  // blackbird: fluty slurred notes then a soft high twitter
  for (let p = 0; p < 1 + (r() < 0.6); p++) {
    let t = r() * L, a = p ? 0.35 : 0.6;
    for (let q = 0, m = 4 + (r() * 3 | 0); q < m; q++) {
      const f0 = 1700 + r() * 900, d = (r() - 0.5) * 900, len = Math.round(sr * (0.14 + r() * 0.2));
      tone(o, Math.round(t * sr), len, sr, (u) => f0 + d * u + 30 * Math.sin(TAU * 7 * u), (u) => a * ar(0.15, 1.2)(u), 0.08);
      t += len / sr + 0.04 + r() * 0.08;
    }
    for (let q = 0, m = 2 + (r() * 3 | 0); q < m; q++) {
      const f0 = 3800 + r() * 1800, len = Math.round(sr * (0.03 + r() * 0.03));
      tone(o, Math.round(t * sr), len, sr, (u) => f0 - 900 * u, (u) => a * 0.35 * ar(0.2)(u));
      t += 0.06 + r() * 0.03;
    }
  }
  const lp = bq(sr, 'lp', 7000), hp = bq(sr, 'hp', 1200);
  circ(o, (x) => lp(hp(x)));
  return done(OAC, sr, [wet(o, sr, 0.5, 1.1, 0.78, 0.4, true)], true);
}

// A distant group of swifts screaming past, high and soft
function swifts({ OfflineAudioContext: OAC, seed }) {
  const sr = 24000, n = Math.round(4.2 * sr), r = rng(seed * 977 + 4), o = new Float32Array(n);
  const mid = 1.3 + r() * 0.6, dop = (t) => 1 + 0.05 * Math.tanh((mid - t) * 2.5);
  const pass = (t) => Math.exp(-(((t - mid) / 0.9) ** 2));
  for (let b = 0, m = 3 + (r() * 4 | 0); b < m; b++) {
    let t = mid - 1.1 + r() * 1.4;
    for (let s = 0, k = 1 + (r() < 0.5); s < k; s++) {
      const len = Math.round(sr * (0.3 + r() * 0.35)), f0 = 5200 + r() * 1600, fm = 110 + r() * 80, dep = 600 + r() * 700, am = 25 + r() * 25;
      const at = Math.round(t * sr), amp = (0.5 + r() * 0.5);
      let ph = 0;
      for (let j = 0; j < len && at + j < n; j++) {
        const u = j / len, tt = (at + j) / sr;
        ph += (f0 * (1 - 0.08 * u) + dep * Math.sin(TAU * fm * j / sr)) * dop(tt) / sr;
        o[at + j] += Math.sin(TAU * ph) * (0.7 + 0.3 * Math.sin(TAU * am * j / sr)) * ar(0.12, 1.5)(u) * amp * pass(tt);
      }
      t += len / sr + 0.05 + r() * 0.2;
    }
  }
  const lp = bq(sr, 'lp', 6500), lp2 = bq(sr, 'lp', 8000), hp = bq(sr, 'hp', 2500);
  lin(o, (x) => lp2(lp(hp(x))));
  return done(OAC, sr, [wet(o, sr, 0.45, 1, 0.75, 0.5)], false);
}

// Cicadas in distant pines: narrow-band buzzes, pulsing and swelling
function cicadas({ OfflineAudioContext: OAC, seed }) {
  const sr = 16000, L = 12, n = L * sr, K = 32, r = rng(seed * 977 + 5), o = new Float32Array(n);
  for (let c = 0; c < 5; c++) {
    const fc = 4300 + r() * 2000, rate = Math.round((90 + r() * 120) * L) / L, a = [1, 0.7, 0.55, 0.4, 0.3][c];
    const ech = r() < 0.5 ? Math.round((2.5 + r() * 4) * L) / L : 0, sw = 1 + (r() * 3 | 0), ph = r() * TAU, ns = noise(n, r);
    const b1 = bq(sr, 'bp', fc, 3.5), b2 = bq(sr, 'bp', fc * 1.02, 3.5);
    circ(ns, (x) => b2(b1(x)));
    let slow = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      if (i % K === 0) slow = a * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(TAU * sw * t / L + ph)) ** 2) * (ech ? (0.5 + 0.5 * Math.cos(TAU * ech * t)) ** 3 : 1);
      const p = 0.5 + 0.5 * Math.cos(TAU * rate * t);
      o[i] += ns[i] * p * p * slow;
    }
  }
  return done(OAC, sr, [wet(o, sr, 0.3, 1.2, 0.75, 0.5, true)], true);
}

// Night crickets: a few individuals with regular chirps, plus a far tree cricket trill
function crickets({ OfflineAudioContext: OAC, seed }) {
  const sr = 24000, L = 14, n = L * sr, r = rng(seed * 977 + 6), o = new Float32Array(n);
  [[0.48, 1], [0.66, 0.6], [0.9, 0.45], [0.57, 0.3]].forEach(([per, a]) => {
    const f = 4200 + r() * 700, np = 3 + (r() * 3 | 0), cnt = Math.round(L / per), off = r() * L;
    for (let c = 0; c < cnt; c++) {
      const t0 = off + c * L / cnt + (r() - 0.5) * 0.01, g = a * (0.85 + r() * 0.15);
      for (let p = 0; p < np; p++) {
        const len = Math.round(sr * 0.016);
        tone(o, Math.round((t0 + p * 0.034) * sr), len, sr, (u) => f * (1 - 0.01 * u), (u) => g * Math.sin(Math.PI * u) ** 2 * (p === np - 1 ? 0.7 : 1));
      }
    }
  });
  // tree cricket: soft continuous trill that comes and goes
  const tf = 2700 + r() * 300, pr = Math.round(44 * L) / L, sw = 2 + (r() * 2 | 0);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr; ph += tf / sr; ph -= Math.floor(ph);
    const env = Math.max(0, Math.sin(TAU * sw * t / L)) ** 1.5 * 0.25;
    o[i] += Math.sin(TAU * ph) * (0.5 - 0.5 * Math.cos(TAU * pr * t)) ** 2 * env;
  }
  const lp = bq(sr, 'lp', 6500), hp = bq(sr, 'hp', 1500);
  circ(o, (x) => lp(hp(x)));
  return done(OAC, sr, [wet(o, sr, 0.6, 1.3, 0.8, 0.45, true)], true);
}

// Warm night by the sea: a low, very still hush
function nightair({ OfflineAudioContext: OAC, seed }) {
  const sr = 8000, L = 16, n = L * sr, K = 32, r = rng(seed * 977 + 7);
  return done(OAC, sr, [0, 1].map(() => {
    const B = wob(n / K, r, [1, 2, 3]), S = wob(n / K, r, [2, 3, 4]), ns = noise(n, r), ns2 = noise(n, r);
    const l1 = bq(sr, 'lp', 320, 0.6), l2 = bq(sr, 'lp', 320, 0.6), b = bq(sr, 'bp', 800, 0.5), hp = bq(sr, 'hp', 30);
    return circ(new Float32Array(n), (_, i) => {
      const k = i / K | 0;
      return hp(l2(l1(ns[i])) * (0.85 + 0.15 * B[k]) * 3 + b(ns2[i]) * (0.04 + 0.06 * S[k]));
    });
  }), true);
}

// Small stone fountain: steady splash, many little bubbles, a soft basin hum
function fountain({ OfflineAudioContext: OAC, seed }) {
  const sr = 24000, L = 10, n = L * sr, r = rng(seed * 977 + 8), o = new Float32Array(n);
  const fl = noise(n, r), flp = bq(sr, 'lp', 12, 0.7);
  circ(fl, (x) => flp(x));
  let fm = 0; for (let i = 0; i < n; i++) fm = Math.max(fm, Math.abs(fl[i]));
  const ns = noise(n, r), ns2 = noise(n, r), sb = bq(sr, 'bp', 1800, 0.7), sh = bq(sr, 'lp', 5000), sl = bq(sr, 'lp', 260, 0.6);
  circ(o, (_, i) => sh(sb(ns[i])) * 0.12 * (0.7 + 0.3 * fl[i] / fm) + sl(ns2[i]) * 0.3);
  // bubbles: damped sines that rise slightly in pitch
  for (let b = 0, m = 220 * L; b < m; b++) {
    const at = r() * n | 0, big = r() < 0.1, f0 = big ? 280 + r() * 320 : 650 * Math.pow(4, r());
    const tau = sr * (big ? 0.03 : 0.008 + 0.014 * r()), a = (big ? 0.5 : 0.3) * (0.15 + r() ** 2), len = tau * 3.5 | 0, d = Math.exp(-1 / tau);
    // rotating phasor, retuned every 32 samples as the pitch rises
    let re = 0, im = a, c = 1, sn = 0;
    for (let j = 0; j < len; j++) {
      if (j % 32 === 0) { const w = TAU * f0 * (1 + 0.15 * (j + 16) / tau) / sr; c = Math.cos(w) * d; sn = Math.sin(w) * d; }
      const t = re * c - im * sn; im = re * sn + im * c; re = t;
      o[(at + j) % n] += im * Math.min(1, j / 8);
    }
  }
  const lp = bq(sr, 'lp', 8000), hp = bq(sr, 'hp', 120);
  circ(o, (x) => lp(hp(x)));
  return done(OAC, sr, [wet(o, sr, 0.18, 0.5, 0.7, 0.5, true)], true);
}

// Formant voice: harmonics of f(u) shaped by resonances fm(u) = [[Hz, width, gain], ...]
function voice(o, at, len, sr, f, fm, env, r) {
  let ph = 0, w = [], jit = 0;
  const nb = bq(sr, 'bp', 1900, 1.2);
  for (let j = 0; j < len && at + j < o.length; j++) {
    const u = j / len;
    if (j % 48 === 0) jit = jit * 0.7 + (r() - 0.5) * 0.012;
    const f0 = f(u) * (1 + jit);
    if (j % 48 === 0) {
      w = [];
      for (let k = 1; k * f0 < 6000; k++) { let g = 0; for (const [F, bw, a] of fm(u)) g += a / (1 + ((k * f0 - F) / bw) ** 2); w.push(g / Math.sqrt(k)); }
    }
    ph += f0 / sr; ph -= Math.floor(ph);
    let s = 0;
    for (let k = 0; k < w.length; k++) s += w[k] * Math.sin(TAU * (k + 1) * ph);
    o[at + j] += (s * (1 + 0.25 * (r() - 0.5)) + nb(r() * 2 - 1) * 1.2) * env(u); // a little harsh breath
  }
}

// Herring gull far over the water: "kyow" calls and a short laughing series
function gull({ OfflineAudioContext: OAC, seed }) {
  const sr = 24000, r = rng(seed * 977 + 9), v = seed % 4, o = new Float32Array(Math.round(4 * sr));
  let t = 0.05;
  const kyow = (p) => {
    const len = Math.round(sr * (0.36 + r() * 0.12)), hi = 1000 * p, lo = 640 * p;
    voice(o, Math.round(t * sr), len, sr,
      (u) => u < 0.15 ? hi * (0.82 + 0.18 * u / 0.15) : lo + (hi - lo) * (1 - (u - 0.15) / 0.85) ** 1.4,
      (u) => [[1100 + 1300 * (1 - u) ** 1.5, 450, 1], [2900 - 400 * u, 700, 0.5]], ar(0.08, 1), r);
    t += len / sr + 0.15 + r() * 0.15;
  };
  const laugh = (m, p) => {
    for (let q = 0; q < m; q++) {
      const len = Math.round(sr * (0.1 + r() * 0.035)), f0 = 760 * p * (1 + 0.03 * Math.sin(Math.PI * q / m));
      voice(o, Math.round(t * sr), len, sr, (u) => f0 * (1 - 0.1 * u), () => [[1500, 500, 1], [2700, 700, 0.45]], (u) => ar(0.2, 0.8)(u) * (1 - 0.05 * q), r);
      t += 0.17 + r() * 0.04;
    }
  };
  const p = 0.92 + r() * 0.16;
  if (v === 0) kyow(p);
  else if (v === 1) { kyow(p); kyow(p * 0.94); }
  else if (v === 2) { kyow(p); laugh(5, p); }
  else laugh(7, p);
  const lp = bq(sr, 'lp', 3200), lp2 = bq(sr, 'lp', 4000), hp = bq(sr, 'hp', 700), hp2 = bq(sr, 'hp', 700);
  lin(o, (x) => lp2(lp(hp2(hp(x)))));
  // one reflection off the water, then a wide airy tail
  for (let i = o.length - 1, d = Math.round(sr * 0.045); i >= d; i--) o[i] += o[i - d] * 0.3;
  return done(OAC, sr, [wet(o, sr, 0.45, 1.4, 0.8, 0.45)], false);
}

const loop = (render, seconds) => ({ kind: 'loop', variants: 1, seconds, render: async (a) => render(a) });
const shot = (render, variants) => ({ kind: 'shot', variants, render: async (a) => render(a) });

export const RECIPES = {
  sea: loop(sea, 16),
  breeze: loop(breeze, 14),
  birds: loop(birds, 20),
  swifts: shot(swifts, 3),
  cicadas: loop(cicadas, 12),
  crickets: loop(crickets, 14),
  nightair: loop(nightair, 16),
  fountain: loop(fountain, 10),
  gull: shot(gull, 4),
};
