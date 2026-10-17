// Packs a .gltf with external .bin + images into one .glb (no dependencies).
// Usage: node pack-glb.cjs in.gltf out.glb
const fs = require('fs'), path = require('path')
const [, , input, output] = process.argv
const dir = path.dirname(input)
const gltf = JSON.parse(fs.readFileSync(input, 'utf8'))
const chunks = []
let offset = 0
const pad4 = (n) => (n + 3) & ~3
function push(buf) {
  const start = offset
  chunks.push(buf)
  const padded = pad4(buf.length)
  if (padded > buf.length) chunks.push(Buffer.alloc(padded - buf.length))
  offset += padded
  return start
}
// existing buffer(s) -> one
const bufStarts = gltf.buffers.map((b) => push(fs.readFileSync(path.join(dir, decodeURIComponent(b.uri)))))
gltf.bufferViews.forEach((bv) => { bv.byteOffset = (bv.byteOffset || 0) + bufStarts[bv.buffer]; bv.buffer = 0 })
// images -> bufferViews
for (const img of gltf.images || []) {
  if (!img.uri) continue
  const data = fs.readFileSync(path.join(dir, decodeURIComponent(img.uri)))
  const start = push(data)
  gltf.bufferViews.push({ buffer: 0, byteOffset: start, byteLength: data.length })
  img.bufferView = gltf.bufferViews.length - 1
  img.mimeType = img.uri.endsWith('.png') ? 'image/png' : img.uri.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
  delete img.uri
}
gltf.buffers = [{ byteLength: offset }]
gltf.asset = { ...gltf.asset, generator: (gltf.asset.generator || '') + ' + albretsen design 59 pack-glb' }
const bin = Buffer.concat(chunks)
let json = Buffer.from(JSON.stringify(gltf))
json = Buffer.concat([json, Buffer.alloc(pad4(json.length) - json.length, 0x20)])
const header = Buffer.alloc(12)
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8)
const jh = Buffer.alloc(8); jh.writeUInt32LE(json.length, 0); jh.writeUInt32LE(0x4e4f534a, 4)
const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4)
fs.writeFileSync(output, Buffer.concat([header, jh, json, bh, bin]))
console.log('wrote', output, (12 + 16 + json.length + bin.length) + ' bytes')
