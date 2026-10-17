// node designs/14/bake.mjs : writes the static product markup into index.html
import { readFileSync, writeFileSync } from 'node:fs'
import { content } from '../_shared/content.js'
import { renderProducts, productCounts } from './render.js'
const url = new URL('./index.html', import.meta.url)
const html = readFileSync(url, 'utf8')
const n = productCounts(content)
const out = html
  .replace(/<!--PRODUCTS-->[\s\S]*?<!--\/PRODUCTS-->/, `<!--PRODUCTS-->\n${renderProducts(content)}\n<!--/PRODUCTS-->`)
  .replace(/<p id="counts">[^<]*<\/p>/, `<p id="counts">${n.all} items / ${n.active} active / ${n.retired} retired</p>`)
writeFileSync(url, out)
console.log('baked', n)
