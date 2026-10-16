// node designs/20/build-static.mjs
// Writes the products list from content.js into index.html between the
// <!--products--> markers, so the page reads the same before JavaScript runs.
import { readFileSync, writeFileSync } from 'node:fs'
import { content } from '../_shared/content.js'
import { productsHTML } from './render.js'

const file = new URL('./index.html', import.meta.url)
const html = readFileSync(file, 'utf8')
const out = html.replace(/<!--products-->[\s\S]*?<!--\/products-->/,
  `<!--products-->\n${productsHTML(content.products)}\n<!--/products-->`)
writeFileSync(file, out)
console.log('products written:', content.products.length)
