import fs from 'fs';
const W = 1600, H = 900, out = process.argv[2];
const field = (x, y) => {
  const a = 0.55 * Math.sin(x * 0.0042 + y * 0.0031) + 0.35 * Math.sin(y * 0.0093 - x * 0.0017 + 1.3) + 0.18 * Math.cos(x * 0.011 + 2.1);
  return [Math.cos(a), Math.sin(a)];
};
const lines = [];
for (let i = 0; i < 42; i++) {
  let x = -40, y = -120 + i * (H + 240) / 42; const pts = [[x, y]];
  for (let s = 0; s < 900 && x < W + 40; s++) { const [dx, dy] = field(x, y); x += dx * 3; y += dy * 3; if (s % 6 === 0) pts.push([x, y]); }
  pts.push([x, y]);
  const d = pts.map((p, j) => (j ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  const op = (0.18 + 0.5 * Math.pow(Math.sin((i / 42) * Math.PI), 2)).toFixed(2);
  lines.push(`<path d="${d}" stroke-opacity="${op}"${i % 7 === 3 ? ' stroke-width="1.6"' : ''}/>`);
}
fs.writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <!-- Albretsen 45 "Drift": streamlines of a slow current. Uses currentColor so it can be tinted with CSS colour. -->
  <g fill="none" stroke="currentColor" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round">
  ${lines.join('\n  ')}
  </g>
</svg>
`);
console.log('ok', fs.statSync(out).size);
