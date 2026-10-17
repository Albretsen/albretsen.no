// Writes the Lottie files for design 59 (hand-built, no After Effects).
// Usage: node lottie.cjs <outDir>
const fs = require('fs'), path = require('path')
const out = process.argv[2]
fs.mkdirSync(out, { recursive: true })
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).concat(1)
const C = { ink: rgb('#0f0b22'), lime: rgb('#cefd3e'), violet: rgb('#6c35ec'), glow: rgb('#bab0ff'), cyan: rgb('#2debf9'), rose: rgb('#fd54ad'), paper: rgb('#f3f2fb') }

const st = (v) => ({ a: 0, k: v })
// keyframes: [[t, value, easeOut?]]  value arrays
function anim(frames, ease = [0.2, 0.9, 0.3, 1]) {
  return { a: 1, k: frames.map(([t, v], i) => {
    const k = { t, s: Array.isArray(v) ? v : [v] }
    if (i < frames.length - 1) { k.o = { x: [ease[0]], y: [ease[1]] }; k.i = { x: [ease[2]], y: [ease[3]] } }
    return k
  }) }
}
const tr = (o = {}) => ({ ty: 'tr', p: st(o.p || [0, 0]), a: st([0, 0]), s: st([100, 100]), r: st(0), o: st(100), sk: st(0), sa: st(0) })
const star = (pts, ir, or, rot = 0) => ({ ty: 'sr', sy: 1, d: 1, pt: st(pts), p: st([0, 0]), r: st(rot), ir: st(ir), is: st(0), or: st(or), os: st(0) })
const fill = (c) => ({ ty: 'fl', c: st(c), o: st(100), r: 1 })
const stroke = (c, w) => ({ ty: 'st', c: st(c), o: st(100), w: st(w), lc: 2, lj: 2, ml: 4 })
const layer = (nm, ind, shapes, ks, ip = 0, op = 180) => ({ ddd: 0, ind, ty: 4, nm, sr: 1, ks, ao: 0, shapes, ip, op, st: 0, bm: 0 })
const ks = (o) => ({ o: o.o || st(100), r: o.r || st(0), p: o.p || st([200, 200, 0]), a: st([0, 0, 0]), s: o.s || st([100, 100, 100]) })

// 1. Sticker slap: a lime starburst lands with overshoot, its hard shadow catches up, then it idles in a slow turn.
{
  const slapS = anim([[0, [170, 170, 100]], [9, [92, 92, 100]], [15, [104, 104, 100]], [21, [100, 100, 100]]], [0.5, 0, 0.2, 1])
  const slapR = anim([[0, -28], [12, 4], [20, 0], [179, 60]], [0.3, 0, 0.4, 1])
  const op = anim([[0, 0], [3, 100]])
  const body = [{ ty: 'gr', it: [star(16, 118, 150), fill(C.lime), stroke(C.ink, 8), tr()] }]
  const inner = [{ ty: 'gr', it: [{ ty: 'el', d: 1, p: st([0, 0]), s: st([150, 150]) }, stroke(C.ink, 5), tr()] },
    { ty: 'gr', it: [star(4, 10, 48, 45), fill(C.violet), stroke(C.ink, 5), tr()] }]
  const shadow = [{ ty: 'gr', it: [star(16, 118, 150), fill(C.ink), tr()] }]
  const lot = { v: '5.7.4', fr: 60, ip: 0, op: 180, w: 400, h: 400, nm: 'albretsen-sticker-slap', ddd: 0, assets: [], layers: [
    layer('mark', 1, inner, ks({ s: slapS, r: anim([[0, -28], [12, 4], [20, 0], [179, -90]], [0.3, 0, 0.4, 1]), o: op })),
    layer('burst', 2, body, ks({ s: slapS, r: slapR, o: op })),
    layer('shadow', 3, shadow, ks({ s: slapS, r: slapR, o: op, p: anim([[0, [200, 200, 0]], [10, [200, 200, 0]], [18, [212, 212, 0]]]) })),
  ] }
  fs.writeFileSync(path.join(out, 'sticker-slap.json'), JSON.stringify(lot))
}
// 2. Glow sparks: four-point crystal glints twinkling in rhythm (glow / lime / cyan / rose), seamless 2s loop.
{
  const sparks = [[110, 120, 70, C.glow, 0], [290, 95, 46, C.lime, 20], [250, 280, 88, C.cyan, 40], [120, 300, 40, C.rose, 60], [330, 220, 30, C.glow, 80]]
  const layers = sparks.map(([x, y, size, c, d], i) => {
    const s = anim([[d % 120, [0, 0, 100]], [(d % 120) + 18, [110, 110, 100]], [(d % 120) + 30, [100, 100, 100]], [(d % 120) + 60, [0, 0, 100]]], [0.4, 0, 0.2, 1])
    return layer('spark' + i, i + 1, [{ ty: 'gr', it: [star(4, size * 0.16, size), fill(c), stroke(C.ink, 4), tr()] }],
      ks({ p: st([x, y, 0]), s, r: anim([[0, 0], [119, 90]], [0, 0, 1, 1]) }), 0, 120)
  })
  const lot = { v: '5.7.4', fr: 60, ip: 0, op: 120, w: 400, h: 400, nm: 'albretsen-glow-sparks', ddd: 0, assets: [], layers }
  fs.writeFileSync(path.join(out, 'glow-sparks.json'), JSON.stringify(lot))
}
console.log('lottie ok')
