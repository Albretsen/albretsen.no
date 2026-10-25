// Facts about Asgeir and Albretsen AS. Pages read everything from here, so a
// number changes in one place. Never put a figure in page copy by hand.

export type Status = 'live' | 'building' | 'paused' | 'retired'

export interface Product {
  id: string
  name: string
  short?: string
  since: number
  status: Status
  url?: string
  line: string
  figure?: { value: string; label: string; exact?: string } // exact: the full value, shown as a tooltip
  facts?: string[]
  alt?: string // description of the product plate image on the homepage
}

export const site = {
  person: 'Asgeir Albretsen',
  company: 'Albretsen AS',
  domain: 'albretsen.no',
  origin: 'https://albretsen.no',
  email: 'asgeir@albretsen.no',
  line: 'I build software products and the businesses around them.',
  sub: 'Apps, SaaS and infrastructure for AI agents. On Google Play since 2016.',
  description: 'Asgeir Albretsen builds software products and the businesses around them: apps, SaaS and infrastructure for AI agents.',
  availability: 'Takes one outside engagement at a time.',
  mcpUrl: 'https://albretsen.no/mcp',
  playSince: 2016, // first app on Google Play
  location: 'Norway',
}

export const products: Product[] = [
  { id: 'mcp-emails', name: 'MCP Emails', since: 2026, status: 'live', url: 'https://mcpemails.com',
    line: 'Email for AI agents.', figure: { value: '1.34 million+', label: 'emails handled' },
    facts: ['17 tools', 'About 100 email providers', 'Open source (AGPL)'],
    alt: 'The MCP Emails logo on a terracotta sign by the sea' },
  { id: 'fun-libs', name: 'Fun Libs', since: 2019, status: 'live', url: 'https://funlibs.app',
    line: 'A fill-in-the-blanks word game for Android and iOS.', figure: { value: '113,000+', label: 'installs' },
    facts: ['Built at 17', 'No marketing', 'v5 shipped 2026'],
    alt: 'The Fun Libs icon as a glazed tile in a sunlit wall under a striped awning' },
  { id: 'toolrails', name: 'Toolrails', since: 2026, status: 'building', url: 'https://toolrails.com',
    line: 'One MCP URL that gives an agent every tool.', figure: { value: '4', label: 'connectors' },
    facts: ['Tool search', 'Injection guard'],
    alt: 'The Toolrails icon on a road sign beside a long boulevard at dusk' },
  { id: 'harbor', name: 'Harbor', since: 2026, status: 'paused', url: 'https://harborknowledge.com',
    line: 'A private knowledge base shared by people and AI.', figure: { value: '549', label: 'commits' },
    facts: ['Self-hostable', 'AI edits held for approval'],
    alt: 'The Harbor mark on a plaque beside a glowing doorway on a cliff at night' },
  { id: 'luma', name: 'Luma', since: 2026, status: 'retired', line: 'Norwegian budgeting app with open banking.', figure: { value: '378', label: 'commits' } },
  { id: 'polyglot-pilot', name: 'Polyglot Pilot', since: 2025, status: 'retired', line: 'Agents that localised entire codebases, with a dashboard for human reviewers.' },
  { id: 'pinpoint', name: 'PinPoint', since: 2025, status: 'retired', line: 'GeoGuessr with your own photos: friends guess where your pictures were taken.' },
  { id: 'webvakt', name: 'WebVakt', since: 2024, status: 'retired', line: 'Website change monitoring.' },
  { id: 'joke-central', name: 'Daily Jokes / Joke Central', short: 'Joke Central', since: 2024, status: 'retired', line: 'Joke apps for iOS and Android.' },
  { id: 'tryggere-hyring', name: 'Tryggere Hyring', since: 2023, status: 'retired', line: 'Background checks for hiring.' },
  { id: 'early-apps', name: 'IAGO HMS, Rentekalkulator, Prosentkalkulator', short: 'Early apps', since: 2021, status: 'retired', line: 'Early apps.' },
]

export const dayJob = [
  'Built and led an MCP server for an accounting platform.',
  'Ran a developer hackathon around it.',
  'Built AI chat with invoice, VAT and OCR tools.',
  'Built a React Native mobile app.',
]

// How to add the site's MCP server in each client. The first one is the default tab.
export const mcpClients = [
  { id: 'claude', name: 'Claude Code', kind: 'shell', text: `claude mcp add --transport http albretsen ${site.mcpUrl}` },
  { id: 'cursor', name: 'Cursor', kind: 'json', file: '~/.cursor/mcp.json', text: `{ "mcpServers": { "albretsen": { "url": "${site.mcpUrl}" } } }` },
  { id: 'vscode', name: 'VS Code', kind: 'shell', text: `code --add-mcp '{"name":"albretsen","type":"http","url":"${site.mcpUrl}"}'` },
  { id: 'codex', name: 'Codex', kind: 'toml', file: '~/.codex/config.toml', text: `[mcp_servers.albretsen]\nurl = "${site.mcpUrl}"` },
  { id: 'any', name: 'Any client', kind: 'url', text: site.mcpUrl },
]
