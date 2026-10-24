// Living Town: the townsfolk. Every frame each person asks "what should I be doing at this hour?"
// and, if the answer changed, walks (or runs, if the visitor is scrubbing the clock) to do it.
import * as THREE from 'three';
import { Townsfolk, SPEED, SEAT } from '../../_shared/3d/people/people.js';
import { CAST as MAIN, EXTRAS } from './cast.js';
import { Nav } from './nav.js';
import { RAIL_Z, DANCE, FOUNTAIN, KIOSK, LANE_PROM } from './town.js';
import { wrap24 } from './time.js';

const TAU = Math.PI * 2;
const angTo = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
let CAST = MAIN;
// After dark the figures get a little light of their own, in their own colours, so they read on the paving.
const LIFT = { value: 0 };
function liftShader(sh) {
  sh.uniforms.uLift = LIFT;
  sh.fragmentShader = 'uniform float uLift;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += diffuseColor.rgb * uLift;');
}
const STILL_ONE_SHOTS = new Set(['wave', 'jump_start', 'interact', 'yes', 'no', 'pick_up']);

export function actAt(day, h) {
  h = wrap24(h);
  let cur = day[day.length - 1][1];
  for (const [t, a] of day) if (h >= t) cur = a;
  return cur;
}

// ------------------------------------------------------------------ spots and loops
function makeSpots(world) {
  const S = {};
  const sp = (k, x, z, face, extra = {}) => (S[k] = { x, z, face, ...extra });
  // café chairs: chair:<table>:<0 left|1 right>
  world.chairs.forEach((c, i) => {
    const t = Math.floor(i / 2), side = i % 2;
    sp(`chair:${t}:${side}`, c.x + Math.sin(c.face) * SEAT.back, c.z + Math.cos(c.face) * SEAT.back, c.face, { sit: true, obstacleFree: true });
  });
  // benches face the sea (+Z): bench:<i>:<seat>
  world.benches.forEach((b, i) => {
    sp(`bench:${i}:0`, b.x - 0.42, b.z + SEAT.back - 0.12, 0, { sit: true });
    sp(`bench:${i}:1`, b.x + 0.42, b.z + SEAT.back - 0.12, 0, { sit: true });
  });
  const RX = [-42, -41.1, -11.2, 7.4, 6.2, 8.6, -22.0, -21.1, 27.0, -10.2, 15.6, 16.6, -45.5, 34.5];
  RX.forEach((x, i) => sp(`rail:${i}`, x, RAIL_Z - 0.48, 0));
  sp('drinks:0', 2.5, 12.5, faceTo(2.5, 12.5, 3.5, 13.3)); sp('drinks:2', 3.5, 13.3, faceTo(3.5, 13.3, 2.5, 12.5));
  sp('drinks:3', 0.9, 13.6, faceTo(0.9, 13.6, 2.5, 12.5));
  sp('drinks:1', -13.4, 14.5, faceTo(-13.4, 14.5, -12.6, 15.3)); sp('drinks:1b', -12.6, 15.3, faceTo(-12.6, 15.3, -13.4, 14.5));
  const d = DANCE;
  const dance = [[-0.9, -0.4], [-0.2, 0.25], [0, 0], [1.1, 0.9], [1.8, -0.3], [-1.6, 1.2]];
  dance.forEach(([dx, dz], i) => sp(`dance:${i}`, d.x + dx, d.z + dz, 0));
  // dance partners face each other
  S['dance:0'].face = faceTo(S['dance:0'].x, S['dance:0'].z, S['dance:1'].x, S['dance:1'].z);
  S['dance:1'].face = faceTo(S['dance:1'].x, S['dance:1'].z, S['dance:0'].x, S['dance:0'].z);
  S['dance:3'].face = faceTo(S['dance:3'].x, S['dance:3'].z, S['dance:4'].x, S['dance:4'].z);
  S['dance:4'].face = faceTo(S['dance:4'].x, S['dance:4'].z, S['dance:3'].x, S['dance:3'].z);
  S['dance:5'].face = 0.6;
  sp('stretch', FOUNTAIN.x + 3.0, FOUNTAIN.z + 0.4, 0.3);
  sp('fountainedge', FOUNTAIN.x - 0.4, FOUNTAIN.z + 2.25, Math.PI);
  sp('plants', -37.7, 10.55, faceTo(-37.7, 10.55, -38.6, 9.7));
  sp('cafedoor', -5.0, 9.7, 0);
  sp('kiosk', KIOSK.x, KIOSK.z + 1.75, Math.PI);
  sp('column', -30.6, 14.6, 0.4);
  sp('postbox', world.sites.mcp.x - 1.6, 9.45, Math.PI);
  sp('arcade', world.sites.funlibs.x + 0.6, 10.1, -0.3);
  sp('workshop', world.sites.toolrails.x - 2.2, 9.9, 0.25);
  // Asgeir's places: beside the post office screen, at the workshop window, a word with Henri, the railing by the builder
  sp('postbox:1', world.sites.mcp.x + 1.7, 9.6, Math.PI + 0.25);
  sp('workshop:1', world.sites.toolrails.x - 0.4, 10.0, Math.PI);
  const b1 = world.benches[1];
  sp('bench:1:stand', b1.x - 1.45, b1.z + SEAT.back + 0.15, faceTo(b1.x - 1.45, b1.z + SEAT.back + 0.15, b1.x - 0.42, b1.z + SEAT.back - 0.12));
  sp('rail:14', -12.4, RAIL_Z - 0.48, 0);
  return S;
}

