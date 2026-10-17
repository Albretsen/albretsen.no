// The house bitmaps. 5x7 capitals for the wordmark, and the A monogram:
// an A drawn twice, the inner stroke an echo of the outer, one pixel left out on purpose.

export const GLYPHS = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  G: ['.####', '#....', '#....', '#..##', '#...#', '#...#', '.###.'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
}

export const MONO = {
  outer: [
    '########.',
    '#.......#',
    '#.......#',
    '#.......#',
    '#########',
    '#.......#',
    '#.......#',
    '#.......#',
    '#.......#',
  ],
  inner: [
    '.........',
    '.........',
    '..#####..',
    '..#...#..',
    '.........',
    '..#...#..',
    '..#...#..',
    '..#...#..',
    '..#...#..',
  ],
}

export function textToRows(text, gap = 1) {
  const rows = Array(7).fill('')
  ;[...text].forEach((ch, i) => {
    const g = GLYPHS[ch]
    for (let r = 0; r < 7; r++) rows[r] += (i ? '.'.repeat(gap) : '') + g[r]
  })
  return rows
}

// Horizontal runs -> compact SVG path.
export function rowsToPath(rows) {
  let d = ''
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== '#') continue
      let w = 1
      while (row[x + w] === '#') w++
      d += `M${x} ${y}h${w}v1h-${w}z`
      x += w - 1
    }
  })
  return d
}

// Iterate filled cells (used by the screensaver canvas).
export function cells(rows, fn) {
  rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') fn(x, y) })
}
