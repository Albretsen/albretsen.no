// Author-time helper: bakes the products list into index.html so it is
// present without JavaScript. Run from the repo root:
//   node designs/08/build.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { content } from '../_shared/content.js'
import { productsHTML } from './products.js'

const file = fileURLToPath(new URL('./index.html', import.meta.url))
const html = readFileSync(file, 'utf8')
const out = html.replace(/(<!--products:start-->)[\s\S]*?(<!--products:end-->)/,
  (_, a, b) => `${a}\n${productsHTML(content)}\n${b}`)
writeFileSync(file, out)
console.log('products baked:', content.products.length)