function makeLoops() {
  const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const circle = (cx, cz, r, n = 18) => Array.from({ length: n }, (_, i) => [cx + Math.cos(-i / n * TAU) * r, cz + Math.sin(-i / n * TAU) * r]);
  return {
    jog: rect(-54, LANE_PROM + 0.4, 56, 10.9),
    stroll: rect(-42, 20.6, 12, 21.3),
    dog: rect(-30, 20.4, 46, 11.1),
    ride: rect(-60, 18.9, 60, 21.3),
    fountain: circle(FOUNTAIN.x, FOUNTAIN.z, 3.1),
  };
}

class Loop {
  constructor(pts) {
    this.pts = pts; this.len = [0];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      this.len.push(this.len[i] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    this.total = this.len[pts.length];
  }
  at(s, out = [0, 0, 0]) {
    s = ((s % this.total) + this.total) % this.total;
    let i = 0; while (this.len[i + 1] < s) i++;
    const a = this.pts[i], b = this.pts[(i + 1) % this.pts.length];
    const f = (s - this.len[i]) / (this.len[i + 1] - this.len[i] || 1);
    out[0] = a[0] + (b[0] - a[0]) * f; out[1] = a[1] + (b[1] - a[1]) * f; out[2] = Math.atan2(b[0] - a[0], b[1] - a[1]);
    return out;
  }
  nearest(x, z) {
    let best = 0, bd = Infinity;
    for (let i = 0; i < this.pts.length; i++) {
      const a = this.pts[i], b = this.pts[(i + 1) % this.pts.length];
      const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
      const px = a[0] + dx * t, pz = a[1] + dz * t, d = (px - x) ** 2 + (pz - z) ** 2;
      if (d < bd) { bd = d; best = this.len[i] + Math.sqrt(L2) * t; }
    }
    return best;
  }
}

// ------------------------------------------------------------------ a person
class Person {
  constructor(life, def, actor) {
    this.life = life; this.def = def; this.actor = actor; this.id = def.id;
    this.obj = actor.object;
    this.pos = new THREE.Vector3(); this.heading = 0; this.speed = 0;
    this.state = 'idle'; this.act = null; this.route = []; this.dest = null;
    this.opacity = 1; this.inside = null; this.mounted = false;
    this.clipTimer = 0; this.loopS = 0; this.pauseT = 0; this.sayIdx = Math.floor(Math.random() * 3);
    this.doorOffset = (Math.random() - 0.5) * 1.1;   // two people never aim for the same doorstep
    this.mats = [];
    this.obj.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material.clone();
      m.onBeforeCompile = liftShader;
      m.customProgramCacheKey = () => 'townsfolk-lift';
      o.material = m; this.mats.push(m);
    });
  }

  /** After dark, lift the figures a little so they read against the paving (as if lit by the shopfronts). */
  nightLift(k) {
    LIFT.value = k * 0.42;
    this.actor.setLights(k * 1.6);
    if (this.bike) this.bike.actor.setLights(k * 2.2);
  }

  setOpacity(v) {
    this.opacity = v;
    this.obj.visible = v > 0.01;
    for (const m of this.mats) { m.transparent = v < 0.999; m.opacity = v; m.depthWrite = v > 0.5; }
    for (const p of Object.values(this.actor.props)) p.traverse((o) => { if (o.isMesh) { o.material.transparent = v < 0.999; o.material.opacity = v; } });
    if (this.dog) { this.dog.obj.visible = v > 0.01; }
    if (this.leash) this.leash.visible = v > 0.3;
  }

  play(clip, fade = 0.35, timeScale = 1) {
    const a = this.actor.play(clip, fade);
    if (a) a.setEffectiveTimeScale(timeScale);
    if (this.mounted && this.bike) { this.bike.actor.current?.setEffectiveTimeScale(timeScale); }
  }

  async setProp(name) {
    const want = name || (this.def.walkProp && this.state === 'travel' ? this.def.walkProp : null);
    for (const p of Object.keys(this.actor.props)) if (p !== want) this.actor.detach(p);
    if (want && !this.actor.props[want]?.visible) {
      const o = await this.actor.attach(want);
      if (o && this.opacity < 1) this.setOpacity(this.opacity);
      if (o) o.traverse((m) => { if (m.isMesh && m.material.name?.startsWith('emissive_')) this.lightMats = [...(this.lightMats || []), m.material]; });
    }
  }

  /** The act changed: work out where to go. */
  plan(act, { instant = false } = {}) {
    this.act = act;
    this.clipTimer = 0;
    const L = this.life;
    // leave the house first
    if (this.inside && !(act.act === 'home' && this.inside === this.def.home) && !(act.act === 'inside' && this.inside === act.site)) {
      const site = L.sites[this.inside];
      L.leave(this, this.inside);
      this.inside = null;
      this.pos.copy(site.door).setZ(site.door.z - 0.5);
      this.heading = 0;
      if (!instant) { this.setOpacity(0.01); this.fadeIn = true; }
      else this.setOpacity(1);
    }
    const dest = this.destination(act);
    this.dest = dest;
    if (act.act === 'home' || act.act === 'inside') {
      const site = L.sites[act.act === 'home' ? this.def.home : act.site];
      if (this.inside === site.id) { L.enter(this, site.id, act.lit !== false || act.act === 'inside'); return; }
    }
    if (instant) {
      this.teleport(dest);
      return;
    }
    this.go(dest);
  }

  destination(act) {
    const L = this.life;
    switch (act.act) {
      case 'home': return { x: L.sites[this.def.home].door.x + this.doorOffset, z: L.sites[this.def.home].door.z, enter: this.def.home };
      case 'inside': return { x: L.sites[act.site].door.x + this.doorOffset, z: L.sites[act.site].door.z, enter: act.site };
      case 'spot': { const s = L.spots[act.spot]; if (!s) console.warn('no spot', act.spot); return { ...s, perform: true }; }
      case 'loop': { const loop = L.loops[act.loop]; const s = loop.nearest(this.pos.x, this.pos.z); const p = loop.at(s); return { x: p[0], z: p[1], loop: act.loop, s }; }
      case 'wander': return { ...L.randomPromenade(), wander: true };
      case 'patrol': return L.patrolStop(this, act);
      case 'follow': return { follow: act.who };
    }
    return { x: this.pos.x, z: this.pos.z };
  }

  teleport(dest) {
    const L = this.life;
    if (dest.follow) { const lead = L.byId[dest.follow]; this.pos.copy(lead.pos).add(new THREE.Vector3(this.act.side || 0.6, 0, 0)); this.arrive(); return; }
    if (dest.enter) { this.state = 'inside'; this.inside = dest.enter; L.enter(this, dest.enter, this.act.lit !== false || this.act.act === 'inside', true); this.setOpacity(0); return; }
    if (dest.loop) { const loop = L.loops[dest.loop]; this.loopS = Math.random() * loop.total; const p = loop.at(this.loopS); this.pos.set(p[0], 0, p[1]); this.heading = p[2]; }
    else this.pos.set(dest.x, 0, dest.z);
    if (this.bike && this.act.bike && !this.mounted) this.mount(true);
    this.setOpacity(1);
    this.arrive();
  }

  go(dest) {
    const L = this.life;
    if (dest.follow) { this.state = 'follow'; this.setProp(this.act.prop); return; }
    // the cyclist fetches the bike first, or parks it before going on foot
    if (this.bike) {
      if (this.act.bike && !this.mounted) { this.toBike = true; dest = { x: this.bike.park.x, z: this.bike.park.z, bikeGet: true }; }
      else if (!this.act.bike && this.mounted) { const park = L.nearestPark(dest.x ?? this.pos.x, dest.z ?? this.pos.z); dest = { ...park, bikePark: park, then: this.dest }; }
    }
    this.route = L.nav.route(this.pos.x, this.pos.z, dest.x, dest.z);
    this.leg = dest;
    // scrubbing the clock: skip most of a long walk
    if (L.hurry) {
      const len = routeLength(this.pos, this.route);
      if (len > 26) {
        const p = pointBack(this.pos, this.route, 9);
        this.pos.set(p[0], 0, p[1]);
        this.route = L.nav.route(this.pos.x, this.pos.z, dest.x, dest.z);
        if (this.inside == null && this.opacity > 0.5) { this.setOpacity(0.01); this.fadeIn = true; }
      }
    }
    this.state = 'travel';
    this.setProp(this.act.prop);
  }

  gait() {
    const L = this.life;
    if (this.mounted) return { clip: 'cycle', speed: L.hurry ? 5.2 : 3.32 };
    const g = this.act?.gait && this.state === 'travel' && this.act.act === 'loop' ? this.act.gait : 'walk';
    if (this.def.model === 'older_man' || this.def.model === 'older_woman') return { clip: 'walk_formal', speed: L.hurry ? 1.7 : 1.0 };
    if (this.act?.act === 'patrol' && this.act.gait === 'walk_carry') return { clip: 'walk_carry', speed: L.hurry ? 1.4 : 0.85 };
    if (L.hurry) return { clip: this.def.model === 'child' ? 'jog' : 'run', speed: this.def.model === 'child' ? 3.2 : 4.6 };
    if (g === 'jog') return { clip: 'jog', speed: 3.2 };
    return { clip: 'walk', speed: 1.2 };
  }

  arrive() {
    const a = this.act, d = this.leg || this.dest;
    this.route = [];
    if (d && d.bikeGet) { this.mount(); this.leg = null; this.go(this.dest); return; }
    if (d && d.bikePark) { this.dismount(d.bikePark); this.leg = null; this.go(this.dest); return; }
    this.leg = null;
    const dest = this.dest;
    if (dest.enter) { this.state = 'entering'; this.enterT = 0; return; }
    if (dest.loop) { this.state = 'loop'; this.loopS = this.life.loops[dest.loop].nearest(this.pos.x, this.pos.z); return; }
    if (dest.wander) { this.state = 'pause'; this.pauseT = rnd(3, 8); this.play(pick(a.pause || ['idle'])); this.setProp(a.prop); return; }
    if (dest.patrol) { this.state = 'pause'; this.pauseT = dest.dur; this.heading = dest.face ?? this.heading; this.play(dest.clip); return; }
    if (dest.follow) { this.state = 'follow'; return; }
    // a spot
    this.state = 'perform';
    if (dest.x != null) this.pos.set(dest.x, 0, dest.z);
    this.targetHeading = dest.face ?? this.heading;
    if (dest.sit) this.heading = this.targetHeading;
    this.nextClip(true);
    this.setProp(a.prop);
  }

  nextClip(first) {
    const clips = this.act.clips || ['idle'];
    const c = first ? clips[0] : pick(clips);
    this.play(c, first ? 0.45 : 0.6);
    this.clipTimer = STILL_ONE_SHOTS.has(c) ? rnd(2.5, 4) : rnd(5, 11);
  }

  mount(keepPos = false) {
    const b = this.bike; if (!b || this.mounted) return;
    if (!keepPos) { this.pos.copy(b.obj.position); this.heading = b.obj.rotation.y; }
    this.actor.mount(b.actor);
    this.obj.position.set(0, 0, 0); this.obj.rotation.set(0, 0, 0);
    b.actor.current?.setEffectiveTimeScale(1);
    this.mounted = true;
  }

  dismount(park) {
    const b = this.bike; if (!b || !this.mounted) return;
    this.life.scene.add(this.obj);
    b.obj.position.set(park.x, 0, park.z); b.obj.rotation.y = park.face;
    b.park = park;
    b.actor.current?.setEffectiveTimeScale(0);
    this.pos.set(park.x + Math.cos(park.face) * 0.7, 0, park.z - Math.sin(park.face) * 0.7);
    this.mounted = false;
    this.play('idle', 0.2);
  }

  /** What the person would say if clicked now. */
  line() {
    const a = this.act;
    if (!a) return null;
    const lines = a.say || (this.state === 'travel' ? ['On my way.'] : null);
    if (!lines) return null;
    this.sayIdx = (this.sayIdx + 1) % lines.length;
    return lines[this.sayIdx];
  }

  get root() { return this.mounted ? this.bike.obj : this.obj; }

  update(dt) {
    const L = this.life;
    if (this.fadeIn) { const v = Math.min(1, this.opacity + dt * 2.2); this.setOpacity(v); if (v >= 1) this.fadeIn = false; }
    if (this.state !== 'travel' && this.state !== 'loop' && this.state !== 'follow') this.speed = 0;
    switch (this.state) {
      case 'inside': break;
      case 'travel': this.walk(dt); break;
      case 'entering': {
        this.enterT += dt;
        const site = L.sites[this.dest.enter];
        this.play('walk', 0.3);
        const tz = site.door.z - 1.2;
        this.heading += angTo(this.heading, Math.PI) * Math.min(1, dt * 8);
        this.pos.z = Math.max(tz, this.pos.z - dt * 1.0);
        this.pos.x += (site.door.x - this.pos.x) * Math.min(1, dt * 4);
        this.setOpacity(Math.max(0, 1 - this.enterT / 0.9));
        if (this.enterT > 0.95) {
          this.state = 'inside'; this.inside = site.id;
          this.setProp(null);
          L.enter(this, site.id, this.act.lit !== false || this.act.act === 'inside');
        }
        break;
      }
      case 'loop': {
        const loop = L.loops[this.dest.loop];
        const g = this.act.bike ? { clip: 'cycle', speed: 3.32 } : this.act.gait === 'jog' ? { clip: 'jog', speed: 3.2 } : this.def.model === 'older_man' ? { clip: 'walk_formal', speed: 0.9 } : { clip: this.act.gait || 'walk', speed: SPEED[this.act.gait] || 1.15 };
        this.loopS += g.speed * dt;
        const p = loop.at(this.loopS + 0.6);
        this.steer(p[0], p[1], g.speed, dt);
        this.play(g.clip, 0.4, 1);
        break;
      }
      case 'pause': {
        this.pauseT -= dt;
        this.turn(this.dest.face, dt);
        if (this.pauseT <= 0) {
          const nd = this.act.act === 'patrol' ? L.patrolStop(this, this.act) : { ...L.randomPromenade(), wander: true };
          this.dest = nd; this.go(nd);
        }
        break;
      }
      case 'perform': {
        this.heading += angTo(this.heading, this.targetHeading) * Math.min(1, dt * 5);
        this.clipTimer -= dt;
        if (this.clipTimer <= 0 && (this.act.clips || []).length > 1) this.nextClip(false);
        break;
      }
      case 'follow': {
        const lead = L.byId[this.act.who];
        if (!lead || lead.state === 'inside' || lead.state === 'entering') { this.play('idle'); break; }
        const r = new THREE.Vector3(Math.cos(lead.heading), 0, -Math.sin(lead.heading));
        const f = new THREE.Vector3(Math.sin(lead.heading), 0, Math.cos(lead.heading));
        const tx = lead.pos.x + r.x * (this.act.side || 0.6) - f.x * 0.25, tz = lead.pos.z + r.z * (this.act.side || 0.6) - f.z * 0.25;
        const d = Math.hypot(tx - this.pos.x, tz - this.pos.z);
        const leadSpeed = lead.speed;
        if (d > 0.25 || leadSpeed > 0.1) {
          const sp = Math.min(Math.max(leadSpeed * (0.9 + d * 0.6), 0.5), 4.6);
          this.steer(tx, tz, sp, dt, true);
          const g = sp > 2.4 ? 'run' : this.def.model.startsWith('older') ? 'walk_formal' : 'walk';
          this.play(g, 0.35, sp / (SPEED[g] || 1.2));
        } else {
          this.speed = 0;
          this.turn(lead.heading, dt);
          this.play(this.def.model === 'child' ? 'idle' : 'talk', 0.5);
        }
        break;
      }
    }
    // the dog
    if (this.dog) this.updateDog(dt);
    const root = this.root;
    root.position.copy(this.pos);
    root.rotation.y = this.heading;
  }

  turn(target, dt) { if (target != null) this.heading += angTo(this.heading, target) * Math.min(1, dt * 5); }

  steer(tx, tz, speed, dt, follow = false) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z;
    const d = Math.hypot(dx, dz);
    const want = Math.atan2(dx, dz);
    this.heading += angTo(this.heading, want) * Math.min(1, dt * (follow ? 6 : 7));
    const step = Math.min(d, speed * dt);
    if (d > 1e-4) { this.pos.x += dx / d * step; this.pos.z += dz / d * step; }
    this.speed = step / Math.max(dt, 1e-4);
  }

  walk(dt) {
    if (!this.route.length) { this.arrive(); return; }
    const g = this.gait();
    const [tx, tz] = this.route[0];
    const d = Math.hypot(tx - this.pos.x, tz - this.pos.z);
    const last = this.route.length === 1;
    if (d < (last ? (this.leg?.enter || this.dest?.enter ? 0.35 : 0.08) : 0.7)) { this.route.shift(); if (!this.route.length) { this.arrive(); } return; }
    // ease into the stop
    const sp = last ? Math.min(g.speed, Math.max(0.5, d * 1.6)) : g.speed;
    this.steer(tx, tz, sp, dt);
    if (!last || d > 1.6) this.separate(dt);
    const ts = this.speed / g.speed;
    this.play(g.clip, 0.3, Math.max(0.6, ts) * (g.speed / (SPEED[g.clip] || g.speed)));
  }

  separate(dt) {
    for (const o of this.life.people) {
      if (o === this || o.state === 'inside' || o.mounted) continue;
      const dx = this.pos.x - o.pos.x, dz = this.pos.z - o.pos.z, d2 = dx * dx + dz * dz;
      if (d2 < 0.36 && d2 > 1e-6) { const d = Math.sqrt(d2), k = (0.6 - d) * dt * 2.5; this.pos.x += dx / d * k; this.pos.z += dz / d * k; }
    }
  }

  updateDog(dt) {
    const dog = this.dog;
    if (this.state === 'inside') { dog.obj.visible = false; return; }
    dog.obj.visible = this.opacity > 0.05;
    const r = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));
    const f = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const tx = this.pos.x - r.x * 0.75 + f.x * 0.45, tz = this.pos.z - r.z * 0.75 + f.z * 0.45;
    const dx = tx - dog.pos.x, dz = tz - dog.pos.z, d = Math.hypot(dx, dz);
    if (d > 6) { dog.pos.set(tx, 0, tz); }
    if (d > 0.18 || this.speed > 0.1) {
      const sp = Math.min(Math.max(this.speed * (0.85 + d * 0.8), 0.4), 4.6);
      const step = Math.min(d, sp * dt);
      if (d > 1e-4) { dog.pos.x += dx / d * step; dog.pos.z += dz / d * step; }
      dog.heading += angTo(dog.heading, Math.atan2(dx, dz)) * Math.min(1, dt * 7);
      const clip = sp > 2.2 ? 'run' : 'walk';
      const a = dog.actor.play(clip, 0.25);
      a?.setEffectiveTimeScale(sp / (clip === 'run' ? 3.4 : 1.15));
      dog.still = 0;
    } else {
      dog.still = (dog.still || 0) + dt;
      dog.heading += angTo(dog.heading, this.heading) * Math.min(1, dt * 3);
      const a = dog.actor.play(dog.still > 9 && (dog.still % 14) < 4 ? 'sniff' : 'sit', 0.5);
      a?.setEffectiveTimeScale(1);
    }
    dog.obj.position.copy(dog.pos);
    dog.obj.rotation.y = dog.heading;
  }
}

