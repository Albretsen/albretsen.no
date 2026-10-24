// Heure Bleue townsfolk loader.
// Needs an import map that resolves "three" and "three/addons/" (three r170).
//
//   import { Townsfolk } from '../_shared/3d/people/people.js';
//   const town = new Townsfolk();                 // base URL defaults to this file's folder
//   const waiter = await town.spawn('waiter');    // { object, play, attach, ... }
//   scene.add(waiter.object);
//   waiter.play('walk_carry'); waiter.attach('tray');
//   // every frame:
//   town.update(dt);
//
// All humans share one 23-bone skeleton ("townsfolk_rig"), so every clip in
// townsfolk-anims.glb plays on every character. The dog and bicycle carry their own clips.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

export const PEOPLE = ['player', 'jogger', 'waiter', 'older_woman', 'older_man', 'dog_walker', 'cyclist', 'child', 'stroller_dress', 'stroller_linen', 'asgeir'];
export const CLIPS = ['idle', 'idle_arms_folded', 'walk', 'walk_formal', 'walk_carry', 'jog', 'run', 'sit', 'sit_talk', 'sit_down', 'stand_up',
  'talk', 'wave', 'drink', 'phone', 'dance', 'lean_rail', 'rail_call', 'lantern', 'water_plants', 'yes', 'no', 'drive', 'cycle',
  'interact', 'pick_up', 'push', 'jump_start', 'jump_loop', 'jump_land', 'roll', 'crouch_idle', 'crouch_walk'];

// Where each prop sits in its bone's local space (metres / degrees). Tuned against the clips named in `for`.
export const PROP_MOUNTS = {
  // bone-local mounts (hand bones: +Y along the fingers, -X out of the palm, +Z along the thumb)
  phone:        { bone: 'hand_r', pos: [-0.028, 0.06, 0.0], rot: [0, 0, 0], for: 'phone' },
  coffee_cup:   { bone: 'hand_r', pos: [-0.05, 0.05, 0.0], rot: [90, 0, 0], for: 'drink' },
  wine_glass:   { bone: 'hand_r', pos: [-0.035, 0.05, 0.0], rot: [90, 0, 0], for: 'drink' },
  baguette:     { bone: 'hand_l', pos: [-0.035, 0.05, 0.0], rot: [90, 0, 0], for: 'walk' },
  newspaper:    { bone: 'hand_l', pos: [-0.03, 0.06, 0.0], rot: [90, 0, 0], for: 'sit' },
  // upright mounts follow the bone's position but stay level, facing the actor's forward
  cane:         { bone: 'hand_r', upright: true, offset: [0, -0.02, 0.02], for: 'walk_formal' },
  lantern:      { bone: 'hand_r', upright: true, offset: [0, -0.02, 0.0], for: 'lantern' },
  watering_can: { bone: 'hand_r', upright: true, offset: [0, -0.01, 0.05], for: 'water_plants' },
  tray:         { bone: ['hand_l', 'hand_r'], upright: true, offset: [0, 0.03, 0.04], for: 'walk_carry' },
};

const HERE = new URL('./', import.meta.url).href;
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3();

export class Townsfolk {
  constructor({ base = HERE, loader } = {}) {
    this.base = base.endsWith('/') ? base : base + '/';
    this.loader = loader || new GLTFLoader();
    this.loader.setMeshoptDecoder(MeshoptDecoder);
    this.cache = new Map();
    this.actors = new Set();
    this.clips = null;
  }

  _load(file) {
    if (!this.cache.has(file)) this.cache.set(file, this.loader.loadAsync(this.base + file));
    return this.cache.get(file);
  }

  async library() {
    if (!this.clips) {
      const g = await this._load('townsfolk-anims.glb');
      this.clips = Object.fromEntries(g.animations.map((c) => [c.name, c]));
    }
    return this.clips;
  }

  async props() {
    const g = await this._load('props.glb');
    return g.scene;
  }

