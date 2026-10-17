// The six faces of the Honest Die. Every number is from designs/_shared/content.js.
// Order: front, right, back, left, top, bottom.
const here = (p) => new URL(p, import.meta.url).href
const img = (n) => here(`./faces/${n}.avif`) // .webp twins sit next to each file

export const FACES = [
  { id: 'mcp-emails', kicker: 'MCP Emails · live', value: '$782', label: 'MRR', note: 'Email for AI agents.', image: img('aurora') },
  { id: 'fun-libs', kicker: 'Fun Libs · live', value: '113,000+', label: 'installs', note: 'Built at 17. No marketing.', image: img('summit') },
  { id: 'toolrails', kicker: 'Toolrails · building', value: '4', label: 'connectors', note: 'Not finished. Said plainly.', image: img('tracks') },
  { id: 'harbor', kicker: 'Harbor · paused', value: '549', label: 'commits', note: 'Paused, not pretended.', image: img('orbit') },
  { id: 'retired', kicker: 'The other column', value: '7', label: 'retired products', note: 'Listed, not hidden.', tone: 'field' },
  { id: 'since', kicker: 'Google Play', value: '2016', label: 'first published', note: 'Ten years of shipping.', image: img('lights') },
]
