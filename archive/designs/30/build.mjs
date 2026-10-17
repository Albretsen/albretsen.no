// Writes the cast rows into index.html as static markup, from content.js,
// using the same renderer the browser uses. Run: node designs/30/build.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { content } from '../_shared/content.js'
import { renderCast } from './render.js'

const file = new URL('./index.html', import.meta.url)
let html = readFileSync(file, 'utf8')
const cast = renderCast(content.products)
for (const key of ['working', 'retired']) {
  const re = new RegExp(`(<!--cast:${key}-->)[\\s\\S]*?(<!--/cast:${key}-->)`)
  html = html.replace(re, `$1\n${cast[key]}\n$2`)
}
writeFileSync(file, html)
console.log('cast written')
