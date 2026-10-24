// Living Town: every light in town, switched one at a time.
// Homes light when someone comes home after dark and go dark when they sleep; street lamps
// come on in a wave along the promenade; the rest of the town keeps its own hours.
import * as THREE from 'three';
import { wrap24, smooth } from './time.js';

const WIN = 3.4;     // window intensity at full (HDR, blooms)
const SIGN = 0.95;    // signs carry the logo as their emissive map: more than ~1 burns the artwork to white
const SHOP = 1.7;   // landmark windows carry their own interior texture, so they need less

function hash(i, k) { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); }

/** A light that switches with a little life: warm windows fade in, lamps warm up as they strike. */
class Switch {
  constructor(kind = 'fade') { this.kind = kind; this.v = 0; this.target = 0; this.t = 1; this.from = 0; }
  set(t) { if (t !== this.target) { this.from = this.v; this.target = t; this.t = 0; } }
  update(dt) {
    this.t = Math.min(1, this.t + dt / (this.kind === 'strike' ? 0.9 : 0.45));
    const t = this.t, on = this.target > this.from;
    if (this.kind === 'strike' && on) {
      // strike: a soft glow at once, then a steady warm-up, like an old lantern. (It used to blink twice,
      // 0.85, 0.08, 0.7, 0.15, and the paving under the five real lamp lights blinked with it: flicker.)
      const f = 0.35 * smooth(0, 0.12, t) + 0.65 * smooth(0.12, 1, t);
      this.v = this.from + (this.target - this.from) * f;
    } else if (on) {
      const f = t < 0.08 ? 0.6 : 0.6 + 0.4 * smooth(0.08, 1, t);
      this.v = this.from + (this.target - this.from) * f;
    } else this.v = this.from + (this.target - this.from) * smooth(0, 1, t);
    return this.v;
  }
}

export class TownLights {
  constructor(world, life) {
    this.world = world; this.life = life;
    // backdrop buildings keep their own hours
    this.town = world.buildings.map((b, i) => ({
      b, sw: new Switch(),
      on: 19.3 + hash(i, 1) * 2.4, off: 22.0 + hash(i, 2) * 4.2,
      mOn: 5.4 + hash(i, 3) * 1.2, mOff: 6.9 + hash(i, 4) * 1.0, early: hash(i, 5) < 0.45,
      lvl: [0.35, 0.62, 1][Math.floor(hash(i, 6) * 3)],
    }));
    // waterfront
    this.sites = Object.values(world.sites).map((s) => {
      const groups = {};
      for (const [name, m] of Object.entries(s.emissive)) groups[name] = { m, sw: new Switch(name.includes('lamp') ? 'strike' : 'fade'), glow: (m.userData.glow || m.userData.emissiveOn || m.emissive).clone() };
      for (const g of Object.values(groups)) { g.m.emissive.copy(g.glow); g.m.emissiveIntensity = 0; }
      return { s, groups, delay: 0, pulse: 0 };
    });
    this.lamps = world.lamps.map((l) => {
      for (const m of l.mats) { m.emissive.copy(m.userData.glow); m.emissiveIntensity = 0; }
      return { ...l, sw: new Switch('strike') };
    });
    this.strings = world.strings.map((st) => {
      for (const m of st.mats) { m.emissive.copy(m.userData.glow); m.emissiveIntensity = 0; }
      return { ...st, sw: new Switch('strike') };
    });
    this.kiosk = { mats: world.kioskMats, sw: new Switch() };
    for (const m of world.kioskMats) { m.emissive.copy(m.userData.glow); }
    this.parasols = world.parasols.map((p) => ({ ...p, k: 1 }));
    this.pulses = {};
    this.level = { lamps: 0, dance: 0, cafe: 0 };
  }

  /** A product event: the landmark's sign flares for a moment. */
  pulse(siteId) { const s = this.sites.find((x) => x.s.id === siteId); if (s) s.pulse = 1; }

  // How bright a sign is over its switch level: a product event brightens it gently (a soft swell over
  // about a third of a second, then a slow ease back), never a flash.
  static PULSE = 0.3;

