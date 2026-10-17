// <drag-room> — "drag to rearrange anything". Children with [data-drag] are positioned by their
// base-centre in % of the room (data-x, data-y) and can be picked up, moved and dropped.
// Pick-up lifts and tilts with pointer velocity; drop springs down and snaps to the room's
// 320-wide pixel grid. Depth sorts by y (lower = nearer). Arrow keys nudge a focused object.
// Positions persist per viewer in localStorage (best effort).
//
//   <drag-room ratio="2560/1761" store="prism-room">
//     <img data-drag data-x="88.4" data-y="62.4" data-w="11.2" src="products/sprite-mcp-emails.png" alt="MCP Emails">
//   </drag-room>

const GRID = 320; // the room is 320 "pixels" wide, same as hero/room-pixel-320.png
const REST = 'drop-shadow(0 4px 5px rgba(22,12,33,.45))';

class DragRoom extends HTMLElement {
  connectedCallback() {
    this.style.display = 'block'; this.style.touchAction = 'pan-y';
    if (getComputedStyle(this).position === 'static') { this.style.position = 'relative'; this.style.aspectRatio = this.getAttribute('ratio') || '16/9'; }
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('drag-room:' + this.getAttribute('store')) || '{}'); } catch {}
    this.items = [...this.querySelectorAll('[data-drag]')];
    this.items.forEach((el, i) => {
      const id = el.dataset.id || el.getAttribute('alt') || 'i' + i;
      const p = saved[id] || [+el.dataset.x, +el.dataset.y];
      Object.assign(el.dataset, { id, x: p[0], y: p[1] });
      el.tabIndex = 0; el.draggable = false;
      el.setAttribute('aria-roledescription', 'movable object');
      el.style.cssText += `;position:absolute;width:${el.dataset.w}%;height:auto;transform-origin:50% 100%;cursor:grab;
        image-rendering:pixelated;filter:${REST};user-select:none;-webkit-user-drag:none;will-change:transform;
        transition:transform .5s cubic-bezier(.2,1.4,.4,1),filter .3s`;
      this._place(el);
      el.addEventListener('pointerdown', e => this._down(e, el));
      el.addEventListener('keydown', e => this._key(e, el));
    });
  }
  _place(el) {
    const x = +el.dataset.x, y = +el.dataset.y;
    el.style.left = `calc(${x}% - ${el.dataset.w / 2}%)`;
    el.style.bottom = `${100 - y}%`;
    el.style.zIndex = Math.round(y * 10);
  }
  _snap(v) { return Math.round(v / 100 * GRID) / GRID * 100; }
  _down(e, el) {
    e.preventDefault(); el.setPointerCapture(e.pointerId);
    const r = this.getBoundingClientRect();
    const start = [e.clientX, e.clientY], from = [+el.dataset.x, +el.dataset.y];
    let last = e.clientX, vx = 0;
    el.style.transition = 'filter .3s'; el.style.cursor = 'grabbing'; el.style.zIndex = 9999;
    el.style.filter = 'drop-shadow(0 18px 14px rgba(22,12,33,.45))';
    const move = ev => {
      vx = vx * .7 + (ev.clientX - last) * .3; last = ev.clientX;
      el.dataset.x = Math.max(0, Math.min(100, from[0] + (ev.clientX - start[0]) / r.width * 100));
      el.dataset.y = Math.max(8, Math.min(100, from[1] + (ev.clientY - start[1]) / r.height * 100));
      this._place(el); el.style.zIndex = 9999;
      el.style.transform = `translateY(-10px) scale(1.06) rotate(${Math.max(-12, Math.min(12, vx * .9))}deg)`;
    };
    const up = () => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      el.dataset.x = this._snap(+el.dataset.x); el.dataset.y = this._snap(+el.dataset.y);
      el.style.transition = 'transform .55s cubic-bezier(.2,1.6,.4,1),filter .4s';
      el.style.transform = ''; el.style.filter = REST; el.style.cursor = 'grab';
      this._place(el); this._save();
      this.dispatchEvent(new CustomEvent('arrange', { detail: { id: el.dataset.id, x: +el.dataset.x, y: +el.dataset.y } }));
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
  _key(e, el) {
    const step = 100 / GRID * (e.shiftKey ? 8 : 1), m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!m) return; e.preventDefault();
    el.dataset.x = +el.dataset.x + m[0] * step; el.dataset.y = +el.dataset.y + m[1] * step; this._place(el); this._save();
  }
  _save() {
    const o = {}; this.items.forEach(el => o[el.dataset.id] = [+el.dataset.x, +el.dataset.y]);
    try { localStorage.setItem('drag-room:' + this.getAttribute('store'), JSON.stringify(o)); } catch {}
  }
  reset() { try { localStorage.removeItem('drag-room:' + this.getAttribute('store')); } catch {} location.reload(); }
}
customElements.define('drag-room', DragRoom);
export { DragRoom };