function routeLength(p, route) {
  let L = 0, x = p.x, z = p.z;
  for (const [a, b] of route) { L += Math.hypot(a - x, b - z); x = a; z = b; }
  return L;
}
function pointBack(p, route, back) {
  const pts = [[p.x, p.z], ...route];
  let rem = back;
  for (let i = pts.length - 1; i > 0; i--) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L >= rem) { const f = rem / L; return [b[0] + (a[0] - b[0]) * f, b[1] + (a[1] - b[1]) * f]; }
    rem -= L;
  }
  return pts[0];
}

// ------------------------------------------------------------------ the town's people
export class Life {
  constructor(scene, world) {
    this.scene = scene; this.world = world; this.sites = world.sites;
    this.sites.away_w = { kind: 'away', x: -60, door: new THREE.Vector3(-60, 0, 10.9), emissive: {} };
    this.sites.away_e = { kind: 'away', x: 62, door: new THREE.Vector3(62, 0, 10.9), emissive: {} };
    for (const [id, s] of Object.entries(this.sites)) { s.id = id; s.occupants = new Map(); }
    this.spots = makeSpots(world);
    this.loops = Object.fromEntries(Object.entries(makeLoops()).map(([k, v]) => [k, new Loop(v)]));
    this.nav = new Nav(this.obstacles());
    this.people = []; this.byId = {};
    this.hurry = false;
    this.onLight = () => {};
    this.parks = [
      { x: this.sites.home_cyc.x + 2.4, z: 9.75, face: Math.PI / 2 },
      { x: KIOSK.x - 2.2, z: KIOSK.z + 0.6, face: Math.PI / 2 },
    ];
  }

