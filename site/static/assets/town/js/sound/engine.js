// Living Town: the sound of the town. Loaded only when the visitor turns sound on.
//
// Everything is made here, on the visitor's machine: each recipe (recipes-*.js) is rendered once into
// an AudioBuffer, in idle time, and from then on the town only plays buffers through a gain and a
// stereo pan. What you hear follows the camera: the spot it looks at is where you stand, and how far
// it stands back is how wide you listen. Close in, footsteps, cups and a bicycle bell come forward;
// from the overview the town settles into the sea, the breeze and a murmur. The time of day picks the
// bed (birds, cicadas, crickets) and senses.js says what just happened (a lamp, a letter, a bell).

import { RECIPES as NATURE } from './recipes-nature.js';
import { RECIPES as FOLEY } from './recipes-foley.js';
import { RECIPES as MUSIC } from './recipes-music.js';

const RECIPES = { ...NATURE, ...FOLEY, ...MUSIC };

// CC0 recordings that stand in for a recipe when the build found them (content.js SOUNDS; licences in
// docs/sound-licences.md): recipe -> recording name(s)
const RECORDED = { murmurbig: 'cafe_walla', lapping: 'sea_gentle', gull: ['gull_1', 'gull_2', 'gull_3', 'gull_4'] };
/** The recordings to use, given the ones the build found. */
export const SAMPLES = (have) => Object.fromEntries(Object.entries(RECORDED).map(([k, v]) => [k, [].concat(v).filter((n) => have[n])]).filter(([, v]) => v.length));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const wrap = (h) => ((h % 24) + 24) % 24;
const dB = (d) => Math.pow(10, d / 20);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const idle = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 300 }) : setTimeout(r, 30)));

// Where the steady sounds are (metres; see senses.js PLACES)
const AT = {
  fountain: [-23.5, 16.0], cafe: [-6.0, 14.4], dance: [6.2, 17.6], arcade: [22.0, 9.6], workshop: [30.4, 9.4],
  rose: [[2.3, 12.9], [-13.0, 14.9]], kiosk: [44.4, 15.8], post: [6.4, 9.8],
};

// The mix, in dB, before distance: one place to tune how loud everything is against everything else
const MIX = {
  sea: -9, lapping: -14, breeze: -17, birds: -15, cicadas: -21, crickets: -19, nightair: -15, fountain: -11,
  murmurbig: -10, murmur: -11, murmursmall: -12, musette: -9, musette2: -9, radio: -18, arcade: -22, freewheel: -16,
  step: -17, stepheel: -17, cane: -21, run: -16, paw: -22, jingle: -25, bikebell: -10, cup: -18, glass: -17, cutlery: -21,
  chair: -22, lamptink: -20, shutter: -16, shutterup: -16, letter: -10, chime: -14, churchbell: -12, applause: -14,
  taps: -22, door: -18, gull: -15, swifts: -20, hum: -20, laugh: -16,
};
// What to render first: the bed for the hour you arrive at, then what you are likely to hear next
const FIRST = ['sea', 'lapping', 'breeze', 'nightair', 'birds', 'fountain', 'murmur', 'murmursmall', 'step', 'cup', 'chime', 'letter', 'crickets', 'cicadas', 'murmurbig'];

// equal-power fades (noise crossfaded linearly dips 3 dB at every crossover)
const FADE_IN = Float32Array.from({ length: 64 }, (_, i) => Math.sin(i / 63 * Math.PI / 2));
const FADE_OUT = FADE_IN.slice().reverse();
const SILENT = 0.006;   // -44 dB: below this a bed is not heard, so it stops playing
// tunes play straight through from the top (they loop seamlessly; a random entry would start mid-phrase)
const TUNES = new Set(['musette', 'musette2', 'radio', 'arcade']);

