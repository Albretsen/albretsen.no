// Collects designs/NN/brand.json into designs/manifest.json for the gallery.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = new URL('../designs/', import.meta.url).pathname
const dirs = (await readdir(root, { withFileTypes: true }))
  .filter(d => d.isDirectory() && /^\d{2}$/.test(d.name))
  .map(d => d.name)
  .sort()

const manifest = []
for (const id of dirs) {
  let brand = {}
  try { brand = JSON.parse(await readFile(join(root, id, 'brand.json'), 'utf8')) } catch (e) { console.warn(`${id}: no valid brand.json (${e.message})`) }
  manifest.push({ ...brand, id, path: `${id}/` })
}
await writeFile(join(root, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n')
console.log(`manifest.json: ${manifest.length} designs`)
