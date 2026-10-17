// sun.js — tiny, dependency-free sun maths + sky palette for "Long Evening" (design 73).
// The signature delight: the sky on the page matches the real sky over Norway right now.
// Accuracy is about half a degree (NOAA low-precision formulae), plenty for colour.
//
//   import { sunPosition, skyPalette, norwayNow } from './sun.js'
//   const s = sunPosition(new Date())            // { elevation, azimuth } in degrees
//   const p = skyPalette(s.elevation)            // { zenith, horizon, glow, sun, ambient, night }
//   document.documentElement.style.setProperty('--sky-top', p.zenith)

export const NORWAY = { lat: 60.4, lon: 9.6 } // inland southern Norway, a generic small-town latitude

const rad = (d) => (d * Math.PI) / 180
const deg = (r) => (r * 180) / Math.PI

/** Solar elevation and azimuth (degrees, azimuth clockwise from north). */
export function sunPosition(date = new Date(), lat = NORWAY.lat, lon = NORWAY.lon) {
  const jd = date.getTime() / 86400000 + 2440587.5
  const n = jd - 2451545.0
  const L = (280.46 + 0.9856474 * n) % 360
  const g = rad((357.528 + 0.9856003 * n) % 360)
  const lambda = rad(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g))
  const eps = rad(23.439 - 0.0000004 * n)
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda))
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda))
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24
  const lst = rad(((gmst * 15 + lon) % 360 + 360) % 360)
  const H = lst - ra
  const phi = rad(lat)
  const el = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H))
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(phi) - Math.sin(phi) * Math.cos(H))
  return { elevation: deg(el), azimuth: (deg(az) + 360) % 360 }
}

/** A Date for "today at hh:mm in Norway" (Europe/Oslo), handy for demos and baking stills. */
export function norwayAt(hours, minutes = 0, base = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
  const parts = Object.fromEntries(fmt.formatToParts(base).map((p) => [p.type, p.value]))
  const osloNowMin = (+parts.hour % 24) * 60 + +parts.minute
  const deltaMin = hours * 60 + minutes - osloNowMin
  return new Date(base.getTime() + deltaMin * 60000)
}

/** Current hh:mm in Norway as a string, e.g. "21:47". */
export function norwayClock(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

// Palette keyframes by solar elevation (degrees). Hex, sRGB. "LA dusk" inks:
// peach, mauve, smog blue, palm black, plus the bleached Miami midday.
const KEYS = [
  { e: -14, zenith: '#222b4a', horizon: '#6d6a8f', glow: '#c58a8f', sun: '#ffb38a', ambient: '#3b4363', night: 1 },
  { e: -7,  zenith: '#2f3a60', horizon: '#b88aa0', glow: '#f2a98a', sun: '#ffb38a', ambient: '#59597a', night: 0.85 },
  { e: -2,  zenith: '#45537d', horizon: '#d698a0', glow: '#f7a97f', sun: '#ffab7a', ambient: '#8a7d98', night: 0.45 },
  { e: 2,   zenith: '#6479a6', horizon: '#f3b598', glow: '#ff9e6c', sun: '#ffb27c', ambient: '#b49aa6', night: 0.1 },
  { e: 8,   zenith: '#7d9cc6', horizon: '#f6cdb0', glow: '#ffc28c', sun: '#ffd2a1', ambient: '#c9b9bb', night: 0 },
  { e: 22,  zenith: '#86b6d9', horizon: '#e7eee6', glow: '#fff1d8', sun: '#fff4e4', ambient: '#d6dcdc', night: 0 },
  { e: 50,  zenith: '#7fb4dc', horizon: '#eef3ec', glow: '#fffaf0', sun: '#fffaf2', ambient: '#e2e7e6', night: 0 },
]

const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const rgb2hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const mixHex = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v + (B[i] - v) * t)) }

/** Interpolated sky palette for a solar elevation in degrees. */
export function skyPalette(elevation) {
  const e = Math.max(KEYS[0].e, Math.min(KEYS[KEYS.length - 1].e, elevation))
  let i = 0
  while (i < KEYS.length - 2 && e > KEYS[i + 1].e) i++
  const a = KEYS[i], b = KEYS[i + 1]
  const t = (e - a.e) / (b.e - a.e)
  const s = t * t * (3 - 2 * t)
  const out = {}
  for (const k of ['zenith', 'horizon', 'glow', 'sun', 'ambient']) out[k] = mixHex(a[k], b[k], s)
  out.night = a.night + (b.night - a.night) * s
  return out
}

/** Writes the palette into CSS custom properties. Cheap: call once a minute. */
export function paintSky(el = document.documentElement, date = new Date()) {
  const { elevation, azimuth } = sunPosition(date)
  const p = skyPalette(elevation)
  el.style.setProperty('--sky-zenith', p.zenith)
  el.style.setProperty('--sky-horizon', p.horizon)
  el.style.setProperty('--sky-glow', p.glow)
  el.style.setProperty('--sky-sun', p.sun)
  el.style.setProperty('--sky-night', p.night.toFixed(3))
  el.style.setProperty('--sky-ink', p.night > 0.5 ? '#fbf5ec' : '#1d1f24')
  el.style.setProperty('--sun-elevation', elevation.toFixed(2))
  el.style.setProperty('--sun-azimuth', azimuth.toFixed(2))
  el.dataset.sky = elevation < -6 ? 'blue-hour' : elevation < 4 ? 'golden' : elevation < 18 ? 'evening' : 'day'
  return { elevation, azimuth, palette: p }
}
