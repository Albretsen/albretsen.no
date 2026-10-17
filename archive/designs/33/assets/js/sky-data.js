// Uranographia — constellation data for Albretsen AS products.
// Every figure is drawn in a 0..100 box. Star magnitude m: 1 = brightest, 4 = faint.
// The numbers that drive the drawings come from designs/_shared/content.js only:
//   MCP Emails  -> 17 stars, one per tool (17 tools)
//   Fun Libs    -> 113 field stars, one per thousand installs (113,000+)
//   Toolrails   -> 4 bright connector stars (4 connectors)
//   Harbor      -> 549 field dust points, one per commit (549 commits)
//   PinPoint    -> 16 stars (16 commits)

export const PRODUCTS = [
  {
    id: 'mcp-emails', name: 'MCP Emails', latin: 'Epistula Machinae', since: 2026, status: 'live',
    figure: '$782 MRR', datum: '17 stars = 17 tools',
    logo: '../../../_shared/products/mcp-emails/logo-mark.svg',
    stars: [
      [10,25,3],[30,25,3],[50,25,3],[70,25,3],[90,25,1],
      [90,52,3],[90,80,2],[70,80,3],[50,80,3],[30,80,3],[10,80,2],[10,52,3],
      [27,38,4],[39,47,4],[50,55,2],[61,47,4],[73,38,4],
    ],
    // pairs of star indices
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,0],
      [0,12],[12,13],[13,14],[14,15],[15,16],[16,4]],
    field: 0,
  },
  {
    id: 'fun-libs', name: 'Fun Libs', latin: 'Lacunae Ludentes', since: 2019, status: 'live',
    figure: '113,000+ installs', datum: '113 field stars = 113,000 installs',
    logo: '../../../_shared/products/fun-libs/icon.png',
    stars: [
      [22,40,2],[33,40,3],[44,40,3],[55,40,3],[66,40,3],[77,40,1],
      [22,61,2],[33,61,3],[44,61,3],[55,61,2],
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[6,7],[7,8],[8,9]],
    field: 113, fieldShape: 'cluster',
  },
  {
    id: 'toolrails', name: 'Toolrails', latin: 'Semitae Instrumentorum', since: 2026, status: 'building',
    figure: '4 connectors', datum: '4 bright feeders = 4 connectors',
    logo: '../../../_shared/products/toolrails/icon.svg',
    stars: [
      [16,39,3],[33,39,3],[50,39,3],
      [16,61,3],[33,61,3],[50,61,3],
      [56,22,2],[71,36,3],[86,50,1],[71,64,3],[56,78,2],
      [3,24,2],[3,42,2],[3,58,2],[3,76,2],
    ],
    lines: [[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[8,9],[9,10],[11,0],[12,0],[13,3],[14,3]],
    dashed: [8,9,10,11],
    field: 0,
  },
  {
    id: 'harbor', name: 'Harbor', latin: 'Portus Memoriae', since: 2026, status: 'paused',
    figure: '549 commits', datum: '549 dust points = 549 commits',
    logo: '../../../_shared/products/harbor/harbor-mark.svg',
    stars: [
      [15,34,3],[26,16,3],[42,16,3],[50,27,2],[58,16,3],[74,16,3],[85,34,3],
      [85,68,3],[74,85,3],[26,85,3],[15,68,3],[50,58,1],
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,0]],
    field: 549, fieldShape: 'dust',
  },
];

// Retired products: "constellationes obsoletae", as old atlases kept the constellations
// that astronomers stopped using. Stand-ins drawn in the house style (no surviving brand),
// except Luma which keeps its real monogram.
export const OBSOLETE = [
  { id: 'luma', name: 'Luma', since: 2026, latin: 'Libra Domestica', note: '378 commits',
    logo: '../../../_shared/products/luma/logo.png',
    stars: [[30,18,2],[30,50,3],[30,82,2],[56,82,3],[74,74,1]], lines: [[0,1],[1,2],[2,3]] },
  { id: 'polyglot-pilot', name: 'Polyglot Pilot', since: 2025, latin: 'Lingua Multiplex',
    stars: [[14,26,2],[50,20,3],[78,34,2],[64,58,3],[36,64,3],[24,82,1],[86,74,3]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,0],[4,5],[3,6]] },
  { id: 'pinpoint', name: 'PinPoint', since: 2025, latin: 'Acus Locorum', note: '16 commits',
    stars: [[50,14,2],[30,22,3],[22,40,3],[30,58,3],[40,70,3],[50,88,1],[60,70,3],[70,58,3],[78,40,3],[70,22,3],
      [50,40,2],[44,34,4],[56,34,4],[44,46,4],[56,46,4],[50,28,4]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,0]] },
  { id: 'webvakt', name: 'WebVakt', since: 2024, latin: 'Oculus Vigil',
    stars: [[8,50,2],[28,34,3],[50,28,3],[72,34,3],[92,50,2],[72,66,3],[50,72,3],[28,66,3],[50,50,1]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]] },
  { id: 'joke-central', name: 'Joke Central', since: 2024, latin: 'Risus Cotidianus',
    stars: [[34,34,2],[66,34,2],[18,56,3],[32,74,3],[50,80,1],[68,74,3],[82,56,3]],
    lines: [[2,3],[3,4],[4,5],[5,6]] },
  { id: 'tryggere-hyring', name: 'Tryggere Hyring', since: 2023, latin: 'Scutum Fidei',
    stars: [[50,12,2],[82,24,3],[78,58,3],[50,88,1],[22,58,3],[18,24,3],[50,48,3]],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]] },
  { id: 'early-apps', name: 'IAGO HMS, Rentekalkulator, Prosentkalkulator', short: 'Early apps', since: 2021, latin: 'Calculi Primi',
    stars: [[24,26,2],[76,20,3],[24,80,3],[76,74,2],[62,34,4],[50,50,4],[38,66,4]],
    lines: [[1,4],[4,5],[5,6],[6,2]] },
];

// The house mark, as data (0..64 box) — also used by the loader.
export const ASTERISM = {
  stars: [[30,9,1],[9.5,55,2],[50.5,55,2],[16.6,39.1,3],[41.8,35.4,3],[59,34.1,4]],
  lines: [[0,3],[3,1],[0,4],[4,2],[3,4]],
  vector: [4,5],
};

// Deterministic PRNG (seeded from the brief's salt c4bb0d)
export function rng(seed = 0xc4bb0d) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Field points (cluster or dust) for a product, in the 0..100 box
export function fieldPoints(p, seed = 7) {
  const r = rng(0xc4bb0d ^ (seed * 2654435761));
  const pts = [];
  for (let i = 0; i < p.field; i++) {
    if (p.fieldShape === 'cluster') {
      // Plummer-like globular cluster centred on the figure
      const u = r(), a = r() * Math.PI * 2;
      const rad = 70 * Math.sqrt(Math.pow(u, -2 / 3) - 1) / 3;
      pts.push([50 + Math.cos(a) * Math.min(rad, 48), 50 + Math.sin(a) * Math.min(rad, 48) * 0.8, r()]);
    } else {
      // dust drifting across the plate in a soft band
      const x = r() * 100; const band = 50 + Math.sin(x / 18) * 14 + (r() + r() + r() - 1.5) * 26;
      pts.push([x, Math.max(2, Math.min(98, band)), r()]);
    }
  }
  return pts;
}

export const MAG_R = { 1: 2.6, 2: 1.9, 3: 1.35, 4: 0.95 };

// Logo paths above are relative to this module; resolve them for any page.
export const logoURL = (p) => (p.logo ? new URL(p.logo, import.meta.url).href : null);
