// Set KHR_materials_emissive_strength = 0 on every emissive_* material of the given GLBs, so the
// lights load switched off (three.js: emissiveIntensity 0) while emissiveFactor keeps their colour.
// Edits only the JSON chunk; the (meshopt) binary chunk is copied as is.
import fs from 'node:fs';

const EXT = 'KHR_materials_emissive_strength';
for (const file of process.argv.slice(2)) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(file + ': not a GLB');
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const rest = buf.subarray(20 + jsonLen);
  let n = 0;
  for (const m of json.materials || []) {
    if (!m.name?.startsWith('emissive_')) continue;
    m.extensions = { ...(m.extensions || {}), [EXT]: { emissiveStrength: 0 } };
    n++;
  }
  if (n) {
    json.extensionsUsed = [...new Set([...(json.extensionsUsed || []), EXT])];
  }
  let text = Buffer.from(JSON.stringify(json), 'utf8');
  const pad = (4 - (text.length % 4)) % 4;
  text = Buffer.concat([text, Buffer.alloc(pad, 0x20)]);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + text.length + rest.length, 8);
  header.writeUInt32LE(text.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  fs.writeFileSync(file, Buffer.concat([header, text, rest]));
}
