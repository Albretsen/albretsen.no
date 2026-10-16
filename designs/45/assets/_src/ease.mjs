// sample a damped spring 0->1 into a CSS linear() easing + duration
function sample(k, c, m = 1, pts = 40) {
  let x = 0, v = 0; const h = 1 / 600; const out = []; let t = 0; let settledAt = 0;
  const trace = [];
  while (t < 4) { const a = (-k * (x - 1) - c * v) / m; v += a * h; x += v * h; t += h; trace.push([t, x]); if (Math.abs(x - 1) > 0.001 || Math.abs(v) > 0.01) settledAt = t; }
  const dur = settledAt; const res = [];
  for (let i = 0; i <= pts; i++) { const tt = (i / pts) * dur; const s = trace.find((p) => p[0] >= tt) || [0, 0]; res.push(i === pts ? 1 : +s[1].toFixed(4)); }
  res[0] = 0;
  return { dur: Math.round(dur * 1000), css: `linear(${res.join(', ')})` };
}
for (const [n, k, c] of [['weightless', 70, 9], ['buoy', 210, 16], ['tide', 120, 20], ['settle', 320, 26]]) { const s = sample(k, c); console.log(`--ease-${n}: ${s.css}; --dur-${n}: ${s.dur}ms;`); }
