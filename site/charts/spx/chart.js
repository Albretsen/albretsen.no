// S&P Composite records chart for "Stop caring about all-time highs".
// Dependency-free ES module. mountSpxChart(el, { lang, dataUrl }) renders it live;
// the pure helpers below are also used by build-data.ts for the static fallback.

const SERIES = ['nominal', 'real', 'tr']
const SCALES = ['lin', 'log']
const MIN_SPAN = 5 // years the slider always leaves in view

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const loc = l => (l === 'nb' ? 'nb-NO' : 'en-GB')
const NF = {}
export const num = (lang, v, d = 0) =>
  (NF[lang + d] ||= new Intl.NumberFormat(loc(lang), { minimumFractionDigits: d, maximumFractionDigits: d })).format(v)

/** spx.json stores each series as deltas of round(ln(v) * k). Returns { y0, m0, n, s: { nominal, real, tr }, copy }. */
export function decode(raw) {
  const s = {}
  for (const k in raw.d) {
    let q = 0
    s[k] = raw.d[k].map(d => Math.exp((q += d) / raw.k))
  }
  return { y0: raw.y0, m0: raw.m0, n: s.nominal.length, s, copy: raw.copy }
}
export const endYear = D => D.y0 + Math.floor((D.m0 - 1 + D.n - 1) / 12)
export const idxOfYear = (D, y) => Math.max(0, Math.min(D.n - 1, (y - D.y0) * 12 - (D.m0 - 1)))
const ym = (D, i) => { const t = D.m0 - 1 + i; return [D.y0 + Math.floor(t / 12), (t % 12) + 1] }

/** Records in the window starting at s: months above every earlier month in view. */
export function analyse(a, s) {
  const n = a.length, rec = []
  let m = a[s]
  for (let i = s + 1; i < n; i++) if (a[i] > m) { m = a[i]; rec.push(i) }
  const months = n - 1 - s, g = a[n - 1] / a[s]
  return { rec, months, years: months / 12, growth: g, annual: Math.pow(g, 12 / months) - 1, share: rec.length / months }
}

const DF = {}
const month = (lang, D, i) => { const [y, m] = ym(D, i); return (DF[lang] ||= new Intl.DateTimeFormat(loc(lang), { month: 'short', year: 'numeric', timeZone: 'UTC' })).format(new Date(Date.UTC(y, m - 1, 15))) }
export const val = (lang, v) => num(lang, v, Math.round(v * 100) < 10000 ? 2 : 0)

export function statText(lang, A, D, a, s) {
  const g = A.growth
  return {
    window: num(lang, A.years, 1),
    span: month(lang, D, s) + '–' + month(lang, D, D.n - 1),
    growth: num(lang, g, g >= 100 ? 0 : g >= 10 ? 1 : 2) + '×',
    ends: val(lang, a[s]) + ' → ' + val(lang, a[D.n - 1]),
    annual: (A.annual < 0 ? '−' : '+') + num(lang, Math.abs(A.annual * 100), 1) + ' %',
    records: num(lang, A.share * 100) + ' %',
    recSub: num(lang, A.rec.length) + ' / ' + num(lang, A.months)
  }
}

function nice(x) {
  const p = Math.pow(10, Math.floor(Math.log10(x))), f = x / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
}
function linTicks(lo, hi, count) {
  const st = nice((hi - lo) / count), out = []
  for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) out.push(+v.toPrecision(12))
  return out
}
function logTicks(lo, hi) {
  for (const mult of [[1], [1, 3], [1, 2, 5], [1, 1.5, 2, 3, 5, 7]]) {
    const out = []
    for (let d = Math.floor(Math.log10(lo)); d <= Math.ceil(Math.log10(hi)); d++)
      for (const m of mult) { const v = +(m * Math.pow(10, d)).toPrecision(6); if (v >= lo && v <= hi) out.push(v) }
    if (out.length >= 3) return out
  }
  return linTicks(lo, hi, 3).filter(v => v > 0)
}
function tickLabel(lang, v, d) {
  if (v >= 1e6) return num(lang, v / 1e6, v % 1e6 ? 1 : 0) + 'M'
  if (v >= 1e4) return num(lang, v / 1e3) + 'k'
  return num(lang, v, d)
}
const decimals = ts => { for (let d = 0; d < 3; d++) if (ts.every(t => Math.abs(t * 10 ** d - Math.round(t * 10 ** d)) < 1e-6)) return d; return 2 }

