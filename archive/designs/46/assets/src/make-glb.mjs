// Re-casts Poly Haven "Camera 01" (CC0, Rajil Jose Macatangay) as a candy-clay toy and packs it into one .glb.
// Textures are dropped; each material becomes a flat candy PBR colour so the photoreal rangefinder reads as clay.
// node make-glb.mjs <Camera_01_1k.gltf> <Camera_01.bin> <out.glb>
import { readFileSync, writeFileSync } from 'node:fs';
const [gltfPath, binPath, out] = process.argv.slice(2);
const g = JSON.parse(readFileSync(gltfPath, 'utf8'));
const bin = readFileSync(binPath);
const srgb = h => [0, 2, 4].map(i => Math.pow(parseInt(h.slice(i, i + 2), 16) / 255, 2.2)).concat(1);
const MAT = {
  Camera_01_strap: { name: 'clay_gum', baseColorFactor: srgb('FF99C2'), roughnessFactor: 0.82 },
  Camera_01_lens_body: { name: 'clay_apricot', baseColorFactor: srgb('FC9E47'), roughnessFactor: 0.62 },
  Camera_01_lens: { name: 'glass_ink', baseColorFactor: srgb('2A1530'), roughnessFactor: 0.06 },
  Camera_01_body: { name: 'clay_butter', baseColorFactor: srgb('FFE97E'), roughnessFactor: 0.74 },
};
g.materials = g.materials.map(m => {
  const c = MAT[m.name];
  return { name: c.name, pbrMetallicRoughness: { baseColorFactor: c.baseColorFactor, metallicFactor: 0, roughnessFactor: c.roughnessFactor } };
});
delete g.textures; delete g.images; delete g.samplers; delete g.extensionsUsed;
g.asset = { version: '2.0', generator: 'albretsen design 46 make-glb.mjs',
  copyright: 'CC0. Source: Poly Haven "Camera 01" by Rajil Jose Macatangay, https://polyhaven.com/a/Camera_01. Recoloured as candy clay.' };
g.buffers = [{ byteLength: bin.length }];
let json = Buffer.from(JSON.stringify(g));
const pad4 = (b, fill) => { const r = (4 - (b.length % 4)) % 4; return r ? Buffer.concat([b, Buffer.alloc(r, fill)]) : b; };
json = pad4(json, 0x20); const body = pad4(bin, 0);
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + json.length + 8 + body.length, 8);
const ch = (len, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.writeUInt32LE(type, 4); return b; };
writeFileSync(out, Buffer.concat([header, ch(json.length, 0x4e4f534a), json, ch(body.length, 0x004e4942), body]));
console.log('wrote', out);
