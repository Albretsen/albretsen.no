// Living Town sound: music and voices (the evening band, a radio, the arcade, humming, café talk).
// All original and synthesised: tunes are written out below and played on small additive
// instruments; voices are glottal pulses through moving formant filters. Loops are periodic by
// construction: notes wrap round the buffer and filters run twice round it, so there is no seam.

const TAU = Math.PI * 2;

function rng(seed) {
  let s = (seed * 2654435761) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- notes and chords ----------

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(s) { // 'Bb4' -> 70
  let pc = PC[s[0]], i = 1;
  while (s[i] === '#' || s[i] === 'b') pc += s[i++] === '#' ? 1 : -1;
  return pc + 12 * (+s.slice(i) + 1);
}

// "B4:2 A4 | ..." -> notes in beats. ':' gives a length (default 1), 'r' rests, '~' a grace note.
function tune(src, meter) {
  const ev = []; let beat = 0;
  for (const bar of src.split('|')) {
    let b = 0;
    for (const tok of bar.trim().split(/\s+/)) {
      const [n, d] = tok.split(':'), len = d ? +d : 1, g = n[0] === '~';
      if (n !== 'r') ev.push({ beat: beat + b, len, m: midi(g ? n.slice(1) : n), g, down: b === 0 });
      b += len;
    }
    beat += meter;
  }
  return { ev, beats: beat };
}

const QUAL = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], 6: [0, 4, 7, 9], m6: [0, 3, 7, 9] };
// "G Am/E Cm7,F7" -> one entry per chord with its start beat and length
function chords(src, meter) {
  const out = [];
  src.trim().split(/\s+/).forEach((bar, i) => {
    const cs = bar.split(',');
    cs.forEach((c, k) => {
      const r = /^([A-G][#b]?)(maj7|m7|m6|m|7|6)?(?:\/([A-G][#b]?))?$/.exec(c);
      const root = midi(r[1] + '0') % 12;
      out.push({ name: c, root, pcs: QUAL[r[2] || ''].map((x) => (x + root) % 12), bass: r[3] ? midi(r[3] + '0') % 12 : root, beat: i * meter + k * meter / cs.length, len: meter / cs.length, slash: !!r[3] });
    });
  });
  return out;
}

// Nearest note of pitch class pc to prev, kept near a centre and inside [lo, hi]
function near(pc, prev, ctr, lo, hi) {
  let best = 0, bs = 1e9;
  for (let m = lo; m <= hi; m++) if (m % 12 === pc) { const s = Math.abs(m - prev) + 0.3 * Math.abs(m - ctr); if (s < bs) { bs = s; best = m; } }
  return best;
}

// Close voicing of pcs in [lo, hi] that moves least from the previous one
function voicing(pcs, lo, hi, prev) {
  let best = null, bs = 1e9;
  const rec = (i, acc) => {
    if (i === pcs.length) {
      const v = [...acc].sort((a, b) => a - b), spread = v[v.length - 1] - v[0];
      if (spread > 12) return;
      const s = spread * 0.4 + (prev ? v.reduce((a, m, j) => a + Math.abs(m - (prev[j] ?? prev[0])), 0) : Math.abs(v[0] - (lo + hi) / 2));
      if (s < bs) { bs = s; best = v; }
      return;
    }
    for (let m = lo; m <= hi; m++) if (m % 12 === pcs[i]) rec(i + 1, [...acc, m]);
  };
  rec(0, []);
  return best;
}

// ---------- sample-level tools ----------

let TB = new Map();
// One period (2048 samples) of a harmonic tone; amp(n, f) shapes it, harmonics stay under 0.45 sr
function wt(key, f, sr, amp) {
  key += Math.round(f * 8);
  let t = TB.get(key);
  if (t) return t;
  t = new Float32Array(2049);
  const K = Math.min(48, Math.floor(0.45 * sr / f));
  for (let n = 1; n <= K; n++) {
    const a = amp(n, f), w = TAU * n / 2048;
    if (a) for (let i = 0; i < 2048; i++) t[i] += a * Math.sin(w * i);
  }
  let m = 0;
  for (let i = 0; i < 2048; i++) m = Math.max(m, Math.abs(t[i]));
  for (let i = 0; i < 2048; i++) t[i] /= m;
  t[2048] = t[0];
  TB.set(key, t);
  return t;
}

// Play a table tone into out (wrapping round it). dec > 0 gives a free decay (seconds to -60 dB).
function tone(out, sr, t0, dur, f, tb, amp, att, rel, vib = 0, ph = 0, dec = 0) {
  const N = out.length, nd = Math.max(1, dur * sr), na = Math.min(att * sr, nd * 0.5), nr = rel * sr, len = Math.round(nd + nr);
  let i = Math.round(t0 * sr) % N, p = ph * 2048, d = 1;
  if (i < 0) i += N;
  const inc = f * 2048 / sr, dk = dec ? Math.exp(-6.9 / (dec * sr)) : 1, vw = TAU * 5.3 / sr;
  for (let k = 0; k < len; k++) {
    const e = k < na ? 0.5 - 0.5 * Math.cos(Math.PI * k / na) : k < nd ? 1 : 0.5 + 0.5 * Math.cos(Math.PI * (k - nd) / nr);
    const j = p | 0;
    out[i] += amp * e * d * (tb[j] + (p - j) * (tb[j + 1] - tb[j]));
    p += vib ? inc * (1 + vib * Math.sin(vw * k) * Math.min(1, k / (0.35 * sr))) : inc;
    if (p >= 2048) p -= 2048;
    d *= dk;
    if (++i === N) i = 0;
  }
}

// Plucked string (Karplus-Strong), soft and dark: an upright bass under the waltz
function pluck(out, sr, t0, f, amp, dur, rnd) {
  const N = out.length, L = Math.max(2, Math.round(sr / f - 0.5)), d = new Float32Array(L);
  let lp = 0, mean = 0;
  for (let k = 0; k < L; k++) { lp += 0.3 * (rnd() * 2 - 1 - lp); d[k] = lp; mean += lp / L; }
  for (let k = 0; k < L; k++) d[k] -= mean;
  const g = Math.exp(-6.9 * L / (2.2 * sr)), len = Math.round(dur * sr), fo = 0.06 * sr;
  let p = 0, y = 0, i = Math.round(t0 * sr) % N;
  if (i < 0) i += N;
  for (let k = 0; k < len; k++) {
    const a = d[p], b = d[p + 1 === L ? 0 : p + 1];
    d[p] = g * 0.5 * (a + b);
    if (++p === L) p = 0;
    y += 0.22 * (a - y);
    out[i] += amp * y * Math.min(1, k / (0.003 * sr), (len - k) / fo);
    if (++i === N) i = 0;
  }
}

// RBJ biquad coefficients, and a pass over an array (passes = 2 makes a loop periodic)
function bq(type, f, q, sr, db = 0) {
  const w = TAU * Math.min(f, sr * 0.45) / sr, c = Math.cos(w), al = Math.sin(w) / (2 * q), A = 10 ** (db / 40);
  let b0, b1, b2, a0 = 1 + al, a2 = 1 - al;
  if (type === 'lp') { b1 = 1 - c; b0 = b2 = b1 / 2; }
  else if (type === 'hp') { b1 = -(1 + c); b0 = b2 = (1 + c) / 2; }
  else { b0 = 1 + al * A; b1 = -2 * c; b2 = 1 - al * A; a0 = 1 + al / A; a2 = 1 - al / A; } // peaking
  return [b0 / a0, b1 / a0, b2 / a0, -2 * c / a0, a2 / a0];
}
function filt(x, c, passes = 1) {
  const [b0, b1, b2, a1, a2] = c;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let p = 0; p < passes; p++) {
    const w = p === passes - 1;
    for (let i = 0; i < x.length; i++) {
      const v = x[i], y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = v; y2 = y1; y1 = y;
      if (w) x[i] = y;
    }
  }
  return x;
}

// Small Freeverb-style room; returns the wet signal only
function verb(x, sr, rt, damp, passes, spread = 0) {
  const s = sr / 44100, y = new Float32Array(x.length);
  const cs = [1116, 1188, 1277, 1356].map((d) => { const n = Math.round((d + spread) * s); return { b: new Float32Array(n), i: 0, f: 0, g: 10 ** (-3 * n / (rt * sr)) }; });
  const as = [556, 441].map((d) => ({ b: new Float32Array(Math.round((d + spread) * s)), i: 0 }));
  for (let p = 0; p < passes; p++) {
    const w = p === passes - 1;
    for (let k = 0; k < x.length; k++) {
      const inp = x[k] * 0.25;
      let o = 0;
      for (const c of cs) { const v = c.b[c.i]; c.f = v * (1 - damp) + c.f * damp; c.b[c.i] = inp + c.f * c.g; if (++c.i === c.b.length) c.i = 0; o += v; }
      for (const a of as) { const v = a.b[a.i]; a.b[a.i] = o + v * 0.5; o = v - o; if (++a.i === a.b.length) a.i = 0; }
      if (w) y[k] = o;
    }
  }
  return y;
}

function mix(dst, src, g) { for (let i = 0; i < dst.length; i++) dst[i] += src[i] * g; return dst; }
function addAt(out, src, start, g) {
  const N = out.length;
  let i = Math.round(start) % N;
  if (i < 0) i += N;
  for (let k = 0; k < src.length; k++) { out[i] += src[k] * g; if (++i === N) i = 0; }
}

// Normalise (loops: -24 dBFS RMS, never above -1 dBFS peak; shots: -6 dBFS peak) into an AudioBuffer
function finish(Off, chans, sr, shot) {
  const n = chans[0].length;
  let pk = 0, ss = 0;
  for (const c of chans) for (let i = 0; i < n; i++) { pk = Math.max(pk, Math.abs(c[i])); ss += c[i] * c[i]; }
  const g = shot ? 0.5 / pk : Math.min(0.063 / Math.sqrt(ss / (n * chans.length)), 0.89 / pk);
  const buf = new Off(chans.length, n, sr).createBuffer(chans.length, n, sr), fi = 0.004 * sr, fo = 0.08 * sr;
  chans.forEach((c, k) => {
    for (let i = 0; i < n; i++) c[i] *= g * (shot ? Math.min(1, i / fi, (n - 1 - i) / fo) : 1);
    buf.copyToChannel(c, k);
  });
  TB = new Map();
  return buf;
}

// ---------- the evening band: two musette waltzes ----------

// Free-reed timbre: bright but rounded
const reed = (n, f) => n ** -0.85 / (1 + (n * f / 2200) ** 2);

function accordion(out, sr, t, dur, m, amp, reeds, rnd) {
  const f = mtof(m), tb = wt('a', f, sr, reed);
  for (const [c, g] of reeds) tone(out, sr, t, dur, f * 2 ** (c / 1200), tb, amp * g, 0.03, 0.07, 0, rnd());
}

// Waltz 1, G major, 24 bars (A B A'): a tender tune with a borrowed C minor before the cadence
const W1 = {
  bpm: 104,
  reeds: [[0, 1], [11, 0.75], [-7, 0.4]], // three reeds tuned apart: the musette shimmer
  mel: `~B4:3 | A4 B4 D5 | E5:2 D5 | C5:3 | A4 G4:.5 F#4:.5 A4 | D5:2 C5 | ~B4:3 | B4 G#4 B4 |
        A4 C5 E5 | A5:2 G5 | F#5:2 E5 | D5:3 | B4:.5 C5:.5 D5 G5 | G5:2 F#5 | E5:2 G5 | F#5 E5 C5 |
        ~B4:3 | A4:.5 B4:.5 C5:.5 C#5:.5 D5 | E5:2 D5 | Eb5:2 C5 | B4:2 D5 | C5 A4 F#4 | G4:3 | r F#4 A4`,
  ch: 'G G C Am D7 D7 G E7 Am Am D7 D7 G Em A7 D7 G G C Cm G/D D7 G D7',
  alt: true, accBass: 1, pluck: 0.35,
};
// Waltz 2, F major, 16 bars, slower: a bass line that walks down, then a chromatic one
const W2 = {
  bpm: 76,
  reeds: [[0, 1], [6, 0.6]],
  mel: `A4 C5 F5 | E5:3 | F4 A4 D5 | C5:3 | D5 C5 Bb4 | A4:2 C5 | D5:2 Bb4 | G4 C5 Bb4 |
        A4 C5 F5 | E5:2 C#5 | D5:2 F5 | A5:2 Eb5 | D5:3 | Db5:2 Bb4 | C5 G4 E4 | F4:3`,
  ch: 'F Am/E Dm Dm7/C Bb F/A Gm7 C7 F A7/C# Dm F7/Eb Bb/D Bbm/Db C7 F',
  alt: false, accBass: 0, pluck: 0.9,
};

function waltz(Off, seed, W) {
  const sr = 24000, rnd = rng(seed + 101), spb = 60 / W.bpm, T = tune(W.mel, 3), N = Math.round(T.beats * spb * sr);
  const mel = new Float32Array(N), lh = new Float32Array(N), bs = new Float32Array(N);
  const j = () => (rnd() - 0.5) * 0.016;
  for (const e of T.ev) {
    const t = e.beat * spb + j();
    if (e.g) accordion(mel, sr, t - 0.075, 0.07, e.m - 1, 0.5, W.reeds, rnd);
    accordion(mel, sr, t, e.len * spb - 0.035, e.m, e.down ? 0.95 : 0.8, W.reeds, rnd);
  }
  // Bellows: each four-bar phrase swells and eases
  const ph = 12 * spb * sr;
  for (let i = 0; i < N; i++) mel[i] *= 0.78 + 0.22 * Math.sin(Math.PI * ((i % ph) / ph)) ** 1.5;
  // Left hand: bass on one, chord on two and three (oom-pah-pah)
  let pb = 43, pv = null, prev = '';
  for (const c of chords(W.ch, 3)) {
    const t = c.beat * spb, five = W.alt && c.name === prev && !c.slash;
    const b = near(five ? (c.root + 7) % 12 : c.bass, pb, 42, 31, 52);
    pb = b; prev = c.name;
    if (W.accBass) { accordion(lh, sr, t + j(), spb * 0.8, b, 0.55, [[0, 1]], rnd); accordion(lh, sr, t + j(), spb * 0.8, b + 12, 0.3, [[0, 1]], rnd); }
    if (W.pluck) pluck(bs, sr, t + j(), mtof(b), W.pluck, spb * 1.6, rnd);
    const pcs = c.pcs.length > 3 ? [c.pcs[0], c.pcs[1], c.pcs[3]] : c.pcs;
    pv = voicing(pcs, 52, 67, pv);
    for (const k of [1, 2]) for (const m of pv) accordion(lh, sr, t + k * spb + j(), spb * 0.42, m, k === 1 ? 0.2 : 0.17, [[0, 1]], rnd);
  }
  const out = mix(mix(mel, lh, 0.8), bs, 1);
  filt(out, bq('hp', 55, 0.7, sr), 2);
  filt(out, bq('lp', 6000, 0.7, sr), 2);
  mix(out, verb(out, sr, 1.3, 0.4, 2), 0.35);
  return finish(Off, [out], sr);
}

// ---------- the radio in an open window ----------

const RADIO = {
  mel: `D5:3 C5:.5 D5:.5 | F5:2 D5 B4 | C5:3 Bb4:.5 C5:.5 | Eb5:2 C5 A4 | A4:2 D5 F5 | G5 F5 D5 B4 | C5:2 Eb5 G4 | F4:2 r:2 |
        Ab4:3 G4:.5 Ab4:.5 | C5:2 Ab4 F4 | Bb4:2 D5 G5 | Gb5:2 F5 Eb5 | D5:3 C5:.5 D5:.5 | F5:2 D5 B4 | C5 Eb5 A4 C5 | Bb4:2 r:2`,
  ch: 'Bbmaj7 G7 Cm7 F7 Dm7 G7 Cm7 F7 Fm7 Bb7 Ebmaj7 Ebm6 Dm7 G7 Cm7,F7 Bb6,F7',
};

function radio(Off, seed) {
  const sr = 16000, rnd = rng(seed + 202), spb = 0.5, T = tune(RADIO.mel, 4), N = Math.round(T.beats * spb * sr);
  const sw = (b) => { const i = Math.floor(b), f = b - i; return (i + (f < 0.5 ? f * 1.24 : 0.62 + (f - 0.5) * 0.76)) * spb; }; // swung eighths
  const lead = new Float32Array(N), pno = new Float32Array(N), br = new Float32Array(N);
  // Clarinet: odd harmonics, a little vibrato
  const clar = (n, f) => (n % 2 ? 1 : 0.15) / n / (1 + (n * f / 1800) ** 2);
  for (const e of T.ev) {
    const f = mtof(e.m), t = sw(e.beat) + (rnd() - 0.4) * 0.02;
    tone(lead, sr, t, sw(e.beat + e.len) - sw(e.beat) - 0.03, f, wt('c', f, sr, clar), e.down ? 0.5 : 0.42, 0.05, 0.09, 0.004, rnd());
  }
  // Piano: bass on one and three, chords on two and four; decaying tones
  const pi = (n, f) => n ** -1.2 / (1 + (n * f / 2500) ** 2);
  const key = (t, m, a, d) => { const f = mtof(m), tb = wt('p', f, sr, pi), dc = 1.6 * (262 / f) ** 0.4; tone(pno, sr, t, d, f, tb, a, 0.004, 0.12, 0, 0, dc); tone(pno, sr, t, d, f * 1.0009, tb, a * 0.6, 0.004, 0.12, 0, 0.3, dc); };
  let pb = 41, pv = null;
  for (const c of chords(RADIO.ch, 4)) {
    pb = near(c.bass, pb, 41, 34, 50);
    key(c.beat * spb, pb, 0.4, spb * 1.6);
    if (c.len === 4) { pb = near((c.root + 7) % 12, pb, 41, 34, 50); key((c.beat + 2) * spb, pb, 0.32, spb * 1.6); }
    pv = voicing(c.pcs, 53, 68, pv);
    for (const b of c.len === 4 ? [1, 3] : [1]) for (const m of pv) key(sw(c.beat + b) + rnd() * 0.012, m, 0.11, spb * 0.55);
  }
  // Brushes: a stirred swish across each half bar, taps on two and four, a soft ride pattern
  const env = new Float32Array(N), hb = 2 * spb * sr;
  for (let i = 0; i < N; i++) env[i] = 0.05 * Math.sin(Math.PI * (i % hb) / hb) ** 2;
  for (let b = 0; b < T.beats; b++) for (const [o, a] of [[0, 0.12], [0.5, 0.08], [b % 2 ? 0 : -1, 0.25]]) {
    if (o < 0) continue;
    const s = Math.round(sw(b + o) * sr), L = Math.round((a > 0.2 ? 0.09 : 0.04) * sr);
    for (let k = 0; k < L; k++) env[(s + k) % N] += a * (1 - k / L) ** 2;
  }
  for (let i = 0; i < N; i++) br[i] = env[i] * (rnd() * 2 - 1);
  filt(br, bq('hp', 2200, 0.7, sr), 2);
  const out = mix(mix(lead, pno, 1), br, 0.6);
  mix(out, verb(out, sr, 0.7, 0.3, 2), 0.25);
  // The little speaker: crackle and hiss first, then a narrow band, a boxy peak and soft clipping
  for (let i = 0; i < N; i++) { out[i] += 0.0025 * (rnd() * 2 - 1); if (rnd() < 7 / sr) out[i] += (rnd() - 0.5) * 0.12 * rnd() ** 2; }
  for (const c of [bq('hp', 250, 0.7, sr), bq('hp', 250, 0.7, sr), bq('lp', 3500, 0.7, sr), bq('lp', 3500, 0.7, sr), bq('pk', 1200, 1, sr, 4)]) filt(out, c, 2);
  let pk = 0;
  for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(out[i]));
  for (let i = 0; i < N; i++) out[i] = Math.tanh(1.4 * out[i] / pk);
  return finish(Off, [out], sr);
}

