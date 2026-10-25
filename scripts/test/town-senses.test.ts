// What the town notices, and the lines that react to it: node --test scripts/test/town-senses.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Senses, crossed, nextAct, PLACES } from '../../site/static/assets/town/js/senses.js';
import { extendReact, pickReactive, REACT } from '../../site/static/assets/town/js/dialog.js';
import { CAST } from '../../site/static/assets/town/js/cast.js';

const person = (id, x, z, o: any = {}) => ({ id, def: { name: id, model: 'x', day: CAST.find((c) => c.id === id)?.day }, pos: { x, z }, state: 'perform', act: { act: 'spot', spot: 'bench:1:0' }, speed: 0, opacity: 1, ...o });
const seeded = (seed = 1) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; };

test('the clock crossing an hour, forwards only, across midnight', () => {
  assert.equal(crossed(7.9, 8.01, 8), true);
  assert.equal(crossed(8.01, 8.2, 8), false);
  assert.equal(crossed(23.9, 0.2, 0), true);
  assert.equal(crossed(8.2, 7.9, 8), false);   // dragging the sun back rings nothing
  assert.equal(crossed(5, 5, 5), false);
});

test('what is next on a schedule, if it is soon', () => {
  const day = [[0, { act: 'home' }], [8, { act: 'spot', spot: 'kiosk' }], [12, { act: 'home' }]];
  assert.equal(nextAct(day, 7.8)?.at, 8);
  assert.equal(nextAct(day, 7), null);
  assert.equal(nextAct(day, 23.9)?.at, 24);
});

test('places match the town layout', () => {
  const town = readFileSync(new URL('../../site/static/assets/town/js/town.js', import.meta.url), 'utf8');
  for (const k of ['FOUNTAIN', 'KIOSK', 'DANCE']) {
    const m = new RegExp(`export const ${k} = \\{ x: ([-\\d.]+), z: ([-\\d.]+) \\}`).exec(town);
    assert.ok(m, k);
    const p = PLACES[k.toLowerCase()];
    assert.deepEqual([p.x, p.z], [+m[1], +m[2]], k);
  }
});

test('sunset, lamps and the church bell are noticed once, as they happen', () => {
  const s = new Senses({ rand: seeded() });
  const seen: string[] = [];
  s.on((e) => seen.push(e.type));
  const lamps = [{ x: 0, z: 24.85, on: false }, { x: 10, z: 24.85, on: false }];
  s.update(0, 17.95, 2, [], lamps);
  s.update(1, 18.01, 0.1, [], lamps);
  assert.ok(seen.includes('sunset') && seen.includes('churchbell'));
  lamps[0].on = true;
  s.update(2, 18.02, -0.1, [], lamps);
  lamps[1].on = true;
  s.update(3, 18.03, -0.2, [], lamps);
  assert.equal(seen.filter((t) => t === 'lamp').length, 2);
  assert.equal(seen.filter((t) => t === 'lamps').length, 1, 'one wave, one cue');
  assert.equal(seen.filter((t) => t === 'sunset').length, 1);
});

test('someone walking past is noticed by whoever they pass, once', () => {
  const s = new Senses({ rand: seeded() });
  const henri = person('henri', 0, 20);
  const lucie = person('lucie', -10, 20, { state: 'loop', speed: 3.3, mounted: true, act: { act: 'loop', loop: 'ride', bike: true } });
  for (let t = 0; t < 8; t += 0.25) { lucie.pos.x = -10 + t * 3.3; s.update(t, 9, 30, [henri, lucie]); }
  const passes = s.events.filter((e) => e.type === 'passby');
  assert.equal(passes.length, 1);
  assert.equal(passes[0].to, 'henri');
  const cues = s.cuesFor(henri, 4, 9, 30, [henri, lucie]).map((c) => c.cue);
  assert.ok(cues.includes('passby_lucie') && cues.includes('passby'), cues.join());
  assert.ok(!s.cuesFor(henri, 30, 9, 30, [henri, lucie]).some((c) => c.cue.startsWith('passby')), 'stale after a while');
});

