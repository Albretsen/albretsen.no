// The townspeople's lines (copied from archive/designs/91): node --test scripts/test/town-dialog.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { DIALOG, EXCHANGES, PHASES, phaseOf, activityOf, pick, REF_RATE } from '../../site/static/assets/town/js/dialog.js';
import { CAST, EXTRAS } from '../../site/static/assets/town/js/cast.js';

const MAIN = ['ines', 'marcel', 'henri', 'odile', 'yusuf', 'lucie', 'leo', 'camille', 'theo', 'builder', 'asgeir'];
const PHASE_HOUR = { dawn: 6, morning: 9, midday: 12.5, afternoon: 16, golden: 18.7, sunset: 19.7, blue: 20.5, night: 22, late: 1 };
const ACTIVITIES = ['running', 'cycling', 'dogwalk', 'stroll', 'playing', 'serving', 'setup', 'break', 'watering', 'bench',
  'cafe', 'rose', 'railing', 'dancing', 'kiosk', 'stretching', 'fountain', 'post', 'arcade', 'workshop', 'phone', 'wander', 'home', 'goinghome'];

function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

const allRows = () => Object.entries(DIALOG).flatMap(([id, e]) => [
  ...e.lines.map((r) => ({ id, ref: false, w: r[0], a: r[1], t: r[2] })),
  ...e.refs.map((r) => ({ id, ref: true, w: r[0], a: r[1], t: r[2] })),
]);
const allTexts = () => [...allRows().map((r) => r.t), ...EXCHANGES.flatMap((e) => [e.line, e.reply])];

test('every main character has a voice note and at least 14 lines', () => {
  for (const id of MAIN) {
    const e = DIALOG[id];
    assert.ok(e, id);
    assert.ok(e.voice && e.voice.length > 10, `${id} voice`);
    assert.ok(e.lines.length + e.refs.length >= 14, `${id} has ${e.lines.length + e.refs.length}`);
  }
});

test('lines are short, emoji free, and use only known phases and activities', () => {
  for (const r of allRows()) {
    assert.ok(r.t.length <= 72, `too long (${r.t.length}): ${r.t}`);
    for (const p of r.w.split(' ').filter(Boolean)) assert.ok(PHASES.includes(p), `${r.id}: phase ${p}`);
    for (const a of r.a.split(' ').filter(Boolean)) assert.ok(ACTIVITIES.includes(a), `${r.id}: activity ${a}`);
  }
  for (const t of allTexts()) {
    assert.ok(t.length <= 72, `too long: ${t}`);
    assert.doesNotMatch(t, /\p{Extended_Pictographic}/u, t);
    assert.doesNotMatch(t, /\b(hire|hiring|argu|sad|rubbish|siren|rain|lonely|angry|hate|crash|DataAnnotation)/i, t);
  }
});

test('product references keep to the facts in content.js', () => {
  const allowed = /^(17|seventeen|113,000\+?|4|four|about a hundred)$/i;
  for (const r of allRows().filter((x) => x.ref)) {
    for (const n of r.t.match(/\d[\d,]*\+?/g) || []) assert.match(n, allowed, r.t);
  }
  for (const t of allTexts()) assert.doesNotMatch(t, /(\$|NOK|kr\b|MRR)/, t);
});

test('refs are rare: about one pick in eight at most', () => {
  const rand = seeded(7);
  let refs = 0, n = 0;
  for (let i = 0; i < 4000; i++) {
    const id = MAIN[i % MAIN.length];
    const ph = PHASES[i % PHASES.length];
    const said = pick(id, { phase: ph, rand });
    if (!said) continue;
    n++; if (said.ref) refs++;
  }
  assert.ok(refs / n <= REF_RATE + 0.02, `ref share ${refs / n}`);
  assert.ok(refs / n > 0.05, `ref share ${refs / n}`);
});

test('everyone has something to say at every phase, whatever they are doing', () => {
  for (const id of [...MAIN, 'biscuit', 'x1', 'x3', 'x4', 'x6']) {
    for (const ph of PHASES) {
      for (const activity of [undefined, ...ACTIVITIES]) {
        const said = pick(id, { hour: PHASE_HOUR[ph], activity, rand: seeded(3) });
        assert.ok(said && said.text, `${id} at ${ph} / ${activity}`);
      }
    }
  }
});

test('lines follow the time of day and the activity', () => {
  const said = pick('marcel', { hour: 9, activity: 'serving', rand: () => 0.5 });
  const row = DIALOG.marcel.lines.find((r) => r[2] === said.text);
  assert.ok(row, said.text);
  assert.ok(!row[0] || row[0].split(' ').includes('morning'));
  assert.ok(row[1].split(' ').includes('serving'));
});

test('no repeats until the pool is used up', () => {
  const recent = new Set();
  const rand = seeded(11);
  const seen = [];
  for (let i = 0; i < 6; i++) seen.push(pick('henri', { hour: 16.4, activity: 'bench', recent, rand }).text);
  const exact = DIALOG.henri.lines.filter((r) => (!r[0] || r[0].includes('afternoon')) && r[1].includes('bench')).length;
  assert.equal(new Set(seen.slice(0, exact)).size, Math.min(exact, 6));
  // And never the same line twice in a row, however long you keep clicking.
  for (let i = 0; i < 60; i++) {
    const a = pick('leo', { hour: 10, activity: 'playing', recent, rand }).text;
    const b = pick('leo', { hour: 10, activity: 'playing', recent, rand }).text;
    assert.notEqual(a, b);
  }
});

