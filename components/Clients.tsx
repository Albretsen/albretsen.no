import type { ClientsCopy } from '@/lib/copy'
import { SectionHead } from './Services'
import { ICONS } from './Icons'

interface ClientsProps { t: ClientsCopy }

function ClientLogo({ logo, name }: { logo: string; name: string }) {
  if (logo === 'chesscom') {
    return (
      <span className="client-logo" aria-label={name}>
        <span className="client-logo-mark">{ICONS.pawn}</span>
        <span className="client-logo-text">
          Chess<span className="client-logo-text-suffix">.com</span>
        </span>
      </span>
    )
  }
  if (logo === 'globetech') {
    return (
      <span className="client-logo" aria-label={name}>
        <span className="client-logo-mark">{ICONS.globe}</span>
        <span className="client-logo-text">GlobeTech</span>
      </span>
    )
  }
  return <span className="client-name">{name}</span>
}

export function Clients({ t }: ClientsProps) {
  return (
    <section className="section" id="clients">
      <SectionHead n={t.n} label={t.label} title={t.title} tag={t.tag} />
      <div className="clients-wrap fade-in">
        <p className="clients-note">{t.note}</p>
        <div className="clients-list">
          {t.rows.map((row, i) => (
            <div key={i} className="client-row">
              <ClientLogo logo={row.logo} name={row.name} />
              <div className="client-kind">{row.kind}</div>
              <div className="client-meta">{row.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
