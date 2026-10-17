// Warm Boot: motion study (GSAP half). Requires window.gsap and window.ScrollTrigger
// (gsap@3.13.0, loaded from jsdelivr, see preview.html). Every export respects
// prefers-reduced-motion by jumping straight to the end state.
//
// Signature animations
//  1. decode(el)         DECODE: text scrambles through a terminal glyph set and resolves
//                        left to right on the beat. After soulwire's "Text Scramble" pen
//                        (codepen.io/soulwire/pen/mEMPrK) and GSAP's ScrambleTextPlugin docs
//                        (gsap.com/docs/v3/Plugins/ScrambleTextPlugin) — rebuilt here with no
//                        plugin so the glyph set and rhythm are ours.
//  2. bootSequence(...)  WARM BOOT: a POST log types in, each check decodes to [ OK ],
//                        then the log collapses into one phosphor line at the horizon and
//                        the Drift Field rises out of it. The boot screen *becomes* the hero.
//  3. horizonDrift(...)  HORIZON DRIFT: scroll scrubs the hour. Layers drift at different
//                        rates (classic layered-landscape parallax, as on the 2014 Firewatch
//                        site) while the hero cross-fades first light -> blue hour and the
//                        Drift Field re-tints. Uses ScrollTrigger scrub.
//  4. sweepIn(els)       SCANLINE SWEEP: one raster pass over each product horizon as it enters.

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
export const BEAT = 0.12 // seconds: the rhythm unit
const GLYPHS = '▁▂▃▄▅▆▇░▒▓/\\|<>_=+*#01'

// 1 ─ DECODE ------------------------------------------------------------------
export function decode(el, { text = el.dataset.text || el.textContent, duration, delay = 0, glyphs = GLYPHS } = {}) {
  const gsap = window.gsap
  const final = text
  el.setAttribute('aria-label', final)
  if (reduced() || !gsap) { el.textContent = final; return null }
  const n = final.length
  const dur = duration ?? Math.min(0.35 + n * 0.035, 1.6)
  const state = { p: 0 }
  const rnd = () => glyphs[(Math.random() * glyphs.length) | 0]
  let lastStep = -1
  return gsap.to(state, {
    p: 1, duration: dur, delay, ease: 'none',
    onStart: () => { el.textContent = final.replace(/\S/g, () => rnd()) },
    onUpdate: () => {
      // quantise to the beat so the scramble has a pulse, not a blur
      const step = Math.floor(state.p * dur / (BEAT / 3))
      if (step === lastStep) return
      lastStep = step
      const resolved = Math.floor(state.p * (n + 4)) - 4
      let out = ''
      for (let i = 0; i < n; i++) {
        const ch = final[i]
        if (ch === ' ' || i < resolved) out += ch
        else if (i < resolved + 6) out += rnd()
        else out += ch === ch.toUpperCase() ? '▁' : '·'
      }
      el.textContent = out
    },
    onComplete: () => { el.textContent = final },
  })
}

// 2 ─ WARM BOOT ---------------------------------------------------------------
// log: element to type into; lines: [{ text, ok }]; field: Drift Field instance (optional);
// stage: element that holds the field canvas.
export function bootSequence({ log, lines, field, stage, onDone } = {}) {
  const gsap = window.gsap
  if (reduced() || !gsap) { log && (log.style.display = 'none'); field && field.boot(1); onDone && onDone(); return null }
  const tl = gsap.timeline({ onComplete: onDone })
  log.innerHTML = ''
  lines.forEach((l, i) => {
    const row = document.createElement('div'); row.className = 'wb-log-row'
    const t = document.createElement('span'); t.className = 'wb-log-text'; t.textContent = l.text
    const s = document.createElement('span'); s.className = 'wb-log-status'; s.textContent = l.ok ?? 'OK'
    row.append(t, s); log.append(row)
    gsap.set(row, { opacity: 0 })
    tl.set(row, { opacity: 1 }, i * BEAT * 2)
    tl.add(decode(t, { duration: BEAT * 3 }), i * BEAT * 2)
    tl.add(decode(s, { duration: BEAT * 2, glyphs: '·.:' }), i * BEAT * 2 + BEAT * 2)
  })
  // collapse the log into the horizon line (vertical scale to a hairline, brightness up)
  tl.to(log, { scaleY: 0.004, filter: 'brightness(3)', duration: BEAT * 3, ease: 'power3.in', transformOrigin: '50% 50%' }, '+=0.25')
  tl.to(log, { opacity: 0, duration: BEAT }, '>-0.02')
  if (field) {
    const p = { v: 0 }
    tl.to(p, { v: 1, duration: 3.2, ease: 'power1.inOut', onUpdate: () => field.boot(p.v) }, '<')
  }
  if (stage) tl.from(stage, { opacity: 0, duration: BEAT * 2 }, '<')
  return tl
}

// 3 ─ HORIZON DRIFT -----------------------------------------------------------
// section: the pinned/scrolling hero; layers: [{ el, y }] (y = % drift); fade: element shown
// on top of the base image whose opacity follows the hour; field: Drift Field (optional).
export function horizonDrift({ section, layers = [], fade, field, end = 'bottom top' } = {}) {
  const { gsap, ScrollTrigger } = window
  if (!gsap || !ScrollTrigger) return null
  gsap.registerPlugin(ScrollTrigger)
  if (reduced()) { field && field.setHour(0); return null }
  const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end, scrub: 0.8 } })
  layers.forEach(({ el, y }) => tl.to(el, { yPercent: y, ease: 'none' }, 0))
  if (fade) tl.fromTo(fade, { opacity: 0 }, { opacity: 1, ease: 'none' }, 0)
  if (field) { const h = { v: 0 }; tl.to(h, { v: 1, ease: 'none', onUpdate: () => field.setHour(h.v) }, 0) }
  return tl
}

// 4 ─ SCANLINE SWEEP ----------------------------------------------------------
export function sweepIn(els) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
  }), { threshold: 0.35 })
  els.forEach((el) => io.observe(el))
  return io
}