test('local happenings are only noticed nearby, and a reacted-to one is not repeated', () => {
  const s = new Senses();
  const near = person('henri', -6, 14), far = person('asgeir', 40, 20);
  s.update(0, 6.8, 5, [near, far]);
  const ev = s.emit('cafeopen', 1, { ...PLACES.cafe });
  assert.ok(s.cuesFor(near, 2, 6.9, 5, [near, far]).some((c) => c.cue === 'cafeopen'));
  assert.ok(!s.cuesFor(far, 2, 6.9, 5, [near, far]).some((c) => c.cue === 'cafeopen'));
  s.noted(ev, 'henri');
  assert.ok(!s.cuesFor(near, 3, 6.9, 5, [near, far]).some((c) => c.cue === 'cafeopen'));
});

test('neighbours in view and what is next', () => {
  const s = new Senses();
  const odile = person('odile', 0, 20, { state: 'follow', act: { act: 'follow', who: 'henri' } });
  const henri = person('henri', 2, 20, { act: { act: 'spot', spot: 'plants' } });
  const cues = s.cuesFor(odile, 0, 18.85, 10, [odile, henri]);
  const see = cues.find((c) => c.cue === 'see:henri');
  assert.equal(see?.act, 'watering');
  assert.ok(cues.some((c) => c.cue === 'next:bench'), cues.map((c) => c.cue).join());
  assert.ok(!cues.some((c) => c.cue === 'see:odile'));
});

test('a reactive line wins when it fits, fills in the name, and falls back when nothing fits', () => {
  extendReact('odile', {
    lines: [['passby', '', '', 'Bonjour, {name}! Lovely shoes!'], ['lamps', 'blue', '', 'There they go, one by one!'], ['see:henri', '', 'watering', 'Henri and his lemons. Forty years!']],
    exchanges: [['lamps', 'henri', '', '', 'Henri, the lamps!', 'Like a slow piano, ma chérie.']],
  });
  assert.ok(REACT.odile);
  const rand = () => 0.01;
  const r = pickReactive('odile', { hour: 9, cues: [{ cue: 'passby', w: 1.2, vars: { name: 'Lucie' } }], rand, recent: new Set() });
  assert.equal(r?.text, 'Bonjour, Lucie! Lovely shoes!');
  const r2 = pickReactive('odile', { hour: 9, cues: [{ cue: 'see:henri', w: 0.5, act: 'watering' }], rand });
  assert.equal(r2?.text, 'Henri and his lemons. Forty years!');
  assert.equal(pickReactive('odile', { hour: 9, cues: [{ cue: 'see:henri', w: 0.5, act: 'bench' }], rand }), null, 'wrong activity');
  assert.equal(pickReactive('odile', { hour: 12, cues: [{ cue: 'lamps', w: 1.5 }], rand }), null, 'wrong phase');
  const r3 = pickReactive('odile', { hour: 20.5, cues: [{ cue: 'lamps', w: 1.5 }], nearby: ['henri'], rand: () => 0.3 });
  assert.equal(r3?.reply?.id, 'henri');
  assert.equal(pickReactive('odile', { hour: 9, cues: [{ cue: 'passby', w: 1.2 }], rand }), null, 'a {name} line needs a name');
  assert.equal(pickReactive('nobody', { cues: [{ cue: 'lamps', w: 1 }] }), null);
});

