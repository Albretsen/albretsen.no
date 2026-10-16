// Darkfield keyboard layer + visible cheat sheet (the signature delight of design 44).
// Built on <dialog> so focus trap, Esc and the backdrop come free. "?" toggles it; it is
// suppressed while typing. A persistent keycap hint sits bottom-right so the layer is discoverable.
//
//   import { createShortcuts } from './assets/shortcuts.js'
//   const keys = createShortcuts({ groups: DEFAULT_GROUPS, on: { 'zoom-in': () => ..., ... } })
//   keys.open(); keys.close(); keys.destroy()

export const DEFAULT_GROUPS = [
  { title: 'Canvas', items: [
    { id: 'pan', keys: ['←', '↑', '→', '↓'], label: 'Pan the slide' },
    { id: 'zoom-in', keys: ['+'], label: 'Magnify' },
    { id: 'zoom-out', keys: ['−'], label: 'Reduce' },
    { id: 'fit', keys: ['0'], label: 'Whole slide in view' },
    { id: 'goto', keys: ['1', '…', '9'], label: 'Go to a specimen' },
    { id: 'next', keys: ['.'], alt: [','], label: 'Next / previous place' },
  ] },
  { title: 'Specimen', items: [
    { id: 'signal', keys: ['Space'], label: 'Send a signal' },
    { id: 'home', keys: ['H'], label: 'Back to the stone' },
    { id: 'open', keys: ['↵'], label: 'Open the product' },
  ] },
  { title: 'Albretsen', items: [
    { id: 'copy-mcp', keys: ['C'], label: 'Copy the MCP command' },
    { id: 'mail', keys: ['M'], label: 'Write to Asgeir' },
    { id: 'grain', keys: ['G'], label: 'Film grain on / off' },
    { id: 'help', keys: ['?'], label: 'This sheet' },
  ] },
];
const KEYMAP = { ArrowLeft: 'pan', ArrowRight: 'pan', ArrowUp: 'pan', ArrowDown: 'pan', '+': 'zoom-in', '=': 'zoom-in', '-': 'zoom-out', '−': 'zoom-out', '0': 'fit', '.': 'next', ',': 'prev', ' ': 'signal', h: 'home', Enter: 'open', c: 'copy-mcp', m: 'mail', g: 'grain', '?': 'help' };

const CSS = `
.dfk-hint{position:fixed;right:20px;bottom:20px;z-index:60;display:flex;align-items:center;gap:10px;font:500 11px/1 'Geist Mono',ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#bd8e53;background:rgba(20,16,10,.72);border:1px solid #3b3124;border-radius:999px;padding:8px 14px 8px 8px;cursor:pointer;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:border-color .4s,color .4s}
.dfk-hint:hover,.dfk-hint:focus-visible{color:#fae0c1;border-color:#bd8e53;outline:none}
.dfk-cap{display:inline-grid;place-items:center;min-width:26px;height:26px;padding:0 7px;box-sizing:border-box;font:500 12px/1 'Geist Mono',ui-monospace,monospace;letter-spacing:0;text-transform:none;color:#fae0c1;border-radius:7px;background:linear-gradient(180deg,#2b2219,#17120c);border:1px solid #4a3d2c;box-shadow:inset 0 1px 0 rgba(250,224,193,.12),0 2px 0 #0b0805,0 3px 8px rgba(0,0,0,.4)}
.dfk-cap.is-down{transform:translateY(2px);box-shadow:inset 0 1px 0 rgba(250,224,193,.12),0 0 0 #0b0805;color:#f0b871;border-color:#bd8e53}
.dfk-sheet{border:0;padding:0;background:transparent;max-width:min(760px,calc(100vw - 32px));width:100%;color:#fae0c1}
.dfk-sheet:focus,.dfk-sheet:focus-visible{outline:none}
.dfk-sheet::backdrop{background:rgba(11,8,5,.62);backdrop-filter:blur(6px) saturate(.8);-webkit-backdrop-filter:blur(6px)}
.dfk-panel{position:relative;background:radial-gradient(120% 90% at 50% 0%,#241c13 0%,#14100a 60%);border:1px solid #3b3124;border-radius:22px;padding:34px 36px 28px;box-shadow:0 40px 120px rgba(0,0,0,.6),inset 0 1px 0 rgba(250,224,193,.06);overflow:hidden}
.dfk-panel::before{content:"";position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='41.57'%3E%3Cg fill='%23bd8e53' fill-opacity='.16'%3E%3Ccircle r='1.3'/%3E%3Ccircle cx='24' r='1.3'/%3E%3Ccircle cy='41.57' r='1.3'/%3E%3Ccircle cx='24' cy='41.57' r='1.3'/%3E%3Ccircle cx='12' cy='20.78' r='1.3'/%3E%3C/g%3E%3C/svg%3E");mask-image:radial-gradient(80% 60% at 100% 0%,#000,transparent);pointer-events:none}
.dfk-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:22px;position:relative}
.dfk-head h2{margin:0;font:400 34px/1 'Instrument Serif',Georgia,serif;letter-spacing:-.005em}
.dfk-head h2 em{color:#bd8e53}
.dfk-head p{margin:0;font:400 11px/1 'Geist Mono',ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#735836}
.dfk-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;position:relative}
@media (max-width:640px){.dfk-grid{grid-template-columns:1fr}.dfk-panel{padding:26px 20px}}
.dfk-grid h3{margin:0 0 12px;font:500 10.5px/1 'Geist Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#bd8e53;padding-bottom:10px;border-bottom:1px solid #3b3124}
.dfk-grid ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.dfk-grid li{display:flex;justify-content:space-between;align-items:center;gap:12px;font:400 15px/1.2 'Instrument Serif',Georgia,serif;color:#e9cfae}
.dfk-grid li span.k{display:flex;gap:4px;flex-shrink:0}
.dfk-grid li.is-hit{color:#f0b871}
.dfk-foot{margin-top:24px;display:flex;justify-content:space-between;font:400 10.5px/1 'Geist Mono',ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#735836;position:relative}
.dfk-sheet[open] .dfk-panel{animation:dfk-in .7s cubic-bezier(.16,1,.3,1) both}
.dfk-sheet[open] li{animation:dfk-li .8s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(var(--i)*28ms + 120ms)}
@keyframes dfk-in{from{opacity:0;transform:scale(1.03);filter:blur(10px)}to{opacity:1;transform:none;filter:none}}
@keyframes dfk-li{from{opacity:0;filter:blur(6px);transform:translateY(4px)}to{opacity:1;filter:none;transform:none}}
@media (prefers-reduced-motion:reduce){.dfk-sheet[open] .dfk-panel,.dfk-sheet[open] li{animation:none}}
`;