  update(dt, h, e, calm = false) {
    const dark = smooth(4, -3, e);          // enough for windows
    const hx = h < 12 ? h + 24 : h;         // evening hours run past midnight
    const inRange = (a, b) => hx >= a && hx < b;
    const day = (a, b) => { const x = wrap24(h); return a <= b ? x >= a && x < b : x >= a || x < b; };

    for (const t of this.town) {
      const on = dark > 0.35 && (inRange(t.on, t.off) || (t.early && day(t.mOn, t.mOff)));
      t.sw.set(on ? t.lvl : 0);
      t.b.setLights(t.sw.update(dt), WIN * 0.72);
    }

    for (const st of this.sites) {
      const s = st.s, G = st.groups;
      // `mod` scales the switched level (a sign's swell, the marquee's chase) without restarting the switch:
      // fed into the switch, a target that moved every frame restarted its fade each frame, so it rose
      // fast and fell slowly
      const set = (name, target, k = WIN, mod = 1) => { const g = G[name]; if (!g) return; g.sw.set(target); g.m.emissiveIntensity = g.sw.update(dt) * k * mod; };
      st.pulse = Math.max(0, st.pulse - dt * 0.8);
      st.glow = (st.glow || 0) + (st.pulse - (st.glow || 0)) * Math.min(1, dt * 6);
      const swell = 1 + st.glow * TownLights.PULSE;
      const occ = [...s.occupants.values()];
      const litN = occ.filter(Boolean).length;
      if (s.kind === 'home') {
        const v = dark > 0.3 && litN > 0 && performance.now() > (s.lightAt || 0) ? litN : 0;
        // a window of someone's own (Asgeir's) follows only them
        const own = (name) => { const o = s.own?.[name]; return !!o && o.lit && dark > 0.3 && performance.now() > o.at; };
        set('emissive_window_1', v >= 1 || own('emissive_window_1') ? 1 : 0);
        set('emissive_window_2', v >= 2 || own('emissive_window_2') ? 1 : 0);
        set('emissive_window_3', v >= 3 || own('emissive_window_3') ? 1 : 0);
      } else if (s.kind === 'cafe') {
        const open = day(6.6, 0.7);
        set('emissive_sign', open && dark > 0.2 ? 1 : 0, SIGN);
        set('emissive_lamp_string', open && dark > 0.1 ? 1 : 0, 2.2);
        set('emissive_window_1', open && dark > 0.25 ? 1 : 0);
        set('emissive_window_2', open && dark > 0.25 && day(17, 0.5) ? 1 : 0);
        set('emissive_window_3', dark > 0.25 && litN > 0 ? 1 : 0);
        this.level.cafe = open ? dark : 0;
      } else if (s.product === 'mcp-emails') {
        // the post office never closes: agents send mail all night
        set('emissive_window_ground', dark > 0.2 ? 1 : 0.25, SHOP);
        set('emissive_window_upper', dark > 0.25 && day(17.5, 23.5) ? 1 : 0, SHOP);
        set('emissive_lamp', dark > 0.15 ? 1 : 0, 1.6);
        set('emissive_sign_mcpemails', dark > 0.1 ? 1 : 0.3, SIGN * 0.55, swell);   // a white lightbox: keep the wordmark legible
      } else if (s.product === 'fun-libs') {
        set('emissive_window_ground', day(9, 1) ? (dark > 0.2 ? 1 : 0.35) : 0, SHOP);
        set('emissive_window_upper', dark > 0.25 && day(19, 23) ? 1 : 0, SHOP);
        set('emissive_arcade', day(9, 1) ? 1 : 0, 1.2);
        // the chase as it always looked (the restarting switch held it between 0.94 and 1), now an even ripple
        const chase = 0.97 + 0.03 * Math.sin(performance.now() / 160);
        set('emissive_marquee', day(17.5, 1.5) && dark > 0.05 ? 1 : 0, 1.7, chase);
        set('emissive_sign_funlibs', dark > 0.1 ? 1 : 0.35, SIGN, swell);
      } else if (s.product === 'toolrails') {
        // lit while the builder is in the workshop
        const working = litN > 0;
        set('emissive_window_ground', working ? (dark > 0.2 ? 1 : 0.45) : 0, SHOP);
        set('emissive_window_upper', working && dark > 0.2 ? 1 : 0, SHOP);
        set('emissive_skylight', working ? (dark > 0.2 ? 1 : 0.3) : 0, 1.5);
        set('emissive_sign_toolrails', dark > 0.1 ? 1 : 0.35, SIGN, swell);
      } else if (s.product === 'harbor') {
        // paused: one reading lamp left on, the sign turned low
        set('emissive_window_ground', 0, SHOP);
        set('emissive_window_upper', dark > 0.3 && day(19, 23.5) ? 0.4 : 0, SHOP);
        set('emissive_sign_harbor', dark > 0.1 ? 0.35 : 0.12, SIGN);
      }
    }

    // street lamps strike one after another along the promenade, west to east
    let lampSum = 0;
    for (const l of this.lamps) {
      const thr = 2.6 - l.order * 0.32;
      l.sw.set(e < thr ? 1 : 0);
      const v = l.sw.update(dt);
      for (const m of l.mats) m.emissiveIntensity = v * 4.0;
      l.level = v; lampSum += v;
    }
    this.level.lamps = lampSum / Math.max(1, this.lamps.length);
    for (const st of this.strings) {
      st.sw.set(dark > 0.15 && day(17, 1.3) ? 1 : 0);
      const v = st.sw.update(dt);
      for (const m of st.mats) m.emissiveIntensity = v * 2.6;
      this.level.dance = v;
    }
    this.kiosk.sw.set(day(6, 22) ? (dark > 0.2 ? 1 : 0.3) : 0);
    const kv = this.kiosk.sw.update(dt);
    for (const m of this.kiosk.mats) m.emissiveIntensity = kv * WIN;

    // parasols open for service and fold at night
    for (const p of this.parasols) {
      const open = day(7.3 + p.order * 0.03, 21.4 + p.order * 0.04) ? 1 : 0;
      p.k += (open - p.k) * Math.min(1, dt * 2.5);
      const k = p.k;
      p.open.visible = k > 0.08;
      p.open.scale.set(0.2 + 0.8 * k, 0.85 + 0.15 * k, 0.2 + 0.8 * k);
      p.closed.visible = k < 0.6;
      p.closed.scale.setScalar(1 - Math.max(0, k - 0.3));
    }
  }
}

/** Soft pools of lamplight on the paving (cheap additive decals). */
export function makeGlowPools(world) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,214,150,1)'); g.addColorStop(0.35, 'rgba(255,190,120,0.45)'); g.addColorStop(1, 'rgba(255,170,100,0)');
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv);
  const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const pools = [];
  const add = (x, z, r, src) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, color: new THREE.Color(1, 1, 1) }));
    m.position.set(x, 0.03, z); m.scale.set(r * 2, 1, r * 2); m.renderOrder = 2;
    pools.push({ m, src });
    return m;
  };
  const group = new THREE.Group();
  for (const l of world.lamps) group.add(add(l.x + 0.0, l.z - 0.6, 4.2, l));
  return { group, pools };
}