/** A loop that never sounds like a loop: two playheads crossfading at random offsets (a tune just loops). */
class Bed {
  constructor(eng, name, out) {
    this.eng = eng; this.name = name;
    this.g = eng.ctx.createGain(); this.g.gain.value = 0;
    this.pan = eng.ctx.createStereoPanner ? eng.ctx.createStereoPanner() : null;
    (this.pan ? (this.g.connect(this.pan), this.pan) : this.g).connect(out);
    this.level = 0; this.playing = null; this.next = 0;
  }
  set(level, pan = 0, k = 1.2) {
    const ctx = this.eng.ctx, t = ctx.currentTime;
    this.level = level;
    this.g.gain.setTargetAtTime(level, t, k);
    if (this.pan) this.pan.pan.setTargetAtTime(clamp(pan, -0.85, 0.85), t, 0.25);
    const buf = this.eng.buffer(this.name);
    if (!buf) return;
    const on = level > SILENT;
    if (on && TUNES.has(this.name)) { if (!this.playing) { const src = this.source(buf); src.connect(this.g); src.start(t); this.playing = src; } }
    else if (on && t >= this.next) this.cycle(buf);
    // silent for a while: stop playing altogether (costs nothing until it is wanted again; a tune starts over)
    if (!on && this.playing && t > this.quietSince + 4) { try { this.playing.stop(); } catch {} this.playing = null; this.next = 0; }
    if (on) this.quietSince = t;
  }
  source(buf) { const src = this.eng.ctx.createBufferSource(); src.buffer = buf; src.loop = true; return src; }
  cycle(buf) {
    const ctx = this.eng.ctx, t = ctx.currentTime;
    const len = Math.min(buf.duration, 14 + Math.random() * 6), fade = Math.min(2.5, len / 4);
    const src = this.source(buf), g = ctx.createGain();
    src.connect(g); g.connect(this.g);
    g.gain.value = 0;
    g.gain.setValueCurveAtTime(FADE_IN, t, fade);
    g.gain.setValueCurveAtTime(FADE_OUT, t + len - fade, fade);
    src.start(t, Math.random() * buf.duration);
    src.stop(t + len + 0.05);
    src.onended = () => g.disconnect();
    this.playing = src;
    this.next = t + len - fade;   // the next playhead starts as this one fades
  }
}

export class TownSound {
  /** ctx: an AudioContext made (and resumed) in the visitor's click; T: the town; senses: senses.js. */
  constructor(ctx, T, senses, { reduced = false, samples = {} } = {}) {
    this.ctx = ctx; this.T = T; this.senses = senses; this.reduced = reduced; this.samples = samples;
    this.buffers = new Map(); this.rendering = null;
    this.master = ctx.createGain(); this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.4;
    this.master.connect(comp); comp.connect(ctx.destination);
    // a short open-air reflection off the house fronts, for the sounds that happen in the street
    this.verb = ctx.createConvolver(); this.verb.buffer = this.space();
    const wet = ctx.createGain(); wet.gain.value = 0.32;
    this.verb.connect(wet); wet.connect(this.master);
    this.beds = new Map();
    this.live = [];   // [start, end] of every one-shot playing or scheduled, in audio time
    this.on = false;
    this.vol = 3;   // the recipes are rendered quiet (about -24 dBFS); the compressor keeps the peaks down
    this.walk = new Map();   // person id -> step phase
    this.groups = [];
    this.timers = { cup: 0, swifts: 0, taps: 0, applause: 0, laugh: 0 };
    this.off = senses ? senses.on((e) => this.happen(e)) : () => {};
    this.v = new T.THREE.Vector3();
  }

