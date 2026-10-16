// fullt hus: products section renderer.
// Used by app.js in the browser, and once by hand (node) to write the static
// fallback markup into index.html, so the page reads the same before JS runs.

// Feed products own a hue. Everything else is ink.
export const KEY = { 'mcp-emails': 'mcp', 'fun-libs': 'fun', toolrails: 'tool', 'albretsen.no': 'site' }
const GLYPH = { live: '●', building: '◐', paused: '○', retired: '×' }

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const low = s => esc(String(s).toLowerCase())
const hueVars = p => KEY[p.id] ? ` style="--h:var(--h-${KEY[p.id]});--hi:var(--hi-${KEY[p.id]})"` : ''

function years(content) {
  const from = content.history.playDeveloperSince
  const to = Math.max(...content.products.map(p => p.since), content.history.companySince)
  const notes = {
    [content.history.playDeveloperSince]: 'first app on google play',
    [content.history.consultingSince]: 'consulting starts',
    [content.history.companySince]: 'albretsen as',
  }
  let out = ''
  for (let y = from; y <= to; y++) {
    const ps = content.products.filter(p => p.since === y)
    const dots = ps.map(p => `<i class="dot dot-${p.status}"${hueVars(p)} title="${low(p.name)} · ${p.status}"></i>`).join('')
    const label = ps.length ? `${y}: ${ps.map(p => low(p.name)).join(', ')}` : `${y}`
    out += `<li aria-label="${label}"><span class="dots" aria-hidden="true">${dots}</span><span class="yr">${y}</span>${notes[y] ? `<span class="note">${notes[y]}</span>` : ''}</li>`
  }
  return `<ol class="years" aria-label="start year of each product">${out}</ol>`
}

function lead(p) {
  const name = p.url ? `<a href="${esc(p.url)}">${low(p.name)}</a>` : low(p.name)
  const fig = p.figure ? `<p class="fig"><span class="v">${low(p.figure.value)}</span> <span class="l">${low(p.figure.label)}</span></p>` : ''
  const facts = p.facts?.length ? `<p class="facts">${p.facts.map(low).join(' · ')}</p>` : ''
  return `<li class="card st-${p.status}" data-p="${p.id}"${hueVars(p)}>
      <p class="meta"><span class="st">${GLYPH[p.status]} ${p.status}</span><span>since ${p.since}</span></p>
      <h3>${name}</h3>${fig}
      <p class="line">${low(p.line)}</p>${facts}
    </li>`
}

function retired(p) {
  const fig = p.figure ? `<p class="fig-s"><b>${low(p.figure.value)}</b> ${low(p.figure.label)}</p>` : ''
  return `<li class="ret"><p class="meta"><span class="st">${GLYPH.retired} retired</span><span>${p.since}</span></p><h3>${low(p.name)}</h3><p class="line">${low(p.line)}</p>${fig}</li>`
}

export function renderProducts(content) {
  const ps = content.products
  const n = s => ps.filter(p => p.status === s).length
  const sum = [`${ps.length} things`, `${n('live')} live`, `${n('building')} building`, `${n('paused')} paused`, `${n('retired')} retired`].join(' · ')
  return `<div class="p-head">
    <h2 id="products-h"><span class="kicker">alt sammen</span> everything built, kept or not</h2>
    <p class="p-sum">${sum}</p>
    ${years(content)}
  </div>
  <ul class="lead">${ps.filter(p => p.status !== 'retired').map(lead).join('')}</ul>
  <ul class="retired">${ps.filter(p => p.status === 'retired').map(retired).join('')}</ul>`
}
