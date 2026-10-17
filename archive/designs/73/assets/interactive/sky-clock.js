// sky-clock.js — <sky-clock> custom element, no dependencies (uses sun.js).
// Draws today's sun path over Norway: the elevation curve across 24 hours, the
// horizon, the "never quite dark" band (sun between 0° and -6°), and a dot for now.
// Attributes: time="HH:MM" (fixed Norwegian time; omit for live), compact (no labels).
//
//   <script type="module" src="assets/interactive/sky-clock.js"></script>
//   <sky-clock></sky-clock>

import { sunPosition, skyPalette, norwayAt, norwayClock } from './sun.js'

const W = 320, H = 132, EL_MIN = -22, EL_MAX = 58
const y = (el) => 8 + (1 - (el - EL_MIN) / (EL_MAX - EL_MIN)) * (H - 30)
const x = (h) => 6 + (h / 24) * (W - 12)

class SkyClock extends HTMLElement {
  static observedAttributes = ['time']
  connectedCallback() {
    this.attachShadow?.({ mode: 'open' })
    this.render()
    if (!this.hasAttribute('time')) this._t = setInterval(() => this.render(), 60000)
  }
  disconnectedCallback() { clearInterval(this._t) }
  attributeChangedCallback() { if (this.shadowRoot) this.render() }
  set hours(v) { this._hours = v; this.render() }

  now() {
    if (this._hours != null) return norwayAt(Math.floor(this._hours), Math.round((this._hours % 1) * 60))
    const t = this.getAttribute('time')
    if (t) { const [h, m] = t.split(':').map(Number); return norwayAt(h, m) }
    return new Date()
  }

  render() {
    const now = this.now()
    const clock = norwayClock(now)
    const [ch, cm] = clock.split(':').map(Number)
    const nowH = ch + cm / 60
    // sample the day in Norway (local hours 0..24)
    let d = ''
    for (let i = 0; i <= 96; i++) {
      const h = i / 4
      const el = sunPosition(norwayAt(Math.floor(h), Math.round((h % 1) * 60), now)).elevation
      d += (i ? 'L' : 'M') + x(h).toFixed(1) + ' ' + y(el).toFixed(1)
    }
    const s = sunPosition(now)
    const p = skyPalette(s.elevation)
    const compact = this.hasAttribute('compact')
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:inline-block;width:100%;max-width:${W}px;font:600 12px/1.2 Nunito, ui-rounded, system-ui, sans-serif;color:var(--ink,#1d1f24)}
        svg{display:block;width:100%;height:auto;border-radius:18px}
        .row{display:flex;justify-content:space-between;margin-top:6px;letter-spacing:.02em}
        .muted{opacity:.6}
      </style>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sun over Norway now: ${s.elevation.toFixed(1)} degrees at ${clock}">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${p.zenith}"/><stop offset=".78" stop-color="${p.horizon}"/><stop offset="1" stop-color="${p.glow}"/>
          </linearGradient>
          <clipPath id="above"><rect x="0" y="0" width="${W}" height="${y(0)}"/></clipPath>
        </defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        <rect x="0" y="${y(0)}" width="${W}" height="${y(-6) - y(0)}" fill="${p.glow}" opacity=".35"/>
        <rect x="0" y="${y(-6)}" width="${W}" height="${H - y(-6)}" fill="#1d1f24" opacity=".18"/>
        <path d="${d}" fill="none" stroke="#1d1f24" stroke-opacity=".25" stroke-width="1.5" stroke-dasharray="2 4" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="#fbf5ec" stroke-width="2.2" stroke-linecap="round" clip-path="url(#above)"/>
        <line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" stroke="#1d1f24" stroke-opacity=".55" stroke-width="1.2"/>
        <circle cx="${x(nowH)}" cy="${y(s.elevation)}" r="9" fill="${p.sun}" opacity=".35"/>
        <circle cx="${x(nowH)}" cy="${y(s.elevation)}" r="5.5" fill="${p.sun}" stroke="#1d1f24" stroke-opacity=".5"/>
      </svg>
      ${compact ? '' : `<div class="row"><span>${clock} in Norway</span><span class="muted">sun ${s.elevation >= 0 ? '+' : ''}${s.elevation.toFixed(1)}°</span></div>`}
    `
  }
}
if (!customElements.get('sky-clock')) customElements.define('sky-clock', SkyClock)
export { SkyClock }