// ---------- the arcade doorway ----------

const ARC = {
  mel: `E5:1.5 D5:.5 C5 G4 | B4:3 r | C5:1.5 D5:.5 E5 A5 | G5:3 r | E5:1.5 D5:.5 C5 G4 | B4:2 E5 G5 | A5:1.5 G5:.5 F5 D5 | D5:2 B4 r`,
  ch: 'C Em Am F C Em F G',
};

function arcade(Off, seed) {
  const sr = 24000, rnd = rng(seed + 303), spb = 0.5, T = tune(ARC.mel, 4), N = Math.round(T.beats * spb * sr), out = new Float32Array(N);
  const soft = (f, n) => 1 / (1 + (n * f / 3000) ** 2);
  const pulse = (n, f) => Math.sin(Math.PI * n * 0.25) / n * soft(f, n), square = (n, f) => (n % 2) / n * soft(f, n);
  const tri = (n) => (n % 2) * ((n - 1) % 4 ? -1 : 1) / (n * n);
  for (const e of T.ev) { const f = mtof(e.m); tone(out, sr, e.beat * spb, e.len * spb * 0.9, f, wt('s', f, sr, square), 0.22, 0.006, 0.05, 0.006, 0); }
  let pb = 48;
  for (const c of chords(ARC.ch, 4)) {
    pb = near(c.root, pb, 48, 43, 55);
    for (const [b, m] of [[0, pb], [2, pb + 7]]) tone(out, sr, (c.beat + b) * spb, spb * 1.6, mtof(m), wt('t', mtof(m), sr, tri), 0.4, 0.005, 0.05);
    const v = voicing(c.pcs.slice(0, 3), 55, 67, null), arp = [v[0], v[1], v[2], v[0] + 12, v[2], v[1], v[0], v[1]];
    arp.forEach((m, k) => { const f = mtof(m); tone(out, sr, (c.beat + k / 2) * spb, 0.12, f, wt('p', f, sr, pulse), 0.14, 0.003, 0.05, 0, 0, 0.5); });
  }
  for (const b of [15.5, 31.5]) [84, 91].forEach((m, k) => tone(out, sr, (b + k * 0.12) * spb, 0.05, mtof(m), wt('s', mtof(m), sr, square), 0.06, 0.003, 0.04)); // two blips at each turn
  // Little echo (three eighths), then dark and quiet
  const d = Math.round(0.75 * sr), e = new Float32Array(N);
  for (let p = 0; p < 2; p++) for (let i = 0; i < N; i++) e[i] = out[i] + 0.3 * e[(i - d + N) % N];
  for (let i = 0; i < N; i++) out[i] = 0.8 * out[i] + 0.25 * e[(i - d + N) % N];
  filt(out, bq('lp', 2400, 0.7, sr), 2); filt(out, bq('lp', 2400, 0.7, sr), 2); filt(out, bq('hp', 100, 0.7, sr), 2);
  return finish(Off, [out], sr);
}

