// Product data for the sim. Facts come from ../_shared/content.js and are never changed here;
// this file only adds where each product stands in the town and how the card reads.
import { content } from '../../_shared/content.js';

export { content };
const byId = Object.fromEntries(content.products.map((p) => [p.id, p]));

// Where each product lives. `find` picks a building from the seeded town (kit piece, x, row);
// `landmark` replaces it with one of the four product landmarks from the props library.
export const PLACES = {
  // the two live products and the one being built stand on the coast road, in the front row, scaled up a little
  'fun-libs':        { find: ['med_house_gable', -27.1, 0], landmark: 'lm_funlibs', scale: 1.3, building: 'A games arcade on the coast road, next to the café, with the Fun Libs marquee on the roof.' },
  'mcp-emails':      { find: ['med_cube_small', 20.8, 0], landmark: 'lm_mcpemails', scale: 1.25, dx: 1.0, building: 'A post office on the coast road. Its screen shows the live figure.' },
  'toolrails':       { find: ['med_house_gable', 30.8, 0], landmark: 'lm_toolrails', scale: 1.18, dx: 0.4, building: 'A workshop with rails running out of the door. Still being fitted out.' },
  'harbor':          { find: ['med_tower_house', -8.7, 1], landmark: 'lm_harbor', scale: 1.2, building: 'A library and archive behind the café. Paused, so only the sign stays lit.' },
  'early-apps':      { find: [['med_house_gable_mustard', -46.1, 0], ['med_house_gable', -37.3, 0], ['med_villa_tiled', -34, 1]],
                       names: ['IAGO HMS', 'Rentekalkulator', 'Prosentkalkulator'], building: 'Three houses at the west end of town, one per app.' },
  'tryggere-hyring': { find: ['paris_narrow', -2.5, 2], building: 'A narrow Paris block on the middle terrace.' },
  'webvakt':         { find: ['med_tower_house', 21.3, 1], building: 'A house with a lookout tower, for a product that watched websites.' },
  'joke-central':    { find: ['med_villa_tiled', -14, 3], building: 'A tiled villa on the upper terrace, with a view over the rooftops.' },
  'polyglot-pilot':  { find: ['paris_rotunda', -25, 2], building: 'The corner rotunda with the zinc dome.' },
  'pinpoint':        { find: ['med_tower_house', -25.1, 3], building: 'A tower house with a view in every direction.' },
  'luma':            { find: ['paris_powder', 30, 2], building: 'A powder-blue Paris block.' },
};

export const STATUS_LABEL = { live: 'Live', building: 'Being built', paused: 'Paused', retired: 'Retired' };

export const PRODUCTS = content.products.map((p) => ({ ...p, place: PLACES[p.id] }));
export const product = (id) => byId[id];

// The years axis. 2016 .. 2026 are calendar years; TODAY is one more stop after 2026,
// where products take their current status (retired shutters close, the paused one dims).
export const Y0 = content.history.playDeveloperSince; // 2016
export const Y1 = 2026;
// Internal year value V: the stop for year y is V = y + 1 (the end of that year); TODAY is one stop later.
export const TODAY = Y1 + 2;
export const stopOf = (y) => y + 1;

const names = (y) => PRODUCTS.filter((p) => p.since === y).map((p) => p.name);
export function yearCaption(y) {
  const out = [];
  if (y === content.history.playDeveloperSince) out.push('On Google Play since 2016');
  if (y === content.history.consultingSince) out.push('Consulting since 2021');
  if (y === content.history.companySince) out.push('Albretsen AS founded');
  const n = names(y);
  if (n.length) out.push('Opened: ' + n.join(', ').replace('IAGO HMS, Rentekalkulator, Prosentkalkulator', 'the early apps'));
  return out;
}
export function todayCaption() {
  const by = (s) => PRODUCTS.filter((p) => p.status === s);
  return [
    `Live: ${by('live').map((p) => p.name).join(', ')}`,
    `Being built: ${by('building').map((p) => p.name).join(', ')} · Paused: ${by('paused').map((p) => p.name).join(', ')}`,
    `${by('retired').length} retired, shutters closed`,
  ];
}
export const counts = () => {
  const c = { live: 0, building: 0, paused: 0, retired: 0 };
  for (const p of PRODUCTS) c[p.status]++;
  return c;
};

// Real product marks (unchanged, from _shared/products). Retired products without surviving marks get none.
export const LOGOS = {
  'mcp-emails': '../_shared/products/mcp-emails/logo-mark.svg',
  'fun-libs': '../_shared/products/fun-libs/icon.png',
  toolrails: '../_shared/products/toolrails/icon.svg',
  harbor: '../_shared/products/harbor/harbor-mark.svg',
  luma: '../_shared/products/luma/luma-monogram.svg',
};
