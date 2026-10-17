// Kiln Light — bespoke icon system for Albretsen AS (design 35).
// Grammar: 24px grid, 1.5px stroke, round caps and joins, 2px keyline padding.
// Every glyph carries exactly ONE "glaze" — a small filled form in the seed
// blue (oklch 0.56 0.085 228). It is the object in the room; the strokes are
// the room. Stroke = currentColor, glaze = var(--glaze).
//
//   import { icons, svg } from './icons.js'
//   el.innerHTML = svg('agent', { size: 32 })

const G = 'class="g" fill="var(--glaze, #357e9c)" stroke="none"';

export const icons = {
  // identity
  mark:      `<path d="M5.5 21V10.5a6.5 6.5 0 0 1 13 0V21"/><path d="M5.5 15.5h13"/><circle ${G} cx="13.6" cy="12.4" r="2.1"/>`,
  // what he builds
  app:       `<rect x="6.5" y="2.75" width="11" height="18.5" rx="3"/><path d="M10.5 18h3"/><circle ${G} cx="12" cy="10" r="2.4"/>`,
  saas:      `<path d="M12 4.2 20.5 8.6 12 13 3.5 8.6Z"/><path d="m3.5 12.4 8.5 4.4 8.5-4.4"/><path d="m3.5 16.2 8.5 4.4 8.5-4.4"/><ellipse ${G} cx="12" cy="8.6" rx="2.6" ry="1.35"/>`,
  agent:     `<circle cx="12" cy="12" r="3.4"/><path d="M4.2 15.6A8.5 8.5 0 0 1 15.6 4.2"/><path d="M19.8 8.4A8.5 8.5 0 0 1 8.4 19.8"/><circle ${G} cx="18.6" cy="5.4" r="2"/>`,
  mail:      `<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m3.8 7 8.2 6 8.2-6"/><circle ${G} cx="18.4" cy="6.2" r="2.3"/>`,
  connector: `<path d="M9 3.5v4.5M15 3.5v4.5"/><path d="M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0Z"/><path d="M12 17v3.5"/><circle ${G} cx="12" cy="11.6" r="1.9"/>`,
  knowledge: `<path d="M12 6.5C10 5 7 4.6 3.5 5.2v13c3.5-.6 6.5-.2 8.5 1.3 2-1.5 5-1.9 8.5-1.3v-13C17 4.6 14 5 12 6.5Z"/><path d="M12 6.5v13"/><circle ${G} cx="16.4" cy="10.8" r="1.9"/>`,
  consult:   `<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/><path ${G} d="M12 7.4a5.5 5.5 0 0 1 0 9.2 5.5 5.5 0 0 1 0-9.2Z"/>`,
  // facts and figures
  since:     `<path d="M2.5 18.5h19"/><path d="M5.5 18.5a6.5 6.5 0 0 1 13 0"/><path d="M12 5v2.2M5.2 8.2l1.5 1.5M18.8 8.2l-1.5 1.5"/><circle ${G} cx="12" cy="18.5" r="2.4"/>`,
  launch:    `<path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"/><path d="M12 15V4.5M7.8 8.5 12 4.3l4.2 4.2"/><circle ${G} cx="12" cy="17.6" r="1.8"/>`,
  install:   `<path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"/><path d="M12 3.5V14M7.8 9.8 12 14l4.2-4.2"/><circle ${G} cx="12" cy="17.8" r="1.8"/>`,
  commit:    `<path d="M6 3.5v4M6 11v9.5"/><circle cx="6" cy="9.25" r="1.75"/><path d="M6 11c0 2.2 1.8 3 4.4 3h4.4"/><circle ${G} cx="17.4" cy="14" r="2.6"/>`,
  revenue:   `<path d="M3 20.5h18"/><path d="M4.5 17c3-.5 5-2.2 7-5.6 1.6-2.7 3.4-4.6 6.4-5.4"/><circle ${G} cx="18.6" cy="5.8" r="2.3"/>`,
  norway:    `<path d="m2.5 19.5 6.5-10 3.6 5.4 2.4-3.4 6.5 8Z"/><circle ${G} cx="17.5" cy="5.6" r="2.3"/>`,
  // spark words
  molten:    `<path d="M12 3.2c3.2 4.4 6 7.7 6 11.2a6 6 0 0 1-12 0c0-3.5 2.8-6.8 6-11.2Z"/><path ${G} d="M12 20.4a6 6 0 0 1-5.9-5h11.8a6 6 0 0 1-5.9 5Z"/>`,
  fracture:  `<circle cx="12" cy="12" r="8.5"/><path d="m11 3.6 2.2 5.2-3 3.4 3.4 3-1.6 5.2"/><path ${G} d="M13.2 8.8 20.3 11a8.5 8.5 0 0 1-6.7 9.2l1.6-5-3.4-3Z"/>`,
  clarity:   `<path d="M12 3.5 21 19.5H3Z"/><path d="M1.5 12.8 9.6 11.5"/><path d="m14.6 11.2 7.9-1.6"/><path ${G} d="M12 9.6 15.6 16H8.4Z"/>`,
  // interface
  'sound-on':  `<path d="M4 9.5h3.2L12 5.2v13.6l-4.8-4.3H4Z"/><path d="M15.4 9a4.2 4.2 0 0 1 0 6"/><path d="M18 6.4a8 8 0 0 1 0 11.2"/><circle ${G} cx="7.4" cy="12" r="1.5"/>`,
  'sound-off': `<path d="M4 9.5h3.2L12 5.2v13.6l-4.8-4.3H4Z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/><circle ${G} cx="7.4" cy="12" r="1.5"/>`,
  arrow:     `<path d="M4 12h15"/><path d="m13.5 6.5 5.5 5.5-5.5 5.5"/><circle ${G} cx="4.6" cy="12" r="1.9"/>`,
  external:  `<path d="M7 17 17 7"/><path d="M9 7h8v8"/><circle ${G} cx="6.6" cy="17.4" r="1.9"/>`,
  plus:      `<path d="M12 4.5v15M4.5 12h15"/><circle ${G} cx="12" cy="12" r="2.2"/>`,
  close:     `<path d="m6 6 12 12M18 6 6 18"/><circle ${G} cx="12" cy="12" r="2"/>`,
  chevron:   `<path d="m6 9.5 6 6 6-6"/><circle ${G} cx="12" cy="15.5" r="1.7"/>`,
  copy:      `<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 5.6V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h.6"/><circle ${G} cx="14.5" cy="14.5" r="2"/>`,
  terminal:  `<rect x="2.5" y="4" width="19" height="16" rx="3"/><path d="m6.5 9.5 3 2.5-3 2.5"/><path d="M12 15h5"/><circle ${G} cx="18.2" cy="7.2" r="1.3"/>`,
  // retired products (stand-ins; no surviving brand assets)
  polyglot:  `<path d="M3.5 5.5h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8l-3.5 3v-3h-1Z"/><path d="M15.5 9.5h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v2.6l-3-2.6h-4a2 2 0 0 1-2-2v-2"/><circle ${G} cx="9" cy="10" r="1.9"/>`,
  pinpoint:  `<rect x="2.5" y="6" width="19" height="14" rx="2.5"/><path d="m2.8 17.2 5-4.6 4 3.4 3.2-2.6 6.2 5"/><path d="M15.5 2.5a3 3 0 0 1 3 3c0 2.2-3 4.6-3 4.6s-3-2.4-3-4.6a3 3 0 0 1 3-3Z"/><circle ${G} cx="15.5" cy="5.5" r="1.1"/>`,
  webvakt:   `<rect x="2.5" y="4" width="19" height="16" rx="3"/><path d="M2.5 8.5h19"/><path d="M6.5 14.3c1.5-2 3.4-3 5.5-3s4 1 5.5 3c-1.5 2-3.4 3-5.5 3s-4-1-5.5-3Z"/><circle ${G} cx="12" cy="14.3" r="1.6"/>`,
  jokes:     `<circle cx="12" cy="12" r="8.5"/><path d="M8 14c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4"/><path d="M8.6 9.6h.01M15.4 9.6h.01"/><circle ${G} cx="15.4" cy="9.6" r="1.4"/>`,
  hiring:    `<path d="M12 3 19.5 6v5.6c0 4.4-3.2 8-7.5 9.4-4.3-1.4-7.5-5-7.5-9.4V6Z"/><path d="m8.6 12 2.4 2.4 4.4-4.6"/><circle ${G} cx="12" cy="6.4" r="1.3"/>`,
  calculator:`<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8 6.5h8"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M8.5 18h.01M12 18h.01"/><path ${G} d="M14.3 13.6h2.4v5.2h-2.4Z"/>`,
};

export const groups = {
  identity: ['mark'],
  building: ['app', 'saas', 'agent', 'mail', 'connector', 'knowledge', 'consult'],
  figures: ['since', 'launch', 'install', 'commit', 'revenue', 'norway'],
  spark: ['molten', 'fracture', 'clarity'],
  interface: ['sound-on', 'sound-off', 'arrow', 'external', 'plus', 'close', 'chevron', 'copy', 'terminal'],
  retired: ['polyglot', 'pinpoint', 'webvakt', 'jokes', 'hiring', 'calculator'],
};

export function svg(name, { size = 24, stroke = 1.5, title } = {}) {
  const body = icons[name];
  if (!body) throw new Error('unknown icon ' + name);
  const t = title ? `<title>${title}</title>` : '';
  const aria = title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" ${aria}>${t}${body}</svg>`;
}
