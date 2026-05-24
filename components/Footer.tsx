import type { FooterCopy } from '@/lib/copy'

interface FooterProps {
  t: FooterCopy
  lang: string
  setLang: (lang: string) => void
}

export function Footer({ t, lang, setLang }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-mark">
            {t.mark} <span className="footer-mark-suffix">{t.markSuffix}</span>
          </div>
          <div className="footer-meta" style={{ marginTop: 8, maxWidth: '36ch' }}>
            {t.tagline}
          </div>
        </div>

        <div className="footer-col">
          <div className="footer-k">{t.colA.k}</div>
          {t.colA.lines.map((line, i) => <span key={i}>{line}</span>)}
        </div>

        <div className="footer-col">
          <div className="footer-k">{t.colB.k}</div>
          {t.colB.lines.map((line, i) =>
            line.kind === 'mail' ? (
              <a key={i} href={'mailto:' + line.text}>{line.text}</a>
            ) : (
              <a key={i} href={line.href} target="_blank" rel="noopener noreferrer">{line.text}</a>
            )
          )}
        </div>

        <div className="footer-col footer-col--toggle">
          <div className="footer-k">{t.colC.k}</div>
          <div className="lang-toggle" role="group" aria-label="Language">
            <button
              className={'lang-btn' + (lang === 'no' ? ' is-active' : '')}
              onClick={() => setLang('no')}
              aria-pressed={lang === 'no'}
            >NO</button>
            <button
              className={'lang-btn' + (lang === 'en' ? ' is-active' : '')}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
            >EN</button>
          </div>
        </div>
      </div>

      <div className="footer-fine">
        <span>{t.fineLeft}</span>
        <span>{t.fineRight}</span>
      </div>
    </footer>
  )
}
