// Foley for Living Town: steps, paws, café clinks, bells, doors, shutters.
// Everything is synthesised: damped modes for things that ring, shaped noise
// for things that scuff, short early reflections for the street around them.

const PI2 = Math.PI * 2, E = Math.exp;

// mulberry32: small seeded PRNG
const rng = s => () => {
  s = s + 0x6D2B79F5 | 0;
  let t = Math.imul(s ^ s >>> 15, 1 | s);
  t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
const rr = (r, a, b) => a + (b - a) * r();
const buf = (sr, s) => new Float32Array(Math.ceil(sr * s));
const z = o => new Float32Array(o.length);
const add = (o, x, g = 1) => { for (let i = 0; i < o.length; i++) o[i] += g * x[i]; return o; };

// RBJ biquad, in place. k: 0 lowpass, 1 highpass, 2 bandpass
function bq(x, sr, k, f, q = .707) {
  const w = PI2 * Math.min(f, sr * .45) / sr, c = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al;
  let b0, b1, b2;
  if (k == 0) { b1 = (1 - c) / a0; b0 = b2 = b1 / 2; }
  else if (k == 1) { b1 = -(1 + c) / a0; b0 = b2 = -b1 / 2; }
  else { b0 = al / a0; b1 = 0; b2 = -b0; }
  const a1 = -2 * c / a0, a2 = (1 - al) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i], y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = v; y2 = y1; y1 = y; x[i] = y;
  }
  return x;
}

// noise burst at t: attack `at`, exponential decay `tau`
function nb(o, sr, r, t, a, tau, at = .0003) {
  const i0 = t * sr | 0, n = Math.min(o.length - i0, (tau * 7 + at) * sr | 0), ka = E(-1 / (at * sr)), kd = E(-1 / (tau * sr));
  let ga = 1, gd = a;
  for (let i = 0; i < n; i++) { o[i0 + i] += (1 - ga) * gd * (r() * 2 - 1); ga *= ka; gd *= kd; }
  return o;
}
// the same, through a filter
const nbf = (o, sr, r, t, a, tau, k, f, q, at) => add(o, bq(nb(z(o), sr, r, t, a, tau, at), sr, k, f, q));

// sustained noise from t for d seconds, sine envelope, with a rough wobble
function sus(o, sr, r, t, d, a, rough = 0) {
  const i0 = t * sr | 0, n = Math.min(o.length - i0, d * sr | 0);
  let m = 0;
  for (let i = 0; i < n; i++) {
    m = m * .997 + (r() * 2 - 1) * .08;
    o[i0 + i] += a * Math.sin(Math.PI * i / n) * Math.max(0, 1 + rough * m * 3) * (r() * 2 - 1);
  }
  return o;
}

// smooth contact pulse (raised cosine) of width w, area a: drives resonators
function hit(x, sr, t, a, w = .0004) {
  const m = Math.max(2, w * sr | 0), i0 = t * sr | 0;
  for (let i = 0; i < m && i0 + i < x.length; i++) x[i0 + i] += a * 2 / m * (.5 - .5 * Math.cos(PI2 * (i + .5) / m));
  return x;
}

// two-pole resonator driven by x, added to o (impulse in -> sine of amplitude g)
function res(o, x, sr, f, t60, g) {
  if (f > sr * .45) return;
  const w = PI2 * f / sr, d = E(-6.9 / (t60 * sr)), c = 2 * Math.cos(w) * d, d2 = d * d, b = g * Math.sin(w);
  let y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const y = b * x[i] + c * y1 - d2 * y2; y2 = y1; y1 = y; o[i] += y; }
}
const bank = (o, x, sr, F, T, G) => F.forEach((f, k) => res(o, x, sr, f, T[k], G[k]));