  /** Spawn a person ('waiter'), 'dog' or 'bicycle'. Returns an Actor. */
  async spawn(name, { clip } = {}) {
    const [g, lib] = await Promise.all([this._load(name + '.glb'), name === 'dog' || name === 'bicycle' ? null : this.library()]);
    const object = cloneSkinned(g.scene);
    object.name = name;
    object.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; }
    });
    const clips = lib ? lib : Object.fromEntries(g.animations.map((c) => [c.name, c]));
    const actor = new Actor(this, name, object, clips);
    this.actors.add(actor);
    actor.play(clip || (name === 'bicycle' ? 'ride' : 'idle'), 0);
    return actor;
  }

  /** A leash line from a person's left hand to the dog's collar. Add the returned line to the scene. */
  leash(person, dog, { color = 0x232c57 } = {}) {
    const geo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 12 }, () => new THREE.Vector3()));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
    line.frustumCulled = false;
    const hand = person.bone('hand_l'), collar = dog.bone('collar') || dog.bone('neck');
    const a = new THREE.Vector3(), b = new THREE.Vector3(), p = new THREE.Vector3();
    line.userData.update = () => {
      hand.getWorldPosition(a); a.y -= 0.03;
      collar.getWorldPosition(b);
      const pos = geo.attributes.position;
      const sag = Math.max(0.05, 1.6 - a.distanceTo(b)) * 0.25;
      for (let i = 0; i < 12; i++) {
        const t = i / 11;
        p.lerpVectors(a, b, t); p.y -= Math.sin(Math.PI * t) * sag;
        if (line.parent) line.parent.worldToLocal(p);
        pos.setXYZ(i, p.x, p.y, p.z);
      }
      pos.needsUpdate = true;
    };
    this._leashes = (this._leashes || new Set()).add(line);
    return line;
  }

  update(dt) {
    for (const a of this.actors) { a.mixer.update(dt); a._updateFollowers(); }
    if (this._leashes) for (const l of this._leashes) l.userData.update();
  }

  remove(actor) { this.actors.delete(actor); actor.mixer.stopAllAction(); actor.object.removeFromParent(); }
}

export class Actor {
  constructor(town, name, object, clips) {
    this.town = town; this.name = name; this.object = object; this.clips = clips;
    this.mixer = new THREE.AnimationMixer(object);
    this.current = null; this.props = {}; this.followers = [];
    this._bones = {};
    object.traverse((o) => { if (o.isBone) this._bones[o.name] = o; });
    object.traverse((o) => { if (o.isSkinnedMesh && !this.skinned) this.skinned = o; });
  }

  bone(name) { return this._bones[name]; }

  /** Crossfade to a clip by name. once=true plays a one-shot and holds the last frame. */
  play(name, fade = 0.35, { once = false, timeScale = 1 } = {}) {
    const clip = this.clips[name];
    if (!clip) { console.warn('townsfolk: no clip', name); return null; }
    const action = this.mixer.clipAction(clip);
    action.enabled = true;
    action.setEffectiveTimeScale(timeScale);
    action.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = once;
    if (this.current === action) return action;
    action.reset().setEffectiveWeight(1).play();
    if (this.current && fade > 0) this.current.crossFadeTo(action, fade, false);
    else if (this.current) this.current.stop();
    this.current = action;
    return action;
  }

  /** Play a one-shot (e.g. 'wave', 'pick_up', 'jump_start') then return to `then`. */
  async once(name, then = 'idle', fade = 0.25) {
    const a = this.play(name, fade, { once: true });
    if (!a) return;
    await new Promise((res) => {
      const done = (e) => { if (e.action === a) { this.mixer.removeEventListener('finished', done); res(); } };
      this.mixer.addEventListener('finished', done);
    });
    this.play(then, fade);
  }