export function createShortcuts({ groups = DEFAULT_GROUPS, on = {}, hint = true, root = document.body } = {}) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.append(style);
  const dlg = document.createElement('dialog'); dlg.className = 'dfk-sheet'; dlg.setAttribute('aria-label', 'Keyboard shortcuts');
  let i = 0;
  const cap = (k) => `<kbd class="dfk-cap">${k}</kbd>`;
  dlg.innerHTML = `<div class="dfk-panel"><div class="dfk-head"><h2>Keys to the <em>slide</em></h2><p>Esc to close</p></div><div class="dfk-grid">${groups.map((g) => `<section><h3>${g.title}</h3><ul>${g.items.map((it) => `<li data-id="${it.id}" style="--i:${i++}">${it.label}<span class="k">${it.keys.map(cap).join('')}${it.alt ? it.alt.map(cap).join('') : ''}</span></li>`).join('')}</ul></section>`).join('')}</div><div class="dfk-foot"><span>Albretsen AS</span><span>Slide no. 44</span></div></div>`;
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  root.append(dlg);
  let btn;
  if (hint) {
    btn = document.createElement('button'); btn.className = 'dfk-hint'; btn.type = 'button';
    btn.innerHTML = `${cap('?')}Keys`; btn.setAttribute('aria-haspopup', 'dialog');
    btn.addEventListener('click', () => toggle()); root.append(btn);
  }
  function toggle(force) { const want = force ?? !dlg.open; if (want && !dlg.open) dlg.showModal(); else if (!want && dlg.open) dlg.close(); }
  function flash(id) {
    const li = dlg.querySelector(`li[data-id="${id}"]`); if (!li) return;
    li.classList.add('is-hit'); li.querySelectorAll('.dfk-cap').forEach((c) => c.classList.add('is-down'));
    setTimeout(() => { li.classList.remove('is-hit'); li.querySelectorAll('.dfk-cap').forEach((c) => c.classList.remove('is-down')); }, 220);
  }
  function onKey(e) {
    const t = e.target;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === '?' || (e.key === '/' && e.shiftKey)) { e.preventDefault(); toggle(); return; }
    if (/^[1-9]$/.test(k)) { flash('goto'); on.goto?.(+k, e); return; }
    const id = KEYMAP[k] ?? KEYMAP[e.key];
    if (!id) return;
    if (id === 'pan' || id === 'signal') e.preventDefault();
    flash(id === 'prev' ? 'next' : id);
    on[id]?.(e);
    if (btn && id !== 'help') { btn.querySelector('.dfk-cap').classList.add('is-down'); setTimeout(() => btn.querySelector('.dfk-cap').classList.remove('is-down'), 160); }
  }
  addEventListener('keydown', onKey);
  return { open: () => toggle(true), close: () => toggle(false), toggle, dialog: dlg, destroy() { removeEventListener('keydown', onKey); dlg.remove(); btn?.remove(); style.remove(); } };
}
