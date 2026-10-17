// oslo-sun.js — the signature delight for design 84.
// Works out where the sun actually is over Norway right now and picks the
// matching "edition" of the cover. No network, no permission prompts.
//
//   import { osloSun, editionFor, applyEdition } from './oslo-sun.js'
//   const sun = osloSun()            // { altitude, azimuth, rising, edition, time }
//   applyEdition(document.documentElement)   // sets data-edition + --sun-alt etc.
//
// Editions: 'nocturne' (sun below -6°), 'dawn' (-6°..8°, morning),
// 'zenith' (above 8°), 'dusk' (-6°..8°, evening).
// Add ?edition=dawn|nocturne|zenith|dusk to any page to force one.

const LAT = 59.9139, LON = 10.7522 // Oslo
const rad = Math.PI / 180

export function osloSun(date = new Date()) {
  // NOAA simplified solar position (accuracy ~0.5°, plenty for art direction)
  const jd = date.getTime() / 86400000 + 2440587.5
  const n = jd - 2451545.0
  const L = (280.46 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * rad
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad
  const eps = (23.439 - 0.0000004 * n) * rad
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda))
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda))
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24
  const lst = (gmst * 15 + LON) * rad
  const ha = lst - ra
  const lat = LAT * rad
  const alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha))
  const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(ha))
  const altitude = alt / rad
  const azimuth = ((az / rad) + 360) % 360
  const rising = Math.sin(ha) < 0 // before local solar noon
  const time = new Intl.DateTimeFormat('nb-NO', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit' }).format(date)
  return { altitude, azimuth, rising, edition: editionFor(altitude, rising), time }
}

export function editionFor(altitude, rising) {
  if (altitude < -6) return 'nocturne'
  if (altitude > 8) return 'zenith'
  return rising ? 'dawn' : 'dusk'
}

export const EDITIONS = {
  nocturne: { label: 'Nocturne edition', no: 'N°4', kicker: 'After dark in Norway' },
  dawn: { label: 'Dawn edition', no: 'N°1', kicker: 'First light in Norway' },
  zenith: { label: 'Orbit edition', no: 'N°2', kicker: 'Full sun in Norway' },
  dusk: { label: 'Dusk edition', no: 'N°3', kicker: 'Last light in Norway' },
}

// Sets data-edition, --sun-alt (deg), --sun-y (0 top .. 1 horizon) on an element.
export function applyEdition(el = document.documentElement, date = new Date()) {
  const forced = new URLSearchParams(location.search).get('edition')
  const sun = osloSun(date)
  const edition = EDITIONS[forced] ? forced : sun.edition
  el.dataset.edition = edition
  el.style.setProperty('--sun-alt', sun.altitude.toFixed(1))
  // map altitude -20..55° onto a 0..1 height used to nudge the live sun/orbit
  const DEFAULT_Y = { nocturne: 0.25, dawn: 0.8, zenith: 0.2, dusk: 0.85 }
  const y = (EDITIONS[forced] || edition === 'nocturne') ? DEFAULT_Y[edition] : 1 - Math.min(1, Math.max(0, (sun.altitude + 20) / 75))
  el.style.setProperty('--sun-y', y.toFixed(3))
  return { ...sun, edition, meta: EDITIONS[edition] }
}
