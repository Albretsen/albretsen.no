// Writes the products section into index.html as static markup, using the same
// renderer the page uses, so the page reads complete before any script runs.
//   node designs/19/tools/build.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { content } from '../../_shared/content.js'
import { productsHTML } from '../products.js'

const file = fileURLToPath(new URL('../index.html', import.meta.url))
const page = readFileSync(file, 'utf8')
const out = page.replace(/<!--products-->[\s\S]*?<!--\/products-->/, `<!--products-->${productsHTML(content)}\n<!--/products-->`)
writeFileSync(file, out)
console.log('products written:', content.products.length)