// ---------- voices: a glottal pulse through three moving formants ----------

// Vowel formants (F1, F2, F3), adult male; 8 is a closed-mouth hum
const VOW = [[730, 1090, 2440], [530, 1840, 2480], [300, 2250, 2950], [570, 840, 2410], [320, 900, 2250], [500, 1450, 2500], [650, 1700, 2400], [420, 1950, 2550], [270, 1250, 2250]];
const LOCUS = [1000, 1750, 2200, 1350]; // F2 where a consonant starts: lips, tongue tip, back, mixed

// syls: { d (s), v (vowel), f0, amp, on (0 none, 1 stop, 2 nasal, 3 hiss, 4 breath, 5 soft re-attack), c (onset share), lo, sl (pitch slope) }
function speak(sr, sp, syls, rnd) {
  const B = 32, n = Math.ceil((syls.reduce((a, s) => a + s.d, 0) + 0.12) * sr), out = new Float32Array(n);
  const bw = sp.bw || [90, 110, 170], kf = 1 - Math.exp(-B / (0.018 * sr)), ka = 1 - Math.exp(-B / (0.012 * sr)), kp = 1 - Math.exp(-B / ((sp.glide || 0.05) * sr));
  const F = VOW[syls[0].v].map((x) => x * sp.fs), y1 = [0, 0, 0], y2 = [0, 0, 0], cA = [0, 0, 0], cB = [0, 0, 0], cC = [0, 0, 0];
  let si = 0, s0 = 0, f0 = syls[0].f0, A = 0, Nz = 0, ph = rnd(), jit = 0, shim = 1, g0 = 0, nz0 = 0, drift = 0, lp = 0, Fz = 0;
  const kl = 1 - Math.exp(-TAU * (sp.tilt || 1100) / sr);
  for (let b = 0; b < n; b += B) {
    while (si < syls.length - 1 && b >= s0 + syls[si].d * sr) s0 += syls[si++].d * sr;
    const s = syls[si], u = (b - s0) / (s.d * sr);
    let tA, tN, tF = VOW[s.v];
    if (u >= 1) { tA = 0; tN = 0; }
    else if (s.on && u < s.c) {
      tA = [0, 0.1, 0.3, 0.04, 0, 0.55][s.on] * s.amp; tN = [0, 0.1, 0, 0.45, 0.5, 0][s.on] * s.amp;
      if (s.on < 4) tF = [250, LOCUS[s.lo], 2500];
    } else {
      const w = s.on ? (u - s.c) / (1 - s.c) : u;
      tA = s.amp * (s.pulse ? (1 - w) ** 1.5 : w > 0.7 ? 1 - (w - 0.7) * 1.3 : 1); tN = sp.br * 0.12 * s.amp;
    }
    for (let k = 0; k < 3; k++) {
      F[k] += kf * (tF[k] * sp.fs - F[k]);
      const r = Math.exp(-Math.PI * bw[k] / sr);
      cB[k] = 2 * r * Math.cos(TAU * F[k] / sr); cC[k] = -r * r; cA[k] = 1 - cB[k] - cC[k];
    }
    A += ka * (tA - A); Nz += ka * (tN - Nz); Fz += ka * ((s.on === 3 && u < s.c ? 0.3 * s.amp : 0) - Fz);
    drift += (rnd() - 0.5) * 0.004 - drift * 0.01;
    f0 += kp * (s.f0 * (1 + (s.sl || 0) * (Math.min(u, 1) - 0.5)) - f0);
    const vib = sp.vib ? 1 + sp.vib * Math.sin(TAU * 5.4 * b / sr) : 1;
    for (let i = b; i < Math.min(n, b + B); i++) {
      const f = f0 * (1 + drift + jit) * vib;
      ph += f / sr;
      if (ph >= 1) { ph -= 1; jit = (rnd() - 0.5) * 0.014; shim = 1 + (rnd() - 0.5) * 0.16; }
      // Rosenberg glottal pulse (open 60% of the cycle), differentiated for lip radiation
      const g = ph < 0.4 ? 0.5 - 0.5 * Math.cos(Math.PI * ph / 0.4) : ph < 0.6 ? Math.cos(Math.PI * (ph - 0.4) / 0.4) : 0;
      const nz = rnd() * 2 - 1;
      lp += kl * ((g - g0) * 0.13 * sr / f * A * shim + nz * Nz * (0.4 + 0.6 * g) - lp); // softer voice: extra spectral tilt
      let x = lp + (nz - nz0) * Fz;
      g0 = g; nz0 = nz;
      for (let k = 0; k < 3; k++) { const y = cA[k] * x + cB[k] * y1[k] + cC[k] * y2[k]; y2[k] = y1[k]; y1[k] = y; x = y; }
      out[i] = x;
    }
  }
  return out;
}

