import { posts } from '@/lib/blog'

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]!)

export function GET() {
  const items = posts.map(post => `<item><title>${escapeXml(post.title)}</title><link>https://albretsen.no/blog/${post.slug}</link><guid>https://albretsen.no/blog/${post.slug}</guid><pubDate>${new Date(post.date).toUTCString()}</pubDate><description>${escapeXml(post.excerpt)}</description></item>`).join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Asgeir Albretsen</title><link>https://albretsen.no</link><description>Notes on money, products, AI, and the internet.</description>${items}</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
