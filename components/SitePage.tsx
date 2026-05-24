'use client'
import { useState, useEffect } from 'react'
import { COPY } from '@/lib/copy'
import { Nav } from './Nav'
import { Hero } from './Hero'
import { Services } from './Services'
import { Clients } from './Clients'
import { Projects } from './Projects'
import { Contact } from './Contact'
import { Footer } from './Footer'

function runFadeIn() {
  const els = document.querySelectorAll<HTMLElement>('.fade-in:not(.is-visible)')
  if (!els.length) return () => {}

  const vh = window.innerHeight || 800
  els.forEach(el => {
    const r = el.getBoundingClientRect()
    if (r.top < vh * 1.05) {
      el.style.transition = 'none'
      el.style.opacity = '1'
      el.style.transform = 'none'
      el.classList.add('is-visible')
    }
  })

  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible')
          io.unobserve(e.target)
        }
      })
    },
    { rootMargin: '-10% 0px -8% 0px', threshold: 0.01 }
  )
  document.querySelectorAll<HTMLElement>('.fade-in:not(.is-visible)').forEach(el => io.observe(el))

  const timer = setTimeout(() => {
    document.querySelectorAll<HTMLElement>('.fade-in:not(.is-visible)').forEach(el => {
      el.style.transition = 'none'
      el.style.opacity = '1'
      el.style.transform = 'none'
      el.classList.add('is-visible')
    })
  }, 1500)

  return () => { io.disconnect(); clearTimeout(timer) }
}

export function SitePage() {
  const [theme, setTheme] = useState('light')
  const [lang, setLangState] = useState('no')

  useEffect(() => {
    try {
      const t = localStorage.getItem('alb-theme')
      if (t) setTheme(t)
      const l = localStorage.getItem('alb-lang')
      if (l) setLangState(l)
    } catch {}
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('alb-theme', theme) } catch {}
  }, [theme])

  const setLang = (l: string) => {
    setLangState(l)
    document.documentElement.setAttribute('lang', COPY[l].htmlLang)
    try { localStorage.setItem('alb-lang', l) } catch {}
  }

  useEffect(() => {
    return runFadeIn()
  }, [])

  useEffect(() => {
    // Re-run after lang change resets fade-in classes
    const raf = requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>('.fade-in').forEach(el => {
        el.classList.remove('is-visible')
        el.style.transition = ''
        el.style.opacity = ''
        el.style.transform = ''
      })
      return runFadeIn()
    })
    return () => cancelAnimationFrame(raf)
  }, [lang])

  const t = COPY[lang]

  return (
    <>
      <Nav
        t={t.nav}
        theme={theme}
        themeToggleLabel={t.themeToggleLabel}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
      />
      <main>
        <Hero t={t.hero} />
        <Services t={t.services} />
        <Clients t={t.clients} />
        <Projects t={t.projects} />
        <Contact t={t.contact} />
        <Footer t={t.footer} lang={lang} setLang={setLang} />
      </main>
    </>
  )
}