function speaker(rnd, woman) {
  return woman ? { f0: 175 + rnd() * 55, fs: 1.13 + rnd() * 0.06, rate: 4.2 + rnd() * 1.3, br: 0.3, g: 0.75 + rnd() * 0.3 }
    : { f0: 98 + rnd() * 35, fs: 0.96 + rnd() * 0.07, rate: 4 + rnd() * 1.3, br: 0.18, g: 0.8 + rnd() * 0.3 };
}

// A phrase of n syllables: pitch falls across it, stressed syllables lift, a question rises at the end
function phrase(sp, rnd, n, q) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const pos = k / Math.max(1, n - 1), st = rnd() < 0.33, last = k === n - 1, r = rnd();
    let f = sp.f0 * (1.12 - 0.24 * pos) * (st ? 1.08 + 0.14 * rnd() : 0.96 + 0.05 * rnd());
    if (last) f *= q ? 1.25 : 0.9;
    out.push({
      d: (0.65 + 0.5 * rnd()) / sp.rate * (st ? 1.25 : 0.9) * (last ? 1.45 : 1),
      v: st ? Math.floor(rnd() * 8) : [5, 5, 7, 2, 1, 6][Math.floor(rnd() * 6)],
      f0: f, amp: st ? 1 : 0.62 + 0.15 * rnd(),
      on: r < 0.15 ? 0 : r < 0.47 ? 1 : r < 0.8 ? 2 : r < 0.95 ? 3 : 4,
      c: 0.18 + 0.12 * rnd(), lo: Math.floor(rnd() * 4), sl: (rnd() - 0.6) * 0.16 + (last && q ? 0.3 : 0),
    });
  }
  return out;
}