/** Geometry for one view. fs = tick font size in px; everything else scales from it. */
export function geom(D, a, s, scale, W, H, fs, lang) {
  const ml = Math.round(fs * 4.6), mr = Math.round(fs * 0.9), mt = Math.round(fs * 1.1), mb = Math.round(fs * 2.6)
  const pw = W - ml - mr, ph = H - mt - mb, n = a.length, span = n - 1 - s
  let lo = Infinity, hi = -Infinity
  for (let i = s; i < n; i++) { if (a[i] < lo) lo = a[i]; if (a[i] > hi) hi = a[i] }
  const log = scale === 'log'
  let yt, Y
  if (log) {
    lo /= 1.06; hi *= 1.06
    const l0 = Math.log(lo), k = ph / (Math.log(hi) - l0)
    Y = v => mt + ph - (Math.log(v) - l0) * k
    yt = logTicks(lo, hi)
  } else {
    hi *= 1.04
    const k = ph / hi
    Y = v => mt + ph - v * k
    yt = linTicks(0, hi, ph < 220 ? 3 : 4)
  }
  const d = decimals(yt)
  const X = i => ml + ((i - s) / span) * pw
  const y0 = ym(D, s)[0] + (ym(D, s)[1] > 1 ? 1 : 0), y1 = endYear(D), yrs = span / 12
  const maxT = Math.max(2, Math.floor(pw / (fs * 6.2)))
  const step = [1, 2, 5, 10, 20, 25, 50].find(st => yrs / st <= maxT) || 50
  const xt = []
  for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) {
    const x = X(idxOfYear(D, y))
    if (x - ml > fs * 1.4 && W - mr - x > fs * 1.4) xt.push({ y, x })
  }
  return { ml, mr, mt, mb, pw, ph, X, Y, base: mt + ph, yt: yt.map(v => ({ v, y: Y(v), t: tickLabel(lang, v, d) })), xt, s, n }
}

const f1 = v => Math.round(v * 10) / 10
export function linePath(G, ys) {
  let p = ''
  for (let k = 0; k < ys.length; k++) p += (k ? 'L' : 'M') + f1(G.X(G.s + k)) + ',' + f1(ys[k])
  return p
}
export const areaPath = (G, ys, line) => line + 'L' + f1(G.X(G.n - 1)) + ',' + G.base + 'L' + G.ml + ',' + G.base + 'Z'
// Dots are zero-length segments with round caps: stroke-width = diameter.
export function dotsPath(G, ys, rec) {
  let p = ''
  for (const i of rec) p += 'M' + f1(G.X(i)) + ',' + f1(ys[i - G.s]) + 'h0'
  return p
}
export const dotR = G => Math.max(1.6, Math.min(3, (G.pw / (G.n - G.s)) * 0.9))
export function gridMarkup(G, fs) {
  let g = ''
  for (const t of G.yt) {
    const y = f1(t.y)
    g += `<line class="spx-gl${t.v === 0 ? ' spx-g0' : ''}" x1="${G.ml}" x2="${G.ml + G.pw}" y1="${y}" y2="${y}"/>` +
      `<text class="spx-yt" x="${G.ml - fs * 0.7}" y="${f1(t.y + fs * 0.36)}" text-anchor="end">${esc(t.t)}</text>`
  }
  for (const t of G.xt) {
    const x = f1(t.x)
    g += `<line class="spx-xk" x1="${x}" x2="${x}" y1="${G.base}" y2="${G.base + fs * 0.45}"/>` +
      `<text class="spx-xt" x="${x}" y="${f1(G.base + fs * 1.75)}" text-anchor="middle">${t.y}</text>`
  }
  return g
}

