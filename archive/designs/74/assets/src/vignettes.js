// Product vignettes: four hours of one day in the same paper world (800 x 1000).
// Each places the REAL product logo from designs/_shared/products, unchanged.
const PROD = '../../../_shared/products/';
const img = async (src) => { const i = new Image(); i.src = src; await i.decode(); return i; };
async function font() { const f = new FontFace('Josefin Sans', 'url(../fonts/josefin-sans-var.woff2)', { weight: '300 700' }); await f.load(); document.fonts.add(f); }
function spaced(ctx, text, x, y, size, color, track = 0.32, weight = 600, align = 'center') {
  ctx.save(); ctx.font = `${weight} ${size}px "Josefin Sans"`; ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) { ctx.letterSpacing = `${size * track}px`; const w = ctx.measureText(text).width - size * track; ctx.fillText(text, align === 'center' ? x - w / 2 : x, y); }
  ctx.restore(); }
function shadowedImage(ctx, im, x, y, w, h, a = 0.25) { ctx.save(); ctx.shadowColor = `rgba(20,10,30,${a})`; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2; ctx.drawImage(im, x, y, w, h); ctx.restore(); }

export const VIGNETTES = {
  // 08:00 — MCP Emails on a mid-century signage pylon by the shore road
  async 'mcp-emails'(ctx, P) {
    await font(); const L = P.lightAt(14); const logo = await img(PROD + 'mcp-emails/logo-mark.svg');
    P.frame(ctx, L, { horizon: 700, sunX: 520, sunY: 300, ridgeSeed: 7 });
    // glints
    for (let i = 0; i < 12; i++) { const t = i / 12; const p = new Path2D(); p.roundRect(170 + Math.sin(i * 7.1) * (30 + t * 140), 712 + t * t * 110, 40 + t * 120, 1.5 + t * 2.5, 2); P.sheet(ctx, p, { fill: P.mix(L.sea[0], '#ffffff', 0.6), rimA: 0, shadow: 0.12, blur: 3, dy: 1, shade: 0, grainA: 0 }); }
    const ground = P.ridge({ x0: -20, x1: 820, base: 850, amp: 8, freq: 0.01, seed: 4, bottom: 1020 });
    P.sheet(ctx, ground, { fill: L.blvd, rim: L.rim, rimA: L.rimA * 0.7, shadow: L.shadow, blur: 24, dy: 8, shade: 0.25, top: 820, bottom: 1000 });
    P.palmSheets(ctx, [[P.fanPalm, 640, 860, 520, { seed: 5, lean: 0.05, s: 1.5 }], [P.fanPalm, 720, 870, 420, { seed: 9, lean: 0.09, s: 1.25 }]], L, L.blvd);
    // the pylon: a tall slim slab on two legs, a projecting top fin, an enamel panel
    const x = 250, w = 190;
    const legs = new Path2D(); legs.rect(x + 28, 640, 14, 240); legs.rect(x + w - 42, 640, 14, 240);
    P.sheet(ctx, legs, { fill: P.mix(L.wall, '#8a7a70', 0.35), rim: L.rim, rimA: 0.5, shadow: L.shadow, blur: 14, dy: 6, shade: 0.2, top: 640, bottom: 880 });
    const slab = new Path2D(); slab.roundRect(x, 250, w, 410, 6);
    P.sheet(ctx, slab, { fill: P.PALETTE.terracotta, rim: '#ffffff', rimA: 0.5, rimW: 2.5, shadow: L.shadow + 0.1, blur: 30, dy: 14, shade: 0.18, top: 250, bottom: 660 });
    const fin = new Path2D(); fin.moveTo(x - 30, 232); fin.lineTo(x + w + 30, 214); fin.lineTo(x + w + 30, 232); fin.lineTo(x - 30, 250); fin.closePath();
    P.sheet(ctx, fin, { fill: P.PALETTE.paper, rim: '#ffffff', rimA: 0.6, shadow: L.shadow + 0.1, blur: 14, dy: 8, shade: 0, top: 210, bottom: 250 });
    const disc = new Path2D(); disc.arc(x + w / 2, 196, 16, 0, Math.PI * 2);
    P.sheet(ctx, disc, { fill: P.PALETTE.ochre, rim: '#ffffff', rimA: 0.5, shadow: 0.3, blur: 8, dy: 4, shade: 0, top: 180, bottom: 212 });
    P.plate(ctx, x + 22, 280, w - 44, w - 44, L, { fill: P.PALETTE.paper, radius: 8, lift: 0.6 });
    shadowedImage(ctx, logo, x + 36, 294, w - 72, w - 72, 0.12);
    // stacked signage letters on the slab
    spaced(ctx, 'MCP', x + w / 2, 500, 34, P.PALETTE.paper, 0.38, 600);
    spaced(ctx, 'EMAILS', x + w / 2, 546, 28, P.PALETTE.paper, 0.38, 500);
    const rule = new Path2D(); rule.rect(x + 40, 572, w - 80, 3); ctx.fillStyle = P.mix(P.PALETTE.terracotta, '#ffffff', 0.45); ctx.fill(rule);
    spaced(ctx, '17 TOOLS', x + w / 2, 616, 16, P.mix(P.PALETTE.terracotta, '#ffffff', 0.65), 0.6, 500);
    const near = P.ridge({ x0: -20, x1: 820, base: 950, amp: 8, freq: 0.02, seed: 9, bottom: 1020 }); near.addPath(P.agave(110, 955, 1.2, 3));
    P.sheet(ctx, near, { fill: L.near, rim: L.rim, rimA: L.rimA * 0.5, shadow: L.shadow, blur: 26, dy: 10, shade: 0.2, top: 900, bottom: 1000 });
  },
  // 12:00 — Fun Libs: a sunlit wall, a striped awning, the icon set in like a glazed tile
  async 'fun-libs'(ctx, P) {
    await font(); const L = P.lightAt(50); const icon = await img(PROD + 'fun-libs/icon.png');
    P.frame(ctx, L, { horizon: 520, sunX: 640, sunY: 120, ridgeSeed: 12, far: false });
    const wall = new Path2D(); wall.rect(-20, 250, 840, 780);
    P.sheet(ctx, wall, { fill: '#f7ead6', rim: '#ffffff', rimA: 0.7, shadow: 0.3, blur: 30, dy: 10, shade: 0.1, top: 250, bottom: 1000 });
    // a palm's shadow falling across the wall (cut from translucent tissue)
    ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#4b3a66'; ctx.translate(560, 380); ctx.rotate(0.35); ctx.scale(1.8, 1.4);
    ctx.fill(P.fanPalm(0, 520, 470, { seed: 2, lean: 0.03, s: 2.2 })); ctx.restore();
    // window with deep reveal and sea view
    const win = new Path2D(); win.rect(110, 450, 300, 360);
    ctx.save(); ctx.clip(win); P.frame(ctx, L, { horizon: 640, sunX: 300, sunY: 2000, ridgeSeed: 21 }); ctx.restore();
    const reveal = new Path2D(); reveal.rect(90, 430, 340, 400); reveal.rect(110, 450, 300, 360);
    ctx.save(); ctx.shadowColor = 'rgba(40,20,30,.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10; ctx.fillStyle = '#efdcc2'; ctx.fill(reveal, 'evenodd'); ctx.restore();
    const shutterL = new Path2D(), shutterR = new Path2D(); for (let i = 0; i < 14; i++) { shutterL.rect(20, 440 + i * 27, 66, 18); shutterR.rect(434, 440 + i * 27, 66, 18); }
    P.sheet(ctx, shutterL, { fill: P.PALETTE.sea, rim: '#ffffff', rimA: 0.5, rimW: 1.6, shadow: 0.3, blur: 8, dy: 4, shade: 0, top: 440, bottom: 830 });
    P.sheet(ctx, shutterR, { fill: P.PALETTE.sea, rim: '#ffffff', rimA: 0.5, rimW: 1.6, shadow: 0.3, blur: 8, dy: 4, shade: 0, top: 440, bottom: 830 });
    // striped awning, scalloped edge
    const stripes = 9, ax = 60, aw = 400, ay = 330, ah = 92;
    for (let i = 0; i < stripes; i++) { const sx = ax + (aw / stripes) * i, sw = aw / stripes; const p = new Path2D();
      p.moveTo(sx + 6, ay); p.lineTo(sx + sw + 6, ay); p.lineTo(sx + sw, ay + ah); p.arc(sx + sw / 2, ay + ah, sw / 2, 0, Math.PI); p.closePath();
      P.sheet(ctx, p, { fill: i % 2 ? '#fbf3e6' : P.PALETTE.ochre, rim: '#ffffff', rimA: 0.4, rimW: 1.4, shadow: 0.32, blur: 16, dy: 12, shade: 0.12, top: ay, bottom: ay + ah + 20 }); }
    // the tile: icon framed in a terracotta surround like a glazed house tile
    P.plate(ctx, 520, 470, 190, 190, L, { fill: P.PALETTE.terracotta, radius: 22, lift: 0.9 });
    ctx.save(); const r = new Path2D(); r.roundRect(538, 488, 154, 154, 26); ctx.clip(r); ctx.drawImage(icon, 538, 488, 154, 154); ctx.restore();
    ctx.save(); const gl = ctx.createLinearGradient(538, 488, 692, 642); gl.addColorStop(0, 'rgba(255,255,255,.35)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; const r2 = new Path2D(); r2.roundRect(538, 488, 154, 154, 26); ctx.fill(r2); ctx.restore();
    spaced(ctx, 'FUN LIBS', 615, 712, 24, P.PALETTE.terracottaDeep, 0.42, 600);
    // a terracotta pot with a small agave on the sill line
    const pot = new Path2D(); pot.moveTo(560, 860); pot.lineTo(680, 860); pot.lineTo(664, 960); pot.lineTo(576, 960); pot.closePath(); pot.addPath(P.agave(620, 862, 1.0, 11));
    P.sheet(ctx, pot, { fill: P.PALETTE.terracotta, rim: '#ffffff', rimA: 0.5, shadow: 0.35, blur: 20, dy: 10, shade: 0.15, top: 800, bottom: 960 });
    const floor = new Path2D(); floor.rect(-20, 950, 840, 80); P.sheet(ctx, floor, { fill: '#d8b98f', rim: '#ffffff', rimA: 0.5, shadow: 0.3, blur: 20, dy: -4, shade: 0.1, top: 950, bottom: 1000 });
  },
  // 18:30 — Toolrails: a boulevard of light running straight to the horizon
  async 'toolrails'(ctx, P) {
    await font(); const L = P.lightAt(3); const icon = await img(PROD + 'toolrails/icon.svg');
    const HOR = 560; P.frame(ctx, L, { horizon: HOR, sunX: 400, sunY: 520, ridgeSeed: 33 });
    const land = new Path2D(); land.rect(-20, HOR + 4, 840, 500);
    P.sheet(ctx, land, { fill: L.blvd, rim: L.rim, rimA: L.rimA * 0.6, shadow: L.shadow, blur: 20, dy: 6, shade: 0.3, top: HOR, bottom: 1000 });
    const road = new Path2D(); road.moveTo(396, HOR + 4); road.lineTo(404, HOR + 4); road.lineTo(760, 1010); road.lineTo(40, 1010); road.closePath();
    P.sheet(ctx, road, { fill: P.mix(L.blvd, L.sky[2], 0.4), rim: L.rim, rimA: 0.4, rimW: 1, shadow: 0.2, blur: 8, dy: 2, shade: 0.2, top: HOR, bottom: 1000 });
    // two rails of lamps converging on the vanishing point (lamps are already on)
    const posts = new Path2D(), lights = [], palms = [];
    for (let i = 0; i < 9; i++) { const t = Math.pow(i / 8, 1.8); const y = HOR + 8 + t * 440; const sc = 0.14 + t * 2.0;
      for (const side of [-1, 1]) { const x = 400 + side * (10 + t * 460); const l = P.lamp(x, y, 76 * sc, sc, -side); posts.addPath(l.path); lights.push([...l.light, Math.abs(sc)]);
        if (i % 2 === 0 && i > 1) palms.push([P.fanPalm, x + side * 30 * sc, y, 250 * sc, { seed: i * 3 + (side > 0), lean: side * 0.03, s: sc }]); } }
    P.palmSheets(ctx, palms, L, L.blvd);
    P.sheet(ctx, posts, { fill: P.mix(L.blvd, '#000', 0.2), rim: L.rim, rimA: 0.6, rimW: 1, shadow: L.shadow, blur: 6, dy: 3, shade: 0, top: 500, bottom: 1000 });
    for (const [x, y, r, sc] of lights) { const b = new Path2D(); b.ellipse(x, y, Math.abs(r) * 0.95, Math.abs(r) * 0.7, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffe6b0'; ctx.fill(b); P.glow(ctx, x, y + Math.abs(r), 50 * sc + 10, '#ffc979', 0.8); }
    // road sign on the left verge carrying the real icon
    const pole = new Path2D(); pole.rect(118, 700, 8, 260); P.sheet(ctx, pole, { fill: '#5b4a4a', rim: L.rim, rimA: 0.6, shadow: L.shadow, blur: 10, dy: 5, shade: 0, top: 640, bottom: 940 });
    P.plate(ctx, 42, 520, 160, 204, L, { fill: P.PALETTE.paper, radius: 12, lift: 0.9 });
    ctx.drawImage(icon, 58, 536, 128, 128);
    spaced(ctx, 'TOOLRAILS', 122, 700, 15, P.PALETTE.ink, 0.36, 600);
    // centre line, dashed, in perspective
    for (let i = 0; i < 14; i++) { const t0 = Math.pow(i / 14, 2), t1 = Math.pow((i + 0.45) / 14, 2); const y0 = HOR + 6 + t0 * 440, y1 = HOR + 6 + t1 * 440;
      const p = new Path2D(); p.moveTo(400 - (0.5 + t0 * 6), y0); p.lineTo(400 + (0.5 + t0 * 6), y0); p.lineTo(400 + (0.5 + t1 * 6), y1); p.lineTo(400 - (0.5 + t1 * 6), y1); p.closePath();
      ctx.fillStyle = 'rgba(255,236,200,.75)'; ctx.fill(p); }
  },
  // 21:40 — Harbor: the afterglow, a white house on the cliff, one warm doorway
  async 'harbor'(ctx, P) {
    await font(); const L = P.lightAt(-3.5); const mark = await img(PROD + 'harbor/harbor-mark-filled.svg');
    P.frame(ctx, L, { horizon: 700, sunX: 600, sunY: 2000, ridgeSeed: 44 });
    // first stars
    const r = P.rng(5); ctx.fillStyle = 'rgba(255,240,220,.8)'; for (let i = 0; i < 40; i++) { const s = r() * 1.6 + 0.4; ctx.beginPath(); ctx.arc(r() * 800, r() * 320, s, 0, Math.PI * 2); ctx.fill(); }
    const cliff = new Path2D(); cliff.moveTo(-20, 1020); cliff.lineTo(-20, 600); cliff.lineTo(560, 600); cliff.bezierCurveTo(600, 640, 610, 760, 680, 820); cliff.lineTo(700, 1020); cliff.closePath();
    P.sheet(ctx, cliff, { fill: L.head, rim: L.rim, rimA: L.rimA, shadow: L.shadow, blur: 24, dy: 8, shade: 0.3, top: 600, bottom: 1000 });
    P.palmSheets(ctx, [[P.fanPalm, 520, 604, 300, { seed: 77, lean: 0.06, s: 1.2 }]], L, L.head);
    // white house: a simple block with a rounded parapet and an arched door
    const house = new Path2D(); house.rect(80, 380, 380, 225); house.rect(70, 370, 400, 14); house.rect(380, 330, 46, 52);
    P.sheet(ctx, house, { fill: P.mix(L.wall, P.PALETTE.paper, 0.25), rim: L.rim, rimA: L.rimA * 0.8, rimW: 2.4, shadow: L.shadow + 0.1, blur: 26, dy: 10, shade: 0.25, top: 370, bottom: 605 });
    const door = new Path2D(); door.moveTo(220, 605); door.lineTo(220, 500); door.arc(260, 500, 40, Math.PI, 0); door.lineTo(300, 605); door.closePath();
    ctx.save(); const dg = ctx.createLinearGradient(0, 460, 0, 605); dg.addColorStop(0, '#ffd890'); dg.addColorStop(1, '#f39a5a'); ctx.fillStyle = dg; ctx.fill(door); ctx.restore();
    P.glow(ctx, 260, 560, 200, '#ffc46e', 0.7);
    const win = new Path2D(); win.rect(118, 450, 56, 70);
    ctx.fillStyle = P.mix(L.sky[1], L.head, 0.5); ctx.fill(win);
    // light spilling onto the ground from the doorway
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const spill = new Path2D(); spill.moveTo(220, 605); spill.lineTo(300, 605); spill.lineTo(360, 700); spill.lineTo(160, 700); spill.closePath();
    const sg = ctx.createLinearGradient(0, 605, 0, 700); sg.addColorStop(0, 'rgba(255,196,110,.55)'); sg.addColorStop(1, 'rgba(255,196,110,0)'); ctx.fillStyle = sg; ctx.fill(spill); ctx.restore();
    // the plaque beside the door, carrying the real Harbor mark
    P.plate(ctx, 322, 470, 92, 92, L, { fill: P.PALETTE.paper, radius: 10, lift: 0.7 });
    ctx.drawImage(mark, 328, 476, 80, 80);
    P.glow(ctx, 368, 516, 90, '#ffc46e', 0.25);
    const near = P.ridge({ x0: -20, x1: 820, base: 930, amp: 12, freq: 0.02, seed: 19, bottom: 1020 }); near.addPath(P.agave(680, 930, 1.3, 5));
    P.sheet(ctx, near, { fill: L.near, rim: L.rim, rimA: L.rimA * 0.5, shadow: L.shadow, blur: 26, dy: 10, shade: 0.2, top: 880, bottom: 1000 });
    spaced(ctx, 'HARBOR', 400, 980, 20, P.mix(L.rim, '#ffffff', 0.3), 0.6, 500);
  },
};
// Cut-outs: single paper elements on transparent ground (800 x 1000 virtual).
const cut = (fn) => async (ctx, P) => { const L = P.lightAt(10); const ink = '#3B2D53'; fn(ctx, P, L, ink); };
const S = (P, L, fill, o = {}) => ({ fill, rim: '#fff4e0', rimA: 0.55, rimW: 2.4, shadow: 0.35, blur: 26, dy: 12, shade: 0.12, top: 0, bottom: 1000, ...o });
Object.assign(VIGNETTES, {
  'cut-fan-palm': cut((ctx, P, L, ink) => { const pal = { palm: '#3f6a52', blvd: '#8e3f2c', lamps: 0, rim: '#fff4e0', rimA: 0.8, shadow: 0.35 };
    P.palmSheets(ctx, [[P.fanPalm, 360, 985, 760, { seed: 3, lean: 0.08, s: 3.6 }]], pal, '#3f6a52', { blur: 26, dy: 12, rimW: 2.4 }); }),
  'cut-date-palm': cut((ctx, P, L, ink) => { const pal = { palm: '#3f6a52', blvd: '#8e3f2c', lamps: 0, rim: '#fff4e0', rimA: 0.8, shadow: 0.35 };
    P.palmSheets(ctx, [[P.datePalm, 400, 990, 560, { seed: 12, s: 1.55, fronds: 22 }]], pal, '#3f6a52', { blur: 26, dy: 12, rimW: 1.4, rimA: 0.3 }); }),
  'cut-cypress': cut((ctx, P, L, ink) => { const p = P.cypress(400, 980, 900); P.sheet(ctx, p, S(P, L, '#34584a')); }),
  'cut-spruce': cut((ctx, P, L, ink) => { const p = P.spruce(400, 980, 900, 4); P.sheet(ctx, p, S(P, L, '#2f4b45')); }),
  'cut-agave': cut((ctx, P, L, ink) => { const p = P.agave(400, 900, 7, 4); P.sheet(ctx, p, S(P, L, '#5d7f6a')); }),
  'cut-lamp': cut((ctx, P, L, ink) => { const l = P.lamp(330, 990, 760, 5.5); P.sheet(ctx, l.path, S(P, L, '#2E2240')); P.glow(ctx, l.light[0], l.light[1] + 20, 260, '#ffc979', 0.9);
    const b = new Path2D(); b.ellipse(l.light[0], l.light[1], l.light[2] * 0.95, l.light[2] * 0.7, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffe6b0'; ctx.fill(b); }),
  'cut-pavilion': cut((ctx, P, L, ink) => { ctx.translate(40, 380); ctx.scale(2.8, 2.8); const pv = P.pavilion(20, 160, 1);
    for (const [gx, gy, gw, gh] of pv.glass) { const g = ctx.createLinearGradient(0, gy, 0, gy + gh); g.addColorStop(0, '#ffd27e'); g.addColorStop(1, '#f0915a'); ctx.fillStyle = g; ctx.fillRect(gx, gy, gw, gh);
      ctx.fillStyle = 'rgba(46,34,64,.8)'; for (let m = gx + gw / 3; m < gx + gw - 2; m += gw / 3) ctx.fillRect(m - 0.7, gy, 1.4, gh); }
    P.sheet(ctx, pv.body, S(P, L, '#2E2240', { blur: 10, dy: 5, rimW: 1, top: 80, bottom: 170 })); P.sheet(ctx, pv.roof, S(P, L, '#F5EBDC', { blur: 8, dy: 5, rimW: 1, top: 80, bottom: 100 })); }),
});
