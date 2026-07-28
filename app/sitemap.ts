import type { MetadataRoute } from 'next'
import { posts } from '@/lib/blog'

const baseUrl = 'https://albretsen.no'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/blog`, lastModified: new Date() },
    ...posts.map(post => ({ url: `${baseUrl}/blog/${post.slug}`, lastModified: new Date(post.date) })),
  ]
}