test('exchanges: a reply comes from someone nearby, under their own id', () => {
  const recent = new Set();
  let got = null;
  for (let i = 0; i < 50 && !got; i++) {
    const s = pick('henri', { hour: 16.4, activity: 'bench', nearby: ['odile', 'x3'], recent, rand: seeded(i + 1) });
    if (s.reply) got = s;
  }
  assert.ok(got, 'Henri and Odile should talk on the bench');
  assert.equal(got.reply.id, 'odile');
  // Visitors are aliased: x1 speaks the visitor bank, and replies keep the scene id.
  let v = null;
  for (let i = 0; i < 50 && !v; i++) {
    const s = pick('x1', { hour: 22, nearby: ['waiter', 'marcel'], rand: seeded(i + 1) });
    if (s.reply) v = s;
  }
  assert.ok(v);
  assert.equal(v.id, 'x1');
  assert.ok(['waiter', 'marcel'].includes(v.reply.id));
  // Nobody nearby, no reply.
  for (let i = 0; i < 30; i++) assert.equal(pick('henri', { hour: 16.4, activity: 'bench', rand: seeded(i) }).reply, null);
});

test('every exchange is between characters who have lines', () => {
  for (const e of EXCHANGES) {
    assert.ok(DIALOG[e.a], e.a);
    assert.ok(DIALOG[e.b], e.b);
  }
});

test('phases and activities map from the clock and the cast', () => {
  assert.equal(phaseOf(6), 'dawn');
  assert.equal(phaseOf(12), 'midday');
  assert.equal(phaseOf(19.45), 'golden');
  assert.equal(phaseOf(19.8), 'sunset');
  assert.equal(phaseOf(20.5), 'blue');
  assert.equal(phaseOf(23), 'night');
  assert.equal(phaseOf(0.75), 'late');
  assert.equal(phaseOf(24 + 9), 'morning');
  for (const p of [...CAST, ...EXTRAS]) {
    for (const [, act] of p.day) assert.ok(ACTIVITIES.includes(activityOf(act)), `${p.id} ${JSON.stringify(act)}`);
  }
  assert.equal(activityOf({ act: 'home' }, 'travel'), 'goinghome');
  assert.equal(activityOf({ act: 'loop', loop: 'jog' }), 'running');
  assert.equal(activityOf({ act: 'spot', spot: 'rail:4' }), 'railing');
  assert.equal(activityOf({ act: 'spot', spot: 'drinks:1b' }), 'rose');
  assert.equal(activityOf({ act: 'inside', site: 'toolrails' }), 'workshop');
});

test('unknown characters say nothing', () => {
  assert.equal(pick('nobody', { hour: 12 }), null);
});

test('a ref is only said where its time and activity fit (no evening library lamp at a noon café table)', () => {
  const rand = seeded(7);
  for (let i = 0; i < 3000; i++) {
    const said = pick('henri', { hour: 12.5, activity: 'cafe', recent: new Set(), rand });
    assert.doesNotMatch(said.text, /lamp/i, said.text);
  }
  const refRows = Object.entries(DIALOG).flatMap(([id, e]) => e.refs.map((r) => ({ id, w: r[0], a: r[1], t: r[2] })));
  for (const id of MAIN) {
    for (const [phase, hour] of Object.entries(PHASE_HOUR)) {
      for (const activity of ACTIVITIES) {
        const r2 = seeded(3);
        for (let i = 0; i < 40; i++) {
          const said = pick(id, { hour, activity, recent: new Set(), rand: r2 });
          if (!said || !said.ref || said.reply) continue;
          const row = refRows.find((r) => r.id === id && r.t === said.text);
          assert.ok(row, said.text);
          if (row.w) assert.ok(row.w.split(' ').includes(phase), `${id} ${phase}: ${row.t}`);
          if (row.a) assert.ok(row.a.split(' ').includes(activity), `${id} ${activity}: ${row.t}`);
        }
      }
    }
  }
});

test('the full dialog banks are valid and load into the picker', async () => {
  const { readdirSync, readFileSync } = await import('node:fs')
  const dir = new URL('../../site/static/assets/town/dialog/', import.meta.url)
  const { DIALOG: D, EXCHANGES: X, extend, pick: pk, PHASES: P } = await import('../../site/static/assets/town/js/dialog.js')
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
  assert.ok(files.length >= 16)
  for (const f of files) {
    const bank = f.replace(/\.json$/, '')
    assert.ok(D[bank], `no bank ${bank}`)
    const data = JSON.parse(readFileSync(new URL(f, dir), 'utf8'))
    for (const [when, , text] of [...data.lines, ...data.refs]) {
      assert.ok(P.includes(when), `${bank}: phase ${when}`)
      assert.ok(text.length <= 70, `${bank}: too long: ${text}`)
    }
    for (const [b, when, , line, reply] of data.exchanges) {
      assert.ok(D[b] || b === 'dog', `${bank}: replier ${b}`)
      assert.ok(P.includes(when) && line.length <= 70 && reply.length <= 70, `${bank}: exchange ${line}`)
    }
    const before = D[bank].lines.length
    extend(bank, data)
    assert.ok(D[bank].lines.length >= before + data.lines.length)
  }
  assert.ok(X.length > 1000)
  const recent = new Set()
  for (let i = 0; i < 300; i++) assert.ok(pk('henri', { hour: 16.4, activity: 'bench', recent })?.text)
})
