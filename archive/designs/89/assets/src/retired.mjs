// Hand-drawn 16x16 pixel stand-ins for retired products that have no surviving brand assets.
// node designs/89/assets/src/retired.mjs  -> ../retired/<id>.svg
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'retired');
fs.mkdirSync(dir, { recursive: true });
const C = { k: '#160c21', u: '#572953', p: '#fff5ea', f: '#e8d8e6', o: '#ff9a7d', O: '#ee6b47', g: '#ff99c2', l: '#bea6eb', m: '#8deaca', y: '#faea89', s: '#86cbf3' };

const ICONS = {
  'pinpoint': [ // a map pin holding a tiny photo
    '......kkkk......',
    '....kkggggkk....',
    '...kggggggggk...',
    '..kggkkkkkkggk..',
    '..kggkssyskggk..',
    '..kggksmmskggk..',
    '..kggkmmmmkggk..',
    '..kggkkkkkkggk..',
    '...kggggggggk...',
    '...kggggggggk...',
    '....kggggggk....',
    '.....kggggk.....',
    '......kggk......',
    '.......kk.......',
    '....uuuuuuuu....',
    '................'],
  'webvakt': [ // a watching eye over a page
    '................',
    '..kkkkkkkkkkkk..',
    '..kppppppppppk..',
    '..kpffffffffpk..',
    '..kppppppppppk..',
    '..kpkkkkkkkkpk..',
    '..kkppppppppkk..',
    '.kpppkkkkkkpppk.',
    'kpppkssssssk ppk',
    'kppkssskksssk pk',
    'kppkssskksssk pk',
    'kpppkssssssk ppk',
    '.kpppkkkkkkpppk.',
    '..kkppppppppkk..',
    '....kkkkkkkk....',
    '................'],
  'joke-central': [ // a grinning speech bubble
    '................',
    '..kkkkkkkkkkkk..',
    '.kyyyyyyyyyyyyk.',
    '.kyyyyyyyyyyyyk.',
    '.kyyykyyyykyyyk.',
    '.kyyykyyyykyyyk.',
    '.kyyyyyyyyyyyyk.',
    '.kyykyyyyyykyyk.',
    '.kyyykkkkkkyyyk.',
    '.kyyyyOOOOyyyyk.',
    '.kyyyyyyyyyyyyk.',
    '..kkkkyykkkkkk..',
    '.....kyyk.......',
    '.....kyk........',
    '.....kk.........',
    '................'],
  'polyglot-pilot': [ // two overlapping speech bubbles, two scripts
    '................',
    '.kkkkkkkkk......',
    'klllllllllk.....',
    'kllkkkkklllk....',
    'klllllllllk.....',
    'kllkkkkllkkkkkk.',
    'klllllllkmmmmmmk',
    '.kkklkkkkmmkkmmk',
    '...kk.kmmmmmmmmk',
    '......kmmkkkkmmk',
    '......kmmmmmmmmk',
    '......kmmkkmmmmk',
    '.......kkkkmmkk.',
    '..........kmk...',
    '..........kk....',
    '................'],
  'tryggere-hyring': [ // a shield with a check
    '................',
    '.......kk.......',
    '.....kkmmkk.....',
    '...kkmmmmmmkk...',
    '..kmmmmmmmmmmk..',
    '..kmmmmmmmmkmk..',
    '..kmmmmmmmkpmk..',
    '..kmmkmmmkpmmk..',
    '..kmkpkmkpmmmk..',
    '..kmmkpkpmmmmk..',
    '...kmmkpmmmmk...',
    '...kmmmkmmmmk...',
    '....kmmmmmmk....',
    '.....kkmmkk.....',
    '.......kk.......',
    '................'],
  'early-apps': [ // a pocket calculator showing %
    '................',
    '...kkkkkkkkkk...',
    '..kooooooooook..',
    '..kokkkkkkkkok..',
    '..kok' + 'ssssss' + 'kok..',
    '..kok' + 'skkkks' + 'kok..',
    '..kok' + 'ssssss' + 'kok..',
    '..kokkkkkkkkok..',
    '..kooooooooook..',
    '..kopkpkpkOkok..',
    '..kooooooooook..',
    '..kopkpkpkOkok..',
    '..kooooooooook..',
    '..kopkpkpkpkok..',
    '...kkkkkkkkkk...',
    '................'],
};

for (const [id, rows] of Object.entries(ICONS)) {
  let body = '';
  rows.forEach((r, y) => {
    r = r.replace(/ /g, 'p').padEnd(16, '.').slice(0, 16);
    let x = 0;
    while (x < 16) {
      const c = r[x];
      if (c === '.') { x++; continue; }
      let x2 = x; while (r[x2] === c) x2++;
      body += `<rect x="${x}" y="${y}" width="${x2 - x}" height="1" fill="${C[c]}"/>`; x = x2;
    }
  });
  fs.writeFileSync(path.join(dir, id + '.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="128" height="128" shape-rendering="crispEdges">${body}</svg>\n`);
}
console.log('retired icons:', Object.keys(ICONS).join(', '));