  /** Attach a prop from props.glb ('phone', 'tray', 'coffee_cup', ...). Returns the prop object. */
  async attach(prop) {
    if (this.props[prop]) { this.props[prop].visible = true; return this.props[prop]; }
    const lib = await this.town.props();
    const src = lib.getObjectByName(prop);
    if (!src) { console.warn('townsfolk: no prop', prop); return null; }
    const m = PROP_MOUNTS[prop];
    // wrap the clone: optimised glTF nodes carry their own (de)quantisation transform
    const inner = src.clone(true);
    inner.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.castShadow = true; } });
    const obj = new THREE.Group();
    obj.name = prop;
    obj.add(inner);
    if (m.upright) {
      // the rig may be scaled (the child is 0.62); props follow that scale
      const rig = this.object.getObjectByName(this.name);
      obj.scale.setScalar(rig && rig !== this.object ? rig.scale.x : 1);
      this.object.add(obj);
      this.followers.push({ obj, m });
    } else {
      obj.position.fromArray(m.pos);
      obj.rotation.set(...m.rot.map(THREE.MathUtils.degToRad));
      this.bone(m.bone).add(obj);
    }
    this.props[prop] = obj;
    return obj;
  }

  _updateFollowers() {
    if (!this.followers.length) return;
    const a = _v1, b = _v2;
    for (const { obj, m } of this.followers) {
      if (!obj.visible) continue;
      if (Array.isArray(m.bone)) {
        this.bone(m.bone[0]).getWorldPosition(a); this.bone(m.bone[1]).getWorldPosition(b); a.add(b).multiplyScalar(0.5);
      } else this.bone(m.bone).getWorldPosition(a);
      this.object.worldToLocal(a);
      obj.position.copy(a);
      if (m.offset) obj.position.x += m.offset[0], obj.position.y += m.offset[1], obj.position.z += m.offset[2];
      obj.quaternion.identity();
    }
  }

  detach(prop) { if (this.props[prop]) this.props[prop].visible = false; }

  /** Sets every emissive_ material on this actor (and its props) to intensity k (0..1+). */
  setLights(k, color = 0xffc979) {
    this.object.traverse((o) => {
      if (!o.isMesh) return;
      for (const mat of [].concat(o.material)) {
        if (mat.name && mat.name.startsWith('emissive_')) { mat.emissive.set(color); mat.emissiveIntensity = k; }
      }
    });
  }

  /** Seat a cyclist on a bicycle actor (rider follows the bike). */
  mount(bike) {
    bike.object.add(this.object);
    this.object.position.set(0, 0, 0);
    this.object.rotation.set(0, 0, 0);
    this.play('cycle', 0);
    this.current.time = bike.current ? bike.current.time : 0;
  }
}

/** sit / sit_talk (measured): pelvis 0.54 m up and 0.33 m behind the origin. Put a chair seat (~0.44 m high) centred 0.33 m behind the actor. */
export const SEAT = { height: 0.44, back: 0.33 };
/**
 * 'drive' clip (measured): the pelvis sits 0.54 m above the actor origin and 0.31 m behind it (seat surface ~0.44 m);
 * the hands rest 0.38 m above and 0.35 m ahead of the pelvis, 0.37 m apart (steering-wheel rim).
 * To seat a driver: put the actor origin 0.44 m below the seat surface and 0.31 m ahead of the seat's hip point.
 */
export const DRIVE = { seatHeight: 0.44, back: 0.31, wheelAhead: 0.35, wheelUp: 0.38, wheelWidth: 0.37 };

/** Ground speed (m/s) to move an actor at so its in-place locomotion clip does not slide (measured from foot travel; tune by eye). */
export const SPEED = { walk: 1.2, walk_formal: 1.0, walk_carry: 0.75, jog: 3.2, run: 4.6, crouch_walk: 0.85, cycle: 3.32 };

/**
 * A day in the town: what each townsperson does at a given hour (0-24).
 * Each entry: [fromHour, clip, prop|null, moving]. moving = the actor should travel along a path at SPEED[clip].
 */
