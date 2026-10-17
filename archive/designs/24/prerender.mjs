// Bakes the static, no-JS markup into index.html from the canonical content.
// Run from the repo root:  node designs/24/prerender.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { content } from '../_shared/content.js'
import { productsHTML, gridHTML, markSVG, hash } from './render.js'

const file = fileURLToPath(new URL('./index.html', import.meta.url))
let html = readFileSync(file, 'utf8')
const put = (tag, body) => {
  const re = new RegExp(`<!--${tag}-->[\\s\\S]*?<!--/${tag}-->`)
  if (!re.test(html)) throw new Error(`missing marker ${tag}`)
  html = html.replace(re, `<!--${tag}-->${body}<!--/${tag}-->`)
}
const products = productsHTML(content)
put('products', `\n<div class="products-inner" data-h="${hash(products)}">\n${products}\n</div>\n`)
put('grid', gridHTML())
put('mark', markSVG())
writeFileSync(file, html)
console.log('prerendered', file)
