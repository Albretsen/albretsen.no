// Merge Blender build metadata into manifest.json (keeps entries not rebuilt this run).
import fs from 'node:fs';
import path from 'node:path';

const [metaPath, dir] = process.argv.slice(2);
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const out = path.join(dir, 'manifest.json');
const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : [];
const byFile = new Map(prev.map((e) => [e.file, e]));

const NOTES = {
  paris: 'Paris block: limestone or stucco facade, wrought-iron balconies, zinc mansard with dormers and chimney pots.',
  med: 'Whitewashed Mediterranean house: deep-set windows, painted shutters, bougainvillea.',
  civic: 'Landmark building.',
  road: 'Road piece: 6.4 m carriageway, kerbs, 1.3 m sidewalks. Ports are [x,y,z] in glTF space; dir points out of the piece.',
  wall: 'Wall piece.',
  stairs: 'Stair flight.',
  terrain: 'Terrain piece.',
};

for (const [name, m] of Object.entries(meta)) {
  const file = name + '.glb';
  const kb = Math.round(fs.statSync(path.join(dir, file)).size / 102.4) / 10;
  const emissive = m.materials.filter((x) => x.startsWith('emissive_')).sort();
  byFile.set(file, {
    file, name, kind: m.kind, tris: m.tris, kb,
    animations: [], emissive,
    footprint: m.footprint.map((v) => Math.round(v * 10) / 10), height: m.height,
    windows: m.windows,
    ...(m.ports ? { ports: m.ports } : {}),
    source: 'Own Blender work (procedural, src/build_kit.py)', license: 'CC0 (own work for Albretsen AS)',
    notes: [NOTES[m.kind], m.notes,
      m.tris > 6000 ? `Above the 6k building budget: ${m.windows} windows with stone surrounds and wrought iron; town.js merges static geometry so a whole town stays near 200 draw calls.` : '',
    ].filter(Boolean).join(' '),
  });
}
const order = ['paris', 'med', 'civic', 'wall', 'stairs', 'road', 'terrain'];
const list = [...byFile.values()].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
fs.writeFileSync(out, JSON.stringify(list, null, 1) + '\n');
console.log('manifest:', list.length, 'assets,', Math.round(list.reduce((s, e) => s + e.kb, 0)), 'KB');
