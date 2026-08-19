'use client'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  SPX_NOMINAL,
  SPX_REAL,
  SPX_TOTAL_RETURN,
  SPX_START_YEAR,
  SPX_END_YEAR,
  spxIndexOfYear,
  spxMonth,
} from '@/lib/spx'

export type SeriesKey = 'nominal' | 'real' | 'tr'
export type ScaleKey = 'lin' | 'log'

export type AthChartCopy = {
  eyebrow: string
  title: string
  hint: string
  startLabel: string
  presets: { label: string; year: number | 'first' }[]
  seriesLabel: string
  series: Record<SeriesKey, string>
  seriesNote: Record<SeriesKey, string>
  scaleLabel: string
  scale: Record<ScaleKey, string>
  scaleNote: Record<ScaleKey, string>
  recordsLegend: string
  stats: { window: string; growth: string; annual: string; records: string }
  windowUnit: string
  tooltipRecord: string
  source: string
  a11y: string
}

const SERIES: Record<SeriesKey, number[]> = {
  nominal: SPX_NOMINAL,
  real: SPX_REAL,
  tr: SPX_TOTAL_RETURN,
}

const MONTHS_NB = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const PAD = { t: 18, r: 14, b: 30, l: 58 }
const STRIP_H = 22
const MIN_SPAN_YEARS = 5
const MAX_START_YEAR = SPX_END_YEAR - MIN_SPAN_YEARS

type Domain = { x0: number; x1: number; y0: number; y1: number }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** Rounded axis bounds that comfortably contain [lo, hi]. */
function niceBounds(lo: number, hi: number): [number, number] {
  if (!(hi > lo)) return [lo - 1, hi + 1]
  const pad = (hi - lo) * 0.08
  const a = Math.max(0, lo - pad)
  const b = hi + pad
  const step = Math.pow(10, Math.floor(Math.log10(b - a))) / 2
  return [Math.floor(a / step) * step, Math.ceil(b / step) * step]
}

function linTicks(lo: number, hi: number, count = 5): number[] {
  const raw = (hi - lo) / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) ?? 10 * mag
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(v)
  return out
}

function logTicks(lo: number, hi: number): number[] {
  const out: number[] = []
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo <= 0 || hi <= lo) return out
  const from = Math.floor(Math.log10(lo))
  const to = Math.min(Math.ceil(Math.log10(hi)), from + 12)
  const decades = to - from
  const mults = decades > 4 ? [1] : decades > 2 ? [1, 3] : [1, 2, 5]
  for (let e = from; e <= to; e++) {
    for (const m of mults) {
      const v = m * Math.pow(10, e)
      if (v >= lo && v <= hi) out.push(v)
    }
  }
  return out
}

const YEAR_STEPS = [1, 2, 5, 10, 20, 25, 50, 100]

/** Coarsest-to-finest step that keeps roughly 48px between year labels. */
function yearTickStep(span: number, plotW: number): number {
  const maxTicks = Math.max(2, Math.floor(plotW / 48))
  return YEAR_STEPS.find(step => span / step <= maxTicks) ?? YEAR_STEPS[YEAR_STEPS.length - 1]
}

