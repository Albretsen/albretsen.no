'use client'
import { useState } from 'react'
import type { FormCopy } from '@/lib/copy'

interface ContactFormProps { f: FormCopy }

export function ContactForm({ f }: ContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) return
    setStatus('sending')
    setTimeout(() => {
      setStatus('sent')
      setName(''); setEmail(''); setMessage('')
      setTimeout(() => setStatus('idle'), 4000)
    }, 900)
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="field">
        <label className="field-label" htmlFor="cf-name">{f.name}</label>
        <input
          id="cf-name" className="input" type="text"
          value={name} onChange={e => setName(e.target.value)}
          placeholder={f.namePh} required
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="cf-email">{f.email}</label>
        <input
          id="cf-email" className="input" type="email"
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder={f.emailPh} required
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="cf-msg">{f.message}</label>
        <textarea
          id="cf-msg" className="textarea"
          value={message} onChange={e => setMessage(e.target.value)}
          placeholder={f.messagePh} required
        />
      </div>
      <div className="form-actions">
        <span className={'form-note' + (status === 'sent' ? ' is-sent' : '')}>
          {status === 'sent' ? f.sent : f.note}
        </span>
        <button className="btn" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? f.sending : f.send}
          <span className="btn-arrow">→</span>
        </button>
      </div>
    </form>
  )
}
