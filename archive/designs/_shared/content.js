// Canonical facts for every design exploration. Designs may rewrite tone and
// microcopy, but the facts below are fixed. Import with:
//   import { content } from '../_shared/content.js'

export const content = {
  person: 'Asgeir Albretsen',
  company: 'Albretsen AS',
  domain: 'albretsen.no',
  email: 'asgeir@albretsen.no',
  location: 'Norway',
  // Default one-liner. Designs may write their own in their brand voice.
  line: 'I build software that pays for itself.',
  mcpCommand: 'claude mcp add albretsen https://albretsen.no/mcp',
  availability: 'Takes one outside engagement at a time.',

  // Retired products will get a one-line reason later (written by Asgeir, not invented).
  products: [
    { id: 'mcp-emails', name: 'MCP Emails', since: 2026, status: 'live', url: 'https://mcpemails.com',
      line: 'Email for AI agents.', figure: { value: '10,203 NOK', label: 'MRR', exact: '10,203.19 NOK' },
      facts: ['17 tools', 'about 100 email providers', 'open source (AGPL)'] },
    { id: 'fun-libs', name: 'Fun Libs', since: 2019, status: 'live', url: 'https://funlibs.app',
      line: 'A fill-in-the-blanks word game for Android and iOS.', figure: { value: '113,000+', label: 'installs' },
      facts: ['built at 17', 'no marketing', 'v5 shipped 2026'] },
    { id: 'toolrails', name: 'Toolrails', since: 2026, status: 'building', url: 'https://toolrails.com',
      line: 'One MCP URL that gives an agent every tool.', figure: { value: '4', label: 'connectors' },
      facts: ['tool search', 'injection guard'] },
    { id: 'harbor', name: 'Harbor', since: 2026, status: 'paused', url: 'https://harborknowledge.com',
      line: 'A private knowledge base shared by people and AI.', figure: { value: '549', label: 'commits' },
      facts: ['self-hostable', 'AI edits held for approval'] },
    { id: 'luma', name: 'Luma', since: 2026, status: 'retired',
      line: 'Norwegian budgeting app with open banking.', figure: { value: '378', label: 'commits' } },
    { id: 'polyglot-pilot', name: 'Polyglot Pilot', since: 2025, status: 'retired',
      line: 'Agents that localised entire codebases, with a dashboard for human reviewers.' },
    { id: 'pinpoint', name: 'PinPoint', since: 2025, status: 'retired',
      line: 'GeoGuessr with your own photos: friends guess where your pictures were taken.', figure: { value: '16', label: 'commits' } },
    { id: 'webvakt', name: 'WebVakt', since: 2024, status: 'retired',
      line: 'Website change monitoring.', },
    { id: 'joke-central', name: 'Daily Jokes / Joke Central', since: 2024, status: 'retired',
      line: 'Joke apps for iOS and Android.', },
    { id: 'tryggere-hyring', name: 'Tryggere Hyring', since: 2023, status: 'retired',
      line: 'Background checks for hiring.', },
    { id: 'early-apps', name: 'IAGO HMS, Rentekalkulator, Prosentkalkulator', since: 2021, status: 'retired',
      line: 'Early apps.', },
  ],

  dayJob: [
    'Built and led an MCP server for an accounting platform.',
    'Ran a developer hackathon around it.',
    'Built AI chat with invoice, VAT and OCR tools.',
    'Built a React Native mobile app.',
  ],

  posts: [
    { title: 'Stop caring about all-time highs', date: '2026-08-19', slug: 'stop-caring-about-all-time-highs' },
    { title: 'Fun Libs: 113,000 installs later', date: '2026-07-28', slug: 'fun-libs-113000-installs' },
    { title: 'Why I built MCP Emails', date: '2026-07-28', slug: 'why-i-built-mcp-emails' },
    { title: 'Personal finance should be boring', date: '2026-07-28', slug: 'personal-finance-should-be-boring' },
  ],

  // Facts for colour, not for headlines.
  history: { playDeveloperSince: 2016, consultingSince: 2021, companySince: 2026 },
}