/** Static markup shared by the live chart and the server-rendered shell. */
export function shellHTML(c, lang, v, plot) {
  const id = 'spx-' + lang + '-start'
  const seg = (k, keys, lab, cur) => keys.map(x => `<button type="button" data-${k}="${x}" aria-pressed="${x === cur}">${esc(lab[x])}</button>`).join('')
  const notes = (keys, m, cur) => keys.map(x => `<p class="spx-note${x === cur ? ' on' : ''}" data-note="${x}"${x === cur ? '' : ' aria-hidden="true"'}>${esc(m[x])}</p>`).join('')
  const presets = c.presets.map(p => { const y = p.year === 'first' ? v.y0 : p.year; return `<button type="button" data-year="${y}" aria-pressed="${y === v.start}">${esc(p.label)}</button>` }).join('')
  const T = v.text
  const stat = (k, v, unit, sub) => `<div class="spx-stat spx-s-${k}"><dt>${esc(c.stats[k])}</dt><dd><b data-s="${k}">${v}</b>${unit ? ` <span class="spx-unit">${esc(unit)}</span>` : ''}</dd><dd class="spx-sub"${sub ? ` data-s="${sub}">${T[sub]}` : '>'}</dd></div>`
  return `<figure class="spx" lang="${lang}" data-series="${v.series}" data-scale="${v.scale}">
<header class="spx-head"><p class="spx-eyebrow">${esc(c.eyebrow)}</p><p class="spx-title">${esc(c.title)}</p><p class="spx-hint spx-js">${esc(c.hint)}</p></header>
<div class="spx-ui spx-js">
<div class="spx-start"><label class="spx-lab" for="${id}">${esc(c.startLabel)}</label><output class="spx-year" for="${id}">${v.start}</output>
<input class="spx-range" id="${id}" type="range" min="${v.y0}" max="${v.yMax}" step="1" value="${v.start}" style="--p:${((v.start - v.y0) / (v.yMax - v.y0)) * 100}%">
<div class="spx-presets" role="group" aria-label="${esc(c.startLabel)}">${presets}</div></div>
<div class="spx-sw"><span class="spx-lab" id="spx-${lang}-ser">${esc(c.seriesLabel)}</span><div class="spx-seg" role="group" aria-labelledby="spx-${lang}-ser">${seg('series', SERIES, c.series, v.series)}</div><div class="spx-notes">${notes(SERIES, c.seriesNote, v.series)}</div></div>
<div class="spx-sw"><span class="spx-lab" id="spx-${lang}-sc">${esc(c.scaleLabel)}</span><div class="spx-seg" role="group" aria-labelledby="spx-${lang}-sc">${seg('scale', SCALES, c.scale, v.scale)}</div><div class="spx-notes">${notes(SCALES, c.scaleNote, v.scale)}</div></div>
</div>
<dl class="spx-stats spx-js">${stat('window', T.window, c.windowUnit, 'span')}${stat('growth', T.growth, '', 'ends')}${stat('annual', T.annual)}${stat('records', T.records, '', 'recSub')}</dl>
<div class="spx-plot" tabindex="0" role="group" aria-label="${esc(c.a11y)}">${plot}<div class="spx-tip" aria-hidden="true"><span class="spx-td"></span><span class="spx-tv"></span><span class="spx-tr">${esc(c.tooltipRecord)}</span></div></div>
<p class="spx-live" aria-live="polite"></p>
<figcaption><p class="spx-legend"><i aria-hidden="true"></i>${esc(c.recordsLegend)}</p><p class="spx-source">${esc(c.source)}</p></figcaption>
</figure>`
}

const LIVE_PLOT = '<svg class="spx-svg" aria-hidden="true" focusable="false"><g class="spx-grid"></g><path class="spx-area"/><path class="spx-line"/><path class="spx-dots"/><g class="spx-cur"><line class="spx-cl"/><circle class="spx-cc" r="4"/></g></svg>'

