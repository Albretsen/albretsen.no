// Living Town: the products' figures, kept live.
// Starts from ./content.js (the build-time figures from site/data.ts). If /api/figures has a newer
// figure, or one arrives over the event socket ({ type: 'figure', ... }), the number rolls to its new value.
// Nothing is invented: with no live store the content.js figure stands, with no freshness note.
const API = '/api/figures';
const ROLL = 1.6;   // seconds for a number to roll to its new value

// Same rule as the Worker and site/static/assets/js/figures.js: large figures drop decimals.
const fmt = (n, unit) => `${n.toLocaleString('en-US', { maximumFractionDigits: Math.abs(n) >= 100 ? 0 : 2 })}${unit ? ' ' + unit : ''}`;
const fmtExact = (n, unit) => `${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}${unit ? ' ' + unit : ''}`;
// '10,203 NOK' -> { num: 10203, unit: 'NOK', suffix: '' }; '113,000+' -> { num: 113000, suffix: '+' }
function parse(text) {
  const m = /^([\d,]+(?:\.\d+)?)(\+?)\s*([A-Za-z]{1,8})?$/.exec(String(text).trim());
  return m ? { num: +m[1].replace(/,/g, ''), suffix: m[2], unit: m[3] || '' } : null;
}

export function createFigures(products) {
  const subs = new Set();
  const F = {};
  for (const p of products) {
    if (!p.figure) continue;
    const parsed = parse(p.figure.value);
    F[p.id] = { text: p.figure.value, label: p.figure.label, exact: p.figure.exact || null, updated: null, live: false, parsed, roll: null };
  }
  const emit = (id) => subs.forEach((fn) => fn(id));

  /** A figure from the store or the socket: { value, label?, unit?, updated? }. */
  function set(id, f) {
    const cur = F[id];
    if (!cur || f == null || f.value == null) return;
    const isNum = typeof f.value === 'number' && Number.isFinite(f.value);
    const text = isNum ? fmt(f.value, f.unit) : String(f.value).slice(0, 24);
    const updated = f.updated ? new Date(f.updated) : new Date();
    cur.updated = isNaN(updated) ? new Date() : updated;
    if (f.label) cur.label = String(f.label).slice(0, 24);
    cur.exact = isNum && !Number.isInteger(f.value) ? fmtExact(f.value, f.unit) : null;
    if (text === cur.text) { emit(id); return; }
    const to = isNum ? { num: f.value, unit: f.unit || '', suffix: '' } : parse(text);
    const from = cur.parsed;
    // roll only between two numbers in the same unit
    if (from && to && from.unit === to.unit && from.suffix === to.suffix && from.num !== to.num) {
      cur.roll = { from: from.num, to: to.num, unit: to.unit, suffix: to.suffix, t0: performance.now(), final: text };
    } else cur.roll = null;
    cur.text = text; cur.parsed = to;
    emit(id);
  }

  /** What to show now for a product (mid-roll while a number is changing). */
  function get(id) {
    const f = F[id];
    if (!f) return null;
    let text = f.text, rolling = false;
    if (f.roll) {
      const k = Math.min(1, (performance.now() - f.roll.t0) / (ROLL * 1000));
      if (k >= 1) f.roll = null;
      else {
        rolling = true;
        const e = 1 - Math.pow(1 - k, 3);
        const v = f.roll.from + (f.roll.to - f.roll.from) * e;
        const whole = Math.abs(f.roll.to) >= 100 || Number.isInteger(f.roll.to);
        text = `${(whole ? Math.round(v) : v).toLocaleString('en-US', { maximumFractionDigits: whole ? 0 : 2 })}${f.roll.suffix}${f.roll.unit ? ' ' + f.roll.unit : ''}`;
      }
    }
    return { text, label: f.label, exact: f.exact, fresh: freshness(f), rolling };
  }

  function freshness(f) {
    if (!f.updated) return '';
    const s = (Date.now() - f.updated.getTime()) / 1000;
    if (f.live && s < 90) return 'live';
    if (s < 60) return 'updated just now';
    if (s < 3600) { const m = Math.round(s / 60); return `updated ${m} min ago`; }
    if (s < 86400) { const h = Math.round(s / 3600); return `updated ${h} h ago`; }
    return `updated ${f.updated.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  }

  async function load() {
    try {
      const r = await fetch(API, { cache: 'no-store', headers: { accept: 'application/json' } });
      if (!r.ok || !/json/.test(r.headers.get('content-type') || '')) return;
      const j = await r.json();
      for (const [id, f] of Object.entries(j?.figures || {})) set(id, f);
    } catch { /* no live store yet: content.js stands */ }
  }

  return {
    load,
    get,
    /** From the socket: a pushed figure counts as live for a while. */
    push(msg) { const f = F[msg.product]; if (!f) return; f.live = true; set(msg.product, msg); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    rolling: () => Object.values(F).some((f) => f.roll),
    ids: () => Object.keys(F),
  };
}

/** The event socket: figures and product events, reconnecting gently. */
export function openSocket({ onFigure, onEvent }) {
  if (typeof WebSocket === 'undefined') return;
  let wait = 5000, fails = 0, ws;
  const open = () => {
    if (fails >= 6) return;   // no socket out there yet: stay quiet, the 30 s poll still runs
    try { ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/events/socket`); } catch { return; }
    ws.onopen = () => { wait = 5000; fails = 0; };
    ws.onmessage = (m) => {
      let d; try { d = JSON.parse(m.data); } catch { return; }
      if (!d || typeof d !== 'object') return;
      if (d.type === 'figure') onFigure(d);
      else if (d.product && d.text) onEvent(d);
    };
    ws.onclose = () => { fails++; setTimeout(open, wait); wait = Math.min(wait * 2, 120000); };
  };
  open();
}
