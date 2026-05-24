import Image from 'next/image'
import type { ProjectsCopy } from '@/lib/copy'
import { SectionHead } from './Services'
import { HarborPreview } from './HarborPreview'

interface ProjectsProps { t: ProjectsCopy }

export function Projects({ t }: ProjectsProps) {
  return (
    <section className="section" id="projects">
      <SectionHead n={t.n} label={t.label} title={t.title} tag={t.tag} />
      <div className="proj-list">
        {t.rows.map((p) => (
          <article key={p.n} className="proj fade-in">
            {p.previewKind === 'harbor' ? (
              <div className="proj-image-wrap">
                <HarborPreview lang={p.previewLang ?? 'en'} />
              </div>
            ) : p.image ? (
              <div className="proj-image-wrap">
                <Image
                  className="proj-image"
                  src={p.image}
                  alt={p.imageAlt ?? p.title}
                  fill
                  style={{ objectFit: (p.imageFit as 'cover' | 'contain') ?? 'cover' }}
                  sizes="(max-width: 880px) 100vw, 760px"
                />
                {p.imageCaption ? <span className="proj-image-caption">{p.imageCaption}</span> : null}
              </div>
            ) : null}

            <div className="proj-head">
              <div className="proj-n">{p.n}</div>
              <div className="proj-kind">{p.kind}</div>
            </div>

            <h3 className="proj-title">
              <span>{p.title}</span>
              <span className="proj-title-em">{p.titleEm}</span>
            </h3>

            <p className="proj-body">{p.body}</p>

            <div className="proj-foot">
              <div className="proj-stack">
                {p.tags.map(tag => <span key={tag} className="proj-tag">{tag}</span>)}
              </div>
              <div className="proj-links">
                {p.links.map(link => (
                  <a
                    key={link.k}
                    className="proj-link"
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                  >
                    <span className="proj-link-k">{link.k}</span>
                    <span>{link.text}</span>
                    <span className="proj-link-arrow">↗</span>
                  </a>
                ))}
              </div>
              <div className="proj-link-k" style={{ color: 'var(--fg-3)' }}>{p.role}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
