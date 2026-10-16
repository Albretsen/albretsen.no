// Pure string renderers. No DOM, so the same code prints the static
// fallback markup (node) and re-renders in the browser.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export function productRow(p) {
  const meta = [p.status, p.since, p.figure && `${p.figure.value} ${p.figure.label}`].filter(Boolean).join(' · ')
  const inner = `<span class="cur" aria-hidden="true"></span><span class="nm">${esc(p.name)}</span><span class="meta">${esc(meta)}</span><span class="ln">${esc(p.line)}</span>`
  const body = p.url
    ? `<a class="item" href="${esc(p.url)}">${inner}</a>`
    : `<div class="item" tabindex="-1">${inner}</div>`
  return `<li class="row" data-status="${esc(p.status)}">${body}</li>`
}

export const productRows = products => products.map(productRow).join('\n')

export function tally(products) {
  const order = ['live', 'building', 'paused', 'retired']
  const n = {}
  for (const p of products) n[p.status] = (n[p.status] || 0) + 1
  return order.filter(s => n[s]).map(s => `${n[s]} ${s}`).join(' · ')
}

// What each product says, in its own voice. Facts come only from the event.
export function say(e) {
  const ms = e.ms ? ` ${e.ms} ms.` : ''
  switch (e.kind) {
    case 'thread.read': return `An agent read a thread.${ms}`
    case 'draft.created': return `An agent drafted a reply.${ms}`
    case 'send.scheduled': return `An agent scheduled a send.${ms}`
    case 'inbox.searched': return `An agent searched an inbox.${ms}`
    case 'inbox.triaged': return `An inbox, triaged on its own.${ms}`
    case 'inbox.connected': return `A new inbox, from ${e.country}.`
    case 'story.completed': return `Someone in ${e.country} finished a story.`
    case 'story.shared': return `A story, shared in ${e.country}.`
    case 'install': return `A new player in ${e.country}.`
    case 'tool.searched': return `An agent looked for a tool.${ms}`
    case 'tool.executed': return `An agent ran a tool.${ms}`
    case 'page.served': return `A page, served to ${e.city}. ${e.kb} KB.`
    case 'deploy': return `Deployed ${e.sha}. ${e.kb} KB.`
    default: return e.text
  }
}

export const hhmm = d => d.toTimeString().slice(0, 5)

export function bubble(e, showWho) {
  const who = showWho ? `<span class="who">${esc(e.label)}</span>` : ''
  return `${who}<span class="say">${esc(say(e))}</span><time datetime="${e.time.toISOString()}">${hhmm(e.time)}</time>`
}