export const ROUTINES = {
  jogger:         [[0, 'sit', null, false], [6, 'jog', null, true], [8, 'idle', null, false], [12, 'sit_talk', null, false], [14, 'walk', null, true], [18, 'jog', null, true], [20, 'lean_rail', null, false], [22, 'phone', 'phone', false]],
  waiter:         [[0, 'idle_arms_folded', null, false], [7, 'walk_carry', 'tray', true], [15, 'idle_arms_folded', null, false], [17, 'walk_carry', 'tray', true], [23, 'idle_arms_folded', null, false]],
  older_woman:    [[0, 'sit', null, false], [9, 'walk_formal', null, true], [11, 'sit_talk', null, false], [13, 'sit', null, false], [17, 'walk_formal', null, true], [19, 'sit_talk', null, false], [21, 'sit', null, false]],
  older_man:      [[0, 'sit', 'newspaper', false], [10, 'walk_formal', 'cane', true], [12, 'drink', 'coffee_cup', false], [14, 'water_plants', 'watering_can', false], [17, 'walk_formal', 'cane', true], [19, 'sit_talk', null, false], [21, 'drink', 'wine_glass', false]],
  dog_walker:     [[0, 'idle', null, false], [7, 'walk', null, true], [9, 'phone', 'phone', false], [12, 'sit', null, false], [18, 'walk', null, true], [21, 'lantern', 'lantern', false], [23, 'walk', null, true]],
  cyclist:        [[0, 'idle', null, false], [7, 'cycle', null, true], [10, 'drink', 'coffee_cup', false], [12, 'cycle', null, true], [20, 'talk', null, false], [22, 'yes', null, false]],
  child:          [[0, 'sit', null, false], [8, 'walk', null, true], [10, 'jog', null, true], [12, 'sit', null, false], [14, 'water_plants', 'watering_can', false], [17, 'dance', null, false], [19, 'wave', null, false], [20, 'sit', null, false]],
  stroller_dress: [[0, 'idle', null, false], [10, 'walk', null, true], [13, 'sit_talk', null, false], [16, 'walk', null, true], [18, 'lean_rail', null, false], [19.5, 'drink', 'wine_glass', false], [21, 'dance', null, false], [23, 'walk', null, true]],
  stroller_linen: [[0, 'idle', null, false], [9, 'walk', 'baguette', true], [11, 'phone', 'phone', false], [13, 'sit_talk', null, false], [17, 'walk', null, true], [18.5, 'rail_call', null, false], [19.5, 'talk', null, false], [21, 'dance', null, false]],
  asgeir:         [[0, 'sit', null, false], [7, 'walk', null, true], [7.5, 'drink', 'coffee_cup', false], [8.5, 'sit_talk', null, false], [11.5, 'walk', 'baguette', true], [12.5, 'sit', null, false], [16.5, 'walk', null, true], [18, 'lean_rail', null, false], [19.5, 'wave', null, false], [20, 'talk', null, false], [22, 'sit', null, false]],
  player:         [[0, 'idle', null, false]],
};

/** routine('waiter', 19.5) -> { clip: 'walk_carry', prop: 'tray', moving: true } */
export function routine(name, hour) {
  const r = ROUTINES[name] || ROUTINES.player;
  let cur = r[r.length - 1];
  for (const e of r) if (hour >= e[0]) cur = e;
  return { clip: cur[1], prop: cur[2], moving: cur[3] };
}

/** Switch an actor to its routine for `hour` (crossfade + prop swap). Returns the routine entry. */
export async function applyRoutine(actor, hour, fade = 0.5) {
  const r = routine(actor.name, hour);
  for (const p of Object.keys(actor.props)) if (p !== r.prop) actor.detach(p);
  if (r.prop) await actor.attach(r.prop);
  actor.play(r.clip, fade);
  return r;
}
