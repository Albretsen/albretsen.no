// Honest Deck — keyboard shortcuts with a visible cheat sheet (the signature delight).
// Pattern: "?" opens a sheet, as on GitHub and Linear (https://linear.app/changelog/2021-03-25-keyboard-shortcuts-help).
// The sheet is a dealt card, keys are candy keycaps (extras/keycaps.svg look, rebuilt in CSS as .hd-key),
// and every fired shortcut sends an echo pulse from its keycap. A small persistent "?" chip makes it discoverable.
//
//   import { shortcuts } from './shortcuts.js'
//   const sc = shortcuts([{ key: 'd', label: 'Deal the deck', run: () => deck.deal() }, ...])
//
// Ignores keys while typing in inputs, and any key with Ctrl/Cmd/Alt held.
import { animate } from 'https://cdn.jsdelivr.net/npm/motion@12.23.28/+esm';
import { ping } from './motion.js';

const KEY_COLORS = ['var(--hd-apple)', 'var(--hd-bubble)', 'var(--hd-ice)', 'var(--hd-lilac)', 'var(--hd-tang)', 'var(--hd-lemon)'];

export function shortcuts(list, { title = 'House rules', note = 'Press ? any time. Esc closes.' } = {}) {
  const all = [...list, { key: '?', label: 'Show or hide this sheet', run: () => toggle() }];
  const sheet = document.createElement('div');
  sheet.className = 'hd-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'false');
  sheet.setAttribute('aria-label', 'Keyboard shortcuts');
  sheet.hidden = true;
  sheet.innerHTML = `
    <div class="hd-sheet__card">
      <div class="hd-sheet__head"><span class="hd-sheet__idx">??</span><strong>${title}</strong><span class="hd-sheet__suit" aria-hidden="true"></span></div>
      <ul>${all.map((s, i) => `<li><kbd class="hd-key hd-echo" data-k="${s.key}" style="--key:${KEY_COLORS[i % KEY_COLORS.length]}">${s.key === 'Escape' ? 'esc' : s.key}</kbd><span>${s.label}</span></li>`).join('')}</ul>
      <p>${note}</p>
    </div>`;
  const chip = document.createElement('button');
  chip.className = 'hd-key hd-echo hd-sheet__chip';
  chip.style.setProperty('--key', 'var(--hd-lemon)');
  chip.type = 'button';
  chip.textContent = '?';
  chip.setAttribute('aria-label', 'Keyboard shortcuts');
  chip.addEventListener('click', () => toggle());
  document.body.append(sheet, chip);

  let open = false;
  function toggle(force) {
    open = force ?? !open;
    if (open) {
      sheet.hidden = false;
      animate(sheet.firstElementChild, { opacity: [0, 1], transform: ['translateY(40px) rotate(-6deg) rotateY(90deg)', 'translateY(0) rotate(-1.5deg) rotateY(0deg)'] },
        { type: 'spring', stiffness: 220, damping: 20 });
    } else {
      animate(sheet.firstElementChild, { opacity: 0, transform: 'translateY(30px) rotate(4deg) rotateY(-70deg)' }, { duration: 0.22 })
        .then(() => { if (!open) sheet.hidden = true; });
    }
  }
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === 'Escape' && open) { toggle(false); return; }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const s = all.find((x) => x.key.toLowerCase() === k);
    if (!s) return;
    e.preventDefault();
    s.run(e);
    sheet.querySelectorAll(`[data-k="${CSS.escape(s.key)}"]`).forEach((el) => { el.classList.add('is-down'); setTimeout(() => el.classList.remove('is-down'), 120); ping(el); });
    if (s.key !== '?') ping(chip);
  }
  addEventListener('keydown', onKey);
  return { toggle, destroy() { removeEventListener('keydown', onKey); sheet.remove(); chip.remove(); } };
}

// Styles live here so the module is drop-in. Uses tokens from motion.css.
const css = `
.hd-sheet{position:fixed;inset:auto 24px 88px auto;z-index:50;perspective:1200px}
.hd-sheet__card{width:min(360px,calc(100vw - 48px));padding:22px 22px 18px;border-radius:22px;background:
  radial-gradient(120% 80% at 100% 0%,color-mix(in oklch,var(--hd-lemon) 70%,transparent),transparent 60%),
  radial-gradient(90% 70% at 0% 100%,color-mix(in oklch,var(--hd-bubble) 55%,transparent),transparent 60%),var(--hd-cream);
  color:var(--hd-night);border:2px solid var(--hd-night);box-shadow:8px 10px 0 var(--hd-night),0 30px 80px rgba(16,8,29,.35);transform:rotate(-1.5deg)}
.hd-sheet__head{display:flex;align-items:center;gap:10px;font:800 18px/1 Unbounded,sans-serif;margin-bottom:14px}
.hd-sheet__idx{font:600 13px/1 "Martian Mono",monospace;opacity:.6}
.hd-sheet ul{list-style:none;margin:0;padding:0;display:grid;gap:9px}
.hd-sheet li{display:flex;align-items:center;gap:12px;font:500 13px/1.3 "Martian Mono",monospace}
.hd-sheet p{margin:14px 0 0;font:500 11px/1.4 "Martian Mono",monospace;opacity:.6}
.hd-sheet__chip{position:fixed;right:24px;bottom:24px;z-index:51;cursor:pointer;font-size:1rem;width:44px;height:44px}
`;
const st = document.createElement('style'); st.textContent = css; document.head.append(st);
