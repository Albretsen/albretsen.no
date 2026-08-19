'use client'
import { useState } from 'react'
import type { Block, Translation } from '@/lib/ath-post'
import { AthChart } from './AthChart'

function renderBlock(block: Block, i: number, t: Translation, lang: string) {
  switch (block.k) {
    case 'lead':
      return <p className="article-lead" key={i}>{block.t}</p>
    case 'p':
      return <p key={i}>{block.t}</p>
    case 'h2':
      return <h2 key={i}>{block.t}</h2>
    case 'pull':
      return <aside className="article-pull" key={i}><p>{block.t}</p></aside>
    case 'chart':
      return <div className="article-wide" key={i}><AthChart t={t.chart} lang={lang} /></div>
    case 'list':
      return (
        <ol className="article-list" key={i}>
          {block.items.map((item, j) => (
            <li key={j}><span>{String(j + 1).padStart(2, '0')}</span><p>{item}</p></li>
          ))}
        </ol>
      )
    case 'table':
      return (
        <figure className="article-table" key={i}>
          <table>
            <thead><tr>{block.head.map((h, j) => <th key={j} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {block.rows.map((row, j) => (
                <tr key={j}>{row.map((cell, k) => (k === 0 ? <th key={k} scope="row">{cell}</th> : <td key={k}>{cell}</td>))}</tr>
              ))}
            </tbody>
          </table>
          <figcaption>{block.caption}</figcaption>
        </figure>
      )
    case 'note':
      return <p className="article-note" key={i}>{block.t}</p>
  }
}

export function RichArticle({ translations }: { translations: Translation[] }) {
  const [index, setIndex] = useState(0)
  const t = translations[index] ?? translations[0]
  const lang = t.label === 'NO' ? 'no' : 'en'

  return (
    <article className="article" lang={lang === 'no' ? 'nb' : 'en'}>
      <p className="post-meta">{t.dateLabel} <span>·</span> {t.tags.join(', ')}</p>
      <h1>{t.title}</h1>

      {translations.length > 1 && (
        <div className="lang-switch" role="group" aria-label="Language">
          {translations.map((choice, i) => (
            <button
              key={choice.label}
              type="button"
              className={i === index ? 'is-active' : undefined}
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}

      {t.blocks.map((block, i) => renderBlock(block, i, t, lang))}
    </article>
  )
}
