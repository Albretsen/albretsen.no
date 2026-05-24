import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type ShowcaseLink = {
  href: string
  label: string
}

type ShowcaseItem = {
  title: string
  description: string
  detail: string
  images: string[]
  tags: string[]
  meta: string[]
  bullets?: string[]
  primaryLink: ShowcaseLink
  secondaryLinks?: ShowcaseLink[]
}

type ShowcaseCardProps = {
  item: ShowcaseItem
  eyebrow: string
}

export default function ShowcaseCard({ item, eyebrow }: ShowcaseCardProps) {
  const [heroImage, ...galleryImages] = item.images
  const [activeImage, setActiveImage] = useState<string | null>(null)

  useEffect(() => {
    if (!activeImage) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveImage(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeImage])

  const allImages = [heroImage, ...galleryImages]
  const links = [item.primaryLink, ...(item.secondaryLinks ?? [])]

  return (
    <>
      <article className="showcase-card">
        <div className="showcase-card__media">
          <button
            className="showcase-card__hero showcase-card__imageButton"
            type="button"
            onClick={() => setActiveImage(heroImage)}
            aria-label={`Open larger image for ${item.title}`}
          >
            <img src={heroImage} alt={item.title} />
          </button>

          {galleryImages.length > 0 ? (
            <div className="showcase-card__rail" aria-label={`${item.title} gallery`}>
              {galleryImages.map((image, index) => (
                <button
                  className="showcase-card__thumb showcase-card__imageButton"
                  type="button"
                  key={image}
                  onClick={() => setActiveImage(image)}
                  aria-label={`Open photo ${index + 2} for ${item.title}`}
                >
                  <img src={image} alt={`${item.title} photo ${index + 2}`} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="showcase-card__content">
          <div className="showcase-card__header">
            <p className="card__eyebrow">{eyebrow}</p>
            <h3>{item.title}</h3>
            <p className="showcase-card__lead">{item.description}</p>
          </div>

          <p className="showcase-card__detail">{item.detail}</p>

          {item.bullets?.length ? (
            <ul className="showcase-card__bullets">
              {item.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}

          <div className="project-meta" aria-label={`${item.title} summary`}>
            {item.meta.map((entry) => (
              <span key={entry}>{entry}</span>
            ))}
          </div>

          <ul className="tag-list">
            {item.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>

          <div className="showcase-card__links">
            {links.map((link, index) => (
              <a
                className={index === 0 ? 'showcase-card__link showcase-card__link--primary' : 'showcase-card__link'}
                href={link.href}
                key={`${item.title}-${link.href}`}
                target="_blank"
                rel="noreferrer"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      </article>

      {activeImage
        ? createPortal(
            <div
              className="image-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`${item.title} image viewer`}
              onClick={() => setActiveImage(null)}
            >
              <div className="image-modal__inner" onClick={(event) => event.stopPropagation()}>
                <button
                  className="image-modal__close"
                  type="button"
                  onClick={() => setActiveImage(null)}
                  aria-label="Close image viewer"
                >
                  ×
                </button>
                <img src={activeImage} alt={item.title} />
                <div className="image-modal__count">
                  {allImages.indexOf(activeImage) + 1} / {allImages.length}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
