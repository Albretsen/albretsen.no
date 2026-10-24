// Living Town: the clock and the sun.
// The clock is Oslo's. The sky is a long southern summer day, so that the town's
// routines (coffee at noon, drinks at golden hour, dancing after dark) always line up.

export const SUNRISE = 6.25;   // 06:15
export const SUNSET = 19.75;   // 19:45
const DAY = SUNSET - SUNRISE;

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const wrap24 = (h) => ((h % 24) + 24) % 24;

/** Sun elevation in degrees at an hour of the day (0..24). */
export function elevation(h) {
  h = wrap24(h);
  const x = (h - SUNRISE) / DAY;
  if (x >= 0 && x <= 1) return Math.sin(Math.PI * x) * 48;
  const nx = wrap24(h - SUNSET) / (24 - DAY);
  return -Math.sin(Math.PI * nx) * 32;
}

/** Sun azimuth (radians, direction = [sin, cos] in x/z). Rises behind the hill on the right, sets over the sea on the left. */
export function azimuth(h) {
  h = wrap24(h);
  const x = wrap24(h - SUNRISE) / 24 * (24 / DAY); // 0 at sunrise, 1 at sunset, >1 at night
  return 2.35 - Math.min(x, 1.6) * 3.05;
}

/** Unit vector toward the sun. */
export function sunDir(h, out = [0, 0, 0]) {
  const e = elevation(h) * Math.PI / 180, a = azimuth(h);
  out[0] = Math.sin(a) * Math.cos(e); out[1] = Math.sin(e); out[2] = Math.cos(a) * Math.cos(e);
  return out;
}

/** How dark it is for lights: 0 in daylight, 1 at night. */
export function nightAmount(h) { return smooth(5, -7, elevation(h)); }

export function phase(h) {
  const e = elevation(h), pm = wrap24(h) > 12.5;
  if (e > 28) return 'Midday';
  if (e > 9) return pm ? 'Afternoon' : 'Morning';
  if (e > 1.5) return pm ? 'Golden hour' : 'Early morning';
  if (e > -2.5) return pm ? 'Sunset' : 'Sunrise';
  if (e > -9) return 'Blue hour';
  return 'Night';
}

/** The current Oslo wall-clock time as fractional hours. */
let _fmt = null;
export function osloHour(date = new Date()) {
  try {
    _fmt = _fmt || new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    const p = Object.fromEntries(_fmt.formatToParts(date).map((x) => [x.type, x.value]));
    return (+p.hour % 24) + (+p.minute) / 60 + (+p.second) / 3600 + date.getMilliseconds() / 3.6e6;
  } catch {
    return date.getUTCHours() + 1 + date.getUTCMinutes() / 60;
  }
}

export function fmtHour(h) {
  h = wrap24(h);
  const m = Math.floor(h * 60 + 1e-6);
  return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}
