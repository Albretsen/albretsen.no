// Live screens on the four product landmarks: a 512 x 288 canvas per product,
// drawn with the real logo, the figure from content.js and the latest events.
import * as THREE from 'three';
import { content } from '../../_shared/content.js';

const LOGOS = {
  'mcp-emails': '../_shared/products/mcp-emails/logo-mark.svg',
  'fun-libs': '../_shared/products/fun-libs/icon.png',
  'toolrails': '../_shared/products/toolrails/icon.svg',
  'harbor': '../_shared/products/harbor/harbor-mark.svg',
};
export const STATUS = { live: 'Live', building: 'Being built', paused: 'Paused', retired: 'Retired' };
const STATUS_COL = { live: '#8fd3a6', building: '#f0c35a', paused: '#c8b6e2', retired: '#8d9bb4' };
const imgs = {};
for (const [id, src] of Object.entries(LOGOS)) {
  const im = new Image(); im.decoding = 'async';
  im.src = new URL(src, document.baseURI).href; imgs[id] = im;
}

export function ago(t) {
  const s = Math.max(0, (Date.now() - new Date(t).getTime()) / 1000);
  if (s < 50) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

export function createScreen(id) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 288;
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false; texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  const p = content.products.find((q) => q.id === id);
  const ctx = canvas.getContext('2d');
  let lastKey = '';

  function draw({ events = [], mode = 'demo', hot = 0, clock = 0 } = {}) {
    const key = events.slice(0, 3).map((e) => e.id).join() + mode + Math.round(hot * 4) + Math.floor(clock / 1.2) % 2 + (imgs[id].complete ? 1 : 0) + (document.fonts?.status || '');
    if (key === lastKey) return;
    lastKey = key;
    const W = 512, H = 288;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#232c57'); g.addColorStop(1, '#151a3c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // header
    const im = imgs[id];
    if (im.complete && im.naturalWidth) {
      ctx.save(); ctx.beginPath(); ctx.roundRect(24, 22, 44, 44, 10); ctx.clip();
      if (id === 'harbor' || id === 'mcp-emails') { ctx.fillStyle = '#f4eadb'; ctx.fillRect(24, 22, 44, 44); ctx.drawImage(im, 30, 28, 32, 32); }
      else ctx.drawImage(im, 24, 22, 44, 44);
      ctx.restore();
    }
    ctx.fillStyle = '#f4eadb';
    ctx.font = '30px Federo, Georgia, serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.name, 82, 45);
    // status pill
    const st = STATUS[p.status];
    ctx.font = '600 15px "Instrument Sans", system-ui, sans-serif';
    const tw = ctx.measureText(st).width;
    ctx.fillStyle = 'rgba(244,234,219,.1)'; ctx.beginPath(); ctx.roundRect(W - 24 - tw - 34, 30, tw + 34, 30, 15); ctx.fill();
    ctx.fillStyle = STATUS_COL[p.status];
    const blink = p.status === 'live' ? (Math.floor(clock / 1.2) % 2 ? 1 : 0.35) : 1;
    ctx.globalAlpha = blink; ctx.beginPath(); ctx.arc(W - 24 - tw - 18, 45, 5, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#f4eadb'; ctx.fillText(st, W - 24 - tw - 8, 46);
    // figure
    if (p.figure) {
      ctx.font = '84px "Poiret One", Georgia, serif';
      ctx.fillStyle = '#ffd27a';
      ctx.fillText(p.figure.value, 22, 128);
      const fw = ctx.measureText(p.figure.value).width;
      ctx.font = '500 20px "Instrument Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(244,234,219,.75)';
      ctx.fillText(p.figure.label, 34 + fw, 146);
    }
    ctx.font = '17px "Instrument Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(244,234,219,.82)';
    ctx.fillText(p.line, 26, 190);
    // event ticker
    ctx.fillStyle = 'rgba(244,234,219,.07)'; ctx.fillRect(0, 214, W, 74);
    const mine = events.filter((e) => e.product === id);
    const e = mine[0];
    ctx.font = '600 12px "Instrument Sans", system-ui, sans-serif';
    ctx.fillStyle = mode === 'live' ? '#8fd3a6' : 'rgba(244,234,219,.5)';
    ctx.fillText(mode === 'live' ? 'LATEST EVENT' : 'DEMO EVENT (NO LIVE DATA YET)', 26, 234);
    ctx.font = '17px "Instrument Sans", system-ui, sans-serif';
    ctx.fillStyle = '#f4eadb';
    if (e) {
      const t = `${e.text}${e.country ? ' · ' + e.country : ''}${e.ms ? ' · ' + e.ms + ' ms' : ''}`;
      ctx.fillText(t.length > 46 ? t.slice(0, 45) + '…' : t, 26, 262);
      ctx.fillStyle = 'rgba(244,234,219,.55)'; ctx.textAlign = 'right';
      ctx.fillText(ago(e.time), W - 24, 262); ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = 'rgba(244,234,219,.6)';
      ctx.fillText(p.facts ? p.facts.join(' · ') : new URL(p.url).hostname, 26, 262);
    }
    // a scanline sheen when you are close
    if (hot > 0) { ctx.fillStyle = `rgba(255,210,122,${0.06 * hot})`; ctx.fillRect(0, 0, W, H); }
    texture.needsUpdate = true;
  }
  draw();
  return { canvas, texture, draw };
}
