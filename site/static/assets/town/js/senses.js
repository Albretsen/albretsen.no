// Living Town: what is going on. A few times a second this looks at the town (people, lamps, the
// sun, the clock) and notes what just happened: a lamp striking, Lucie cycling past someone, the sun
// touching the sea, a letter at the post office. The sound (sound/engine.js) plays those happenings,
// and the dialog (dialog.js) lets whoever speaks next react to them and to what is around them.
//
// No three.js and no DOM, so it runs in node for the tests. People are read through a small
// interface: { id, def: { name, model, day }, pos: { x, z }, state, act, speed, mounted, opacity, dog }.

import { activityOf, phaseOf } from './dialog.js';

const wrap = (h) => ((h % 24) + 24) % 24;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// Where things are (metres; from town.js and lights.js)
export const PLACES = {
  cafe: { x: -6.0, z: 14.4 },
  dance: { x: 6.2, z: 17.6 },
  fountain: { x: -23.5, z: 16.0 },
  kiosk: { x: 44.4, z: 15.8 },
  postoffice: { x: 6.4, z: 10.4 },
  arcade: { x: 22.0, z: 10.4 },
  workshop: { x: 30.4, z: 10.4 },
  library: { x: -25.5, z: 10.4 },
};
export const RAIL_Z = 25.6;

// The names a line may greet with {name}: the townspeople with a first name of their own.
export const NAMES = { jogger: 'Inès', waiter: 'Marcel', henri: 'Henri', odile: 'Odile', yusuf: 'Yusuf', lucie: 'Lucie', leo: 'Léo', camille: 'Camille', theo: 'Théo', asgeir: 'Asgeir' };
// cast.js ids to dialog banks (the same as dialog.js ALIASES, for the ones that can be seen)
const BANK = { jogger: 'ines', waiter: 'marcel' };
const bankOf = (id) => BANK[id] || id;
const MAIN = new Set(['jogger', 'waiter', 'henri', 'odile', 'yusuf', 'lucie', 'leo', 'camille', 'theo', 'builder', 'asgeir']);

// How long a happening stays fresh (seconds) and how far away it can be noticed (metres; 0 = anywhere)
const KEEP = {
  lamps: [55, 0], lampsoff: [40, 0], sunset: [150, 0], sunrise: [120, 0], stars: [100, 0], churchbell: [25, 0],
  window: [30, 30], lightsout: [25, 30], post: [30, 45], arcadeev: [25, 30], workshopev: [25, 30],
  bell: [9, 16], gull: [12, 0], cafeopen: [150, 28], cafeclose: [150, 28], dancestart: [70, 32],
  kioskopen: [45, 26], kioskshut: [45, 26],
};
// Hours the church bell rings, and the kiosk opens and shuts (lights.js keeps the kiosk 06-22)
const BELLS = [8, 12, 18];
const PRODUCT_CUE = { 'mcp-emails': 'post', 'fun-libs': 'arcadeev', toolrails: 'workshopev' };
const PRODUCT_PLACE = { post: 'postoffice', arcadeev: 'arcade', workshopev: 'workshop' };

/** True if the clock went past hour `at` between `a` and `b` (going forward, wrapping at midnight). */
export function crossed(a, b, at) {
  if (a === b) return false;
  let d = wrap(b - a);
  if (d > 12) return false;              // the clock went backwards (dragging the sun back): nothing rings
  const x = wrap(at - a);
  return x > 0 && x <= d;
}

/** The person's next schedule entry, if it starts within `within` hours: { act, at }. */
export function nextAct(day, h, within = 0.34) {
  h = wrap(h);
  for (const [t, a] of [...day, ...day.map(([t, a]) => [t + 24, a])]) if (t > h + 1e-6) return t - h <= within ? { act: a, at: t } : null;
  return null;
}

