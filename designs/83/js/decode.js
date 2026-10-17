// Decode, the signature delight: text resolves left to right on the 120 ms beat.
// A short phosphor frontier of scrambled glyphs travels through the line; characters
// ahead of it are already laid out but invisible, so the line never reflows while it
// decodes (layout shift stays 0, even for the 168 px headline).
// Based on the kit's motion.js decode (after soulwire's Text Scramble pen and GSAP's
// ScrambleTextPlugin docs), changed to keep the final layout from the first frame.

import { BEAT } from '../assets/motion.js'

export const GLYPHS = {
  mono: '▁▂▃▄▅▆▇░▒▓/\\|<>_=+*#01',
  serif: 'abcdefghijklmnopqrstuvwxyz',
  quiet: '·.:',
}

export function decode(el, { text, duration, delay = 0, glyphs = GLYPHS.mono, frontier = 3, still = false } = {}) {
  const final = text ?? el.dataset.text ?? el.textContent
  el.dataset.text = final
  const gsap = window.gsap
  if (still || !gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = final; return null }
  const chars = [...final]
  const n = chars.length
  const dur = duration ?? Math.min(0.35 + n * 0.035, 1.6)
  const rnd = (ch) => {
    const g = glyphs[(Math.random() * glyphs.length) | 0]
    return ch === ch.toUpperCase() && glyphs === GLYPHS.serif ? g.toUpperCase() : g
  }
  let spans = null
  let lastStep = -1
  const build = () => {
    el.textContent = ''
    spans = chars.map((ch) => {
      const s = document.createElement('span')
      s.textContent = ch; s.className = ch === ' ' ? '' : 'dc-pend'
      el.append(s)
      return s
    })
  }
  build()
  const state = { p: 0 }
  return gsap.to(state, {
    p: 1, duration: dur, delay, ease: 'none',
    onUpdate: () => {
      if (!spans) build()
      const step = Math.floor((state.p * dur) / (BEAT / 3)) // quantised: a pulse, not a blur
      if (step === lastStep && state.p < 1) return
      lastStep = step
      const resolved = Math.floor(state.p * (n + frontier)) - frontier
      for (let i = 0; i < n; i++) {
        const ch = chars[i], s = spans[i]
        if (ch === ' ') continue
        if (i < resolved) { if (s.className) { s.textContent = ch; s.className = '' } }
        else if (i < resolved + frontier) { s.textContent = rnd(ch); s.className = 'dc-fx' }
        else if (s.className !== 'dc-pend') { s.textContent = ch; s.className = 'dc-pend' }
      }
    },
    onComplete: () => { el.textContent = final; spans = null },
  })
}