// one freely ringing mode from t (starts at zero phase), optional soft attack
function ring(o, sr, t, f, a, t60, at = 0) {
  if (f > sr * .45) return;
  const i0 = t * sr | 0, w = PI2 * f / sr, d = E(-6.9 / (t60 * sr)), c = 2 * Math.cos(w) * d, d2 = d * d,
    n = Math.min(o.length - i0, t60 * 1.4 * sr | 0), ka = at ? E(-1 / (at * sr)) : 0;
  let y0 = 0, y1 = a * d * Math.sin(w), ga = 1;
  for (let i = 0; i < n; i++) { o[i0 + i] += y0 * (1 - ga); ga *= ka; const y = c * y1 - d2 * y0; y0 = y1; y1 = y; }
}
// a set of modes: ratios R, amps A, decays T; sp splits each mode into a beating pair
function modes(o, sr, t, f0, R, A, T, a, at = 0, sp = 0) {
  R.forEach((k, i) => {
    ring(o, sr, t, f0 * k, a * A[i] * (sp ? .72 : 1), T[i], at);
    if (sp) ring(o, sr, t, f0 * k + sp * (1 + i * .3), a * A[i] * .28, T[i] * .9, at);
  });
}

// early reflections: delayed, darker copies
function er(o, sr, taps, lp) {
  const c = bq(o.slice(), sr, 0, lp);
  for (const [ms, g] of taps) { const d = ms * sr / 1e3 | 0; for (let i = d; i < o.length; i++) o[i] += g * c[i - d]; }
}

// small Schroeder reverb with damped combs
function verb(o, sr, t60, wet, lp = 3000) {
  const x = bq(o.slice(), sr, 0, lp), y = z(o);
  for (const ms of [29.7, 37.1, 41.1, 43.7, 47.9, 53.3]) {
    const d = ms * sr / 1e3 | 0, g = 10 ** (-3 * ms / 1e3 / t60), b = new Float32Array(d);
    let p = 0, l = 0;
    for (let i = 0; i < x.length; i++) { const v = b[p]; l = v * .7 + l * .3; b[p] = x[i] + g * l; p = (p + 1) % d; y[i] += v; }
  }
  for (const ms of [5, 1.7]) {
    const d = ms * sr / 1e3 | 0, b = new Float32Array(d);
    let p = 0;
    for (let i = 0; i < y.length; i++) { const v = b[p], u = y[i] + .7 * v; b[p] = u; y[i] = v - .7 * u; p = (p + 1) % d; }
  }
  add(o, y, wet / 6);
}

// DC out, short fades, normalise (-6 dBFS peak, or an RMS target for loops)
function fin(O, sr, o, rms) {
  const n = o.length;
  if (!rms) {
    bq(o, sr, 1, 30, .6);
    const fi = sr * .001 | 0, fo = Math.min(sr * .3, n * .25) | 0;
    for (let i = 0; i < fi; i++) o[i] *= i / fi;
    for (let i = 0; i < fo; i++) o[n - 1 - i] *= .5 - .5 * Math.cos(Math.PI * i / fo);
  }
  let p = 0, s = 0;
  for (const v of o) { p = Math.max(p, Math.abs(v)); s += v * v; }
  const g = rms ? Math.min(rms / Math.sqrt(s / n), .9 / p) : .5 / p;
  for (let i = 0; i < n; i++) o[i] *= g;
  const b = new O(1, n, sr).createBuffer(1, n, sr);
  b.copyToChannel(o, 0);
  return b;
}

let salt = 0;
const shot = (variants, fn, rate) => {
  const k = ++salt * 7919;
  return { kind: 'shot', variants, render: async ({ OfflineAudioContext: O, sampleRate, seed }) => {
    const sr = rate || sampleRate;
    return fin(O, sr, fn(sr, rng(k + seed * 104729), seed));
  } };
};

