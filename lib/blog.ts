export type BlogPost = { slug: string; title: string; date: string; dateLabel: string; tags: string[]; excerpt: string; body: string[]; highlighted?: boolean }

export const posts: BlogPost[] = [
  {
    slug: 'why-i-built-mcp-emails', title: 'Why I built MCP Emails', date: '2026-07-28', dateLabel: 'July 28, 2026', tags: ['MCP', 'AI', 'Products'], highlighted: true,
    excerpt: 'AI clients are useful until they need context locked inside an inbox. MCP Emails is my attempt at making that connection boring, secure, and broadly compatible.',
    body: ['An inbox holds a surprising amount of useful context. The problem is that it remains awkward to use from the tools where I already work.', 'MCP Emails connects the email providers people actually use to MCP-compatible clients. The goal is deliberately unglamorous: make email access work reliably, keep the setup understandable, and avoid turning an inbox into a data giveaway.'],
  },
  {
    slug: 'fun-libs-113000-installs', title: 'Fun Libs: 113,000 installs later', date: '2026-07-20', dateLabel: 'July 20, 2026', tags: ['Mobile', 'Indie', 'Products'], highlighted: true,
    excerpt: 'What a small word-game app taught me about shipping, distribution, ads, in-app purchases, and the difference between a product people like and one they return to.',
    body: ['Fun Libs started as a small mobile product. It now has more than 113,000 installs and has earned money through both ads and in-app purchases.', 'The interesting part is not a single launch moment. It is the accumulation: shipping, fixing, measuring, and giving a straightforward product enough time to find its audience.'],
  },
  {
    slug: 'personal-finance-should-be-boring', title: 'Personal finance should be boring', date: '2026-07-12', dateLabel: 'July 12, 2026', tags: ['Personal finance', 'Money'], highlighted: true,
    excerpt: 'The most useful money system is the one that leaves you with fewer decisions to make—not more screens to check or rules to optimise.',
    body: ['Good personal finance reduces future decisions. It should make the sensible thing easy and leave more attention for work, family, or whatever else matters.', 'That does not make it uninteresting. It just means that a system is better when it compounds quietly than when it demands to be watched.'],
  },
]

export const getPost = (slug: string) => posts.find(post => post.slug === slug)
export const getHighlightedPosts = () => posts.filter(post => post.highlighted)
