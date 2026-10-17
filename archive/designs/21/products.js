// Renders the products chart and the sidebar index from content.js.
// Used at runtime and (once, by hand) to write the static fallback markup in index.html,
// so the no-JS page and the enhanced page are byte-identical.

export const AXIS_FROM = 2016 // first app on Google Play (content.history.playDeveloperSince)
export const AXIS_TO = 2027 // right edge = today; dots sit at the start of their year

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const pct = y => (((y - AXIS_FROM) / (AXIS_TO - AXIS_FROM)) * 100).toFixed(1)

export function renderProducts(content) {
  const from = content.history?.playDeveloperSince ?? AXIS_FROM
  const rows = content.products.map(p => {
    const name = p.url
      ? `<a href="${esc(p.url)}" rel="noopener">${esc(p.name)}</a>`
      : esc(p.name)
    const fig = p.figure
      ? `<b>${esc(p.figure.value)}</b><small>${esc(p.figure.label)}</small>`
      : `<b class="none" aria-label="no figure">&middot;</b>`
    return `<li class="row s-${esc(p.status)}" id="p-${esc(p.id)}">
<div class="who"><h3>${name}</h3><p>${esc(p.line)}</p>${p.facts ? `<p class="facts">${p.facts.map(esc).join(' <span aria-hidden="true">·</span> ')}</p>` : ''}</div>
<div class="track" style="--x:${pct(p.since)}%" role="img" aria-label="started ${p.since}, ${esc(p.status)}"><i></i></div>
<div class="st"><span class="mk" aria-hidden="true"></span>${esc(p.status)}<small>since ${p.since}</small></div>
<div class="fig">${fig}</div>
</li>`
  }).join('\n')

  const ticks = []
  for (let y = AXIS_FROM; y <= AXIS_TO - 3; y += 2) ticks.push(`<span style="--x:${pct(y)}%">${y}</span>`)

  const count = s => content.products.filter(p => p.status === s).length
  const tally = `${count('live')} live, ${count('building')} building, ${count('paused')} paused, ${count('retired')} retired. The retired ones stay on the chart.`

  return { rows, ticks: ticks.join(''), tally, from }
}

const short = name => name.includes(',') ? 'Early apps' : name.split(' / ')[0]

export function renderIndex(content) {
  return content.products
    .map(p => `<li class="s-${esc(p.status)}"><a href="#p-${esc(p.id)}"><span class="mk" aria-hidden="true"></span>${esc(short(p.name))}</a></li>`)
    .join('')
}
