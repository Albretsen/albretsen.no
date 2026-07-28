import Link from 'next/link'
import { getHighlightedPosts } from '@/lib/blog'
import { getMcpEmailsUserCount } from '@/lib/mcp-emails'

export const revalidate = 900

function formatNumber(value: number | null) {
  return value === null ? '—' : new Intl.NumberFormat('en-US').format(value)
}

export default async function HomePage() {
  const [mcpEmailsUsers] = await Promise.all([getMcpEmailsUserCount()])
  const posts = getHighlightedPosts()

  return (
    <main>
      <nav className="site-nav" aria-label="Primary navigation">
        <Link className="wordmark" href="/">albretsen<span>.no</span></Link>
        <div className="nav-links">
          <a href="#projects">Projects</a>
          <Link href="/blog">Writing</Link>
          <a href="https://www.linkedin.com/in/asgeir-albretsen" target="_blank" rel="noreferrer">LinkedIn ↗</a>
        </div>
      </nav>

      <section className="hero" aria-labelledby="intro-title">
        <p className="eyebrow">ASGEIR ALBRETSEN <span>·</span> BERGEN, NORWAY</p>
        <h1 id="intro-title">I build useful software and write about money, products, and the internet.</h1>
        <p className="hero-copy">This is where I keep the products I own, the things I’m learning, and occasional opinions worth putting in writing.</p>
        <p className="status"><span className="status-dot" aria-hidden="true" /> Currently building MCP Emails. Still compounding Fun Libs.</p>
      </section>

      <section className="metrics" aria-label="Product statistics">
        <div className="metric"><strong>NOK 61,630</strong><span>Fun Libs · AdSense revenue</span></div>
        <div className="metric"><strong>Several thousand NOK</strong><span>Fun Libs · in-app purchases</span></div>
        <div className="metric"><strong>113,013+</strong><span>Fun Libs · installs</span></div>
        <div className="metric"><strong>{formatNumber(mcpEmailsUsers)}</strong><span>MCP Emails · users <i>{mcpEmailsUsers === null ? 'temporarily unavailable' : 'live'}</i></span></div>
      </section>
      <p className="data-note">Fun Libs figures are lifetime totals. MCP Emails user count is queried from its production database.</p>

      <section className="section" id="projects" aria-labelledby="projects-title">
        <div className="section-heading"><p className="eyebrow">01 — PROJECTS</p><h2 id="projects-title">Things I have built.</h2></div>
        <p className="section-intro">Small products with real users, real constraints, and no pitch deck required.</p>
        <div className="project-list">
          <article className="project-card project-card--mcp">
            <div className="project-top"><p className="project-kind">CURRENT</p><a href="https://mcpemails.com/" target="_blank" rel="noreferrer">mcpemails.com ↗</a></div>
            <h3>MCP Emails</h3>
            <p className="project-tagline">Email access for MCP clients.</p>
            <p>Connect Gmail, Outlook, Fastmail, iCloud, or IMAP to Claude, Cursor, ChatGPT, and other MCP-compatible tools. Read, search, send, and organise email without handing a third party your inbox.</p>
            <ul className="tags"><li>MCP</li><li>OAuth</li><li>Email infrastructure</li></ul>
          </article>
          <article className="project-card project-card--fun">
            <div className="project-top"><p className="project-kind">MOBILE APP</p><a href="https://play.google.com/store/apps/details?id=com.asgalb.FunLibs" target="_blank" rel="noreferrer">Google Play ↗</a></div>
            <h3>Fun Libs</h3>
            <p className="project-tagline">A word game with serious distribution.</p>
            <p>A mobile take on Mad Libs: fill in the blanks, make a story, then share the result. Built end to end and monetised through ads and in-app purchases.</p>
            <ul className="tags"><li>Mobile</li><li>React Native</li><li>Supabase</li></ul>
          </article>
        </div>
      </section>

      <section className="section writing" aria-labelledby="writing-title">
        <div className="section-heading section-heading--row"><div><p className="eyebrow">02 — WRITING</p><h2 id="writing-title">Notes worth keeping.</h2></div><Link className="text-link" href="/blog">All writing →</Link></div>
        <p className="section-intro">Mostly about building products, personal finance, and the practical side of using AI.</p>
        <div className="post-list">
          {posts.map(post => <article className="post-card" key={post.slug}><p className="post-meta">{post.dateLabel} <span>·</span> {post.tags[0]}</p><h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3><p>{post.excerpt}</p><Link className="read-link" href={`/blog/${post.slug}`}>Read note →</Link></article>)}
        </div>
      </section>

      <section className="section elsewhere" aria-labelledby="elsewhere-title">
        <p className="eyebrow">03 — ELSEWHERE</p><h2 id="elsewhere-title">The short version.</h2>
        <p>I am Asgeir Albretsen. I build and own internet products from Bergen. I care about useful software, long-term ownership, and personal finance.</p>
        <div className="elsewhere-links"><a href="https://www.linkedin.com/in/asgeir-albretsen" target="_blank" rel="noreferrer">LinkedIn ↗</a><a href="https://mcpemails.com/" target="_blank" rel="noreferrer">MCP Emails ↗</a><a href="https://play.google.com/store/apps/details?id=com.asgalb.FunLibs" target="_blank" rel="noreferrer">Fun Libs ↗</a></div>
      </section>

      <footer><span>© {new Date().getFullYear()} Asgeir Albretsen</span><Link href="/blog">Writing</Link></footer>
    </main>
  )
}
