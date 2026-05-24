import type { ServicesCopy } from '@/lib/copy'
import { ICONS } from './Icons'

interface ServicesProps { t: ServicesCopy }

function SectionHead({ n, label, title, tag }: { n: string; label: string; title: string; tag?: string }) {
  return (
    <header className="ed-head fade-in">
      <div>
        <div className="ed-head-n">{n} · {label}</div>
      </div>
      <div>
        <h2 className="ed-head-title">{title}</h2>
        {tag ? <div className="ed-head-tag">{tag}</div> : null}
      </div>
    </header>
  )
}

export { SectionHead }

export function Services({ t }: ServicesProps) {
  return (
    <section className="section" id="services">
      <SectionHead n={t.n} label={t.label} title={t.title} tag={t.tag} />
      <div className="services">
        {t.items.map((it, i) => (
          <article key={i} className="service fade-in">
            <div className="service-icon">{ICONS[it.icon] ?? ICONS.web}</div>
            <div className="service-n">{it.n}</div>
            <h3 className="service-title">{it.title}</h3>
            <p className="service-body">{it.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