export async function mountSpxChart(el, { lang = 'en', dataUrl, series = 'nominal', scale = 'lin', start } = {}) {
  const D = decode(await (await fetch(dataUrl)).json())
  const c = D.copy[lang] || D.copy.en
  const yMax = endYear(D) - MIN_SPAN
  const st = { series, scale, start: Math.min(yMax, start || D.y0) }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  const view = () => ({ ...st, y0: D.y0, yMax, text: stats() })
  const stats = () => { const a = D.s[st.series], s = idxOfYear(D, st.start); return statText(lang, analyse(a, s), D, a, s) }
  el.innerHTML = shellHTML(c, lang, view(), LIVE_PLOT)
  const $ = q => el.querySelector(q), $$ = q => [...el.querySelectorAll(q)]
  const fig = $('.spx'), plot = $('.spx-plot'), svg = $('.spx-svg'), grid = $('.spx-grid')
  const line = $('.spx-line'), area = $('.spx-area'), dots = $('.spx-dots'), cur = $('.spx-cur')
  const tip = $('.spx-tip'), range = $('.spx-range'), out = $('.spx-year'), live = $('.spx-live')
  const sEl = Object.fromEntries($$('[data-s]').map(e => [e.dataset.s, e]))
  let W = 0, H = 0, fs = 11, G, A, a, ys, shown, raf = 0, anim = 0, hover = -1, flags

  function frame(morph) {
    a = D.s[st.series]
    const s = idxOfYear(D, st.start)
    A = analyse(a, s)
    flags = new Uint8Array(D.n); for (const i of A.rec) flags[i] = 1
    const T = statText(lang, A, D, a, s)
    for (const k in T) if (sEl[k].textContent !== T[k]) sEl[k].textContent = T[k]
    if (!W) return
    G = geom(D, a, s, st.scale, W, H, fs, lang)
    grid.innerHTML = gridMarkup(G, fs)
    ys = new Float64Array(D.n - s)
    for (let k = 0; k < ys.length; k++) ys[k] = G.Y(a[s + k])
    cancelAnimationFrame(anim)
    const from = shown
    if (morph && from && from.length === ys.length && !reduce.matches) {
      const t0 = performance.now(), to = ys, mid = new Float64Array(to.length)
      dots.style.opacity = 0
      const step = now => {
        const t = Math.min(1, (now - t0) / 560), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        for (let k = 0; k < to.length; k++) mid[k] = from[k] + (to[k] - from[k]) * e
        paint(mid, t === 1)
        if (t < 1) anim = requestAnimationFrame(step)
      }
      anim = requestAnimationFrame(step)
    } else paint(ys, true)
  }
  function paint(y, done) {
    const p = linePath(G, y)
    line.setAttribute('d', p)
    area.setAttribute('d', areaPath(G, y, p))
    if (done) { dots.setAttribute('d', dotsPath(G, y, A.rec)); dots.setAttribute('stroke-width', f1(2 * dotR(G))); dots.style.opacity = ''; shown = Float64Array.from(y) }
    else shown = y
    cursor()
  }
  function cursor() {
    if (hover < 0 || !G) { cur.style.display = 'none'; tip.classList.remove('on'); return }
    const i = Math.max(G.s, Math.min(D.n - 1, hover)), x = G.X(i), y = shown[i - G.s], rec = flags[i]
    cur.style.display = ''
    cur.firstChild.setAttribute('x1', x); cur.firstChild.setAttribute('x2', x)
    cur.firstChild.setAttribute('y1', G.mt); cur.firstChild.setAttribute('y2', G.base)
    cur.lastChild.setAttribute('cx', x); cur.lastChild.setAttribute('cy', y)
    cur.classList.toggle('rec', !!rec)
    const date = month(lang, D, i), v = val(lang, a[i])
    tip.children[0].textContent = date
    tip.children[1].textContent = v
    tip.classList.toggle('rec', !!rec)
    tip.classList.add('on')
    const tw = tip.offsetWidth, th = tip.offsetHeight
    const left = x + 14 + tw > W - 4 ? x - 14 - tw : x + 14
    const top = Math.max(4, Math.min(H - th - 4, y - th - 12))
    tip.style.transform = `translate(${Math.round(left)}px,${Math.round(top)}px)`
    live.textContent = date + ': ' + v + (rec ? ', ' + c.tooltipRecord : '')
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; frame(false) }) }

  function setStart(y) {
    st.start = Math.max(D.y0, Math.min(yMax, y))
    range.value = st.start
    out.textContent = st.start
    range.style.setProperty('--p', ((st.start - D.y0) / (yMax - D.y0)) * 100 + '%')
    range.setAttribute('aria-valuetext', String(st.start))
    for (const b of $$('[data-year]')) b.setAttribute('aria-pressed', +b.dataset.year === st.start)
    if (hover >= 0) hover = Math.max(hover, idxOfYear(D, st.start))
    schedule()
  }
  function setOpt(k, v) {
    if (st[k] === v) return
    st[k] = v
    fig.dataset[k] = v
    for (const b of $$(`[data-${k}]`)) b.setAttribute('aria-pressed', b.dataset[k] === v)
    for (const p of $$('.spx-note')) if ((k === 'series' ? SERIES : SCALES).includes(p.dataset.note)) {
      const on = p.dataset.note === v
      p.classList.toggle('on', on); on ? p.removeAttribute('aria-hidden') : p.setAttribute('aria-hidden', 'true')
    }
    frame(true)
  }

  range.addEventListener('input', () => setStart(+range.value))
  el.addEventListener('click', e => {
    const b = e.target.closest('button')
    if (!b) return
    if (b.dataset.year) setStart(+b.dataset.year)
    else if (b.dataset.series) setOpt('series', b.dataset.series)
    else if (b.dataset.scale) setOpt('scale', b.dataset.scale)
  })

  const pick = e => {
    if (!G) return
    const r = plot.getBoundingClientRect()
    hover = Math.round(G.s + ((e.clientX - r.left - G.ml) / G.pw) * (D.n - 1 - G.s))
    hover = Math.max(G.s, Math.min(D.n - 1, hover))
    cursor()
  }
  plot.addEventListener('pointermove', pick)
  plot.addEventListener('pointerdown', pick)
  plot.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && document.activeElement !== plot) { hover = -1; cursor() } })
  plot.addEventListener('focus', () => { if (hover < 0) { hover = D.n - 1; cursor() } })
  plot.addEventListener('blur', () => { hover = -1; cursor() })
  plot.addEventListener('keydown', e => {
    const k = e.key, s = idxOfYear(D, st.start), m = e.shiftKey ? 12 : 1
    let h = hover < 0 ? D.n - 1 : hover
    if (k === 'ArrowLeft' || k === 'ArrowDown') h -= m
    else if (k === 'ArrowRight' || k === 'ArrowUp') h += m
    else if (k === 'PageDown') h -= 120
    else if (k === 'PageUp') h += 120
    else if (k === 'Home') h = s
    else if (k === 'End') h = D.n - 1
    else if (k === 'Escape') { hover = -1; cursor(); return }
    else return
    e.preventDefault()
    hover = Math.max(s, Math.min(D.n - 1, h))
    cursor()
  })

  const size = () => {
    const r = plot.getBoundingClientRect()
    if (!r.width) return
    W = Math.round(r.width); H = Math.round(r.height); fs = W < 480 ? 10 : 11
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    svg.setAttribute('width', W); svg.setAttribute('height', H)
    shown = null
    frame(false)
  }
  new ResizeObserver(size).observe(plot)
  size()
  return { set: o => { if (o.start) setStart(o.start); if (o.series) setOpt('series', o.series); if (o.scale) setOpt('scale', o.scale) } }
}
