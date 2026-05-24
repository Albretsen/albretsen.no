import type { HeroCopy } from '@/lib/copy'

interface HeroProps { t: HeroCopy }

function scrollTo(id: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export function Hero({ t }: HeroProps) {
  return (
    <section className="hero" id="top">
      <div className="hero-meta fade-in">
        <span>{t.metaLoc}</span>
        <span className="hero-meta-rule" />
        <span>{t.metaEst}</span>
        <span className="hero-meta-rule" />
        <span className="hero-meta-status">
          <span className="hero-status-dot" />
          {t.metaStatus}
        </span>
      </div>

      <h1 className="hero-display fade-in">{t.headline}</h1>

      <p className="hero-byline fade-in">{t.byline}</p>

      <div className="hero-ctas fade-in">
        <a className="btn" href="#services" onClick={scrollTo('services')}>
          {t.ctaPrimary}<span className="btn-arrow">→</span>
        </a>
        <a className="btn btn--secondary" href="#contact" onClick={scrollTo('contact')}>
          {t.ctaSecondary}<span className="btn-arrow">→</span>
        </a>
      </div>

      <div className="hero-index fade-in">
        {t.index.map(row => (
          <a key={row.to} className="hero-index-row" href={'#' + row.to} onClick={scrollTo(row.to)}>
            <span className="hero-index-n">{row.n}</span>
            <span className="hero-index-t">{row.t}</span>
            <span className="hero-index-d">{row.d}</span>
            <span className="hero-index-arrow">→</span>
          </a>
        ))}
      </div>
    </section>
  )
}
