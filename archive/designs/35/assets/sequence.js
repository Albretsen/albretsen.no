// Kiln Light — image-sequence scrubber (the centrepiece).
// 64 pre-rendered frames of The Room: the camera walks in while one day passes
// through the arched window (morning light on the back wall -> ember dusk).
//
//   import { scrub } from './sequence.js'
//   scrub(canvas, { src: i => `sequence/room-${String(i).padStart(3,'0')}.webp`, count: 64,
//                   track: sectionEl, onFrame: (i, p) => ... })
//
// - frames load progressively: keyframes every 8th first, then fill-in, so a
//   fast scroll always has *something* close to draw (nearest loaded frame)
// - scroll progress is eased toward the target (serene, never jumpy)
// - draws cover-fit into a DPR-sized canvas; respects reduced motion (shows
//   the frame for the current section only, no tween)
export function scrub(canvas, { src, count, track, onFrame, ease = 0.12, start = 0 } = {}) {
  const ctx = canvas.getContext('2d');
  const frames = new Array(count);
  const loaded = new Uint8Array(count);
  const order = [];
  for (let step = 8; step >= 1; step >>= 1) for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);
  if (!order.includes(count - 1)) order.splice(1, 0, count - 1);
  let inflight = 0;
  const pump = () => {
    while (inflight < 6 && order.length) {
      const i = order.shift(); inflight++;
      const img = new Image(); img.decoding = 'async'; img.src = src(i);
      img.decode().then(() => { frames[i] = img; loaded[i] = 1; if (Math.round(cur) === i || !drawn) draw(true); })
        .catch(() => {}).finally(() => { inflight--; pump(); });
    }
  };
  pump();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let target = start, cur = start, drawn = false, lastI = -1, raf = 0;
  const nearest = i => { for (let d = 0; d < count; d++) { if (loaded[i - d]) return i - d; if (loaded[i + d]) return i + d; } return -1; };
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); lastI = -1; draw(true);
  }
  function draw(force) {
    const i = nearest(Math.round(cur)); if (i < 0 || (!force && i === lastI)) return;
    const img = frames[i], cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    lastI = i; drawn = true; onFrame?.(i, i / (count - 1));
  }
  function progress() {
    const el = track || document.documentElement, r = el.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
  }
  function tick() {
    target = progress() * (count - 1);
    cur = reduce ? target : cur + (target - cur) * ease;
    if (Math.abs(target - cur) < 0.01) cur = target;
    draw(false);
    raf = requestAnimationFrame(tick);
  }
  addEventListener('resize', size); size(); tick();
  return {
    set(p) { target = cur = p * (count - 1); draw(true); },
    destroy() { cancelAnimationFrame(raf); removeEventListener('resize', size); },
  };
}