// a footstep on stone: heel strike, sole rolling through, toe-off, a few grains of grit
function foot(sr, r, hb, roll, gap, lp, click) {
  const o = buf(sr, .34), x = z(o), t = .004 + r() * .006, t3 = t + rr(r, gap, gap * 1.4);
  hit(x, sr, t, .35, .003); hit(x, sr, t3, .12, .003);
  res(o, x, sr, rr(r, 85, 120), .05, 1); res(o, x, sr, rr(r, 240, 380), .035, .7);
  nbf(o, sr, r, t, .7, .005, 2, hb * rr(r, .85, 1.2), .8);
  nbf(o, sr, r, t + rr(r, .015, .03), roll, .03, 2, rr(r, 900, 1500), .6, .012);
  nbf(o, sr, r, t3, .35, .01, 2, hb * rr(r, 1.1, 1.5), .9, .002);
  if (click) {
    const f = rr(r, 2000, 2600), R = [1, 1.71, 2.6], A = [1, .5, .25], T = [.03, .02, .015];
    modes(o, sr, t, f, R, A, T, click); modes(o, sr, t3, f * 1.1, R, A, T, click * .4);
  }
  const g = z(o);
  for (let k = 0; k < 10; k++) g[(t + r() * (t3 - t + .04)) * sr | 0] += rr(r, -.4, .4);
  add(o, bq(g, sr, 2, rr(r, 3500, 5000), 1.2));
  bq(o, sr, 0, lp, .6);
  er(o, sr, [[6, .15], [11, .1], [19, .06]], 2500);
  return o;
}

// metal roller shutter: slats click over the drum, rumble, then the stop
function shutter(sr, r, up) {
  const o = buf(sr, 2.3), x = z(o), F = [], T = [], G = [], end = up ? 1.8 : 1.7;
  for (let k = 0; k < 16; k++) { F.push(250 * 12 ** r()); T.push(rr(r, .02, .07)); G.push(rr(r, .2, .5)); }
  let t = up ? .22 : .05, rate = up ? 5 : 9;
  const t0 = t;
  if (up) hit(x, sr, .03, .7, .004);
  while (t < end) { const a = rr(r, .2, .5); hit(x, sr, t, a, .001); nbf(o, sr, r, t, a * .25, .003, 2, rr(r, 900, 1800), .9); t += 1 / rate; rate = Math.min(rate * (up ? 1.07 : 1.05), up ? 14 : 19); }
  sus(x, sr, r, t0, end - t0, .02, 1);
  hit(x, sr, end + .03, up ? .7 : 1.2, .003);
  if (!up) hit(x, sr, end + .12, .3, .003);
  bank(o, x, sr, F, T, G);
  const y = z(o);
  sus(y, sr, r, t0, end - t0, .25, 1); bq(y, sr, 0, 220); bq(y, sr, 0, 220); add(o, y);
  hit(y.fill(0), sr, end + .03, 1.2, .006); res(o, y, sr, up ? 140 : 85, .15, 1);
  bq(o, sr, 0, 2600, .6);
  er(o, sr, [[11, .25], [27, .15], [52, .1]], 2000);
  verb(o, sr, .9, .25, 2000);
  return o;
}