// "Ha-ha-ha": breathy, high, each pulse a little lower and softer
function laughter(sp, rnd) {
  const n = 4 + Math.floor(rnd() * 4), out = [];
  let f = sp.f0 * (1.55 + 0.3 * rnd());
  for (let k = 0; k < n; k++) {
    out.push({ d: 0.15 + 0.05 * rnd(), v: rnd() < 0.7 ? 0 : 6, f0: f, amp: 1 - k / (n + 2), on: 4, c: 0.35, lo: 0, sl: -0.25, pulse: 1 });
    f *= 0.93 + 0.03 * rnd();
  }
  return out;
}

function laughAt(out, sr, sps, rnd, t, who = 1 + Math.floor(rnd() * sps.length)) {
  for (let k = 0; k < Math.min(who, sps.length); k++) {
    const sp = { ...sps[k], br: 0.55 };
    addAt(out, speak(sr, sp, laughter(sp, rnd), rnd), (t + (k ? 0.1 + rnd() * 0.35 : 0)) * sr, sp.g * (k ? 0.35 : 0.5));
  }
}

// One table talking for L seconds: turns, short pauses, a listener's "mm-hm", now and then a laugh
function table(out, sr, sps, rnd, L) {
  let t = 0.1 + rnd() * 1.2, who = Math.floor(rnd() * sps.length);
  for (let guard = 0; guard < 400; guard++) {
    const turns = 1 + Math.floor(rnd() * 3);
    for (let j = 0; j < turns; j++) {
      const sp = sps[who], syl = phrase(sp, rnd, 3 + Math.floor(rnd() * 10), rnd() < 0.15), d = syl.reduce((a, s) => a + s.d, 0);
      if (t + d > L - 0.15) return;
      addAt(out, speak(sr, sp, syl, rnd), t * sr, sp.g);
      if (sps.length > 1 && rnd() < 0.3) {
        const o = sps[(who + 1 + Math.floor(rnd() * (sps.length - 1))) % sps.length], bc = phrase(o, rnd, 1 + Math.floor(rnd() * 2), false);
        addAt(out, speak(sr, o, bc, rnd), (t + d * (0.4 + 0.5 * rnd())) * sr, o.g * 0.45);
      }
      t += d + 0.12 + rnd() * 0.4;
    }
    if (rnd() < 0.13 && t + 1.6 < L) { laughAt(out, sr, sps, rnd, t); t += 1.1 + rnd() * 0.5; }
    if (sps.length > 1) who = (who + 1 + Math.floor(rnd() * (sps.length - 1))) % sps.length;
    t += Math.max(0.05, -0.1 + rnd() * 0.6);
  }
}

