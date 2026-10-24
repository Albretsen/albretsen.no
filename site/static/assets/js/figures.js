// Live product figures. Pages ship the build-time figure; this swaps in the
// latest one from /api/figures when there is one, and stays quiet otherwise.
const text = (f) => `${typeof f.value === 'number' ? f.value.toLocaleString('en-US') : f.value}${f.unit ? ' ' + f.unit : ''}`;
export function apply(f) {
  for (const el of document.querySelectorAll(`[data-figure="${f.product}"]`)) {
    const v = text(f), label = el.lastElementChild;
    if (el.firstChild && el.firstChild.textContent !== v) el.firstChild.textContent = v;
    if (label && f.label && label.textContent !== f.label) label.textContent = f.label;
  }
}
try {
  const r = await fetch('/api/figures', { headers: { accept: 'application/json' } });
  if (r.ok) for (const [product, f] of Object.entries((await r.json()).figures || {})) apply({ product, ...f });
} catch { /* no store: keep the build-time figures */ }
