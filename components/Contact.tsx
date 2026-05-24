'use client'
import { useState } from 'react'
import Image from 'next/image'
import type { ContactCopy } from '@/lib/copy'
import { SectionHead } from './Services'
import { ContactForm } from './ContactForm'

interface ContactProps { t: ContactCopy }

export function Contact({ t }: ContactProps) {
  const [copied, setCopied] = useState(false)
  const mail = 'asgeir@albretsen.no'

  const copy = (e: React.MouseEvent) => {
    e.preventDefault()
    navigator.clipboard?.writeText(mail).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <section className="section" id="contact">
      <SectionHead n={t.n} label={t.label} title={t.title} tag={t.tag} />
      <div className="contact-wrap">
        <div className="fade-in">
          <div className="contact-id">
            <div className="contact-id-avatar" style={{ position: 'relative', width: 44, height: 44, borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
              <Image
                src="/images/profile.jpg"
                alt={t.profileName}
                fill
                style={{ objectFit: 'cover', objectPosition: '50% 30%' }}
                sizes="44px"
              />
            </div>
            <div className="contact-id-meta">
              <span className="contact-id-name">{t.profileName}</span>
              <span className="contact-id-role">{t.profileRole}</span>
            </div>
          </div>

          <p className="contact-lead">{t.lead}</p>

          <a className="contact-mail" href={'mailto:' + mail} onClick={copy}>
            <span className="contact-mail-state">{copied ? t.mailCopied : t.mailState}</span>
            <span className="contact-mail-text">{mail}</span>
          </a>

          <ul className="contact-channels">
            {t.channels.map(c => (
              <li key={c.k}>
                <span className="contact-channel-k">{c.k}</span>
                {c.href ? (
                  <a className="contact-channel-v" href={c.href} target="_blank" rel="noopener noreferrer">{c.v}</a>
                ) : (
                  <span className="contact-channel-v">{c.v}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="fade-in">
          <ContactForm f={t.form} />
        </div>
      </div>
    </section>
  )
}
