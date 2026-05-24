'use client'
import { useEffect, useState } from 'react'
import type { NavCopy } from '@/lib/copy'

interface NavProps {
  t: NavCopy
  theme: string
  themeToggleLabel: string
  onToggleTheme: () => void
}

export function Nav({ t, theme, themeToggleLabel, onToggleTheme }: NavProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className={'nav' + (scrolled ? ' is-scrolled' : '')} role="navigation">
      <a className="nav-brand" href="#top" onClick={scrollTo('top')}>
        <span>Albretsen</span>
        <span className="nav-brand-suffix">AS</span>
      </a>
      <div className="nav-right">
        <ul className="nav-links">
          <li><a className="nav-link" href="#services" onClick={scrollTo('services')}>{t.services}</a></li>
          <li><a className="nav-link" href="#projects" onClick={scrollTo('projects')}>{t.projects}</a></li>
          <li><a className="nav-link" href="#contact" onClick={scrollTo('contact')}>{t.contact}</a></li>
        </ul>
        <button className="nav-theme" onClick={onToggleTheme} aria-label={themeToggleLabel}>
          <span className={'th-glyph' + (theme === 'dark' ? ' is-dark' : '')}>
            <span className="th-half th-half--l" />
            <span className="th-half th-half--r" />
          </span>
        </button>
      </div>
    </nav>
  )
}