  obstacles() {
    const o = [];
    for (const c of this.world.chairs) o.push({ x: c.x, z: c.z, r: 0.38 });
    for (let i = 0; i < this.world.chairs.length; i += 2) { const a = this.world.chairs[i], b = this.world.chairs[i + 1]; o.push({ x: (a.x + b.x) / 2, z: a.z, r: 0.48 }); }
    for (const b of this.world.benches) { o.push({ x: b.x - 0.5, z: b.z, r: 0.42 }, { x: b.x + 0.5, z: b.z, r: 0.42 }); }
    for (const l of this.world.lamps) o.push({ x: l.x, z: l.z, r: 0.3 });
    o.push({ x: FOUNTAIN.x, z: FOUNTAIN.z, r: 2.1 });
    o.push({ x: KIOSK.x, z: KIOSK.z, r: 1.5 });
    o.push({ x: -31.5, z: 13.4, r: 0.6 });
    o.push({ x: -19.4, z: 12.6, r: 0.55 }, { x: 27.2, z: 12.4, r: 0.55 });
    for (const [x, z] of [[-32.2, 23.4], [-2.2, 23.6], [19.4, 23.4], [36.4, 23.5]]) o.push({ x, z, r: 0.5 });
    for (const dz of [-2.6, 2.6]) for (const dx of [-4, 4]) o.push({ x: DANCE.x + dx, z: DANCE.z + dz, r: 0.2 });
    return o;
  }

