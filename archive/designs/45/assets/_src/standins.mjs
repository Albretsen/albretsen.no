import fs from 'fs';
const out = process.argv[2];
const T = { 50:'#f2fdfa',100:'#dcf7f1',200:'#b7ebdf',300:'#87dac9',400:'#4bc1ad',500:'#08a28f',600:'#008171',700:'#006154',800:'#034239',900:'#042822' };
const items = {
  'polyglot-pilot': { a: T[300], b: T[600], fg: T[50], title: 'Polyglot Pilot (stand-in)',
    g: `<path d="M150 150h130a34 34 0 0 1 34 34v62a34 34 0 0 1-34 34h-74l-42 34v-34h-14a34 34 0 0 1-34-34v-62a34 34 0 0 1 34-34z"/><path d="M362 232a34 34 0 0 1 34 34v52a34 34 0 0 1-34 34h-8v30l-36-30h-56a34 34 0 0 1-34-34"/><path d="M186 214h88"/>` },
  'pinpoint': { a: T[200], b: T[500], fg: T[50], title: 'PinPoint (stand-in)',
    g: `<path d="M256 392c-58-70-96-118-96-162a96 96 0 0 1 192 0c0 44-38 92-96 162z"/><circle cx="256" cy="230" r="30" fill="currentColor" stroke="none"/>` },
  'webvakt': { a: T[400], b: T[700], fg: T[50], title: 'WebVakt (stand-in)',
    g: `<path d="M120 256c40-62 86-92 136-92s96 30 136 92c-40 62-86 92-136 92s-96-30-136-92z"/><circle cx="256" cy="256" r="44"/><circle cx="256" cy="256" r="14" fill="currentColor" stroke="none"/>` },
  'joke-central': { a: T[100], b: T[400], fg: T[800], title: 'Joke Central (stand-in)',
    g: `<circle cx="200" cy="214" r="18" fill="currentColor" stroke="none"/><path d="M292 214h44"/><path d="M168 284c26 52 150 52 176 0"/>` },
  'tryggere-hyring': { a: T[500], b: T[800], fg: T[50], title: 'Tryggere Hyring (stand-in)',
    g: `<path d="M256 128l104 40v80c0 70-46 118-104 140-58-22-104-70-104-140v-80z"/><path d="M210 262l34 34 62-70"/>` },
  'early-apps': { a: T[200], b: T[600], fg: T[50], title: 'IAGO HMS, Rentekalkulator, Prosentkalkulator (stand-in)',
    g: `<circle cx="196" cy="196" r="34"/><circle cx="316" cy="316" r="34"/><path d="M340 172L172 340"/>` },
};
for (const [id, d] of Object.entries(items)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="${d.title}">
  <title>${d.title}</title>
  <defs>
    <radialGradient id="b" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${d.a}"/><stop offset="1" stop-color="${d.b}"/></radialGradient>
    <radialGradient id="h" cx="34%" cy="22%" r="42%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="${T[900]}" flood-opacity=".28"/></filter>
  </defs>
  <circle cx="256" cy="256" r="240" fill="url(#b)"/>
  <circle cx="256" cy="256" r="240" fill="url(#h)"/>
  <circle cx="256" cy="256" r="236" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4"/>
  <g filter="url(#s)" color="${d.fg}" stroke="${d.fg}" fill="none" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">${d.g}</g>
</svg>
`;
  fs.writeFileSync(`${out}/${id}.svg`, svg);
}
console.log('ok');