// Distance: per-table dulling and level, outdoor early reflections off the façades, a short tail
function place(L, R, mono, sr, d, pan, passes) {
  filt(mono, bq('lp', 3600 - 70 * d, 0.6, sr), passes);
  const g = 10 / d, a = (pan + 1) * Math.PI / 4;
  mix(L, mono, g * Math.cos(a)); mix(R, mono, g * Math.sin(a));
}
function space(L, R, sr, passes) {
  const N = L.length, M = new Float32Array(N);
  for (let i = 0; i < N; i++) M[i] = 0.5 * (L[i] + R[i]);
  for (const [t, gl, gr] of [[0.009, 0.3, 0.18], [0.014, 0.16, 0.28], [0.023, 0.2, 0.12], [0.031, 0.1, 0.18], [0.047, 0.1, 0.07], [0.063, 0.05, 0.08]]) {
    const o = Math.round(t * sr);
    for (let i = 0; i < N; i++) { const v = M[i], j = (i + o) % N; L[j] += v * gl; R[j] += v * gr; }
  }
  mix(L, verb(M, sr, 0.9, 0.5, passes), 0.18); mix(R, verb(M, sr, 0.9, 0.5, passes, 23), 0.18);
  for (const x of [L, R]) { filt(x, bq('lp', 2800, 0.7, sr), passes); filt(x, bq('hp', 110, 0.7, sr), passes); }
}