  /** The reflections of a small street: a few early echoes and a short soft tail. */
  space() {
    const sr = this.ctx.sampleRate, n = Math.floor(sr * 1.1), b = this.ctx.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      let s = 9 + c * 7;
      const r = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
      for (const [ms, g] of [[11, 0.5], [23, 0.32], [37, 0.24], [58, 0.16], [83, 0.1]]) d[Math.floor((ms + c * 3) / 1000 * sr)] += g * (c ? -1 : 1);
      for (let i = Math.floor(0.05 * sr); i < n; i++) d[i] += r() * 0.05 * Math.exp(-i / (sr * 0.22));
    }
    return b;
  }

  /**
   * One recipe, rendered in a worker where there is one (a long tune is a quarter of a second of
   * arithmetic, too long a pause for a phone's frame), on the main thread in idle time otherwise.
   */
  async render(name, seed, Off) {
    this.worker ??= this.startWorker();
    const w = await this.worker;
    if (!w) { await idle(); return RECIPES[name].render({ OfflineAudioContext: Off, sampleRate: this.rate, seed }); }
    const id = (this.jobs = (this.jobs || 0) + 1);
    const d = await new Promise((ok) => { this.waiting.set(id, ok); w.postMessage({ id, name, seed, sampleRate: this.rate }); });
    if (d.error) throw new Error(d.error);
    const b = this.ctx.createBuffer(d.channels.length, d.channels[0].length, d.sampleRate);
    d.channels.forEach((c, k) => b.copyToChannel(c, k));
    return b;
  }
  startWorker() {
    try {
      const at = (f) => import.meta.resolve(f);
      const w = new Worker(at('./render-worker.js'), { type: 'module' });
      this.waiting = new Map();
      return new Promise((ok) => {
        const no = () => { w.terminate(); ok(null); };
        w.onerror = no;
        w.onmessage = ({ data }) => {
          if (data.ready) { w.onerror = null; ok(w); return; }
          this.waiting.get(data.id)?.(data); this.waiting.delete(data.id);
        };
        w.postMessage({ urls: ['./recipes-nature.js', './recipes-foley.js', './recipes-music.js'].map(at) });
        setTimeout(() => { if (!this.waiting.size && w.onerror) no(); }, 4000);   // a worker that never answers: render here
      });
    } catch { return Promise.resolve(null); }
  }

  // no sound here needs more than 48 kHz (some machines run audio at 96): half the memory
  get rate() { return Math.min(this.ctx.sampleRate, 48000); }

  /** Decode a recording at 48 kHz at most, levelled like the recipes: about -24 dBFS RMS, peaks no higher than -3. */
  async decode(bytes) {
    const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const dec = Off ? new Off(1, 1, this.rate) : this.ctx;
    const b = await new Promise((ok, no) => { const p = dec.decodeAudioData(bytes, ok, no); p?.then?.(ok, no); });
    let peak = 0, sum = 0, n = 0;
    for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; sum += v * v; n++; } }
    const rms = Math.sqrt(sum / Math.max(1, n));
    const k = Math.min(dB(-24) / Math.max(rms, 1e-6), dB(-3) / Math.max(peak, 1e-6));
    for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; }
    return b;
  }

  buffer(name) { const v = this.buffers.get(name); return Array.isArray(v) ? pick(v) : v; }

  /** Render the recipes (CC0 recordings first where we have one), most needed first, a few at a time in idle time. */
  async prepare(urlOf) {
    if (this.rendering) return this.rendering;
    const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const order = [...new Set([...FIRST, ...Object.keys(RECIPES)])];
    this.rendering = (async () => {
      for (const name of order) {
        if (!this.on && this.buffers.size > 4) await new Promise((r) => (this.wake = r));
        const file = this.samples[name];
        try {
          if (file && urlOf) {
            const urls = (Array.isArray(file) ? file : [file]).map(urlOf).filter(Boolean);
            const bufs = await Promise.all(urls.map((u) => fetch(u).then((r) => r.arrayBuffer()).then((a) => this.decode(a))));
            if (bufs.length) { this.buffers.set(name, bufs.length > 1 ? bufs : bufs[0]); continue; }
          }
        } catch {}
        const r = RECIPES[name];
        if (!r) continue;
        const out = [];
        for (let seed = 0; seed < (r.variants || 1); seed++) {
          try { out.push(await this.render(name, seed, Off)); } catch (e) { console.warn('sound', name, e); }
        }
        if (out.length) this.buffers.set(name, out.length > 1 ? out : out[0]);
      }
    })();
    return this.rendering;
  }

  setOn(on) {
    this.on = on;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(on ? this.vol : 0, t + (on ? 3 : 0.8));
    if (on) { this.ctx.resume?.(); this.wake?.(); }
    else setTimeout(() => { if (!this.on) this.ctx.suspend?.(); }, 900);
  }

  /** Away (hidden tab, scrolled past the town): fade out and suspend; back: resume and fade in. */
  away(away) {
    if (!this.on) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    if (away) { this.master.gain.linearRampToValueAtTime(0, t + 0.6); clearTimeout(this.susp); this.susp = setTimeout(() => this.ctx.suspend?.(), 700); }
    else { clearTimeout(this.susp); this.ctx.resume?.(); this.master.gain.linearRampToValueAtTime(this.vol, t + 1.2); }
  }

  // ---------------------------------------------------------------- where you are listening
  /** How loud a point in the town is from where the camera looks (0..1), and where it sits left to right. */
  place(x, z, y = 1.2) {
    const cam = this.T.cam.cur;
    const w = clamp(cam.dist * 0.3, 6, 30);
    const d = Math.hypot(x - cam.target.x, z - cam.target.z);
    // standing further back you hear more of the town, but all of it a little further away (to -6 dB)
    const back = 0.5 + 0.5 * smooth(120, 16, cam.dist);
    const g = (Math.exp(-0.7 * (d / w) * (d / w)) * 0.85 + 0.15 / (1 + d / 12)) * back;
    this.v.set(x, y, z).project(this.T.camera);
    const pan = this.v.z > 1 ? 0 : clamp(this.v.x, -1, 1) * 0.75;
    return { g, pan, d };
  }
  /** A steady sound by key; two of the same recipe get keys of their own, e.g. bed('radio#2', 'radio'). */
  bed(key, name = key) { let b = this.beds.get(key); if (!b) { b = new Bed(this, name, this.master); this.beds.set(key, b); } return b; }

  /** Play a one-shot at a place (or everywhere, without x). */
  play(name, { x, z, y, level = 1, rate = 1, delay = 0, verb = 0.6, far = 1, prio = 1, lp = 0 } = {}) {
    if (!this.on || this.ctx.state !== 'running') return;
    const buf = this.buffer(name);
    if (!buf) return;
    let g = level * dB(MIX[name] ?? -18), pan = 0;
    if (x != null) { const p = this.place(x, z, y); g *= Math.pow(p.g, far); pan = p.pan; }
    if (g < 0.003) return;
    const ctx = this.ctx, t = ctx.currentTime + 0.02 + delay;
    // never a pile-up: count what will be sounding at that moment (a bell rung for later does not block a footstep now)
    this.live = this.live.filter(([, b]) => b > ctx.currentTime);
    if (this.live.filter(([a, b]) => a <= t && b > t).length >= (prio > 1 ? 14 : 10)) return;
    const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
    const gain = ctx.createGain(); gain.gain.value = g;
    let out = gain;
    if (lp) { const f = ctx.createBiquadFilter(); f.frequency.value = lp; src.connect(f); f.connect(gain); } else src.connect(gain);
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; gain.connect(p); out = p; }
    out.connect(this.master);
    if (verb) { const s = ctx.createGain(); s.gain.value = verb; out.connect(s); s.connect(this.verb); }
    this.live.push([t, t + buf.duration / rate]);
    src.onended = () => out.disconnect();
    src.start(t);
  }

  // ---------------------------------------------------------------- what just happened
  happen(e) {
    if (!this.on) return;
    const hurry = this.T.life.hurry;
    // dragging the clock sweeps through the day: let the beds tell it, not a pile of doors and chairs
    if (hurry && /^(window|kioskopen|kioskshut|cafeopen|cafeclose|post|arcadeev|workshopev|bell)$/.test(e.type)) return;
    switch (e.type) {
      case 'lamp': if (!hurry || Math.random() < 0.15) this.play('lamptink', { x: e.x, z: e.z, y: 3.5, rate: 0.94 + Math.random() * 0.12 }); break;
      // a product event: a letter now and then, and the chime at most once in 45 s, across all of them
      case 'post': case 'arcadeev': case 'workshopev': {
        const x = e.type === 'post' ? AT.post[0] : e.x, z = e.type === 'post' ? AT.post[1] : 10;
        if (e.type === 'post' && e.t - (this.lettered ?? -99) > 8) { this.lettered = e.t; this.play('letter', { x, z, far: 0.9 }); }
        if (e.t - (this.chimed ?? -99) > 45) { this.chimed = e.t; this.play('chime', { x, z, delay: 0.5, far: 0.9, prio: 2, rate: e.type === 'arcadeev' ? 1.12 : e.type === 'workshopev' ? 0.9 : 1 }); }
        break;
      }
      case 'bell': this.play('bikebell', { x: e.x, z: e.z, rate: 0.97 + Math.random() * 0.06, prio: 2 }); break;
      case 'gull': if (!hurry) this.play('gull', { x: e.x, z: e.z, y: 9, far: 0.25, level: 0.7, rate: 0.94 + Math.random() * 0.1, lp: 3200, verb: 1.2 }); break;   // a close recording, made far away
      case 'churchbell': if (!hurry) for (let i = 0; i < Math.min(e.count || 1, 12); i++) this.play('churchbell', { delay: i * 2.6, verb: 0.3, level: 0.9, prio: 2 }); break;
      case 'window': this.play('door', { x: e.x, z: e.z, far: 0.8 }); break;
      case 'kioskopen': this.play('shutterup', { x: e.x, z: e.z }); break;
      case 'kioskshut': this.play('shutter', { x: e.x, z: e.z }); break;
      case 'cafeopen': case 'cafeclose': for (let i = 0; i < 4; i++) this.play('chair', { x: AT.cafe[0] + (Math.random() - 0.5) * 8, z: AT.cafe[1] + (Math.random() - 0.5) * 3, delay: i * (0.8 + Math.random() * 1.5) }); break;
      case 'dancestart': this.musicAt = 0; break;
    }
  }

  // ---------------------------------------------------------------- every frame
  update(dt, hour, e) {
    if (!this.on || this.ctx.state !== 'running') return;
    const T = this.T, cam = T.cam.cur, h = wrap(hour);
    const people = T.life.people;
    const close = smooth(120, 16, cam.dist);           // 0 from far away, 1 close in
    const day = smooth(-3, 6, e), night = smooth(2, -8, e);
    const hurry = T.life.hurry;
    this.tick = (this.tick || 0) + dt;
    if (this.tick > 0.1) { this.tick = 0; this.mix(h, e, close, day, night, people); }
    if (hurry) return;
    this.steps(dt, close, people);
    this.moments(dt, h, e, close, day, night, people);
  }

  /** Ten times a second: the beds, the places and the groups of people. */
  mix(h, e, close, day, night, people) {
    const cam = this.T.cam.cur;
    const wide = 1 - close;
    const nearSea = smooth(12, 24, cam.target.z);
    const lvl = (n, v) => v * dB(MIX[n]);
    // the sea and the air
    this.bed('sea').set(lvl('sea', 0.55 + 0.35 * nearSea + 0.15 * wide));
    // and close to the railing, the water lapping at the wall below
    this.bed('lapping').set(lvl('lapping', smooth(14, 25, cam.target.z) * close));
    this.bed('breeze').set(lvl('breeze', (0.5 + 0.5 * wide) * (0.7 + 0.3 * day)));
    this.bed('nightair').set(lvl('nightair', night * (0.6 + 0.4 * wide)));
    // birds in the morning, cicadas in the warm afternoon, crickets after dark
    const birds = day * (h < 11.5 ? 1 : h < 14.5 ? 0.55 : h < 18 ? 0.4 : 0.25);
    this.bed('birds').set(lvl('birds', birds));
    this.bed('cicadas').set(lvl('cicadas', smooth(12.2, 14.5, h) * (1 - smooth(18, 19.6, h)) * day));
    this.bed('crickets').set(lvl('crickets', night * (h > 20 || h < 4.5 ? 1 : 0.5)));
    // the fountain runs all day and all night
    const f = this.place(...AT.fountain);
    this.bed('fountain').set(lvl('fountain', f.g), f.pan);
    // the café: as lively as its tables are full
    const seated = people.filter((q) => q.state === 'perform' && /^chair:/.test(q.act?.spot || '')).length + (people.some((q) => q.id === 'waiter' && q.act?.act === 'patrol' && q.state !== 'inside') ? 1 : 0);
    const c = this.place(...AT.cafe);
    const busy = smooth(1, 7, seated);
    this.bed('murmurbig').set(lvl('murmurbig', c.g * busy), c.pan);
    this.bed('murmur').set(lvl('murmur', c.g * smooth(0, 3, seated) * (1 - busy * 0.6)), c.pan);
    this.seated = seated;
    // little groups: the rosé terraces and the railing at sunset
    const groups = this.groupsOf(people);
    const voices = groups.sort((a, b) => this.place(a.x, a.z).d - this.place(b.x, b.z).d).slice(0, 2);
    for (let i = 0; i < 2; i++) {
      const gr = voices[i], b = this.bed('murmursmall#' + i, 'murmursmall');
      if (!gr) { b.set(0); continue; }
      const p = this.place(gr.x, gr.z);
      b.set(lvl('murmursmall', p.g * smooth(1, 4, gr.n) * (0.4 + 0.6 * close)), p.pan);
    }
    // music: the little band under the string lights, a radio in a window, the arcade
    const lights = this.T.lights.level;
    const dancers = people.filter((q) => q.state === 'perform' && String(q.act?.spot).startsWith('dance:')).length;
    const d = this.place(...AT.dance);
    const band = lights.dance > 0.5 && dancers > 0 ? 1 : 0;
    this.musicAt = (this.musicAt || 0) + 0.1;
    if (band && this.musicAt > 80) { this.musicAt = 0; this.tune = !this.tune; if (dancers > 1) this.play('applause', { x: AT.dance[0], z: AT.dance[1], delay: 1.5 }); }
    this.bed('musette').set(lvl('musette', d.g * band * (this.tune ? 0 : 1)), d.pan, 2.5);
    this.bed('musette2').set(lvl('musette2', d.g * band * (this.tune ? 1 : 0)), d.pan, 2.5);
    const radios = this.senses?.radios || [];
    for (let i = 0; i < 2; i++) {
      const r = radios[i], b = this.bed('radio#' + i, 'radio');
      if (!r) { b.set(0); continue; }
      const p = this.place(r.x, r.z, 4);
      b.set(lvl('radio', p.g * (0.5 + 0.5 * close)), p.pan);
    }
    const marquee = (h >= 17.5 || h < 1.5) && e < 3 ? 1 : h >= 9 && h < 17.5 ? 0.45 : 0;
    const a = this.place(...AT.arcade);
    this.bed('arcade').set(lvl('arcade', a.g * a.g * marquee), a.pan);
    // Lucie's freewheel as she coasts past
    const lucie = this.T.life.byId.lucie;
    const fw = lucie && lucie.mounted && lucie.speed > 0.5 ? this.place(lucie.pos.x, lucie.pos.z) : null;
    this.bed('freewheel').set(fw ? lvl('freewheel', fw.g * close) : 0, fw?.pan ?? 0, 0.2);
  }

  /** People gathered in twos and threes: at a terrace table with a glass, at the railing. */
  groupsOf(people) {
    const out = [];
    for (const q of people) {
      if (q.state !== 'perform' || !/^(drinks|rail|dance):/.test(q.act?.spot || '')) continue;
      const g = out.find((o) => Math.hypot(o.x - q.pos.x, o.z - q.pos.z) < 5);
      if (g) { g.x = (g.x * g.n + q.pos.x) / (g.n + 1); g.z = (g.z * g.n + q.pos.z) / (g.n + 1); g.n++; }
      else out.push({ x: q.pos.x, z: q.pos.z, n: 1 });
    }
    return out.filter((g) => g.n >= 2);
  }

  /** Footsteps, in time with the walking: a step every stride, for the few people nearest the camera. */
  steps(dt, close, people) {
    // footsteps are for close in: from the overview they would be a patter of hundreds a minute
    const near2 = smooth(0.55, 0.8, close);
    if (near2 <= 0) return;
    close = near2;
    const near = [];
    for (const q of people) {
      if (q.state === 'inside' || q.opacity < 0.5 || q.speed < 0.3) continue;
      const p = this.place(q.pos.x, q.pos.z);
      if (p.g > 0.12) near.push({ q, p });
    }
    near.sort((a, b) => b.p.g - a.p.g);
    for (const { q, p } of near.slice(0, 5)) {
      const older = /^older/.test(q.def.model), child = q.def.model === 'child';
      const jog = q.speed > 2.2;
      const stride = q.mounted ? Infinity : jog ? 1.25 : older ? 0.55 : child ? 0.5 : 0.72;
      const ph = (this.walk.get(q.id) || 0) + q.speed * dt / stride;
      this.walk.set(q.id, ph % 1);
      if (ph >= 1) {
        const name = jog ? 'run' : older ? 'stepheel' : 'step';
        this.play(name, { x: q.pos.x, z: q.pos.z, y: 0.1, level: close * (child ? 0.6 : 1), rate: (child ? 1.15 : 1) * (0.95 + Math.random() * 0.1), verb: 0.4 });
        const cane = (this.walk.get(q.id + ':cane') || 0) ^ 1;   // the stick lands every other step
        this.walk.set(q.id + ':cane', cane);
        if (q.def.walkProp === 'cane' && cane) this.play('cane', { x: q.pos.x, z: q.pos.z, y: 0.1, level: close, delay: 0.05 });
      }
      // Biscuit trots beside Yusuf: paws and, now and then, his tag
      if (q.dog) {
        const dp = (this.walk.get('dog') || 0) + q.speed * dt / 0.55;   // a patter now and then, not every paw
        this.walk.set('dog', dp % 1);
        if (dp >= 1) this.play('paw', { x: q.dog.pos.x, z: q.dog.pos.z, y: 0.1, level: close * 0.8, rate: 0.9 + Math.random() * 0.2, verb: 0.3 });
        if (dp >= 1 && Math.random() < 0.18) this.play('jingle', { x: q.dog.pos.x, z: q.dog.pos.z, y: 0.3, level: close });
      }
    }
  }

  /** The small things: cups at the café, swifts at dusk, the workshop, a laugh. */
  moments(dt, h, e, close, day, night, people) {
    const T = this.timers, gentle = this.reduced ? 0.4 : 1;
    for (const k in T) T[k] -= dt;
    if (T.cup <= 0) {
      const busy = this.seated || 0;
      T.cup = busy ? (3 + Math.random() * 6) * (6 / (busy + 2)) / gentle : 4;
      if (busy && close > 0.25) {
        const x = AT.cafe[0] + (Math.random() - 0.5) * 9, z = AT.cafe[1] + (Math.random() - 0.5) * 4;
        this.play(Math.random() < 0.7 ? 'cup' : 'cutlery', { x, z, y: 0.8, level: close, rate: 0.92 + Math.random() * 0.16 });
      }
      const glasses = people.filter((q) => q.state === 'perform' && /^drinks:/.test(q.act?.spot || '')).length;
      if (glasses >= 2 && Math.random() < 0.25 * gentle) { const r = pick(AT.rose); this.play('glass', { x: r[0], z: r[1], y: 1.1, level: close }); }
    }
    if (T.laugh <= 0) { T.laugh = 25 + Math.random() * 50; if ((this.seated || 0) >= 4 && close > 0.3) this.play('laugh', { x: AT.cafe[0] + (Math.random() - 0.5) * 8, z: AT.cafe[1], level: 0.8 * gentle }); }
    if (T.swifts <= 0) { T.swifts = 35 + Math.random() * 60; if (h > 18.2 && h < 20.6 && !this.reduced) this.play('swifts', { level: 0.9, verb: 0.2 }); }
    if (T.taps <= 0) {
      T.taps = 3 + Math.random() * 9;
      const b = this.T.life.byId.builder;
      if (b && b.state === 'inside' && b.inside === 'toolrails') {
        if (Math.random() < 0.15) this.play('hum', { x: AT.workshop[0], z: AT.workshop[1], level: 0.8, verb: 0.2 });
        else for (let i = 0, n = 1 + Math.floor(Math.random() * 3); i < n; i++) this.play('taps', { x: AT.workshop[0], z: AT.workshop[1], delay: i * 0.35, verb: 0.2 });
      }
    }
  }

  dispose() { this.off(); for (const b of this.beds.values()) b.set(0); this.ctx.close?.(); }
}
