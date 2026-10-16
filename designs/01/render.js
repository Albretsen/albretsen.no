// Pure string renderers. Used at runtime by main.js and once, at authoring
// time, to bake the identical markup into index.html so the page is complete
// before any script runs (and re-rendering causes zero layout shift).

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const STATUS = { live: 'Live', building: 'Building', paused: 'Paused', retired: 'Retired' }
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']
const word = n => WORDS[n] ?? String(n)

function name(p) {
  const n = esc(p.name)
  return p.url ? `<a href="${esc(p.url)}" rel="noopener">${n}</a>` : n
}

function figure(p) {
  if (!p.figure) return '<p class="work__fig work__fig--none" aria-hidden="true">&mdash;</p>'
  return `<p class="work__fig"><span class="work__num">${esc(p.figure.value)}</span> <span class="work__unit">${esc(p.figure.label)}</span></p>`
}

function entry(p, i) {
  const facts = p.facts?.length
    ? `<ul class="work__facts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''
  return `<article class="work work--${p.status}" style="--i:${i}">
  <p class="work__year"><span class="sr">Since </span>${p.since}</p>
  <div class="work__body">
    <h3 class="work__name">${name(p)}</h3>
    <p class="work__line">${esc(p.line)}</p>${facts}
  </div>
  <div class="work__side">
    <p class="work__status" data-status="${p.status}">${STATUS[p.status] ?? esc(p.status)}</p>
    ${figure(p)}
  </div>
</article>`
}

export function worksHTML(content) {
  const current = content.products.filter(p => p.status !== 'retired')
  const retired = content.products.filter(p => p.status === 'retired')
  const count = s => content.products.filter(p => p.status === s).length
  const lede = `${word(content.products.length)} entries. ${word(count('live'))} live, ${word(count('building')).toLowerCase()} building, ${word(count('paused')).toLowerCase()} paused, ${word(retired.length).toLowerCase()} retired. Nothing is taken down to look tidier.`
  return `<p class="works__lede">${lede}</p>
<div class="works__list">
${current.map(entry).join('\n')}
</div>
<h3 class="works__sub"><span>Retired</span> <span class="works__sub-note">kept on the record</span></h3>
<div class="works__list works__list--retired">
${retired.map((p, i) => entry(p, i + current.length)).join('\n')}
</div>`
}

// Magazine-cover lines, one per product that has a figure and is not retired.
export function coverHTML(content) {
  const lines = content.products.filter(p => p.status !== 'retired' && p.figure).map(p =>
    `<li class="cover__line cover__line--${p.id}"><span class="cover__num">${esc(p.figure.value)}</span> <span class="cover__unit">${esc(p.figure.label)}</span> <span class="cover__what">${esc(p.name)}. ${esc(p.line)}</span></li>`)
  const retired = content.products.filter(p => p.status === 'retired').length
  lines.push(`<li class="cover__line cover__line--retired"><span class="cover__what">Plus ${word(retired).toLowerCase()} retired experiments, left in plain sight.</span></li>`)
  return lines.join('\n')
}
