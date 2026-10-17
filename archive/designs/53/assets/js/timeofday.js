// Halflight / timeofday.js
// The signature delight: the whole brand re-lights itself to the sun over Oslo.
// Computes the real solar altitude for Oslo (59.91 N, 10.75 E) from the visitor's
// clock, names the phase (night / dawn / day / dusk) and hands back the duotone
// inks for that light. No network, no permissions.
//
//   import { sunOslo, phaseNow, applyPhase } from './timeofday.js'
//   applyPhase()               // sets <html data-phase> + --hl-* CSS vars
//   ?phase=dusk in the URL forces a phase (for demos and screenshots)

export const OSLO = { lat: 59.9139, lon: 10.7522, tz: 'Europe/Oslo' };

const rad = Math.PI / 180;

/** Solar altitude in degrees for a Date at lat/lon (NOAA low-precision model, ~0.5 deg). */
export function solarAltitude(date = new Date(), lat = OSLO.lat, lon = OSLO.lon) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * rad;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const eps = (23.439 - 0.0000004 * n) * rad;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const lst = (gmst * 15 + lon) * rad;
  const H = lst - ra;
  const alt = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(H));
  return alt / rad;
}

/** Morning or evening? Compare altitude now with 10 minutes from now. */
export function sunOslo(date = new Date()) {
  const alt = solarAltitude(date);
  const rising = solarAltitude(new Date(date.getTime() + 600000)) > alt;
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: OSLO.tz, hour: '2-digit', minute: '2-digit' }).format(date);
  return { alt, rising, time };
}

// Duotone inks per phase. paper = ground, lo/hi = the two ends of the dot ramp.
// invert = size dots by darkness instead of light (available, unused by default).
// Daylight prints the plate as dark ink on vellum, like a page in the sun.
export const PHASES = {
  night: { label: 'Night in Oslo', paper: '#160d06', lo: '#a75932', hi: '#deac37', invert: 0, plate: 'night' },
  dawn:  { label: 'Sunrise in Oslo', paper: '#160d06', lo: '#de6f11', hi: '#fad86f', invert: 0, plate: 'dawn' },
  day:   { label: 'Daylight in Oslo', paper: '#f6eedd', lo: '#a75932', hi: '#3c2514', invert: 0, plate: 'dusk' },
  dusk:  { label: 'Golden hour in Oslo', paper: '#1d0f07', lo: '#a75932', hi: '#fad86f', invert: 0, plate: 'dusk' },
};

export function phaseFromSun({ alt, rising }) {
  if (alt < -8) return 'night';
  if (alt < 10) return rising ? 'dawn' : 'dusk';
  return 'day';
}

export function phaseNow(date = new Date()) {
  try {
    const forced = new URLSearchParams(location.search).get('phase');
    if (forced && PHASES[forced]) return forced;
  } catch (e) { /* not in a browser */ }
  return phaseFromSun(sunOslo(date));
}

/** Writes data-phase + CSS custom properties on <html>. Re-run every few minutes if you like. */
export function applyPhase(root = document.documentElement, date = new Date()) {
  const name = phaseNow(date);
  const p = PHASES[name];
  const sun = sunOslo(date);
  root.dataset.phase = name;
  root.style.setProperty('--hl-paper', p.paper);
  root.style.setProperty('--hl-lo', p.lo);
  root.style.setProperty('--hl-hi', p.hi);
  root.style.setProperty('--hl-sun-alt', sun.alt.toFixed(1));
  return { name, ...p, ...sun };
}

/** Altitude samples across a day in Oslo, for drawing the sun-path figure. */
export function dayCurve(date = new Date(), steps = 96) {
  const start = new Date(date); start.setUTCHours(-1, 0, 0, 0); // ~ local midnight in CET
  return Array.from({ length: steps + 1 }, (_, i) => {
    const d = new Date(start.getTime() + (i / steps) * 86400000);
    return { t: i / steps, alt: solarAltitude(d) };
  });
}
