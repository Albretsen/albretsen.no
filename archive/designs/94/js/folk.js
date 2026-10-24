// Evening post: the people who get the letters. One townsperson waits on the lane in front of
// each low house on the round and waves when their letter arrives; a few stroll the promenade.
import * as THREE from 'three';
import { Townsfolk, SPEED } from '../../_shared/3d/people/people.js';

const WHO = ['older_woman', 'waiter', 'stroller_dress', 'older_man', 'child', 'stroller_linen', 'jogger', 'dog_walker', 'player'];
const POSE = ['idle', 'talk', 'phone', 'idle_arms_folded', 'idle', 'drink', 'lean_rail', 'idle_arms_folded', 'phone'];

export async function addFolk({ scene, world, course, shadows }) {
  const town = new Townsfolk();
  const out = { town, walkers: [], update(dt) { town.update(dt); for (const w of this.walkers) w.step(dt); } };
  const letters = course.targets.filter((t) => t.kind === 'letter' && t.house.row <= 3).slice(0, 9);
  const rowY = world.town.rowY;
  await Promise.all(letters.map(async (t, i) => {
    const name = WHO[i % WHO.length];
    const a = await town.spawn(name);
    a.object.traverse((o) => { if (o.isMesh) { o.castShadow = shadows; o.receiveShadow = shadows; } });
    const h = t.house;
    a.object.position.set(t.pos.x + (i % 2 ? 1.6 : -1.6), rowY(h.row) + 0.05, h.box.max.z + 1.4);
    a.object.rotation.y = (i % 2 ? -0.5 : 0.5);
    const pose = POSE[i % POSE.length];
    if (pose === 'phone') await a.attach('phone');
    if (pose === 'drink') await a.attach('wine_glass');
    a.play(pose, 0);
    a.mixer.setTime(Math.random() * 3);
    scene.add(a.object);
    t.folk = a; t.folkPose = pose;
  }));
  // a couple of strollers on the coast promenade, walking back and forth
  const road = world.town.road;
  for (const [name, x0, dir] of [['stroller_linen', -40, 1], ['older_woman', 20, -1], ['dog_walker', -5, 1]]) {
    const a = await town.spawn(name);
    a.object.traverse((o) => { if (o.isMesh) { o.castShadow = shadows; } });
    a.object.position.set(x0, 0.05, road.z + 3.3);
    a.play(name === 'older_woman' ? 'walk_formal' : 'walk', 0);
    let d = dir;
    const sp = SPEED[name === 'older_woman' ? 'walk_formal' : 'walk'];
    scene.add(a.object);
    out.walkers.push({ step(dt) {
      const p = a.object.position; p.x += d * sp * dt;
      if (p.x > 55) d = -1; if (p.x < -60) d = 1;
      a.object.rotation.y = d > 0 ? Math.PI / 2 : -Math.PI / 2;
    } });
  }
  return out;
}

/** Turn toward the plane and wave, then go back to what they were doing. */
export function wave(t, planePos) {
  const a = t.folk; if (!a) return;
  const p = a.object.position;
  a.object.rotation.y = Math.atan2(planePos.x - p.x, planePos.z - p.z);
  a.detach('phone'); a.detach('wine_glass');
  a.once('wave', 'idle');
}
