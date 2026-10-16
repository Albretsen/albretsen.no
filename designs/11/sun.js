// Where the real sun is over Oslo, right now. Good to about a degree, which is
// plenty for a shadow. Returns degrees: elevation above the horizon and
// azimuth clockwise from north.
const RAD = Math.PI / 180
export const OSLO = { lat: 59.91, lon: 10.75 }

export function sunPosition(date = new Date(), { lat, lon } = OSLO) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const day = (date.getTime() - start) / 864e5
  const g = (2 * Math.PI / 365) * (day - 1 + (date.getUTCHours() - 12) / 24)
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) -
    0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60
  const solar = minutes + eqTime + 4 * lon
  const ha = (solar / 4 - 180) * RAD
  const phi = lat * RAD
  const cosZen = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(ha)
  const zen = Math.acos(Math.max(-1, Math.min(1, cosZen)))
  const elevation = 90 - zen / RAD
  let az = Math.acos(Math.max(-1, Math.min(1,
    (Math.sin(phi) * Math.cos(zen) - Math.sin(decl)) / (Math.cos(phi) * Math.sin(zen))))) / RAD
  az = ha > 0 ? (az + 180) % 360 : (540 - az) % 360
  return { elevation, azimuth: az }
}

// Shadow geometry for a viewer facing south, the sun behind the name.
// skew: degrees the shadow leans; length: 0..1 of the available ground.
export function shadowFor({ elevation, azimuth }) {
  const rel = Math.max(-62, Math.min(62, azimuth - 180))
  if (elevation <= 0) return { skew: rel * 0.3, length: 0.35, night: true }
  const len = 1 / Math.tan(Math.max(2, elevation) * RAD) // 28 at 2 deg, 1 at 45 deg
  return { skew: -rel * 0.9, length: Math.max(0.3, Math.min(1, len / 4)), night: false }
}