  randomPromenade() {
    for (let i = 0; i < 30; i++) {
      const x = rnd(-46, 46), z = rnd(18.4, 21.4);
      if (this.nav.clear(x, z, x + 0.01, z)) return { x, z, face: rnd(-0.6, 0.6) };
    }
    return { x: 0, z: LANE_PROM, face: 0 };
  }

  patrolStop(p, act) {
    const tables = this.world.chairs.filter((_, i) => i % 2 === 0).map((c, i) => ({ x: c.x + 0.72, z: c.z, i }));
    p._ptog = !p._ptog;
    if (!p._ptog && act.mode === 'serve') return { x: -5.0 + rnd(-1.2, 1.2), z: 9.8, patrol: true, dur: rnd(2, 4), clip: 'idle', face: Math.PI };
    const t = act.mode === 'setup' ? tables[(p._pi = ((p._pi ?? -1) + 1) % tables.length)] : pick(tables);
    const front = t.z < 14;
    return { x: t.x + rnd(-0.2, 0.2), z: front ? t.z - 1.0 : t.z - 1.05, patrol: true, dur: act.mode === 'setup' ? 2.6 : rnd(2.5, 4.5), clip: act.mode === 'setup' ? 'interact' : 'idle', face: 0 };
  }

  nearestPark(x, z) {
    let best = this.parks[0], bd = Infinity;
    for (const p of this.parks) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = p; } }
    return best;
  }

  enter(p, siteId, lit, instant = false) {
    const s = this.sites[siteId];
    // someone with a window of their own (Asgeir): it switches for them alone, never for the household
    if (p.def.window && siteId === p.def.home) {
      s.own = s.own || {};
      const was = !!s.own[p.def.window]?.lit;
      s.own[p.def.window] = { lit: !!lit, at: instant ? 0 : performance.now() + 1100 };
      if (!instant && was !== !!lit) this.onLight(s, p, !!lit, true);
      return;
    }
    const was = [...s.occupants.values()].some(Boolean);
    s.occupants.set(p.id, !!lit);
    const now = [...s.occupants.values()].some(Boolean);
    if (!was && now && !instant) this.onLight(s, p, true);
    if (was && !now && !instant) this.onLight(s, p, false);
  }

  leave(p, siteId) {
    const s = this.sites[siteId];
    if (p.def.window && s.own?.[p.def.window]) {
      const was = s.own[p.def.window].lit;
      delete s.own[p.def.window];
      if (was) this.onLight(s, p, false, true);
      return;
    }
    const was = [...s.occupants.values()].some(Boolean);
    s.occupants.delete(p.id);
    const now = [...s.occupants.values()].some(Boolean);
    if (was && !now) this.onLight(s, p, false);
  }

  async spawn(town = new Townsfolk(), { onProgress = () => {}, extras = true } = {}) {
    CAST = extras ? [...MAIN, ...EXTRAS] : MAIN;
    this.folk = town;
    await town.library();
    let n = 0;
    await Promise.all(CAST.map(async (def) => {
      const actor = await town.spawn(def.model);
      const p = new Person(this, def, actor);
      this.scene.add(actor.object);
      if (def.dog) {
        const d = await town.spawn('dog', { clip: 'sit' });
        this.scene.add(d.object);
        p.dog = { actor: d, obj: d.object, pos: new THREE.Vector3(), heading: 0 };
        p.leash = town.leash(actor, d);
        this.scene.add(p.leash);
      }
      if (def.bike) {
        const b = await town.spawn('bicycle');
        this.scene.add(b.object);
        const park = this.parks[0];
        b.object.position.set(park.x, 0, park.z); b.object.rotation.y = park.face;
        b.current?.setEffectiveTimeScale(0);
        p.bike = { actor: b, obj: b.object, park };
      }
      this.people.push(p); this.byId[def.id] = p;
      onProgress(++n / CAST.length);
    }));
    // keep the cast order stable (followers after leaders)
    this.people.sort((a, b) => CAST.findIndex((c) => c.id === a.id) - CAST.findIndex((c) => c.id === b.id));
  }

  /** Put everyone where they should be at hour h, without walking. */
  settle(h) {
    for (const p of this.people) {
      const act = actAt(p.def.day, h);
      p.plan(act, { instant: true });
      if (p.dog) { p.dog.pos.copy(p.pos).add(new THREE.Vector3(-0.7, 0, 0.3)); }
      p.update(0.016);
    }
  }

  update(dt, h) {
    for (const p of this.people) {
      const act = actAt(p.def.day, h);
      if (act !== p.act) p.plan(act);
      p.update(dt);
      if (p.bike && !p.mounted) { /* parked */ }
    }
    // Townsfolk.update, except that someone hidden indoors does not animate: their mixer keeps the
    // time and catches up in one step when they are seen again, so the pose is the same as if it had run.
    const F = this.folk;
    for (const a of F.actors) {
      if (!a.object.visible) { a._held = (a._held || 0) + dt; continue; }
      a.mixer.update(dt + (a._held || 0)); a._held = 0;
      a._updateFollowers();
    }
    if (F._leashes) for (const l of F._leashes) l.userData.update();
  }

  /** The person under a screen ray, if any (cheap capsule test). */
  pick(ray) {
    let best = null, bd = Infinity;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), pt = new THREE.Vector3(), seg = new THREE.Vector3();
    for (const p of this.people) {
      if (p.state === 'inside' || p.opacity < 0.5) continue;
      const h = p.def.model === 'child' ? 1.1 : 1.75;
      a.copy(p.pos).setY(0.3); b.copy(p.pos).setY(h);
      const d2 = ray.distanceSqToSegment(a, b, pt, seg);
      const r = 0.55;
      if (d2 < r * r) { const d = ray.origin.distanceTo(pt); if (d < bd) { bd = d; best = p; } }
    }
    return best;
  }
}