export const RECIPES = {
  step: shot(6, (sr, r) => foot(sr, r, 1000, .3, .1, 3500, 0)),
  stepheel: shot(4, (sr, r) => foot(sr, r, 2200, .18, .11, 9000, .5)),
  run: shot(4, (sr, r) => foot(sr, r, 1300, .2, .05, 4500, 0)),

  // walking stick tip on stone: a hard little tock with a bounce
  cane: shot(3, (sr, r) => {
    const o = buf(sr, .3), x = z(o), t = .005;
    hit(x, sr, t, 1, .0003); hit(x, sr, t + rr(r, .006, .012), .15, .0003);
    bank(o, x, sr, [rr(r, 700, 850), rr(r, 1800, 2100), rr(r, 3300, 3800), 5600], [.05, .035, .025, .015], [.5, .35, .25, .15]);
    nbf(o, sr, r, t, .5, .0015, 2, 3500, .8);
    bq(o, sr, 0, 7000, .6);
    er(o, sr, [[6, .15], [11, .1], [19, .06]], 3000);
    return o;
  }),

  // terrier paws: a few claw clicks, each with a soft pad
  paw: shot(4, (sr, r) => {
    const o = buf(sr, .25), n = 2 + (r() * 3 | 0);
    let t = .005;
    for (let k = 0; k < n; k++) {
      const a = rr(r, .4, 1);
      nbf(o, sr, r, t, a, .0008, 2, rr(r, 3500, 6000), 1.2, .0001);
      nbf(o, sr, r, t + .002, a * .6, .008, 0, 600, .7, .002);
      t += rr(r, .018, .05);
    }
    er(o, sr, [[5, .12], [10, .08]], 4000);
    return o;
  }),

  // two small collar tags knocking together as the dog trots
  jingle: shot(4, (sr, r) => {
    const o = buf(sr, .8), n = 6 + (r() * 5 | 0), R = [1, 1.62, 2.29, 3.05], A = [1, .5, .3, .15], T = [.18, .12, .08, .05];
    let t = .005;
    for (let k = 0; k < n; k++) {
      const a = rr(r, .15, 1) ** 2, w = r();
      if (w < .7) modes(o, sr, t, 3100 * rr(r, .98, 1.02), R, A, T, a * .5);
      if (w > .4) modes(o, sr, t + rr(r, .001, .006), 3900 * rr(r, .98, 1.02), R, A, T, a * .4);
      nbf(o, sr, r, t, a * .5, .0004, 2, 6500, 1);
      t += rr(r, .015, .1);
    }
    bq(o, sr, 0, 9000, .6);
    return o;
  }),

  // domed thumb bell, two rattling rings, heard from across the square
  bikebell: shot(3, (sr, r, s) => {
    const o = buf(sr, 1.9), f = [1850, 2000, 1720][s];
    for (const [t, a] of [[.01, 1], [.035, .55], [.06, .3], [.24, .9], [.265, .5], [.29, .28]]) {
      modes(o, sr, t + r() * .004, f, [1, 2.32, 3.86, 5.53], [1, .4, .18, .07], [1.3, .7, .4, .22], a, .0003, 3);
      nbf(o, sr, r, t, a * .25, .0006, 2, 5000, 1);
    }
    bq(o, sr, 0, 4500, .6);
    er(o, sr, [[9, .25], [23, .15], [41, .1]], 3000);
    verb(o, sr, 1, .15);
    return o;
  }),

  // freewheel pawls ticking while coasting, over a soft tyre hiss. Built over two
  // identical periods and the second one kept, so the loop is exactly periodic.
  freewheel: { kind: 'loop', variants: 1, seconds: 2, render: async ({ OfflineAudioContext: O }) => {
    const sr = 24000, L = 2 * sr, N = 46, r = rng(4242), x = new Float32Array(2 * L), o = z(x), w = z(x);
    for (let k = 0; k < N; k++) {
      const p = (k + .5 + rr(r, -.06, .06)) / N * 2, a = (.75 + .25 * Math.cos(PI2 * k / 23)) * rr(r, .8, 1);
      hit(x, sr, p, a, .0002); hit(x, sr, p + 2, a, .0002);
    }
    bank(o, x, sr, [2600, 4300, 6100, 8200], [.025, .018, .012, .008], [.5, .4, .3, .15]);
    for (let i = 0; i < L; i++) w[i] = w[i + L] = r() * 2 - 1;
    bq(w, sr, 0, 500); bq(w, sr, 1, 70);
    for (let i = 0; i < 2 * L; i++) o[i] += .5 * w[i] * (1 + .25 * Math.sin(PI2 * i / sr));
    return fin(O, sr, bq(o, sr, 0, 7000).slice(L), .063);
  } },

  // café: cup set on its saucer (0-2), or a spoon against the cup (3-5)
  cup: shot(6, (sr, r, s) => {
    const o = buf(sr, 1), x = z(o), cf = rr(r, 1700, 2300), sf = rr(r, 1150, 1450);
    const cup = (t, a, T) => modes(o, sr, t, cf, [1, 2.83, 5.42, 8.77], [1, .5, .25, .1], [T, T * .6, T * .4, T * .25], a, .0002, 1.5);
    let t = .01;
    if (s < 3) {
      for (const a of [1, rr(r, .3, .6), rr(r, 0, .25)]) {
        hit(x, sr, t, a, .0003); cup(t, a * .35, .25); nbf(o, sr, r, t, a * .3, .0006, 2, 4500, 1);
        t += rr(r, .008, .03);
      }
      bank(o, x, sr, [sf, sf * 1.73, sf * 2.6, sf * 3.9, sf * 5.2], [.2, .15, .12, .08, .06], [.6, .45, .3, .2, .12]);
      res(o, x, sr, 190, .04, .3);
    } else {
      for (let k = 0, n = 2 + (r() * 2 | 0); k < n; k++) {
        const a = rr(r, .5, 1) * (1 - k * .2);
        cup(t, a * .5, .7);
        modes(o, sr, t, rr(r, 4800, 5600), [1, 2.7, 5.1], [.4, .2, .08], [.08, .05, .03], a * .4);
        nbf(o, sr, r, t, a * .2, .0004, 2, 7000, 1);
        t += rr(r, .09, .17);
      }
    }
    bq(o, sr, 0, 9000, .6);
    er(o, sr, [[5, .15], [12, .1]], 4000);
    return o;
  }),

  // two wine glasses touching: two slightly different bowls, beating gently
  glass: shot(4, (sr, r) => {
    const o = buf(sr, 2.8), f1 = rr(r, 700, 880), f2 = f1 * rr(r, 1.05, 1.13),
      R = [1, 2.4, 4.4, 6.9], A = [1, .35, .15, .06], T = [2.4, 1.3, .7, .4];
    modes(o, sr, .01, f1, R, A, T, .5, .0003, .8);
    modes(o, sr, .01, f2, R, A, T.map(t => t * .9), .45, .0003, 1.1);
    if (r() < .5) modes(o, sr, .017, f2, R, A, T, .12, .0003);
    nbf(o, sr, r, .01, .35, .0004, 2, 6000, 1);
    er(o, sr, [[7, .12], [16, .08]], 5000);
    return o;
  }),

  // fork or knife on a plate: taps, a double touch, or a tiny scrape
  cutlery: shot(4, (sr, r, s) => {
    const o = buf(sr, .6), x = z(o), pf = rr(r, 1100, 1350);
    let t = .01;
    const tap = (t, a) => {
      hit(x, sr, t, a, .0002);
      modes(o, sr, t, rr(r, 3000, 3400), [1, 1.75, 2.7], [.3, .2, .1], [.05, .04, .03], a);
      nbf(o, sr, r, t, a * .25, .0004, 2, 6000, 1);
    };
    if (s == 2) {
      for (let k = 0; k < 30; k++) hit(x, sr, t + k * .0035 + r() * .001, rr(r, .02, .08), .0002);
      nbf(o, sr, r, t + .05, .06, .03, 2, 3500, .7, .03);
      t += .13;
    }
    tap(t, 1);
    if (s == 1) tap(t + rr(r, .07, .12), .6);
    if (s == 3) tap(t + rr(r, .012, .02), .5);
    bank(o, x, sr, [pf, pf * 1.62, pf * 2.3, pf * 3.4, pf * 4.6], [.35, .3, .22, .15, .1], [.25, .2, .15, .1, .08]);
    bq(o, sr, 0, 8000, .6);
    er(o, sr, [[5, .15], [12, .1]], 4000);
    return o;
  }),

  // bistro chair nudged on stone: a short, dark stick-slip slide, then set down
  chair: shot(3, (sr, r, s) => {
    const o = buf(sr, .9), x = z(o), d = s == 1 ? .1 : rr(r, .18, .32), t0 = .02;
    let t = t0, f = rr(r, 35, 55);
    while (t < t0 + d) { hit(x, sr, t, Math.sin(Math.PI * (t - t0) / d) * rr(r, .05, .12), .0015); t += 1 / (f *= rr(r, .97, 1.04)); }
    sus(x, sr, r, t0, d, .03, 1);
    bank(o, x, sr, [rr(r, 380, 460), rr(r, 720, 840), rr(r, 1250, 1450), rr(r, 2000, 2300)], [.1, .08, .06, .05], [.6, .5, .35, .2]);
    if (s != 2) {
      const y = z(o), tk = t0 + d + .02;
      hit(y, sr, tk, .7, .002);
      if (s == 1) hit(y, sr, tk + .04, .5, .002);
      res(o, y, sr, rr(r, 180, 240), .05, 1);
      bank(o, y, sr, [900, 1650], [.05, .04], [.2, .12]);
    }
    bq(o, sr, 0, 2400, .6); bq(o, sr, 0, 3500, .6);
    er(o, sr, [[8, .2], [19, .12], [33, .07]], 2000);
    return o;
  }, 24000),

  // old street lamp striking: relay tick, then a faint 100 Hz hum swelling in
  lamptink: shot(3, (sr, r, s) => {
    const o = buf(sr, 1.4), t = .01, i0 = (t + .01) * sr | 0, A = [1, .5, .35, .2, .12, .08];
    nbf(o, sr, r, t, 1, .0005, 2, rr(r, 2500, 3500), 1.2);
    modes(o, sr, t, rr(r, 1900, 2500), [1, 2.1, 3.3], [.25, .12, .06], [.05, .03, .02], 1);
    for (let i = i0; i < o.length; i++) {
      const u = (i - i0) / sr;
      let e = (1 - E(-u / .25)) * E(-u / .7), v = 0;
      if (s == 2 && u < .16) e *= .6 + .4 * Math.cos(PI2 * u / .05);
      for (let h = 0; h < 6; h++) v += A[h] * Math.sin(PI2 * 100 * (h + 1) * u);
      o[i] += .12 * e * v;
    }
    er(o, sr, [[7, .12], [15, .08]], 3000);
    return o;
  }, 24000),

  shutter: shot(2, (sr, r) => shutter(sr, r, 0), 24000),
  shutterup: shot(2, (sr, r) => shutter(sr, r, 1), 24000),

  // letter into the post box: brass flap lifts, paper slides, flap snaps, letter lands
  letter: shot(3, (sr, r) => {
    const o = buf(sr, 1), x = z(o), p = z(o), d = rr(r, .18, .3), bf = rr(r, 1800, 2100),
      B = [1, 1.68, 2.62, 3.9], BA = [.5, .3, .15, .07], BT = [.09, .07, .05, .03],
      tc = .05 + d + rr(r, .02, .05), tl = tc + rr(r, .08, .15);
    modes(o, sr, .02, bf, B, BA, BT, .25, .0005);
    nbf(o, sr, r, .02, .15, .002, 2, 2500, 1);
    sus(p, sr, r, .05, d, .12, 1.5); bq(p, sr, 2, rr(r, 2200, 3200), .9); bq(p, sr, 0, 5000); add(o, p);
    modes(o, sr, tc, bf, B, BA, BT, 1, .0003);
    nbf(o, sr, r, tc, .3, .0008, 2, 4000, 1);
    hit(x, sr, tc, .6, .002); hit(x, sr, tl, .5, .006);
    bank(o, x, sr, [rr(r, 150, 190), rr(r, 300, 360), 520], [.08, .06, .04], [.8, .4, .2]);
    nbf(o, sr, r, tl, .2, .01, 0, 900, .7);
    er(o, sr, [[6, .15], [14, .1]], 3000);
    return o;
  }),

  // the post office chime: two warm tuned bars, felt mallet, gentle shimmer
  chime: shot(3, (sr, r, s) => {
    const o = buf(sr, 3.8);
    [[659.26, 523.25], [587.33, 440], [523.25, 659.26]][s].forEach((f, k) => {
      const t = .01 + k * .45, a = k ? .85 : 1;
      modes(o, sr, t, f, [1, 2, 2.76, 5.4], [1, .07, .2, .05], [3, 1.6, 1.1, .5], a, .002, .6);
      nbf(o, sr, r, t, a * .08, .004, 0, 1200, .7);
    });
    er(o, sr, [[8, .15], [19, .1], [31, .06]], 3000);
    verb(o, sr, 1.4, .15, 3500);
    return o;
  }, 24000),

  // a church bell far up the hill: minor-third bell partials, darkened by distance
  churchbell: shot(2, (sr, r, s) => {
    const o = buf(sr, 6.5), P = [208, 233][s];
    modes(o, sr, .02, P, [.5, 1, 1.19, 1.5, 2, 2.51, 2.66, 3.01, 4.17], [.45, .35, .4, .15, .55, .22, .18, .12, .06],
      [9, 6, 5, 3, 4, 2.2, 2, 1.6, 1], 1, .002, .7);
    nbf(o, sr, r, .02, .25, .004, 0, 1500, .7);
    bq(o, sr, 0, 1700, .6);
    er(o, sr, [[45, .3], [90, .2], [150, .12], [230, .08]], 1400);
    verb(o, sr, 3, .4, 1500);
    return o;
  }, 24000),

  // a handful of people clapping, each with their own pace and hand shape
  applause: shot(2, (sr, r, s) => {
    const o = buf(sr, 3.6), n = [8, 11][s];
    for (let p = 0; p < n; p++) {
      const x = z(o), rate = rr(r, 3.6, 5.2), st = r() * .35, en = rr(r, 2.4, 3.2), ld = rr(r, .5, 1);
      for (let t = st; t < en; t += rr(r, .9, 1.1) / rate)
        nb(x, sr, r, t, ld * Math.min(1, (t - st) / .3 + .3) * Math.min(1, (en - t) / .6 + .2) * rr(r, .7, 1), rr(r, .004, .008), .0004);
      add(o, bq(x, sr, 2, rr(r, 900, 2300), rr(r, 1.2, 2.2)));
    }
    bq(o, sr, 0, 4500, .6);
    er(o, sr, [[13, .25], [31, .15], [57, .1]], 2500);
    verb(o, sr, 1, .2, 3000);
    return o;
  }, 24000),

  // workshop through a closed window: hammer on wood, on a nail, a ratchet, a vice
  taps: shot(4, (sr, r, s) => {
    const o = buf(sr, 1), x = z(o), m = z(o);
    const T = [[.03, .4], [.03, .21, .38], [], [.03]][s];
    T.forEach((t, k) => {
      const a = k ? .75 : 1;
      hit(x, sr, t, a, .0008);
      modes(m, sr, t, rr(r, 2700, 3100), [1, 1.6], [.3, .15], [.05, .03], a);
      if (s == 1) modes(m, sr, t, 3300, [1, 2.4], [.5, .2], [.12, .07], a);
      if (s == 3) modes(m, sr, t, 1450, [1, 2.2, 3.6], [.6, .3, .15], [.25, .15, .1], a);
    });
    if (s == 2) for (let k = 0; k < 5; k++) { const t = .03 + k * .07; nbf(m, sr, r, t, .5, .0005, 2, 3200, 1.2); ring(m, sr, t, 2200, .2, .02); }
    bank(o, x, sr, [rr(r, 240, 290), rr(r, 560, 650), rr(r, 1050, 1250)], [.05, .04, .03], [.8, .5, .3]);
    add(o, m);
    er(o, sr, [[4, .35], [9, .25], [15, .15]], 4000);
    verb(o, sr, .35, .25, 3000);
    bq(o, sr, 0, 1200, .7); bq(o, sr, 0, 1500, .7); bq(o, sr, 1, 120, .7);
    return o;
  }, 24000),

  // a wooden front door closing softly down the street
  door: shot(2, (sr, r, s) => {
    const o = buf(sr, 1.6), x = z(o), w = z(o), t = .3;
    sus(w, sr, r, .02, .32, .15); bq(w, sr, 0, 350, .7); add(o, w);
    if (s) hit(x, sr, t - .12, .3, .006);
    modes(o, sr, t - .02, rr(r, 1600, 1800), [1, 1.7], [.2, .1], [.03, .02], 1);
    hit(x, sr, t, 1, .005);
    bank(o, x, sr, [rr(r, 90, 105), rr(r, 135, 150), rr(r, 220, 250), rr(r, 390, 430), 700], [.18, .14, .1, .07, .05], [1, .7, .45, .3, .15]);
    modes(o, sr, t + .012, rr(r, 2000, 2300), [1, 1.65, 2.5], [.4, .25, .12], [.05, .04, .03], 1);
    bq(o, sr, 0, 2400, .6);
    er(o, sr, [[25, .25], [60, .16], [110, .1]], 1800);
    verb(o, sr, 1, .25, 2000);
    return o;
  }, 24000),

};
