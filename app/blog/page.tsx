import type { Metadata } from 'next'
import Link from 'next/link'
import { posts } from '@/lib/blog'

export const metadata: Metadata = { title: 'Writing', description: 'Notes on money, products, AI, and the internet.' }

export default function BlogIndex() {
  return <main className="blog-shell"><nav className="site-nav"><Link className="wordmark" href="/">albretsen<span>.no</span></Link><Link className="back-link" href="/">← Home</Link></nav><header className="blog-header"><p className="eyebrow">WRITING</p><h1>Notes worth keeping.</h1><p>Mostly about building products, personal finance, and the practical side of using AI.</p></header><div className="blog-list">{posts.map(post => <article className="blog-row" key={post.slug}><p className="post-meta">{post.dateLabel} <span>·</span> {post.tags.join(', ')}</p><h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p><Link className="read-link" href={`/blog/${post.slug}`}>Read note →</Link></article>)}</div></main>
}