export class Senses {
  constructor({ rand = Math.random } = {}) {
    this.rand = rand;
    this.events = [];          // recent happenings, newest last: { id, type, t, x?, z?, who?, name?, seen?: Set }
    this.listeners = new Set();
    this.n = 0;
    this.pairs = new Map();    // 'a|b' -> time they were last close
    this.prev = null;          // the last sample: hour, sun, lamps, who is where
    this.nextGull = 30;
    this.lastBell = -99;
    this.radios = [];          // windows with a radio on: [{ x, z, site }]
    this.said = new Map();     // 'person:type' -> when they last remarked on that kind of happening
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  emit(type, t, o = {}) {
    const e = { id: ++this.n, type, t, ...o };
    this.events.push(e);
    if (this.events.length > 80) this.events.shift();
    for (const fn of this.listeners) fn(e);
    return e;
  }

  /** A window lit or went dark (life.onLight). */
  light(t, site, person, on) {
    if (site.kind !== 'home' || !person) return;
    const name = NAMES[person.id];
    this.emit(on ? 'window' : 'lightsout', t, { x: site.x, z: 9, who: person.id, name, site: site.id });
  }

  /** A product event arrived (real, or the labelled demo feed). */
  product(t, product, x) {
    const type = PRODUCT_CUE[product];
    if (type) this.emit(type, t, { x, z: 10.4 });
  }

  /**
   * Look at the town. t: seconds (any clock), h: the hour, e: sun elevation in degrees,
   * people: Person[], lamps: [{ x, z, on }], s: { dance: string-light level, hurry }.
   */
  update(t, h, e, people, lamps = [], s = {}) {
    const p = this.prev;
    const out = (q) => q.state !== 'inside' && q.state !== 'entering' && q.opacity > 0.5;
    if (p) {
      // the sky
      const pm = wrap(h) > 12;
      if (pm && p.e > 0.3 && e <= 0.3) this.emit('sunset', t);
      if (!pm && p.e < 0 && e >= 0) this.emit('sunrise', t);
      if (pm && p.e > -6 && e <= -6) this.emit('stars', t);
      // the lamps, one by one: a sound each, one cue for the wave
      let lit = 0, dark = 0;
      lamps.forEach((l, i) => {
        const was = p.lamps[i];
        if (was === undefined || was === l.on) return;
        if (l.on) { lit++; this.emit('lamp', t, { x: l.x, z: l.z, quiet: true }); } else dark++;
      });
      if (lit && !this.fresh('lamps', t)) this.emit('lamps', t);
      if (dark && !this.fresh('lampsoff', t) && lamps.every((l) => !l.on)) this.emit('lampsoff', t);
      // the clock
      for (const b of BELLS) if (crossed(p.h, h, b) && t - this.lastBell > 20) { this.lastBell = t; this.emit('churchbell', t, { count: b > 12 ? b - 12 : b }); }
      if (crossed(p.h, h, 6)) this.emit('kioskopen', t, { ...PLACES.kiosk });
      if (crossed(p.h, h, 22)) this.emit('kioskshut', t, { ...PLACES.kiosk });
    }
    // the café and the dance floor
    const marcel = people.find((q) => q.id === 'waiter');
    const setup = marcel?.act?.act === 'patrol' && marcel.act.mode === 'setup' ? (wrap(h) < 12 ? 'cafeopen' : 'cafeclose') : null;
    if (setup && setup !== p?.setup) this.emit(setup, t, { ...PLACES.cafe });
    const dancers = people.filter((q) => out(q) && q.state === 'perform' && String(q.act?.spot).startsWith('dance:')).length;
    const music = (s.dance ?? 0) > 0.5 && dancers > 0;
    if (music && p && !p.music) this.emit('dancestart', t, { ...PLACES.dance });

    // people passing each other: someone moving comes within a couple of metres of someone else
    const moving = (q) => out(q) && q.speed > 0.6;
    for (let i = 0; i < people.length; i++) {
      const a = people[i];
      if (!out(a)) continue;
      for (let j = i + 1; j < people.length; j++) {
        const b = people[j];
        if (!out(b) || !(moving(a) || moving(b))) continue;
        if (a.act?.act === 'follow' && a.act.who === b.id || b.act?.act === 'follow' && b.act.who === a.id) continue;
        if (dist(a.pos, b.pos) > (a.mounted || b.mounted ? 3.4 : 2.6)) continue;
        const k = a.id + '|' + b.id, last = this.pairs.get(k) ?? -1e9;
        this.pairs.set(k, t);
        if (t - last < 25) continue;
        const [mover, still] = moving(a) && (!moving(b) || a.speed >= b.speed) ? [a, b] : [b, a];
        this.emit('passby', t, { who: mover.id, to: still.id, x: mover.pos.x, z: mover.pos.z, name: NAMES[mover.id] });
        // Lucie rings for whoever she passes, now and then (not twice in a row)
        if (mover.id === 'lucie' && mover.mounted && t - (this.rang ?? -1e9) > 20 && this.rand() < 0.6) { this.rang = t; this.emit('bell', t, { x: mover.pos.x, z: mover.pos.z, who: 'lucie' }); }
      }
    }
    // a gull out over the water, by day
    if (e > 2 && t > this.nextGull) {
      this.nextGull = t + 25 + this.rand() * 55;
      this.emit('gull', t, { x: -50 + this.rand() * 100, z: RAIL_Z + 14 + this.rand() * 20 });
    } else if (e <= 2) this.nextGull = Math.max(this.nextGull, t + 20);

    // radios in open windows: Henri and Odile's in the morning, the mustard house's in the evening
    const home = (site) => people.some((q) => q.state === 'inside' && q.inside === site && q.act?.lit !== false);
    const hh = wrap(h);
    this.radios = [];
    if (hh >= 7 && hh < 9.6 && home('home_old')) this.radios.push({ site: 'home_old', x: -35.5, z: 8.8, kind: 'morning' });
    if (hh >= 18 && hh < 22 && home('home_fam')) this.radios.push({ site: 'home_fam', x: 14.2, z: 8.8, kind: 'evening' });

    this.prev = { h, e, lamps: lamps.map((l) => l.on), setup, music };
    // old pairs are forgotten
    if (this.pairs.size > 400) for (const [k, v] of this.pairs) if (t - v > 60) this.pairs.delete(k);
  }

  fresh(type, t) { return this.events.some((e) => e.type === type && t - e.t < (KEEP[type]?.[0] ?? 30)); }

  /**
   * What `who` could react to right now, most striking first: [{ cue, w, vars?, ev? }].
   * w >= 1 for something that just happened; < 1 for what is simply there to see.
   */
  cuesFor(who, t, h, e, people) {
    const out = [];
    const P = who.pos;
    const outdoors = who.state !== 'inside' && who.state !== 'entering';
    if (!outdoors) return out;
    const visible = (q) => q !== who && q.state !== 'inside' && q.state !== 'entering' && q.opacity > 0.9;
    // what just happened
    for (let i = this.events.length - 1; i >= 0; i--) {
      const ev = this.events[i];
      const keep = KEEP[ev.type];
      const age = t - ev.t;
      if (ev.seen?.has(who.id)) continue;
      if (ev.type === 'passby') {
        if (ev.to !== who.id || age > 10) continue;
        const special = { lucie: 'passby_lucie', jogger: 'passby_ines', yusuf: 'passby_biscuit', leo: 'passby_leo', asgeir: 'passby_asgeir' }[ev.who];
        const mover = people.find((q) => q.id === ev.who);
        const couple = (ev.who === 'henri' || ev.who === 'odile') && people.some((q) => q.act?.act === 'follow' && q.act.who === 'henri' && q.state !== 'inside') ? 'passby_henriodile' : null;
        if (couple && who.id !== 'henri' && who.id !== 'odile') out.push({ cue: couple, w: 1.6, ev });
        if (special && (ev.who !== 'lucie' || mover?.mounted)) out.push({ cue: special, w: 1.5, ev });
        if (ev.name) out.push({ cue: 'passby', w: 1.2, vars: { name: ev.name }, ev });
        continue;
      }
      if (!keep || age > keep[0]) continue;
      // one remark per person about the same kind of thing every few minutes (the post office is busy)
      if (t - (this.said.get(who.id + ':' + ev.type) ?? -1e9) < 180) continue;
      const far = keep[1] && ev.x != null ? Math.hypot(ev.x - P.x, (ev.z ?? P.z) - P.z) : 0;
      if (keep[1] && far > keep[1]) continue;
      if ((ev.type === 'window' || ev.type === 'lightsout') && (ev.who === who.id || !ev.name)) continue;
      if (ev.type === 'bell' && who.id === 'lucie') continue;
      out.push({ cue: ev.type, w: 1 + Math.max(0, 1 - age / keep[0]), vars: ev.name ? { name: ev.name } : undefined, ev });
    }
    // what is there to see and hear
    const ph = phaseOf(h);
    const near = (pl, r) => dist(P, PLACES[pl]) < r;
    const seated = people.filter((q) => q.state === 'perform' && /^(chair|drinks):/.test(q.act?.spot || '') && dist(q.pos, PLACES.cafe) < 12).length;
    const cafeOpen = wrap(h) >= 6.6 || wrap(h) < 0.7;
    if (near('cafe', 15) && cafeOpen) {
      if (seated >= 5) out.push({ cue: 'cafebusy', w: 0.7 });
      else if (seated <= 1 && wrap(h) >= 14 && wrap(h) < 17.5) out.push({ cue: 'cafequiet', w: 0.5 });
    }
    const atRail = people.filter((q) => q.state === 'perform' && String(q.act?.spot).startsWith('rail:') && dist(q.pos, P) < 14).length;
    if (atRail >= 3 && (ph === 'golden' || ph === 'sunset')) out.push({ cue: 'crowd', w: 0.75 });
    const dancing = people.some((q) => q.state === 'perform' && String(q.act?.spot).startsWith('dance:'));
    if (dancing && near('dance', 17) && !String(who.act?.spot).startsWith('dance:')) out.push({ cue: 'dancing', w: 0.7 });
    for (const r of this.radios) if (Math.hypot(r.x - P.x, r.z - P.z) < 16) out.push({ cue: 'radio', w: 0.55 });
    if (near('fountain', 6.5)) out.push({ cue: 'fountain', w: 0.45 });
    if (who.id !== 'leo' && who.id !== 'x6' && near('fountain', 11) && people.some((q) => (q.id === 'leo' || q.id === 'x6') && q.act?.loop === 'fountain' && visible(q))) out.push({ cue: 'leofountain', w: 0.65 });
    if (near('kiosk', 7)) out.push({ cue: 'kiosk', w: 0.4 });
    if (near('postoffice', 8)) out.push({ cue: 'postoffice', w: 0.45 });
    if (near('arcade', 8)) out.push({ cue: 'arcade', w: 0.45 });
    if (near('library', 8)) out.push({ cue: 'library', w: 0.4 });
    if (near('workshop', 8) && people.some((q) => q.id === 'builder' && q.state === 'inside' && q.inside === 'toolrails')) out.push({ cue: 'workshop', w: 0.45 });
    const act = activityOf(who.act, who.state);
    if (act === 'railing' || act === 'bench') out.push({ cue: 'sea', w: 0.4 });
    if ((ph === 'night' || ph === 'late') && e < -8) out.push({ cue: 'moon', w: 0.3 });
    if (ph === 'late' || (ph === 'night' && wrap(h) > 23)) { const about = people.filter((q) => q.state !== 'inside').length; if (about <= 3) out.push({ cue: 'quiet', w: 0.4 }); }
    // neighbours in view, nearest first
    const seen = [];
    for (const q of people) {
      if (!visible(q) || !MAIN.has(q.id)) continue;
      const d = dist(q.pos, P);
      if (d < 14) seen.push({ q, d });
      if (q.dog && d < 10 && who.id !== 'yusuf') seen.push({ q: { id: 'biscuit', act: q.act, state: q.state }, d: d + 0.5 });
    }
    seen.sort((a, b) => a.d - b.d);
    for (const { q, d } of seen.slice(0, 4)) out.push({ cue: 'see:' + bankOf(q.id), w: 0.35 + 0.3 * (1 - d / 14), act: activityOf(q.act, q.state) });
    // what is next on their own schedule
    const nx = who.def?.day && nextAct(who.def.day, h);
    if (nx) { const a = activityOf(nx.act, 'idle'); if (a && a !== act) out.push({ cue: 'next:' + a, w: 0.45 }); }
    return out.sort((a, b) => b.w - a.w);
  }

  /** Someone reacted to a happening: they will not mention it again. */
  noted(ev, who) { (ev.seen ||= new Set()).add(who); this.said.set(who + ':' + ev.type, ev.t); }
}
