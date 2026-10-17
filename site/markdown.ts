// A small Markdown renderer for the articles: headings, paragraphs, block
// quotes, lists, rules, emphasis, inline code and links. Raw HTML comments are
// passed to `onComment` so a page can replace a placeholder with a component.

export interface Front { [key: string]: string | string[] | boolean }

export function parseFront(src: string): { front: Front; body: string } {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!m) return { front: {}, body: src }
  const front: Front = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (!kv) continue
    const [, k, raw] = kv
    const v = raw.trim()
    if (v.startsWith('[')) front[k] = JSON.parse(v)
    else if (v === 'true' || v === 'false') front[k] = v === 'true'
    else front[k] = v.replace(/^"(.*)"$/, '$1')
  }
  return { front, body: src.slice(m[0].length) }
}

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function inline(s: string): string {
  const codes: string[] = []
  s = s.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(esc(c)) - 1}\u0000`)
  s = esc(s)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, href) => `<a href="${href}">${t}</a>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>')
  s = s.replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>')
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[+i]}</code>`)
  return s
}

export function markdown(src: string, onComment: (text: string) => string = () => ''): string {
  const lines = src.replace(/\r/g, '').split('\n')
  const out: string[] = []
  let i = 0
  const isBlockStart = (l: string) => /^(#{1,6}\s|>\s?|[-*]\s|\d+\.\s|<!--|---\s*$)/.test(l)
  while (i < lines.length) {
    const l = lines[i]
    if (!l.trim()) { i++; continue }
    const h = l.match(/^(#{1,6})\s+(.*)$/)
    if (h) { const n = h[1].length; out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue }
    if (/^---\s*$/.test(l)) { out.push('<hr>'); i++; continue }
    if (l.startsWith('<!--')) {
      let text = l; while (!text.includes('-->') && i + 1 < lines.length) text += '\n' + lines[++i]
      out.push(onComment(text.replace(/^<!--\s*|\s*-->$/g, ''))); i++; continue
    }
    if (/^>\s?/.test(l)) {
      const q: string[] = []; while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''))
      out.push(`<blockquote>${markdown(q.join('\n'))}</blockquote>`); continue
    }
    const list = l.match(/^([-*]|\d+\.)\s/)
    if (list) {
      const ordered = /\d/.test(list[1]); const items: string[] = []
      while (i < lines.length && /^([-*]|\d+\.)\s/.test(lines[i])) {
        let item = lines[i++].replace(/^([-*]|\d+\.)\s+/, '')
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) item += ' ' + lines[i++].trim()
        items.push(`<li>${inline(item)}</li>`)
      }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`); continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !(para.length && isBlockStart(lines[i]))) para.push(lines[i++])
    out.push(`<p>${inline(para.join(' '))}</p>`)
  }
  return out.join('\n')
}

// The first H1 is the page title; the article body starts after it.
export function stripTitle(body: string): string { return body.replace(/^\s*#\s+.*\n/, '') }