export function AthChart({ t, lang }: { t: AthChartCopy; lang: string }) {
  const locale = lang === 'no' ? 'nb-NO' : 'en-US'
  const months = lang === 'no' ? MONTHS_NB : MONTHS_EN

  const [startYear, setStartYear] = useState(SPX_START_YEAR)
  const [series, setSeries] = useState<SeriesKey>('nominal')
  const [scale, setScale] = useState<ScaleKey>('lin')
  const [hover, setHover] = useState<number | null>(null)

  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(e.contentRect.width)
    })
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  const height = width ? Math.round(Math.min(430, Math.max(260, width * 0.5))) : 340
  const plotH = Math.max(1, height - PAD.t - PAD.b - STRIP_H)

  const values = SERIES[series]
  const i0 = spxIndexOfYear(startYear)
  const i1 = values.length - 1

  /** Months that set a new high relative to everything else on screen. */
  const records = useMemo(() => {
    const out: number[] = []
    let max = -Infinity
    for (let i = i0; i <= i1; i++) {
      if (values[i] >= max) {
        max = values[i]
        out.push(i)
      }
    }
    return out
  }, [values, i0, i1])

  const target: Domain = useMemo(() => {
    let lo = Infinity
    let hi = -Infinity
    for (let i = i0; i <= i1; i++) {
      if (values[i] < lo) lo = values[i]
      if (values[i] > hi) hi = values[i]
    }
    if (scale === 'log') {
      const l = Math.log10(Math.max(lo, 1e-6))
      const h = Math.log10(hi)
      const pad = (h - l) * 0.06 || 0.1
      return { x0: i0, x1: i1, y0: l - pad, y1: h + pad }
    }
    const [a, b] = niceBounds(lo, hi)
    return { x0: i0, x1: i1, y0: a, y1: b }
  }, [values, i0, i1, scale])

  // Ease the axes toward the new window so the rescaling is legible, not a jump cut.
  const [domain, setDomain] = useState<Domain>(target)
  const animRef = useRef<number | null>(null)
  const fromRef = useRef<Domain>(target)
  const firstRef = useRef(true)
  const scaleRef = useRef(scale)

  useEffect(() => {
    // Linear and log y-domains are not on the same number line, so a scale switch
    // has to snap rather than tween — interpolating between them is meaningless.
    const scaleChanged = scaleRef.current !== scale
    scaleRef.current = scale
    if (firstRef.current || scaleChanged) {
      firstRef.current = false
      if (animRef.current) cancelAnimationFrame(animRef.current)
      setDomain(target)
      return
    }
    if (animRef.current) cancelAnimationFrame(animRef.current)
    fromRef.current = domain
    const from = fromRef.current
    // A hidden document does not run animation frames, so tweening there would leave the
    // axes stranded on the previous window until the tab comes back.
    const snap =
      (typeof document !== 'undefined' && document.hidden) ||
      (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    if (snap) {
      setDomain(target)
      return
    }
    const t0 = performance.now()
    const dur = 620
    const step = (now: number) => {
      const k = easeOut(Math.min(1, (now - t0) / dur))
      setDomain({
        x0: lerp(from.x0, target.x0, k),
        x1: lerp(from.x1, target.x1, k),
        y0: lerp(from.y0, target.y0, k),
        y1: lerp(from.y1, target.y1, k),
      })
      if (k < 1) animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
    // `domain` is read as the animation's starting point only; tracking it would restart the tween.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, scale])

  const nf = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale])
  const nfOne = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }), [locale])
  const nfSmall = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }), [locale])
  const fmt = useCallback(
    (v: number) => (v >= 100 ? nf.format(v) : v >= 10 ? nfOne.format(v) : nfSmall.format(v)),
    [nf, nfOne, nfSmall]
  )

  const yTicks = useMemo(() => {
    if (!width) return []
    return scale === 'log'
      ? logTicks(Math.pow(10, domain.y0), Math.pow(10, domain.y1))
      : linTicks(domain.y0, domain.y1)
  }, [width, scale, domain])

  // The total-return series reaches seven figures, so the left gutter has to grow with the labels.
  const padL = useMemo(() => {
    const longest = yTicks.reduce((m, v) => Math.max(m, fmt(v).length), 3)
    return Math.max(44, Math.min(96, Math.round(longest * 6.3) + 16))
  }, [yTicks, fmt])

  const plotW = Math.max(1, width - padL - PAD.r)

  const px = useCallback(
    (i: number) => padL + ((i - domain.x0) / Math.max(1e-9, domain.x1 - domain.x0)) * plotW,
    [domain, plotW, padL]
  )
  const py = useCallback(
    (v: number) => {
      const y = scale === 'log' ? Math.log10(Math.max(v, 1e-6)) : v
      return PAD.t + (1 - (y - domain.y0) / Math.max(1e-9, domain.y1 - domain.y0)) * plotH
    },
    [domain, plotH, scale]
  )

  // Draw a little past the window edges so the line slides in rather than popping.
  const drawFrom = Math.max(0, Math.floor(domain.x0) - 2)
  const drawTo = Math.min(values.length - 1, Math.ceil(domain.x1) + 2)

  const { line, area } = useMemo(() => {
    if (!width) return { line: '', area: '' }
    let d = ''
    for (let i = drawFrom; i <= drawTo; i++) {
      d += `${i === drawFrom ? 'M' : 'L'}${px(i).toFixed(1)} ${py(values[i]).toFixed(1)}`
    }
    const base = (PAD.t + plotH).toFixed(1)
    const a = d
      ? `${d}L${px(drawTo).toFixed(1)} ${base}L${px(drawFrom).toFixed(1)} ${base}Z`
      : ''
    return { line: d, area: a }
  }, [width, drawFrom, drawTo, px, py, values, plotH])

  const xTicks = useMemo(() => {
    if (!width) return []
    const [ya] = spxMonth(Math.round(domain.x0))
    const [yb] = spxMonth(Math.round(domain.x1))
    const step = yearTickStep(yb - ya, plotW)
    const out: number[] = []
    for (let y = Math.ceil(ya / step) * step; y <= yb; y += step) out.push(y)
    if (out.length && yb - out[out.length - 1] > step * 0.5) out.push(yb)
    return out
  }, [width, domain, plotW])

  const pct = (v: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(v)

  const spanYears = (i1 - i0) / 12
  const multiple = values[i1] / values[i0]
  const cagr = Math.pow(multiple, 1 / Math.max(spanYears, 1e-9)) - 1
  const recordShare = (records.length / (i1 - i0 + 1)) * 100

  const recordSet = useMemo(() => new Set(records), [records])

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!width) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const frac = (x - padL) / plotW
    const i = Math.round(domain.x0 + frac * (domain.x1 - domain.x0))
    setHover(i >= i0 && i <= i1 ? i : null)
  }

  const hoverIdx = hover
  const hoverPoint =
    hoverIdx != null ? { x: px(hoverIdx), y: py(values[hoverIdx]), v: values[hoverIdx] } : null
  const hoverDate = hoverIdx != null ? spxMonth(hoverIdx) : null

  const presetActive = (year: number | 'first') =>
    (year === 'first' ? SPX_START_YEAR : year) === startYear

  return (
    <figure className="ath">
      <div className="ath-head">
        <div className="ath-eyebrow">{t.eyebrow}</div>
        <h3 className="ath-title">{t.title}</h3>
        <p className="ath-hint">{t.hint}</p>
      </div>

      <div className="ath-controls">
        <div className="ath-ctl ath-ctl--slider">
          <label className="ath-ctl-k" htmlFor="ath-start">
            {t.startLabel}
            <span className="ath-ctl-v">{startYear}</span>
          </label>
          <input
            id="ath-start"
            className="ath-range"
            type="range"
            min={SPX_START_YEAR}
            max={MAX_START_YEAR}
            step={1}
            value={startYear}
            onChange={e => setStartYear(Number(e.target.value))}
          />
          <div className="ath-presets">
            {t.presets.map(p => (
              <button
                key={String(p.year)}
                type="button"
                className={'ath-chip' + (presetActive(p.year) ? ' is-active' : '')}
                onClick={() => setStartYear(p.year === 'first' ? SPX_START_YEAR : p.year)}
                aria-pressed={presetActive(p.year)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ath-ctl">
          <span className="ath-ctl-k">{t.seriesLabel}</span>
          <div className="ath-chips" role="group" aria-label={t.seriesLabel}>
            {(Object.keys(t.series) as SeriesKey[]).map(k => (
              <button
                key={k}
                type="button"
                className={'ath-chip' + (series === k ? ' is-active' : '')}
                onClick={() => setSeries(k)}
                aria-pressed={series === k}
              >
                {t.series[k]}
              </button>
            ))}
          </div>
          <p className="ath-ctl-note">{t.seriesNote[series]}</p>
        </div>

        <div className="ath-ctl">
          <span className="ath-ctl-k">{t.scaleLabel}</span>
          <div className="ath-chips" role="group" aria-label={t.scaleLabel}>
            {(Object.keys(t.scale) as ScaleKey[]).map(k => (
              <button
                key={k}
                type="button"
                className={'ath-chip' + (scale === k ? ' is-active' : '')}
                onClick={() => setScale(k)}
                aria-pressed={scale === k}
              >
                {t.scale[k]}
              </button>
            ))}
          </div>
          <p className="ath-ctl-note">{t.scaleNote[scale]}</p>
        </div>
      </div>

      <div className="ath-plot" ref={wrapRef}>
        {width > 0 && (
          <svg
            className="ath-svg"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={t.a11y}
            onPointerMove={onPointer}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="ath-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green)" stopOpacity="0.20" />
                <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
              </linearGradient>
              <clipPath id="ath-clip">
                <rect x={padL} y={PAD.t - 6} width={plotW} height={plotH + 6} />
              </clipPath>
              <clipPath id="ath-clip-strip">
                <rect x={padL} y={PAD.t + plotH} width={plotW} height={STRIP_H + PAD.b} />
              </clipPath>
            </defs>

            {yTicks.map(v => {
              const y = py(v)
              if (y < PAD.t - 2 || y > PAD.t + plotH + 2) return null
              return (
                <g key={v}>
                  <line
                    className="ath-grid"
                    x1={padL}
                    x2={padL + plotW}
                    y1={y.toFixed(1)}
                    y2={y.toFixed(1)}
                  />
                  <text className="ath-ylabel" x={padL - 10} y={y + 3.5} textAnchor="end">
                    {fmt(v)}
                  </text>
                </g>
              )
            })}

            <g clipPath="url(#ath-clip)">
              <path className="ath-area" d={area} fill="url(#ath-fill)" />
              <path className="ath-line" d={line} />
              {records.map(i => {
                const x = px(i)
                if (x < padL - 2 || x > padL + plotW + 2) return null
                return <circle key={i} className="ath-dot" cx={x.toFixed(1)} cy={py(values[i]).toFixed(1)} r={2.1} />
              })}
            </g>

            <line
              className="ath-axis"
              x1={padL}
              x2={padL + plotW}
              y1={PAD.t + plotH}
              y2={PAD.t + plotH}
            />

            <g clipPath="url(#ath-clip-strip)">
              {records.map(i => {
                const x = px(i)
                if (x < padL - 2 || x > padL + plotW + 2) return null
                return (
                  <line
                    key={i}
                    className="ath-tick"
                    x1={x.toFixed(1)}
                    x2={x.toFixed(1)}
                    y1={PAD.t + plotH + 7}
                    y2={PAD.t + plotH + 7 + 9}
                  />
                )
              })}
              {xTicks.map(y => {
                const idx = spxIndexOfYear(y)
                const x = px(idx)
                if (x < padL - 12 || x > padL + plotW + 12) return null
                // Keep the outermost labels inside the plot instead of half-clipped by it.
                const nearLeft = x < padL + 16
                const nearRight = x > padL + plotW - 16
                return (
                  <text
                    key={y}
                    className="ath-xlabel"
                    x={(nearLeft ? padL : nearRight ? padL + plotW : x).toFixed(1)}
                    y={PAD.t + plotH + STRIP_H + 16}
                    textAnchor={nearLeft ? 'start' : nearRight ? 'end' : 'middle'}
                  >
                    {y}
                  </text>
                )
              })}
            </g>

            {hoverPoint && hoverDate && (
              <g className="ath-hover" pointerEvents="none">
                <line
                  className="ath-crosshair"
                  x1={hoverPoint.x.toFixed(1)}
                  x2={hoverPoint.x.toFixed(1)}
                  y1={PAD.t}
                  y2={PAD.t + plotH}
                />
                <circle
                  className="ath-hover-dot"
                  cx={hoverPoint.x.toFixed(1)}
                  cy={hoverPoint.y.toFixed(1)}
                  r={4}
                />
              </g>
            )}
          </svg>
        )}

        {hoverPoint && hoverDate && (
          <div
            className="ath-tip"
            style={{
              left: Math.min(Math.max(hoverPoint.x, padL + 4), padL + plotW - 4),
              top: PAD.t + 2,
            }}
          >
            <span className="ath-tip-d">
              {months[hoverDate[1] - 1]} {hoverDate[0]}
            </span>
            <span className="ath-tip-v">{fmt(hoverPoint.v)}</span>
            {recordSet.has(hoverIdx as number) && (
              <span className="ath-tip-badge">{t.tooltipRecord}</span>
            )}
          </div>
        )}
      </div>

      <div className="ath-legend">
        <span className="ath-legend-dot" />
        {t.recordsLegend}
      </div>

      <div className="ath-stats">
        <div className="ath-stat">
          <span className="ath-stat-k">{t.stats.window}</span>
          <span className="ath-stat-v">
            {startYear}–{SPX_END_YEAR}
          </span>
          <span className="ath-stat-s">
            {Math.round(spanYears)} {t.windowUnit}
          </span>
        </div>
        <div className="ath-stat">
          <span className="ath-stat-k">{t.stats.growth}</span>
          <span className="ath-stat-v">
            {fmt(multiple)}×
          </span>
        </div>
        <div className="ath-stat">
          <span className="ath-stat-k">{t.stats.annual}</span>
          <span className="ath-stat-v">+{nfOne.format(cagr * 100)} %</span>
        </div>
        <div className="ath-stat ath-stat--hero">
          <span className="ath-stat-k">{t.stats.records}</span>
          <span className="ath-stat-v">{pct(recordShare)} %</span>
          <span className="ath-stat-s">
            {nf.format(records.length)} / {nf.format(i1 - i0 + 1)}
          </span>
        </div>
      </div>

      <figcaption className="ath-source">{t.source}</figcaption>
    </figure>
  )
}