// Café talk as a stereo loop: tables = [[voices, metres, pan]]
function walla(Off, seed, tables, secs) {
  const sr = 24000, rnd = rng(seed + 404), N = secs * sr, L = new Float32Array(N), R = new Float32Array(N);
  for (const [nv, d, pan] of tables) {
    const sps = Array.from({ length: nv }, (_, k) => speaker(rnd, (k + (rnd() < 0.5 ? 1 : 0)) % 2 === 1)), mono = new Float32Array(N);
    table(mono, sr, sps, rnd, secs);
    const o = Math.floor(rnd() * N), r = mono.slice(); // tables pause at different moments, never all at the seam
    for (let i = 0; i < N; i++) mono[(i + o) % N] = r[i];
    place(L, R, mono, sr, d, pan, 2);
  }
  space(L, R, sr, 2);
  return finish(Off, [L, R], sr);
}

function laughShot(Off, seed) {
  const sr = 24000, rnd = rng(seed + 505), N = Math.round(2.8 * sr), L = new Float32Array(N), R = new Float32Array(N), m = new Float32Array(N);
  const sps = [0, 1, 2].map((k) => speaker(rnd, (k + seed) % 2 === 0));
  laughAt(m, sr, sps, rnd, 0.05, 2 + (seed % 2));
  place(L, R, m, sr, 12, (rnd() - 0.5) * 0.4, 1);
  space(L, R, sr, 1);
  return finish(Off, [L.map((v, i) => 0.5 * (v + R[i]))], sr, true);
}

