interface HarborPreviewProps { lang: string }

export function HarborPreview({ lang }: HarborPreviewProps) {
  const t = lang === 'no' ? {
    title: 'Din private kunnskapsbase for mennesker og AI.',
    desc: 'Notater, planer, idéer, mennesker, prosjekter, oppgaver og preferanser i ett rolig arbeidsrom.',
    cta: 'Åpne Harbor',
    right: 'Q3 Strategy',
    rightTag: 'Projects',
    rightLines: [
      'Ship v2.0 with external MCP support',
      'Grow MRR 40% through hosted plan',
      'Hire 2 senior engineers',
    ],
    meta: ['Hosted $12/mo', 'Self-host free', '14-day trial'],
  } : {
    title: 'Your private knowledge base for people and AI.',
    desc: 'Notes, plans, ideas, people, projects, tasks and preferences in one calm workspace.',
    cta: 'Open Harbor',
    right: 'Q3 Strategy',
    rightTag: 'Projects',
    rightLines: [
      'Ship v2.0 with external MCP support',
      'Grow MRR 40% through hosted plan',
      'Hire 2 senior engineers',
    ],
    meta: ['Hosted $12/mo', 'Self-host free', '14-day trial'],
  }

  return (
    <div className="harbor-card">
      <div className="harbor-card-bar">
        <span className="harbor-card-bar-dots">
          <span /><span /><span />
        </span>
        <span className="harbor-card-url">
          <span className="harbor-card-lock" />
          harborknowledge.com
        </span>
      </div>
      <div className="harbor-card-body">
        <div className="harbor-card-left">
          <span className="harbor-card-eyebrow">
            <span className="harbor-card-eyebrow-mark">H</span>
            Harbor
          </span>
          <h4 className="harbor-card-title">{t.title}</h4>
          <p className="harbor-card-desc">{t.desc}</p>
          <span className="harbor-card-cta">
            {t.cta} <span style={{ fontFamily: 'var(--font-mono)' }}>→</span>
          </span>
          <div className="harbor-card-meta">
            {t.meta.map((m, i) => (
              <span key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                {i > 0 ? <span className="harbor-card-meta-dot" /> : null}
                {m}
              </span>
            ))}
          </div>
        </div>
        <div className="harbor-card-right" aria-hidden="true">
          <div>
            <span className="harbor-card-right-tag">{t.rightTag}</span>
          </div>
          <div className="harbor-card-right-h">{t.right}</div>
          {t.rightLines.map((line, i) => (
            <div key={i} className="harbor-card-right-line">· {line}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