test('the reactive banks: valid cues, short, kind, and nothing already in the big banks', async () => {
  const { readdirSync } = await import('node:fs');
  const dir = new URL('../../site/static/assets/town/dialog/react/', import.meta.url);
  const PH = ['dawn', 'morning', 'midday', 'afternoon', 'golden', 'sunset', 'blue', 'night', 'late'];
  const ACTS = 'running cycling dogwalk stroll playing serving setup break watering bench cafe rose railing dancing kiosk stretching fountain post arcade workshop phone wander home goinghome'.split(' ');
  const CUES = 'lamps lampsoff sunset sunrise stars moon window lightsout churchbell cafeopen cafeclose cafebusy cafequiet dancestart dancing crowd radio kioskopen kioskshut quiet passby passby_lucie passby_ines passby_biscuit passby_leo passby_henriodile passby_asgeir bell gull fountain leofountain kiosk postoffice arcade workshop library sea post arcadeev workshopev'.split(' ');
  const SEE = ['ines', 'marcel', 'henri', 'odile', 'yusuf', 'biscuit', 'lucie', 'leo', 'camille', 'theo', 'builder', 'asgeir'];
  const NAMED = ['passby', 'window', 'lightsout'];
  const list = (s: string, L: string[]) => s.split(' ').filter(Boolean).every((x) => L.includes(x));
  const cueOk = (c: string, b: string) => CUES.includes(c) || (c.startsWith('see:') && SEE.includes(c.slice(4)) && c.slice(4) !== b) || (c.startsWith('next:') && ACTS.includes(c.slice(5)));
  let n = 0;
  for (const f of readdirSync(dir)) {
    const b = f.replace('.json', '');
    const d = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    const big = new Set(JSON.parse(readFileSync(new URL(`../${f}`, dir), 'utf8')).lines.map((r: string[]) => r[2]));
    for (const [c, w, a, t] of d.lines) {
      assert.ok(cueOk(c, b) && list(w, PH) && (c.startsWith('see:') || list(a, ACTS)), `${b}: ${c} ${w} ${a}`);
      assert.ok(t.length <= 70 && !big.has(t), `${b}: ${t}`);
      assert.ok(!t.includes('{') || NAMED.includes(c), `${b}: {name} outside a named cue: ${t}`);
    }
    for (const [c, r, w, a, line, reply] of d.exchanges) {
      assert.ok(cueOk(c, b) && SEE.concat(['visitor', 'neighbour', 'runner', 'kid']).includes(r) && r !== b && list(w, PH), `${b}: ${c} -> ${r}`);
      assert.ok(line.length <= 70 && reply.length <= 70, `${b}: ${line} / ${reply}`);
    }
    for (const t of [...d.lines.map((r: string[]) => r[3]), ...d.exchanges.flatMap((e: string[]) => [e[4], e[5]])]) {
      assert.doesNotMatch(t, /(\p{Extended_Pictographic}|\bboats?\b|\bships?\b|harbou?r|anchor|ferr(y|ies)|\bsail|fishing|money|price|revenue|\bMRR\b|\$|NOK|euro|\bsad\b|lonely|angry|\bhate|\brain\b|siren|crash|DataAnnotation)/iu, `${b}: ${t}`);
      // a year or a time is fine; a product figure must be one of the facts
      for (const num of t.match(/\d{1,3}(,\d{3})+\+?|\d{5,}\+?|\d+\+/g) || []) assert.match(num, /^113,000\+?$/, `${b}: a figure in ${t}`);
    }
    n += d.lines.length + d.exchanges.length;
  }
  assert.ok(n > 5000, `only ${n} reactive rows`);
});

test('nobody remarks on the same kind of happening twice in a few minutes', () => {
  const s = new Senses();
  const asgeir = person('asgeir', 6, 14);
  const a = s.emit('post', 0, { x: 6.4, z: 10.4 });
  assert.ok(s.cuesFor(asgeir, 1, 12, 30, [asgeir]).some((c) => c.cue === 'post'));
  s.noted(a, 'asgeir');
  s.emit('post', 20, { x: 6.4, z: 10.4 });
  assert.ok(!s.cuesFor(asgeir, 21, 12, 30, [asgeir]).some((c) => c.cue === 'post'));
  s.emit('post', 200, { x: 6.4, z: 10.4 });
  assert.ok(s.cuesFor(asgeir, 201, 12, 30, [asgeir]).some((c) => c.cue === 'post'));
});

test('a bank whose reactive file fails is fetched again, and never added twice', async () => {
  const { ensure, DIALOG } = await import('../../site/static/assets/town/js/dialog.js');
  const before = DIALOG.kid.lines.length;
  let reactTries = 0;
  const real = globalThis.fetch;
  globalThis.fetch = (async (u: string) => {
    if (u === 'react') { reactTries++; return reactTries === 1 ? { ok: false, status: 500 } : { ok: true, json: async () => ({ lines: [['gull', '', '', 'A gull! Léo says it is called Paul.']] }) }; }
    return { ok: true, json: async () => ({ lines: [['', '', 'One new line.']] }) };
  }) as any;
  try {
    await ensure('x6', (b: string) => (b.startsWith('react/') ? 'react' : 'lines'));
    await ensure('x6', (b: string) => (b.startsWith('react/') ? 'react' : 'lines'));
    await ensure('x6', (b: string) => (b.startsWith('react/') ? 'react' : 'lines'));
  } finally { globalThis.fetch = real; }
  assert.equal(DIALOG.kid.lines.length, before + 1, 'the big bank once');
  assert.equal(reactTries, 2, 'the reactive file again after it failed, then no more');
  assert.ok(REACT.kid.lines.get('gull'));
});
