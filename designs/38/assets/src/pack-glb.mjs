// Pack a .gltf (+ .bin + textures) into a single binary .glb. No dependencies.
// usage: node pack-glb.mjs in.gltf out.glb [dropImageNameSubstring ...]
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const [, , input, output, ...drop] = process.argv
const dir = dirname(input)
const g = JSON.parse(readFileSync(input, 'utf8'))

// drop unwanted images (and textures/material slots that point to them)
const dropImg = new Set(g.images.map((im, i) => drop.some(d => im.name.includes(d)) ? i : -1).filter(i => i >= 0))
const texMap = new Map(); const newTex = []
g.textures.forEach((t, i) => { if (!dropImg.has(t.source)) { texMap.set(i, newTex.length); newTex.push(t) } })
const imgMap = new Map(); const newImg = []
g.images.forEach((im, i) => { if (!dropImg.has(i)) { imgMap.set(i, newImg.length); newImg.push(im) } })
newTex.forEach(t => (t.source = imgMap.get(t.source)))
const fix = (obj, key) => { if (obj?.[key]) { const n = texMap.get(obj[key].index); if (n === undefined) delete obj[key]; else obj[key].index = n } }
for (const m of g.materials) { fix(m, 'normalTexture'); fix(m, 'occlusionTexture'); fix(m, 'emissiveTexture'); fix(m.pbrMetallicRoughness, 'baseColorTexture'); fix(m.pbrMetallicRoughness, 'metallicRoughnessTexture') }
g.textures = newTex; g.images = newImg

const chunks = []; let offset = 0
const push = buf => { const start = offset; chunks.push(buf); offset += buf.length; const pad = (4 - (offset % 4)) % 4; if (pad) { chunks.push(Buffer.alloc(pad)); offset += pad } return start }
const bin = readFileSync(join(dir, g.buffers[0].uri))
const binStart = push(bin)
for (const bv of g.bufferViews) bv.byteOffset = (bv.byteOffset || 0) + binStart
for (const im of g.images) {
  const data = readFileSync(join(dir, im.uri))
  const start = push(data)
  g.bufferViews.push({ buffer: 0, byteOffset: start, byteLength: data.length })
  im.bufferView = g.bufferViews.length - 1; delete im.uri
}
const body = Buffer.concat(chunks)
g.buffers = [{ byteLength: body.length }]
g.asset.generator = 'pack-glb.mjs (Albretsen design 38) from ' + g.asset.generator
let json = Buffer.from(JSON.stringify(g)); const jp = (4 - (json.length % 4)) % 4; json = Buffer.concat([json, Buffer.alloc(jp, 0x20)])
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + body.length, 8)
const jh = Buffer.alloc(8); jh.writeUInt32LE(json.length, 0); jh.writeUInt32LE(0x4e4f534a, 4)
const bh = Buffer.alloc(8); bh.writeUInt32LE(body.length, 0); bh.writeUInt32LE(0x004e4942, 4)
writeFileSync(output, Buffer.concat([header, jh, json, bh, body]))
console.log('wrote', output, 12 + 16 + json.length + body.length, 'bytes')
