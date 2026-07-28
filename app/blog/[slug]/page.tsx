import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost, posts } from '@/lib/blog'

export function generateStaticParams() { return posts.map(({ slug }) => ({ slug })) }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const post = getPost(slug); return post ? { title: post.title, description: post.excerpt } : {} }
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const post = getPost(slug); if (!post) notFound(); return <main className="blog-shell"><nav className="site-nav"><Link className="wordmark" href="/">albretsen<span>.no</span></Link><Link className="back-link" href="/blog">← All writing</Link></nav><article className="article"><p className="post-meta">{post.dateLabel} <span>·</span> {post.tags.join(', ')}</p><h1>{post.title}</h1>{post.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</article></main> }
