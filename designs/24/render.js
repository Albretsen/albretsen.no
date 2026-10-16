// Pure render helpers shared by the browser (main.js) and the prerender
// script (prerender.mjs), so the static HTML and the live page are identical.

export const PRODUCTS_ROWS = [
  { id: 'mcp-emails', label: 'MCP Emails' },
  { id: 'fun-libs', label: 'Fun Libs' },
  { id: 'toolrails', label: 'Toolrails' },
  { id: 'albretsen.no', label: 'albretsen.no' },
]
export const MINUTES = 24

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen']
export const countWord = n => WORDS[n] || String(n)

const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' }

// The A monogram: a 5 x 5 lattice where the busiest cells spell the letter.
// 0 = quiet lattice cell, 1..4 = heat level.
export const MARK = [
  [0, 0, 4, 0, 0],
  [0, 3, 0, 3, 0],
  [2, 4, 3, 4, 2],
  [3, 0, 0, 0, 3],
  [4, 0, 0, 0, 4],
]

export function markSVG({ size = 28, title = 'Albretsen', quiet = true, cls = 'mark' } = {}) {
  let rects = ''
  MARK.forEach((row, y) => row.forEach((v, x) => {
    if (!v && !quiet) return
    rects += `<rect class="m${v}" x="${x * 6}" y="${y * 6}" width="5" height="5" rx="1.1"/>`
  }))
  return `<svg class="${cls}" viewBox="0 0 29 29" width="${size}" height="${size}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${rects}</svg>`
}

export function productsHTML(content) {
  const order = { live: 0, building: 1, paused: 2, retired: 3 }
  const list = [...content.products].sort((a, b) => order[a.status] - order[b.status] || b.since - a.since)
  const firstRetired = list.find(p => p.status === 'retired')
  const rows = list.map(p => {
    const extra = p === firstRetired ? ' p-first-retired' : ''
    const name = p.url
      ? `<a class="p-name" href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a>`
      : `<span class="p-name">${esc(p.name)}</span>`
    const facts = p.facts?.length ? `<p class="p-facts">${p.facts.map(esc).join('<span aria-hidden="true"> · </span>')}</p>` : ''
    const fig = p.figure
      ? `<p class="p-fig"><span class="p-fig-v">${esc(p.figure.value)}</span><span class="p-fig-l">${esc(p.figure.label)}</span></p>`
      : `<p class="p-fig p-fig-none" aria-hidden="true"></p>`
    return `<li class="p p-${p.status}${extra}">
  <p class="p-year">${p.since}</p>
  <div class="p-main">${name}<p class="p-line">${esc(p.line)}</p>${facts}</div>
  <p class="p-status"><span class="chip chip-${p.status}">${STATUS[p.status]}</span></p>
  ${fig}
</li>`
  }).join('\n')
  const retired = content.products.filter(p => p.status === 'retired').length
  const going = content.products.length - retired
  return `<header class="products-head">
  <p class="cap">The work · ${content.products.length} products · on Google Play since ${content.history.playDeveloperSince}</p>
  <h2 class="products-title" id="work-title">${countWord(going)} in play.<br><span class="soft">${countWord(retired)} retired with honours.</span></h2>
</header>
<ol class="products-list">
${rows}
</ol>`
}

export function gridHTML() {
  const rows = PRODUCTS_ROWS.map(r => `<div class="g-row" data-p="${r.id}">
  <span class="g-label">${r.label}</span>
  <span class="g-track"><span class="g-cells">${'<i></i>'.repeat(MINUTES)}</span></span>
  <span class="g-sum">–</span>
</div>`).join('\n')
  return rows
}

// Stable short hash so the browser can skip re-rendering identical markup.
export function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0).toString(36)
}