// Humming with the mouth closed: a short happy phrase (semitones above a tonic, beats)
const HUMS = [
  { f: 110, bpm: 150, notes: [[0, 0.5], [2, 0.5], [4, 1], [2, 0.5], [4, 0.5], [7, 1.5]] },
  { f: 131, bpm: 138, notes: [[7, 0.5], [4, 0.5], [5, 0.5], [7, 1], [9, 0.5], [7, 1.5]] },
  { f: 117, bpm: 132, notes: [[4, 0.75], [5, 0.25], [7, 1], [4, 0.5], [2, 0.5], [0, 1.5]] },
];
function humShot(Off, seed) {
  const sr = 24000, rnd = rng(seed + 606), h = HUMS[seed % 3], spb = 60 / h.bpm;
  const sp = { fs: 1, br: 0.08, bw: [70, 260, 420], glide: 0.03, vib: 0.01 };
  const syl = h.notes.map(([s, b], k) => ({ d: b * spb, v: 8, f0: h.f * 2 ** (s / 12), amp: k === h.notes.length - 1 ? 0.9 : 1, on: k ? 5 : 0, c: 0.12, sl: 0 }));
  const x = speak(sr, sp, syl, rnd), N = x.length + Math.round(0.25 * sr), out = new Float32Array(N);
  out.set(x, Math.round(0.03 * sr));
  filt(out, bq('lp', 1400, 0.7, sr)); filt(out, bq('lp', 1400, 0.7, sr)); filt(out, bq('hp', 80, 0.7, sr));
  mix(out, verb(out, sr, 0.5, 0.5, 1), 0.12);
  return finish(Off, [out], sr, true);
}

export const RECIPES = {
  musette: { kind: 'loop', variants: 1, seconds: 41.5, render: ({ OfflineAudioContext: O, seed }) => waltz(O, seed, W1) },
  musette2: { kind: 'loop', variants: 1, seconds: 37.9, render: ({ OfflineAudioContext: O, seed }) => waltz(O, seed, W2) },
  radio: { kind: 'loop', variants: 1, seconds: 32, render: ({ OfflineAudioContext: O, seed }) => radio(O, seed) },
  arcade: { kind: 'loop', variants: 1, seconds: 16, render: ({ OfflineAudioContext: O, seed }) => arcade(O, seed) },
  hum: { kind: 'shot', variants: 3, render: ({ OfflineAudioContext: O, seed }) => humShot(O, seed) },
  murmur: { kind: 'loop', variants: 1, seconds: 20, render: ({ OfflineAudioContext: O, seed }) => walla(O, seed, [[3, 11, -0.4], [2, 14, 0.5], [2, 19, 0.05]], 20) },
  murmurbig: { kind: 'loop', variants: 1, seconds: 20, render: ({ OfflineAudioContext: O, seed }) => walla(O, seed, [[3, 9, -0.5], [3, 12, 0.4], [2, 15, -0.1], [2, 19, 0.7]], 20) },
  murmursmall: { kind: 'loop', variants: 1, seconds: 20, render: ({ OfflineAudioContext: O, seed }) => walla(O, seed, [[3, 9, 0.1]], 20) },
  laugh: { kind: 'shot', variants: 3, render: ({ OfflineAudioContext: O, seed }) => laughShot(O, seed) },
};
