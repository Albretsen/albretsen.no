// Checks the built site in dist/ (run node scripts/build.ts first): node --test scripts/test/site.test.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, posix } from 'node:path'
import { pathToFileURL } from 'node:url'
import { products } from '../../site/data.ts'

const DIST = new URL('../../dist/', import.meta.url).pathname
const read = (p: string) => readFileSync(join(DIST, p), 'utf8')
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)])
const html = walk(DIST).filter((f) => f.endsWith('.html'))
const home = read('index.html')
const imports: Record<string, string> = JSON.parse(/<script type="importmap">(.*?)<\/script>/.exec(home)![1]).imports

test('every asset a page refers to exists, and every asset is fingerprinted', () => {
  for (const f of html) for (const [p] of readFileSync(f, 'utf8').replace(/<script type="importmap">.*?<\/script>/, '').matchAll(/\/assets\/[\w\-./]+\.[a-z0-9]+/gi)) assert.ok(existsSync(join(DIST, p)), `${f}: ${p}`)
  for (const f of walk(join(DIST, 'assets'))) assert.match(f, /\.[0-9a-f]{10}\.[a-z0-9]+$/i, 'not fingerprinted')
  assert.match(read('_headers'), /\/assets\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/)
})

test('the import map resolves every import in the town', () => {
  for (const v of Object.values(imports)) assert.ok(existsSync(join(DIST, v)), v)
  let seen = 0
  const plain = Object.fromEntries(Object.entries(imports).filter(([k]) => k.startsWith('/')).map(([k, v]) => [v, k]))
  for (const [hashed, url] of Object.entries(plain)) {
    const src = read(hashed.slice(1)).replace(/^\s*\/\/.*$/gm, '')   // leave out usage notes in comments
    const specs = [...src.matchAll(/^\s*(?:import\s[^;]*?\bfrom|export\s[^;=]*?\bfrom|import)\s*['"]([^'"]+)['"]/gm), ...src.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1])
    seen += specs.length
    for (const spec of specs) {
      const key = spec.startsWith('.') ? posix.join(posix.dirname(url), spec) : spec
      assert.ok(imports[key], `${url} imports ${spec}: not in the import map`)
    }
  }
  assert.ok(seen > 30, `only ${seen} imports found`)
})

test('the town reads its facts from site/data.ts, and talks to this origin only', async () => {
  const { content, model } = await import(pathToFileURL(join(DIST, imports['/assets/town/js/content.js'])).href)
  assert.deepEqual(content.products.map((p: any) => [p.id, p.figure?.value, p.line]), products.map((p) => [p.id, p.figure?.value, p.line]))
  for (const id of ['mcp-emails', 'fun-libs', 'toolrails', 'harbor']) assert.ok(existsSync(join(DIST, content.logos[id])), id)
  assert.ok(existsSync(join(DIST, model('people/asgeir'))))
  for (const f of walk(join(DIST, 'assets', 'town')).filter((f) => f.endsWith('.js'))) {
    const src = readFileSync(f, 'utf8')
    assert.doesNotMatch(src, /https?:\/\/albretsen\.no\/api|wss:\/\/albretsen\.no/, f)
    assert.doesNotMatch(src, /from '[^']*_shared\//, f)
  }
})

test('the homepage: the town, the products, the writing and every MCP client', () => {
  assert.match(home, /<canvas class="stage" id="stage"/)
  assert.match(home, /class="poster"/)
  for (const p of products.filter((p) => p.status !== 'retired')) assert.ok(home.includes(`>${p.name}</a></h3>`), p.name)
  for (const id of ['claude', 'cursor', 'vscode', 'codex', 'any']) assert.ok(home.includes(`id="cmd-${id}"`), id)
  assert.match(home, /class="posts"/)
  assert.ok(existsSync(join(DIST, 'index.md')) && existsSync(join(DIST, 'llms.txt')) && existsSync(join(DIST, 'sitemap.xml')) && existsSync(join(DIST, 'api/content.json')))
})
